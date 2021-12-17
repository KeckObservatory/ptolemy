import React, { useEffect, useState } from 'react'
import { OBCell, ObservationBlock, Science } from '../../typings/ptolemy'
import { makeStyles } from '@mui/styles'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import DropDown from '../drop_down'
import Button from '@mui/material/Button';
import { SocketContext } from './../../contexts/socket';
import JsonViewTheme from '../json_view_theme'
import ReactJson, { ThemeKeys, InteractionProps } from 'react-json-view'
import SequenceQueue from './sequence_queue'
import EventQueue from './event_queue'


const useStyles = makeStyles((theme: any) => ({
    grid: {
        textAlign: 'left',
        margin: theme.spacing(1),
        display: 'flex',
        // width: '100%',
        maxWidth: theme.spacing(190),
    },
    paper: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
        minWidth: theme.spacing(95),
        maxWidth: theme.spacing(95),
        minHeight: theme.spacing(25),
        elevation: 3,
    },
    widepaper: {
        padding: theme.spacing(2),
        margin: theme.spacing(1),
        height: '700px',
        elevation: 3,
        width: theme.spacing(120)
    },
    cell: {
    },
}))

interface Props {
    theme: ThemeKeys,
    iconStyle: 'circle' | 'triangle' | 'square',
    collapsed: number,
    collapseStringsAfter: number,
    enableClipboard: boolean,
    editable: boolean,
}

interface State {
    theme: string;
    avg: number
    ob?: ObservationBlock
    sequences?: Science[]
    sequences_boneyard?: Science[]
    events?: string[]
    event_boneyard?: string[]
}


const defaultState: State = {
    theme: 'apathy',
    avg: 0,
}

const Octect = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [avg, setAvg] = React.useState(defaultState.avg)
    const [ob, setOB] = React.useState({} as ObservationBlock)
    const [task, setTask] = React.useState({})
    const [theme, setTheme] =
        useQueryParam('theme', withDefault(StringParam, defaultState.theme))
    const [sequences, setSequences] = React.useState([] as Science[])
    const [sequenceBoneyard, setSequenceBoneyard] = React.useState([] as Science[])
    const [events, setEvents] = React.useState([] as string[])
    const [eventBoneyard, setEventBoneyard] = React.useState([] as string[])
    let ping_pong_times: number[] = []
    let start_time: number
    const classes = useStyles()


    useEffect(() => {
        console.log('new OB. extracting sequences')
        const seq = ob.sequences
        if (seq) setSequences(seq)
        else setSequences([])
        setSequenceBoneyard([])
    }, [ob])

    useEffect(() => {
        console.log('sequences changed. sending to : ')
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

        socket.on('my_response', function (msg) {
            const txt = 'received #' + msg.count + ': ' + msg.data
            console.log(txt)
        })

        socket.on('my_pong', function () {
            var latency = new Date().getTime() - start_time;
            ping_pong_times.push(latency);
            ping_pong_times = ping_pong_times.slice(-30); // keep last 30 samples
            var sum = 0;
            for (var i = 0; i < ping_pong_times.length; i++)
                sum += ping_pong_times[i];
            // setAvg(Math.round(10 * sum / ping_pong_times.length) / 10)
        });

        socket.on('new_ob', (data) => {
            console.log('new ob event triggered. setting ob, and queues')
            const newOB = data.ob
            setOB(newOB)
            const seq = ob.sequences
            if (seq) setSequences(seq)
            setSequenceBoneyard([])
            setEvents([])
            setEventBoneyard([])
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
            const eq = data.event_queue
            console.log('event_queue', eq)
            if (eq) setEvents(eq)
        })

        socket.on('event_boneyard_broadcast', (data) => {
            console.log('event_boneyard_broadcast event triggered. setting event_boneyard')
            const eb = data.event_boneyard
            console.log('event_boneyard', eb)
            if (eb) setEventBoneyard(eb)
        })

        //@ts-ignore
        socket.emit('send_ob', (data) => {
            console.log('returnded data', data)
            setOB(data['ob'])
            const seq = data.ob?.sequences
            console.log('sequences', seq)
            if (seq) setSequences(seq)
        })

    }, [])

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
            <Grid container spacing={1} className={classes.grid}>
                <Grid item xs={8}>
                    <Paper className={classes.paper}>
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
                    <Button onClick={submitSeq}>Submit Top Sequence</Button>
                    <Paper className={classes.paper} elevation={3}>
                        <SequenceQueue sequence_queue={sequences} sequence_boneyard={sequenceBoneyard} socket={socket} />
                    </Paper >
                </Grid>
                <Grid item xs={4}>
                    <Paper className={classes.paper}>
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
                    <Paper className={classes.paper} elevation={3}>
                        <EventQueue event_queue={events} event_boneyard={eventBoneyard} socket={socket} />
                    </Paper >
                </Grid>
            </Grid>
        </div>
    )
}

Octect.defaultProps = {
    theme: 'bespin',
    iconStyle: 'circle',
    collapsed: 1,
    collapseStringsAfter: 15,
    enableClipboard: true,
    editable: true,
}

export default Octect