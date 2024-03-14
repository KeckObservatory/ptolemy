import React, { useEffect } from 'react'
import { Acquisition, OBSequence, ObservationBlock, Science } from '../typings/ptolemy'
import Grid from '@mui/material/Grid'
import { SocketContext } from './../contexts/socket';
import { ob_api_funcs } from '../api/ApiRoot';
import { SelectionToolColumn } from './SelectionTool/selection_tool_column';
import { SequenceQueueColumn } from './Octect/sequence_queue_column';
import { EventDict, EventQueueColumn } from './Octect/event_queue_column';
import { StringParam, useQueryParam, withDefault } from 'use-query-params';

interface EEState {
    ob?: ObservationBlock,
    ob_id_queue: string[],
    ob_id_boneyard: string[],
    selected_task: Science | Acquisition,
    sequence_queue: Science[],
    sequence_boneyard: Science[],
    event_queue: EventDict[],
    event_boneyard: EventDict[],
    pause: boolean,
    halt: boolean
}

interface Props {
    iconStyle: 'circle' | 'triangle' | 'square',
    collapsed: number,
    collapseStringsAfter: number,
    enableClipboard: boolean,
    editable: boolean,
}

interface OBServerData {
    ob: ObservationBlock
}

export const Ptolemy = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [snackbarOpen, setSnackbarOpen] = React.useState(false)
    const [snackbarMsg, setSnackbarMsg] = React.useState("default message")
    const [ob, setOB] = React.useState({} as ObservationBlock)
    const [task, setTask] = React.useState({} as OBSequence)
    const [selOBs, setSelOBs] = React.useState([] as ObservationBlock[])
    const [obBoneyard, setOBBoneyard] = React.useState([] as ObservationBlock[])
    const [sequences, setSequences] = React.useState([] as Science[])
    const [sequenceBoneyard, setSequenceBoneyard] = React.useState([] as Science[])
    const [events, setEvents] = React.useState([] as EventDict[])
    const [eventBoneyard, setEventBoneyard] = React.useState([] as EventDict[])
    const [halt, setHalt] = React.useState(false)
    const [pause, setPause] = React.useState(false)

    const [role, _] = useQueryParam('role', withDefault(StringParam, "Observer"));

    useEffect((): any => {
        console.log('starting socket connections: ')
        create_connections()
        return () => socket.off();
    }, [socket])

    const create_connections = React.useCallback(() => {

        socket.on('broadcast_submitted_ob_from_server', (ob_data: OBServerData) => {
            console.log('new ob event triggered. setting ob, and queues', ob_data)

            const newOBID = ob_data.ob._id
            //get the source of truth from the database
            ob_api_funcs.get(newOBID).then((ob: ObservationBlock) => {
                console.log('setting ob to:', ob)
                setOB(ob)
                const seq = ob.observations
                console.log('setting sequences to:', seq)
                if (seq) {
                    setSequences(seq)
                }
                else {
                    setSequences([])
                }
                setSequenceBoneyard([])
                setEvents([])
                setEventBoneyard([])
            })
        })

        socket.on('broadcast_ee_state_from_server', async (data: EEState) => {
            console.log('ee state recieved', data)
            data.ob && setOB(data.ob)

            const newSelObs = data.ob_id_queue.length > 0 && await ob_api_funcs.get_many(data.ob_id_queue)
            const newOBBoneyard = data.ob_id_boneyard.length > 0 && await ob_api_funcs.get_many(data.ob_id_boneyard)
            newSelObs && setSelOBs(newSelObs)
            newOBBoneyard && setOBBoneyard(newOBBoneyard)
            data.sequence_queue.length > 0 && setSequences(data.sequence_queue)
            data.sequence_boneyard.length > 0 && setSequenceBoneyard(data.sequence_boneyard)
            data.event_queue.length > 0 && setEvents(data.event_queue)
            data.event_boneyard.length > 0 && setEventBoneyard(data.event_boneyard)
            data.selected_task && setTask(data.selected_task) 
            setPause(data.pause)
            setHalt(data.halt)
        })

        socket.on('task_broadcast', (data) => {
            console.log('task broadcast triggered. setting task and getting event queue')
            const newTask = data.task
            const events = data.events
            if (newTask) setTask(newTask)
            if (events) setEvents(events)
        })

        socket.on('sequence_queue_broadcast', (data) => {
            console.log('sequence_queue_broadcast event triggered. setting sequence_queue')
            const seq = data.sequence_queue
            console.log('sequences', seq)
            if (seq) setSequences(seq)
        })

        socket.on('sequence_boneyard_broadcast', (data) => {
            console.log('sequence_boneyard_broadcast event triggered. setting sequence_boneyard')
            const seq = data.sequence_boneyard
            console.log('sequence_boneyard', seq)
            if (seq) setSequenceBoneyard(seq)
        })

        socket.on('event_queue_broadcast', (data) => {
            console.log('event_queue_broadcast event triggered. setting event_queue', data)
            console.log('event_queue', data.event_queue)
            setEvents(data.event_queue)
        })

        socket.on('event_boneyard_broadcast', (data) => {
            console.log('event_boneyard_broadcast event triggered. setting event_boneyard')
            console.log('event_boneyard', data.event_boneyard)
            setEventBoneyard(data.event_boneyard)
        })


        socket.on('new_event_queue_and_boneyard', (data) => {
            console.log('new_event_queue_and_boneyard broadcasted. Setting.')
            console.log('event_queue', data.event_queue)
            console.log('event_boneyard', data.event_boneyard)
            
            setEvents(data.event_queue)
            setEventBoneyard(data.event_boneyard)
        })

        socket.on('paused_halted_broadcast', (data) => {
            console.log('paused_halted_broadcast. Setting.')
            console.log('pause', data.pause)
            console.log('halt', data.halt)
            data.pause && setPause(() => data.pause)
            data.halt && setHalt(() => data.halt)
        })

        socket.on('ob_sent', (data) => {
            console.log('returned data', data)
            setOB(data['ob'])
            const seq = data.ob?.sequences
            console.log('sequences', seq)
            if (seq) setSequences(seq)
            else setSequences([])
        })

        socket.on('snackbar_msg', (data) => {
            console.log('snackbar_msg received', data)
            const msg = data.msg
            setSnackbarMsg(msg)
            setSnackbarOpen(true)
        })

        console.log('requesting ob to be sent to octect')
        socket.emit('request_ee_state')

    }, [])

    const submitAcq = () => {
        console.log('submit sequence button clicked. sending task')
        const data = { task: ob.acquisition, isAcq: true }
        socket.emit('new_task', data)
    }

    const submitSeq = (idx: number) => {
        const task = sequences[idx]
        console.log(`submit sequence button clicked. sending sequence task idx ${idx}`, task)
        const data = { task: task, isAcq: false }
        socket.emit('new_task', data)
    }

    const submitEvent = (idx: number) => {
        console.log('submit event button clicked.')
        console.log(`trying to submit event idx ${idx}`, events[idx])
        socket.emit('submit_event', { 'submitted_event': events[idx] })
    }

    const releaseEventQueueLock = () => {
        console.log('releaseEventQueueLock button clicked.')
        socket.emit('release_event_queue_lock')
    }

    const NotOAView = !role.includes('OA')

    return (
        <React.Fragment>
            {
                NotOAView ? (
                    <React.Fragment>
                        <Grid container spacing={2} columns={18}>
                            < Grid item xs={6}>
                                <SelectionToolColumn
                                    selOBs={selOBs}
                                    setSelOBs={setSelOBs}
                                    obBoneyard={obBoneyard}
                                    setOBBoneyard={setOBBoneyard}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <SequenceQueueColumn
                                    enableClipboard={props.enableClipboard}
                                    collapseStringsAfter={props.collapseStringsAfter}
                                    collapsed={props.collapsed}
                                    iconStyle={props.iconStyle}
                                    submitAcq={submitAcq}
                                    submitSeq={submitSeq}
                                    sequences={sequences}
                                    sequenceBoneyard={sequenceBoneyard}
                                    ob={ob}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <EventQueueColumn
                                    setSnackbarOpen={setSnackbarOpen}
                                    snackbarMsg={snackbarMsg}
                                    snackbarOpen={snackbarOpen}
                                    sequence={task}
                                    releaseEventQueueLock={releaseEventQueueLock}
                                    submitEvent={submitEvent}
                                    enableClipboard={props.enableClipboard}
                                    collapseStringsAfter={props.collapseStringsAfter}
                                    collapsed={props.collapsed}
                                    iconStyle={props.iconStyle}
                                    events={events}
                                    eventBoneyard={eventBoneyard}
                                    pause={pause}
                                    halt={halt}
                                />
                            </Grid>
                        </Grid>

                    </React.Fragment>
                ) : (
                    <EventQueueColumn
                        setSnackbarOpen={setSnackbarOpen}
                        snackbarMsg={snackbarMsg}
                        snackbarOpen={snackbarOpen}
                        sequence={task}
                        releaseEventQueueLock={releaseEventQueueLock}
                        submitEvent={submitEvent}
                        enableClipboard={props.enableClipboard}
                        collapseStringsAfter={props.collapseStringsAfter}
                        collapsed={props.collapsed}
                        iconStyle={props.iconStyle}
                        events={events}
                        eventBoneyard={eventBoneyard}
                        pause={pause}
                        halt={halt}
                    />
                )
            }
        </React.Fragment >
    )
}

Ptolemy.defaultProps = {
    iconStyle: 'circle',
    collapsed: 1,
    collapseStringsAfter: 15,
    enableClipboard: true,
    editable: true,
}