import React from "react";
import { SocketContext } from '../../contexts/socket'
import MUIDataTable, { MUIDataTableIsRowCheck, MUIDataTableOptions } from "mui-datatables"
import { ObservationBlock, Scoby, OBCell } from "../../typings/ptolemy"
import Tooltip from '@mui/material/Tooltip'
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch"
import { FormControlLabel, IconButton, useTheme } from "@mui/material";
import OBSubmit from "./ob_submit";
import { StringParam, useQueryParam, withDefault } from "use-query-params";
import ReactJson, { ThemeKeys } from "react-json-view";
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import { ob_api_funcs } from "../../api/ApiRoot";

interface Props {
    selOBs: ObservationBlock[],
    setSelOBs: Function,
    obBoneyard: ObservationBlock[]
    onSubmitOB: Function
    hideCompletedOBs: boolean
}

interface CTProps {
    selOBs: ObservationBlock[];
    setSelOBs: Function;
    onSubmitOB: Function
    idx: number
}

const obs_to_cells = (obs: any, completed = true) => {
    let cells: any[] = []
    let uid = 0
    obs.forEach((ob: ObservationBlock, idx: number) => {
        const obCell: OBCell = {
            name: ob.metadata.name,
            type: 'ob',
            id: JSON.stringify(uid),
            ob_id: ob._id,
            tgt_name: ob.target?.parameters.target_info_name,
            ra: ob.target?.parameters.target_coord_ra,
            dec: ob.target?.parameters.target_coord_dec,
            completed: completed

        }
        const tgt = ob.target
        if (tgt) obCell['target'] = tgt
        cells.push(obCell)
        uid += 1
    })
    return cells
}

const CustomToolbarSelect = (props: CTProps) => {

    const handle_move = async (idx: number, jdx: number) => {
        let ob_ids = props.selOBs.map(ob => ob._id)

        console.log(`moving element at idx ${idx} to position jdx ${jdx}`) 
        if (idx===jdx || jdx < 0 || jdx >= ob_ids.length) {
            console.log(`can't move from idx to position jdx`) 
            return
        }
        
        const el = ob_ids[idx];
        console.log(`el ${el} is moving.ob_ids ${ob_ids}`)
        ob_ids.splice(idx, 1);
        ob_ids.splice(jdx, 0, el);
        console.log(`el ${el} has been moved. ob_ids ${ob_ids}`)
        let selOBs = [...props.selOBs] 
        selOBs.sort(function(a, b){
            return ob_ids.indexOf(a._id) - ob_ids.indexOf(b._id)
        });
        props.setSelOBs(selOBs)
    };

    return (
        <React.Fragment>
            <Tooltip title="Move up one row">
                <IconButton onClick={() => { handle_move(props.idx, props.idx-1) }} aria-label='move-up'>
                    <KeyboardArrowUpIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Move to top">
                <IconButton onClick={() => { handle_move(props.idx, 0) }} aria-label='move-top'>
                    <KeyboardDoubleArrowUpIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Move down one row">
                <IconButton onClick={() => { handle_move(props.idx, props.idx+1) }} aria-label='move-down'>
                    <KeyboardArrowDownIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Move to bottom">
                <IconButton onClick={() => { handle_move(props.idx, props.selOBs.length-1) }} aria-label='move-bottom'>
                    <KeyboardDoubleArrowDownIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={"Sends OB to Target Queue"}>
                <OBSubmit onSubmitOB={() => props.onSubmitOB(props.idx)} />
            </Tooltip>
        </React.Fragment>
    );
}

const CustomCheckbox = (props: any) => {
    let newProps = Object.assign({}, props);
    newProps.color = props['data-description'] === 'row-select' ? 'secondary' : 'primary';

    return (
        <Tooltip title='select ob'>
            <Checkbox {...newProps} />
        </Tooltip>
    );
};


const removeFromList = (list: any[], idx: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(idx, 1);
    return [removed, result]
}

const addToList = (list: any[], idx: number, element: any) => {
    const result = Array.from(list);
    result.splice(idx, 0, element)
    return result
}


const SelectedOBTable = (props: Props) => {

    const [jsontheme, _] = useQueryParam('theme', withDefault(StringParam, 'bespin'))

    const socket = React.useContext(SocketContext);

    let rows = obs_to_cells(props.selOBs, false)
    let obs = [...props.selOBs]
    console.log(`creating selected ob table.`, props)

    if (!props.hideCompletedOBs) {
        const boneyardRows = obs_to_cells(props.obBoneyard, true)
        rows = [...rows, ...boneyardRows]
        obs = [...obs, ...props.obBoneyard]
    }

    console.log('len of table:', rows.length)

    const update_value = (value: boolean, checked: boolean, tableMeta: any) => {

        console.log('tableMeta of clicked object', tableMeta, 'value', value)
        // const ob_id = obs[tableMeta.rowIndex]._id
        const ob_id = tableMeta.rowData[0] // selected row is first row and OB_ID is first col

        let selIds: string[] = []
        let boneyardIds: string[] = []
        let newOBList: ObservationBlock[] = []
        if (checked) { // move from selOBs to boneyard
            const idx = props.selOBs.findIndex((ob: ObservationBlock) => ob._id === ob_id)
            const [removedOB, nList] = removeFromList(props.selOBs, idx)
            newOBList = nList
            const insertIdx = props.obBoneyard.length - 1
            const newBoneyard = addToList(props.obBoneyard, insertIdx, removedOB)
            selIds = nList.map((ob: ObservationBlock) => ob._id)
            boneyardIds = newBoneyard.map((ob: ObservationBlock) => ob._id)
        }
        else { //move from boneyard to selOBs
            const idx = props.obBoneyard.findIndex((ob: ObservationBlock) => ob._id === ob_id)
            const [removedOB, newBoneyard] = removeFromList(props.obBoneyard, idx)
            const insertIdx = 0
            newOBList = addToList(props.selOBs, insertIdx, removedOB)
            selIds = newOBList.map((ob: ObservationBlock) => ob._id)
            boneyardIds = newBoneyard.map((ob: ObservationBlock) => ob._id)
        }

        console.log('clicked will update boneyard', checked, ob_id, selIds.length, boneyardIds.length)
        socket.emit('set_ob_queue', { ob_id_queue: selIds, obs: newOBList })
        socket.emit('set_ob_boneyard', { ob_id_boneyard: boneyardIds })
    }

    const options: MUIDataTableOptions = {
        filterType: 'dropdown',
        onRowsDelete: () => false,
        expandableRows: true,
        renderExpandableRow: (rowData, rowMeta: { dataIndex: number, rowIndex: number }) => {
            const ob = obs[rowMeta.dataIndex]
            const colSpan = rowData.length + 1;
            return (
                <TableRow>
                    <TableCell colSpan={colSpan}>
                        <ReactJson
                            src={ob as object}
                            theme={jsontheme as ThemeKeys}
                            collapsed={true}
                            enableClipboard={true}
                            onEdit={false}
                        />
                    </TableCell>
                </TableRow >
            )
        },
        isRowSelectable: (dataIndex: number, selectedRows: MUIDataTableIsRowCheck | undefined) => {
            return !rows[dataIndex].completed
        },
        selectableRowsHeader: false,
        selectableRowsHideCheckboxes: false,
        customToolbarSelect: selectedRows => {
            const selRow = rows[selectedRows.data[0].dataIndex]
            const idx = props.selOBs.findIndex((ob: ObservationBlock) => ob._id === selRow.ob_id)
            return (
                <CustomToolbarSelect
                    idx={idx}
                    selOBs={props.selOBs}
                    setSelOBs={props.setSelOBs}
                    onSubmitOB={props.onSubmitOB}
                />)
        },
        selectableRows: 'single'
    }

    const columns = [
        { name: 'ob_id', label: 'OB ID', options: { display: false } },
        { name: 'name', label: 'OB Name', options: {} },
        { name: 'tgt_name', label: 'Target Name', options: {} },
        { name: 'version', label: 'Version', options: { display: false } },
        { name: 'comment', label: 'Comment', options: { display: false } },
        { name: 'ra', label: 'RA', options: { display: true } },
        { name: 'dec', Label: 'Dec', options: { display: true } },
        { name: 'sem_id', Label: 'Semid', options: { display: false } },
        {
            name: 'completed',
            label: 'Completed',
            options: {
                display: true,
                customBodyRender: (value: boolean, tableMeta: any, updateValue: any) => {
                    return (
                        <FormControlLabel
                            label=""
                            value={value}
                            control={<Switch checked={value} />}
                            onChange={(_, checked) => update_value(value, checked, tableMeta)}
                        />
                    )

                }
            }
        }
    ]

    return (
        <MUIDataTable
            data={rows}
            columns={columns}
            options={options}
            title={"Selected OBs"}
            components={{ Checkbox: CustomCheckbox }}
        />
    )
}

export default SelectedOBTable