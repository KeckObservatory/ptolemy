import React, { useEffect, useState } from 'react'
import FormControl from '@mui/material/FormControl';
import { ObservationBlock, Science } from '../typings/ptolemy'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import Button from '@mui/material/Button';
import { SocketContext } from './../contexts/socket';
import JsonViewTheme from './json_view_theme'
import ReactJson, { ThemeKeys, InteractionProps } from 'react-json-view'
import SequenceQueue from './Octect/sequence_queue'
import EventQueue from './Octect/event_queue'
import { ob_api_funcs } from '../api/ApiRoot';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { SelectionToolColumn } from './SelectionTool/selection_tool_column';
import { SequenceQueueColumn } from './Octect/sequence_queue_column';
import { EventQueueColumn } from './Octect/event_queue_column';

interface TaskEvent {
    script_name: string,
    args: object,
    id: string,
}

interface EventQueueBoneyard {
    event_queue: string,
    event_boneyard: string
}

interface EEState {
    ob?: ObservationBlock,
    ob_id_queue: string[],
    ob_id_boneyard: string[],
    sequence_queue: Science[],
    sequence_boneyard: Science[],
    event_queue: TaskEvent[],
    event_boneyard: TaskEvent[]
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
interface State {
    avg: number
    ob?: ObservationBlock
    sequences?: Science[]
    sequences_boneyard?: Science[]
    events?: string[]
    event_boneyard?: string[]
}


const defaultState: State = {
    avg: 0,
}

export const Ptolemy = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [avg, setAvg] = React.useState(defaultState.avg)
    const [snackbarOpen, setSnackbarOpen] = React.useState(false)
    const [snackbarMsg, setSnackbarMsg] = React.useState("default message")
    const [ob, setOB] = React.useState({} as ObservationBlock)
    const [task, setTask] = React.useState({})
    const [selObs, setSelObs] = React.useState([] as ObservationBlock[])
    const [obBoneyard, setOBBoneyard] = React.useState([] as ObservationBlock[])
    const [sequences, setSequences] = React.useState([] as Science[])
    const [sequenceBoneyard, setSequenceBoneyard] = React.useState([] as Science[])
    const [events, setEvents] = React.useState([] as string[])
    const [eventBoneyard, setEventBoneyard] = React.useState([] as string[])
    let ping_pong_times: number[] = []
    let start_time: number

    useEffect((): any => {
        console.log('starting socket connections: ')
        create_connections()
        return () => socket.off();
    }, [socket])

    const create_connections = React.useCallback(() => {

        window.setInterval(function () {
            start_time = (new Date).getTime();
            socket.emit('my_ping');
        }, 1000);

        socket.on('my_pong', function () {
            var latency = new Date().getTime() - start_time;
            ping_pong_times.push(latency);
            ping_pong_times = ping_pong_times.slice(-30); // keep last 30 samples
            var sum = 0;
            for (var i = 0; i < ping_pong_times.length; i++)
                sum += ping_pong_times[i];
            // setAvg(Math.round(10 * sum / ping_pong_times.length) / 10)
        });

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
                    socket.emit('new_sequence_queue', { sequence_queue: seq, ob: ob })
                }
                else {
                    setSequences([])
                    socket.emit('new_sequence_queue', { sequence_queue: [], ob: ob })
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
            newSelObs && setSelObs(newSelObs) 
            newOBBoneyard && setOBBoneyard(newOBBoneyard)
            setSequences(data.sequence_queue)
            setSequenceBoneyard(data.sequence_boneyard)

            const eq = data.event_queue.map((evt: TaskEvent) => {
                return evt.script_name + '@' + evt.id
            })
            setEvents( eq )

            const eqb = data.event_boneyard.map((evt: TaskEvent) => {
                return evt.script_name + '@' + evt.id
            })
            setEventBoneyard(eqb)
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
            const eventQueue = data.event_queue.map((evt: TaskEvent) => {
                return evt.script_name + '@' + evt.id
            })
            console.log('event_queue', eventQueue)
            if (eventQueue) setEvents(eventQueue)
        })

        socket.on('event_boneyard_broadcast', (data) => {
            console.log('event_boneyard_broadcast event triggered. setting event_boneyard')
            const eventBoneyard = data.event_boneyard.map((evt: TaskEvent) => {
                return evt.script_name + '@' + evt.id
            })
            console.log('event_boneyard', eventBoneyard)
            if (eventBoneyard) setEventBoneyard(eventBoneyard)
        })


        socket.on('new_event_queue_and_boneyard', (data) => {
            setEvents(data.event_queue)
            setEventBoneyard(data.event_boneyard)
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
        //socket.emit('request_ob')
        socket.emit('request_ee_state')

    }, [])

    const submitAcq = () => {
        console.log('submit sequence button clicked. sending task')
        const data = { task: ob.acquisition, isAcq: true }
        socket.emit('new_task', data)
    }

    const submitSeq = () => {
        const task = sequences[0]
        console.log('submit sequence button clicked. sending sequence task', task)
        const data = { task: task }
        socket.emit('new_task', data)
    }

    const submitEvent = () => {
        console.log('submit event button clicked.')
        console.log('trying to submit', events[0])
        socket.emit('submit_event')
    }


    const releaseEventQueueLock = () => {
        console.log('releaseEventQueueLock button clicked.')
        socket.emit('release_event_queue_lock')
    }

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };


    return (

        <React.Fragment>
            <Grid container spacing={2} columns={18}>
                <Grid item xs={6}>
                    <SelectionToolColumn 
                       selObs={selObs}
                       setSelObs={setSelObs}
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
                        setSequences={setSequences}
                        setSequenceBoneyard={setSequenceBoneyard}
                        ob={ob}
                    />
                </Grid>
                <Grid item xs={6}>
                    <EventQueueColumn
                        setSnackbarOpen={setSnackbarOpen}
                        snackbarMsg={snackbarMsg}
                        snackbarOpen={snackbarOpen}
                        task={task}
                        releaseEventQueueLock={releaseEventQueueLock}
                        submitEvent={submitEvent}
                        enableClipboard={props.enableClipboard}
                        collapseStringsAfter={props.collapseStringsAfter}
                        collapsed={props.collapsed}
                        iconStyle={props.iconStyle}
                        events={events}
                        eventBoneyard={eventBoneyard}
                    />
                </Grid>
            </Grid>
        </React.Fragment>
    )
}

Ptolemy.defaultProps = {
    iconStyle: 'circle',
    collapsed: 1,
    collapseStringsAfter: 15,
    enableClipboard: true,
    editable: true,
}