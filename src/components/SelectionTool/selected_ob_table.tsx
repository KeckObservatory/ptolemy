import React from "react";
import { SocketContext } from '../../contexts/socket'
import MUIDataTable, { MUIDataTableIsRowCheck, MUIDataTableOptions } from "mui-datatables"
import { ObservationBlock, Scoby, OBCell } from "../../typings/ptolemy"
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button';
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch"
import { FormControlLabel, useTheme } from "@mui/material";
import OBSubmit from "./ob_submit";
import { StringParam, useQueryParam, withDefault } from "use-query-params";
import ReactJson, { ThemeKeys } from "react-json-view";
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

interface Props {
    selObs: ObservationBlock[],
    obBoneyard: ObservationBlock[]
    onSubmitOB: Function
    hideSubmittedOBs: boolean
}

interface SelectedRows {
    data: {
        index: number;
        dataIndex: number;
    }[];
    lookup: {
        [key: number]: boolean;
    };
}

interface CTProps {
    onSubmitOB: Function
    idx: number 
}

const container_obs_to_cells = (obs: any, submitted = true) => {
    let cells: any[] = []
    let uid = 0
    obs.forEach((ob: ObservationBlock, idx: number) => {
        const obCell: OBCell = {
            name: ob.metadata.name,
            type: 'ob',
            id: JSON.stringify(uid),
            ob_id: ob._id,
            ra: ob.target?.parameters.target_coord_ra,
            dec: ob.target?.parameters.target_coord_dec,
            submitted: submitted

        }
        const tgt = ob.target
        if (tgt) obCell['target'] = tgt
        cells.push(obCell)
        uid += 1
    })
    return cells
}

const CustomToolbarSelect = (props: CTProps) => {
    return (
        <React.Fragment>
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
        <Tooltip title='select row'>
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

    let rows = container_obs_to_cells(props.selObs, false)
    let obs = [...props.selObs]
    console.log('creating selected ob table')

    if (!props.hideSubmittedOBs) {
        const boneyardRows = container_obs_to_cells(props.obBoneyard, true)
        rows = [...rows, ...boneyardRows]
        obs = [...obs, ...props.obBoneyard]
    }

    const update_value = (event: any, checked: boolean, tableMeta: any) => {
        const ob_id = obs[tableMeta.rowIndex]._id
        const idx = obs.findIndex((ob: ObservationBlock) => ob._id === ob_id)
        console.log('clicked will update boneyard', checked, ob_id)

        let selIds: string[] = []
        let boneyardIds: string[] = []
        let newOBList: ObservationBlock[] = []
        if (checked) { // move from selObs to boneyard
            const [removedOB, nList] = removeFromList(props.selObs, idx)
            newOBList = nList
            const insertIdx = props.obBoneyard.length - 1
            const newBoneyard = addToList(props.obBoneyard, insertIdx, removedOB)
            selIds = nList.map((ob: ObservationBlock) => ob._id)
            boneyardIds = newBoneyard.map((ob: ObservationBlock) => ob._id)
        }
        else { //move from boneyard to selObs
            const [removedOB, newBoneyard] = removeFromList(props.obBoneyard, idx)
            const insertIdx = 0
            newOBList = addToList(props.selObs, insertIdx, removedOB)
            selIds = newOBList.map((ob: ObservationBlock) => ob._id)
            boneyardIds = newBoneyard.map((ob: ObservationBlock) => ob._id)
        }

        console.log('selIds', selIds, 'boneyardIds', boneyardIds)
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
            // console.log('is row selectable?', rows[dataIndex], !rows[dataIndex].submitted)
            return !rows[dataIndex].submitted
        },
        selectableRowsHeader: false,
        selectableRowsHideCheckboxes: false,
        customToolbarSelect: selectedRows => {
            console.log('selectedRows', selectedRows)
            const selRow = rows[selectedRows.data[0].dataIndex]
            const idx = props.selObs.findIndex((ob: ObservationBlock) => ob._id === selRow.id)
            console.log('selected row', selRow, 'selOB idx', idx)

            return(
            <CustomToolbarSelect
                idx={idx}
                onSubmitOB={props.onSubmitOB}
            />)
        },
        selectableRows: 'single'
    }

    const columns = [
        { name: 'ob_id', label: 'OB ID', options: { display: false } },
        {
            name: 'name', label: 'OB Name',
            options: {}
        },
        { name: 'version', label: 'Version', options: { display: false } },
        { name: 'comment', label: 'Comment', options: { display: false } },
        { name: 'ra', label: 'RA', options: { display: true } },
        { name: 'dec', Label: 'Dec', options: { display: true } },
        { name: 'sem_id', Label: 'Semid', options: { display: false } },
        {
            name: 'submitted',
            label: 'Submitted',
            options: {
                display: true,
                customBodyRender: (value: boolean, tableMeta: any, updateValue: any) => {
                    return (
                        <FormControlLabel
                            label=""
                            value={value}
                            control={<Switch value={value} />}
                            onChange={(event, checked) => update_value(event, checked, tableMeta)}
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