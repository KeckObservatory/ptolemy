import React, { MouseEventHandler } from 'react'
import { DragDropContext } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, FormControl, Paper, Snackbar, Stack } from '@mui/material'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import ReactJson, { ThemeKeys } from 'react-json-view'
import { SocketContext } from '../../contexts/socket';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface EventDict {
    id: string,
    subsystem: string,
    sem_id: string,
    event_type: string,
    args: object,
    script_name: string,
    block: boolean
}

//@ts-ignore
const DragEventCell = (eventDict: EventDict) => {
    const [theme, setTheme] = useQueryParam('theme', withDefault(StringParam, 'bespin'))
    return (
        <div>
            <p> name: {eventDict.script_name} </p>
            <p> type: {eventDict.event_type} </p>
            <ReactJson
                src={eventDict.args as object}
                theme={theme as ThemeKeys | undefined}
                iconStyle={'circle'}
                collapsed={0}
                collapseStringsAfterLength={15}
                enableClipboard={true}
                onEdit={false}
            />
        </div>
    )
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
            if (dKey === 'eventQueue') {
                let newEvents = [...props.events]
                newEvents = reorder(newEvents, source.index, destination.index)
                socket.emit('new_event_queue', { event_queue: newEvents })
            }
            else {
                let newBoneyard = [...props.eventBoneyard]
                newBoneyard = reorder(newBoneyard, source.index, destination.index)
                socket.emit('new_event_boneyard', { event_boneyard: newBoneyard })
            }
        } else { // item in droppable 
            if (dKey === 'eventQueue') { // event added to event queue
                const result = move(props.eventBoneyard, props.events, source, destination);
                socket.emit('event_queue_boneyard_swap', { event_queue: result[dKey], event_boneyard: result[sKey] })
            }
            else { // event added to boneyard
                const result = move(props.events, props.eventBoneyard, source, destination);
                console.log('result', result)
                socket.emit('event_queue_boneyard_swap', { event_queue: result[sKey], event_boneyard: result[dKey] })
            }
        }
    }
    const isDragDisabled = role === "Observer" ? true : false

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        props.setSnackbarOpen(false);
    };

    const disableQueueUnlock = role === "Observer"

    return (
        <React.Fragment>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        maxHeight: 50,
                        margin: '0px',
                        padding: '4px'
                    }}

                >
                    <h2 style={{ margin: '0px' }}>Selected Sequence</h2>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '0px',
                        margin: '4px',
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
                </AccordionDetails>
            </Accordion>
            <Stack sx={{ margin: '8px', height: '40px' }} direction="row" spacing={2}>
                <Button variant="contained" onClick={props.submitEvent}>Submit Event</Button>
                <Button disabled={disableQueueUnlock} variant="contained" onClick={props.releaseEventQueueLock}>Release Event Queue Lock</Button>
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
                {CreateDroppable(props.events, 'eventQueue', 'eventQueue', 'Sort events here', 'Event Queue', DragEventCell, isDragDisabled)}
                {CreateDroppable(props.eventBoneyard, 'eventBoneyard', 'eventBoneyard', 'Discarded events live here', 'Event Boneyard', DragEventCell, isDragDisabled)}
            </DragDropContext>
        </React.Fragment>
    )
}