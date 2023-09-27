import React from "react";
import { SocketContext } from '../../contexts/socket'
import MUIDataTable, { MUIDataTableIsRowCheck, MUIDataTableOptions } from "mui-datatables"
import { ObservationBlock, OBCell, Science } from "../../typings/ptolemy"
import Tooltip from '@mui/material/Tooltip'
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch"
import { Button, FormControlLabel, IconButton, useTheme } from "@mui/material";
import { StringParam, useQueryParam, withDefault } from "use-query-params";
import ReactJson, { ThemeKeys } from "react-json-view";
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';

interface Props {
    ob: ObservationBlock;
    sequences: Science[];
    sequenceBoneyard: Science[];
    submitSeq: React.MouseEventHandler<HTMLButtonElement>;
    hideCompletedSequences: boolean;
}

interface SeqTSProps {
    ob: ObservationBlock;
    sequences: Science[];
    submitSeq: React.MouseEventHandler<HTMLButtonElement>;
    idx: number;
}

const arr_to_rows = (arr: any[], completed = true, startUid = 0) => {
    let rows: any[] = []
    let uid = startUid
    arr.forEach((el: any, idx: number) => {
        const row = {
            name: el.metadata.name,
            id: JSON.stringify(uid),
            exposure_time: el.parameters.det_exp_time,
            det_type: el.parameters.det_type_mode,
            sequence_number: el.metadata.sequence_number,
            completed: completed
        }
        rows.push(row)
        uid += 1
    })
    return [rows, uid]
}

const SeqToolbarSelect = (props: SeqTSProps) => {

    return (
        <Tooltip title={'Send sequence to event queue'}>
            <Button variant="contained" onClick={props.submitSeq}>Submit Sequence</Button>
        </Tooltip>
    );
}


const CustomCheckbox = (props: any) => {
    let newProps = Object.assign({}, props);
    newProps.color = props['data-description'] === 'row-select' ? 'secondary' : 'primary';

    return (
        <Tooltip title='select sequence'>
            <Checkbox {...newProps} />
        </Tooltip>
    );
}



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



const SelectedSequenceTable = (props: Props) => {
    const [jsontheme, _] = useQueryParam('theme', withDefault(StringParam, 'bespin'))

    const socket = React.useContext(SocketContext);

    let [rows, startUid] = arr_to_rows(props.sequences, false, 0) as [any[], number]
    let seqs = [...props.sequences]
    if (!props.hideCompletedSequences) {
        const [boneyardRows, _] = arr_to_rows(props.sequenceBoneyard, true, startUid) as [any[], number]
        rows = [...rows, ...boneyardRows]
        seqs = [...seqs, ...props.sequenceBoneyard]
    }

    const update_value = (value: boolean, checked: boolean, tableMeta: any) => {
        console.log('update value checked')

        const seq_id = tableMeta.rowData[0] // selected row is first row and OB_ID is first col

        let selIds: string[] = []
        let newBoneyard: string[] = []
        let newSeqList: Science[] = []
        if (checked) { // move from selOBs to boneyard
            const idx = props.sequences.findIndex(seq => seq.metadata.sequence_number === seq_id)
            const [removedSeq, nList] = removeFromList(props.sequences, idx)
            newSeqList = nList
            const insertIdx = props.sequenceBoneyard.length - 1
            newBoneyard = addToList(props.sequenceBoneyard, insertIdx, removedSeq)
            selIds = (nList as Science[]).map(seq => seq.metadata.sequence_number)
        }
        else { //move from boneyard to selOBs
            const idx = props.sequenceBoneyard.findIndex(seq => seq.metadata.sequence_number === seq_id)
            const [removedOB, nBY] = removeFromList(props.sequenceBoneyard, idx)
            newBoneyard = nBY
            const insertIdx = 0
            newSeqList = addToList(props.sequences, insertIdx, removedOB) as Science[]
            selIds = newSeqList.map(seq => seq.metadata.sequence_number)
        }

        console.log(`new_sequence_queue`, newSeqList, `new_sequence_boneyard`, newBoneyard)
        socket.emit('new_sequence_queue', { sequence_queue: newSeqList, ob: props.ob })
        socket.emit('new_sequence_boneyard', { sequence_boneyard: newBoneyard, ob: props.ob })
    }

    const options: MUIDataTableOptions = {
        filterType: 'dropdown',
        onRowsDelete: () => false,
        expandableRows: true,
        renderExpandableRow: (rowData, rowMeta: { dataIndex: number, rowIndex: number }) => {
            const seq = seqs[rowMeta.dataIndex]
            const colSpan = rowData.length + 1;
            return (
                <TableRow>
                    <TableCell colSpan={colSpan}>
                        <ReactJson
                            src={seq as object}
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
        setRowProps: (row, dataIndex, rowIndex) => {
            return {
                style: { padding: '0px' },
            };
        },
        setTableProps: () => {
            return {
                padding: 'none',
            };
        },
        selectableRowsHeader: false,
        selectableRowsHideCheckboxes: false,
        customToolbarSelect: selectedRows => {
            const selRow = rows[selectedRows.data[0].dataIndex]
            console.log(selRow, props.sequences)
            const idx = props.sequences.findIndex(seq => seq.metadata.sequence_number === selRow.sequence_number)
            return (
                <SeqToolbarSelect
                    idx={idx}
                    ob={props.ob}
                    sequences={props.sequences}
                    submitSeq={props.submitSeq}
                />)
        },
        selectableRows: 'single'
    }

    const columns = [
        {
            name: 'sequence_number', label: 'Seq number', options: {
                setCellProps: () => ({
                    align: "center",
                    textAlign: "center"
                }),
                display: true
            }
        },
        { name: 'name', label: 'Name', options: {} },
        {
            name: 'exposure_time', label: 'Exposure Time', options: {
                setCellProps: () => ({
                    align: "center",
                    textAlign: "center"
                }),
            }
        },
        { name: 'det_type', label: 'Detecter Type', options: { display: true } },
        { name: 'id', label: 'ID', options: { display: false } },
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

    return (rows.length > 0 ?
        (<MUIDataTable
            data={rows}
            columns={columns}
            options={options}
            title={"Target Table"}
            components={{ Checkbox: CustomCheckbox }}
        />) : (<React.Fragment></React.Fragment>)
    )
}

export default SelectedSequenceTable