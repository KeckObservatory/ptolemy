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
import { EventDict } from "./event_queue_column";
import { addToList, removeFromList } from "../SelectionTool/selected_ob_table";

interface Props {
    role: string;
    events: EventDict[];
    eventBoneyard: EventDict[];
    submitEvent: Function;
    hideCompletedEvents: boolean;
}

interface EventTSProps {
    role: string;
    events: EventDict[];
    submitEvent: Function;
    idx: number;
}

const arr_to_rows = (arr: any[], completed = true, startUid = 0) => {
    let rows: any[] = []
    let uid = startUid
    arr.forEach((el: any, idx: number) => {
        const row = {
            id: el.id,
            subsystem: el.subsystem,
            event_type: el.event_type,
            script_name: el.script_name,
            completed: completed
        }
        rows.push(row)
        uid += 1
    })
    return [rows, uid]
}

const EventToolbarSelect = (props: EventTSProps) => {

    const socket = React.useContext(SocketContext);
    const handle_move = async (idx: number, jdx: number) => {
        let event_ids = props.events.map(ev => ev.id)
        if (idx === jdx || jdx < 0 || jdx >= event_ids.length) {
            console.log(`can't move from idx to position jdx`)
            return
        }

        const el = event_ids[idx];
        event_ids.splice(idx, 1);
        event_ids.splice(jdx, 0, el);
        let selEvents = [...props.events]
        selEvents.sort(function (a, b) {
            return event_ids.indexOf(a.id) - event_ids.indexOf(b.id)
        });
        socket.emit('new_event_queue', { event_queue: selEvents })
    };

    return (
        <React.Fragment>
            <Tooltip title="Move up one row">
                <IconButton onClick={() => { handle_move(props.idx, props.idx - 1) }} aria-label='move-up'>
                    <KeyboardArrowUpIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Move to top">
                <IconButton onClick={() => { handle_move(props.idx, 0) }} aria-label='move-top'>
                    <KeyboardDoubleArrowUpIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Move down one row">
                <IconButton onClick={() => { handle_move(props.idx, props.idx + 1) }} aria-label='move-down'>
                    <KeyboardArrowDownIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title="Move to bottom">
                <IconButton onClick={() => { handle_move(props.idx, props.events.length - 1) }} aria-label='move-bottom'>
                    <KeyboardDoubleArrowDownIcon />
                </IconButton>
            </Tooltip>
            <Tooltip title={"Sends Event to Execution Engine"}>
                <Button
                    disabled={props.role.includes('OA')}
                    variant="contained"
                    onClick={() => props.submitEvent(props.idx)}>
                    Submit Event
                </Button>
            </Tooltip>
        </React.Fragment>
    );
}

const CustomCheckbox = (props: any) => {
    let newProps = Object.assign({}, props);
    newProps.color = props['data-description'] === 'row-select' ? 'secondary' : 'primary';

    return (
        <Tooltip title='select event'>
            <Checkbox {...newProps} />
        </Tooltip>
    );
}

interface CRR {
    name: string,
    subsystem: string,
    block: boolean,
    completed: boolean
    id: string

}

const CustomRowRender = (props: CRR) => {

    return (
        <div>
            <h1>
                {props.name}
            </h1>
            <p>
                Subsystem: {props.subsystem} <br />
                Blocking?: {props.block}
                Completed: {props.completed} <br />
            </p>
        </div>
    );
}



const SelectedEventTable = (props: Props) => {
    const [jsontheme, _] = useQueryParam('theme', withDefault(StringParam, 'bespin'))

    const socket = React.useContext(SocketContext);

    let [rows, startUid] = arr_to_rows(props.events, false, 0) as [any[], number]
    let events = [...props.events]
    if (!props.hideCompletedEvents) {
        const [boneyardRows, _] = arr_to_rows(props.eventBoneyard, true, startUid) as [any[], number]
        rows = [...rows, ...boneyardRows]
        events = [...events, ...props.eventBoneyard]
    }

    console.log('rendering event table. rows', rows)

    const update_value = (value: boolean, checked: boolean, tableMeta: any) => {
        console.log('update value checked')

        const event_id = tableMeta.rowData[0] // selected row is first row and OB_ID is first col

        let newBoneyard: string[] = []
        let newEventList: EventDict[] = []
        if (checked) { // move from selOBs to boneyard
            const idx = props.events.findIndex(evt => evt.id === event_id)
            const [removedSeq, nList] = removeFromList(props.events, idx)
            newEventList = nList
            const insertIdx = props.eventBoneyard.length - 1
            newBoneyard = addToList(props.eventBoneyard, insertIdx, removedSeq)
        }
        else { //move from boneyard to selOBs
            const idx = props.eventBoneyard.findIndex(evt => evt.id === event_id)
            const [removedEvent, nBY] = removeFromList(props.eventBoneyard, idx)
            newBoneyard = nBY
            const insertIdx = 0
            newEventList = addToList(props.events, insertIdx, removedEvent) as EventDict[]
        }

        console.log(`new_event_queue`, newEventList, `new_event_boneyard`, newBoneyard)

        socket.emit('event_queue_boneyard_swap', { event_queue: newEventList, event_boneyard: newBoneyard })
    }

    const options: MUIDataTableOptions = {
        filterType: 'dropdown',
        onRowsDelete: () => false,
        expandableRows: true,
        renderExpandableRow: (rowData, rowMeta: { dataIndex: number, rowIndex: number }) => {
            const evt = events[rowMeta.dataIndex]
            const colSpan = rowData.length + 1;
            return (
                <TableRow>
                    <TableCell colSpan={colSpan}>
                        <ReactJson
                            src={evt as object}
                            theme={jsontheme as ThemeKeys}
                            collapsed={true}
                            enableClipboard={true}
                            onEdit={false}
                        />
                    </TableCell>
                </TableRow >
            )
        },
        // customRowRender: data => {
        //     const [id, subsystem, name, block, completed] = data;
        //     return (
        //         <tr key={id}>
        //             <td colSpan={5} style={{ padding: "0px" }}>
        //                 <CustomRowRender
        //                     id={id}
        //                     name={name}
        //                     subsystem={subsystem}
        //                     block={block}
        //                     completed={completed}
        //                 />
        //             </td>
        //         </tr>
        //     );
        // },
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
            console.log(selRow, props.events)
            const idx = props.events.findIndex(evt => evt.id === selRow.id)
            return (
                <EventToolbarSelect
                    idx={idx}
                    role={props.role}
                    events={props.events}
                    submitEvent={props.submitEvent}
                />)
        },
        selectableRows: 'single'
    }

    const columns = [
        { name: 'id', label: 'ID', options: { display: false } },
        { name: 'subsystem', label: 'Subystem', options: { display: false } },
        { name: 'script_name', label: 'Name', options: {} },
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

export default SelectedEventTable