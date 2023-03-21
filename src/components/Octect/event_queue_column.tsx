import React, { MouseEventHandler } from 'react'
import { DragDropContext } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'
import { Alert, Button, FormControl, Paper, Snackbar, Stack } from '@mui/material'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import ReactJson, { ThemeKeys } from 'react-json-view'
import { SocketContext } from '../../contexts/socket';

//@ts-ignore
const DragEventCell = (strObj) => {
    return (
        <div>
            <p> event: {strObj.id} </p>
        </div>
    )
}

const convert_string_array_to_object_array = (strArray: string[]) => {
    let obj = []
    for (let idx = 0; idx < strArray.length; idx++) {
        obj.push({ id: strArray[idx] })
    }
    return obj
}

interface Props {
    setSnackbarOpen: Function
    snackbarMsg: string
    snackbarOpen: boolean
    task: object
    releaseEventQueueLock: MouseEventHandler<HTMLButtonElement> | undefined
    submitEvent: MouseEventHandler<HTMLButtonElement> | undefined
    enableClipboard: any
    collapseStringsAfter: any
    collapsed: any
    iconStyle: any
    events: string[];
    eventBoneyard: string[];
}

export const EventQueueColumn = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [theme, setTheme] =
        useQueryParam('theme', withDefault(StringParam, 'bespin'))

    const [role, _] = useQueryParam('role', withDefault(StringParam, "observer"));

    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        const sKey: string = source.droppableId;
        const dKey: string = destination.droppableId;
        console.log('skey, dkey', sKey, dKey)


        if (sKey === dKey) { //shuffling items around
            let newEvents = [...props.events]
            newEvents = reorder(newEvents, source.index, destination.index)
            if (dKey === 'eventQueue') {
                socket.emit('new_event_queue', { event_queue: newEvents })
            }
            else {
                socket.emit('new_event_boneyard', { event_boneyard: newEvents })
            }
        } else { // item in droppable 
            if (dKey === 'eventQueue') { // event added to event queue
                const result = move(props.eventBoneyard, props.events, source, destination);
                socket.emit('new_event_queue', { event_queue: result[dKey] })
                socket.emit('new_event_boneyard', { event_boneyard: result[sKey] })
            }
            else { // event added to boneyard
                const result = move(props.events, props.eventBoneyard, source, destination);
                console.log('result', result)
                socket.emit('new_event_queue', { event_queue: result[sKey] })
                socket.emit('new_event_boneyard', { event_boneyard: result[dKey] })
            }
        }
    }
    const event_items = convert_string_array_to_object_array(props.events)
    const boneyard_items = convert_string_array_to_object_array(props.eventBoneyard)
    const isDragDisabled = true

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        props.setSnackbarOpen(false);
    };

    const disableQueueUnlock = role === "Observer"

    return (
        <React.Fragment>
            <Paper sx={{
                padding: '4px',
                margin: '4px',
                minHeight: 25,
                width: '100%',
                elevation: 3,
            }}
            >
                <ReactJson
                    src={props.task as object}
                    theme={theme as ThemeKeys | undefined}
                    iconStyle={props.iconStyle}
                    collapsed={props.collapsed}
                    collapseStringsAfterLength={props.collapseStringsAfter}
                    enableClipboard={props.enableClipboard}
                    onEdit={false}
                />
            </Paper>
            <Stack direction="row" spacing={0}>
                <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                    <Button variant="contained" onClick={props.submitEvent}>Submit Event</Button>
                </FormControl>
                <FormControl sx={{ width: 275, margin: '4px', marginTop: '16px', padding: '0px'  }}>
                    <Button disabled={disableQueueUnlock} variant="contained" onClick={props.releaseEventQueueLock}>Release Event Queue Lock</Button>
                </FormControl>
            </Stack>
            <Snackbar
                open={props.snackbarOpen}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
                    {props.snackbarMsg}
                </Alert>
            </Snackbar>
            <DragDropContext onDragEnd={onDragEnd}>
                {CreateDroppable(event_items, 'id', 'eventQueue', 'Sort events here', 'Event Queue', DragEventCell, isDragDisabled)}
                {CreateDroppable(boneyard_items, 'id', 'eventBoneyard', 'Discarded events live here', 'Event Boneyard', DragEventCell, isDragDisabled)}
            </DragDropContext>
        </React.Fragment>
    )
}