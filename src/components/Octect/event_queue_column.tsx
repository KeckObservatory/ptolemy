
import React, { MouseEventHandler } from 'react'
import { DragDropContext } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'
import { Alert, Button, FormControl, Paper, Snackbar } from '@mui/material'
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


    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        const sKey: string = source.droppableId;
        const dKey: string = destination.droppableId;
        console.log('skey, dkey', sKey, dKey)


        if (sKey === dKey) { //shuffling items around
            let newSeq = [...props.events]
            newSeq = reorder(newSeq, source.index, destination.index)
            if (dKey === 'eventQueue') {
                socket.emit('new_event_queue', { event_queue: newSeq })
            }
            else {
                socket.emit('new_event_boneyard', { event_boneyard: newSeq })
            }
        } else { // item in droppable 
            if (dKey === 'eventQueue') { // event added to event queue
                const result = move(props.eventBoneyard, props.events, source, destination);
                // props.setSequences(result[dKey])
                socket.emit('new_event_queue', { event_queue: result[dKey] })
                // setDiscardedSequences(result[sKey])
                socket.emit('new_event_boneyard', { event_boneyard: result[sKey] })
            }
            else { // event added to boneyard
                const result = move(props.events, props.eventBoneyard, source, destination);
                console.log('result', result)
                // props.setSequences(result[sKey])
                socket.emit('new_event_queue', { event_queue: result[sKey] })
                socket.emit('new_event_boneyard', { event_boneyard: result[dKey] })
                // setDiscardedSequences(result[dKey])
            }
        }
    }
    const event_items = convert_string_array_to_object_array(props.events)
    const boneyard_items = convert_string_array_to_object_array(props.eventBoneyard)
    const isDragDisabled = true

    
    const releaseEventQueueLock = () => {
        console.log('releaseEventQueueLock button clicked.')
        socket.emit('release_event_queue_lock')
    }

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        props.setSnackbarOpen(false);
    };

    return (
        <React.Fragment>

            <Paper sx={{
                padding: '8px',
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

            <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                <Button onClick={props.submitEvent}>Submit Event</Button>
            </FormControl>
            <FormControl sx={{ width: 300, margin: '4px', marginTop: '16px' }}>
                <Button onClick={props.releaseEventQueueLock}>Release Event Queue Lock</Button>
            </FormControl>
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