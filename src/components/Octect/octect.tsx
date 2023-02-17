import React, { useEffect, useState } from 'react'
import FormControl from '@mui/material/FormControl';
import { ObservationBlock, Science } from '../../typings/ptolemy'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import Button from '@mui/material/Button';
import { SocketContext } from './../../contexts/socket';
import JsonViewTheme from '../json_view_theme'
import ReactJson, { ThemeKeys, InteractionProps } from 'react-json-view'
import SequenceQueue from './sequence_queue'
import EventQueue from './event_queue'
import { ob_api_funcs } from '../../api/ApiRoot';

interface TaskEvent {
    func_name: string,
    id: string,
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

const Octect = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [avg, setAvg] = React.useState(defaultState.avg)
    const [ob, setOB] = React.useState({} as ObservationBlock)
    const [task, setTask] = React.useState({})
    const [theme, setTheme] =
        useQueryParam('theme', withDefault(StringParam, 'bespin'))
    const [sequences, setSequences] = React.useState([] as Science[])
    const [sequenceBoneyard, setSequenceBoneyard] = React.useState([] as Science[])
    const [events, setEvents] = React.useState([] as string[])
    const [eventBoneyard, setEventBoneyard] = React.useState([] as string[])
    let ping_pong_times: number[] = []
    let start_time: number

    // useEffect(() => {
    //     console.log('new OB. extracting sequences', ob)
    //     const seq = ob.observations
    //     if (seq) setSequences(seq)
    //     else setSequences([])
    //     setSequenceBoneyard([])
    // }, [ob])

    useEffect(() => {
        console.log('sequences changed: ', sequences)
    }, [sequences])

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

        socket.on('send_submitted_ob', (ob_data: OBServerData) => {
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
                    socket.emit('new_sequence_queue', {seq_queue: seq, ob: ob})
                }
                else {
                    setSequences([])
                    socket.emit('new_sequence_queue', {seq_queue: [], ob: ob})
                }
                setSequenceBoneyard([])
                setEvents([])
                setEventBoneyard([])
            })
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
            console.log('event_queue_broadcast event triggered. setting event_queue')
            const eq = data.event_queue.map( (evt: TaskEvent) => {
                return evt.func_name + '@' + evt.id
            })
            console.log('event_queue', eq)
            if (eq) setEvents(eq)
        })

        socket.on('event_boneyard_broadcast', (data) => {
            console.log('event_boneyard_broadcast event triggered. setting event_boneyard')
            const eb = data.event_boneyard
            console.log('event_boneyard', eb)
            if (eb) setEventBoneyard(eb)
        })

        socket.on('ob_sent', (data) => {
            console.log('returned data', data)
            setOB(data['ob'])
            const seq = data.ob?.sequences
            console.log('sequences', seq)
            if (seq) setSequences(seq)
            else setSequences([])
        })

        //@ts-ignore
        console.log('requesting ob to be sent to octect')
        socket.emit('request_ob')

    }, [])

    const submitAcq = () => {
        console.log('submit sequence button clicked. sending task')
        const data = { task: ob.acquisition }
        socket.emit('new_task', data)
    }

    const submitSeq = () => {
        console.log('submit sequence button clicked. sending task')
        const data = { task: sequences[0] }
        socket.emit('new_task', data)
    }

    const submitEvent = () => {
        console.log('submit event button clicked. not implemented.')
    }


    return (
        <div>
            {/* <span>{avg} ms</span> */}
            <Grid container spacing={1} sx={{
                textAlign: 'left',
                margin: 1,
                display: 'flex',
                maxWidth: '1600px',
            }}
            >
                <Grid item xs={8}>
                    <Paper sx={{
                        padding: 2,
                        margin: 1,
                        minWidth: '800px',
                        maxWidth: '800px',
                        minHeight: 25,
                        elevation: 3,
                    }}
                    >
                        <Tooltip title="Change the color theme of the OB JSON display">
                            <div>
                                <JsonViewTheme
                                    theme={theme as ThemeKeys | null | undefined}
                                    setTheme={setTheme}
                                />
                            </div>
                        </Tooltip>
                        <ReactJson
                            src={ob as object}
                            theme={theme as ThemeKeys | undefined}
                            iconStyle={props.iconStyle}
                            collapsed={props.collapsed}
                            collapseStringsAfterLength={props.collapseStringsAfter}
                            enableClipboard={props.enableClipboard}
                            onEdit={false}
                        />
                    </Paper>
                    <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                        <Button variant="contained" onClick={submitSeq}>Submit Top Sequence</Button>
                    </FormControl>
                    <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                        <Button variant="contained" onClick={submitAcq}>Submit Acquisition</Button>
                    </FormControl>
                    <Paper sx={{
                        padding: 2,
                        margin: 1,
                        minWidth: '800px',
                        maxWidth: '800px',
                        minHeight: 25,
                        elevation: 3,
                    }}
                        elevation={3}>
                        <SequenceQueue ob={ob} sequence_queue={sequences} sequence_boneyard={sequenceBoneyard} socket={socket} />
                    </Paper >
                </Grid>
                <Grid item xs={4}>
                    <Paper sx={{
                        padding: 2,
                        margin: 1,
                        minWidth: '400px',
                        maxWidth: '400px',
                        minHeight: 25,
                        elevation: 3,
                    }}
                    >
                        <ReactJson
                            src={task as object}
                            theme={theme as ThemeKeys | undefined}
                            iconStyle={props.iconStyle}
                            collapsed={props.collapsed}
                            collapseStringsAfterLength={props.collapseStringsAfter}
                            enableClipboard={props.enableClipboard}
                            onEdit={false}
                        />
                    </Paper>
                    <Button onClick={submitEvent}>Submit Event</Button>
                    <Paper sx={{
                        padding: 2,
                        margin: 1,
                        minWidth: '400px',
                        maxWidth: '400px',
                        minHeight: 25,
                        elevation: 3,
                    }}
                        elevation={3}>
                        <EventQueue event_queue={events} event_boneyard={eventBoneyard} socket={socket} />
                    </Paper >
                </Grid>
            </Grid>
        </div >
    )
}

Octect.defaultProps = {
    iconStyle: 'circle',
    collapsed: 1,
    collapseStringsAfter: 15,
    enableClipboard: true,
    editable: true,
}

export default Octect