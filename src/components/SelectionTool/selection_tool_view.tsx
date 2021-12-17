import React, { useEffect, useState } from 'react'
import { get_obs_from_semester, get_sem_id_list } from '../../api/utils'
import { OBCell, ObservationBlock } from '../../typings/ptolemy'
import { makeStyles } from '@mui/styles'
import { Theme } from '@mui/material/styles'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import { OBQueue } from './ob_queue'
import SkyView from './sky-view/sky_view'
import DropDown from '../drop_down'
import Button from '@mui/material/Button';
import { SocketContext } from './../../contexts/socket';

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
        minWidth: theme.spacing(120),
        maxWidth: theme.spacing(150),
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
    observer_id: string
}

interface State {
    selObs: OBCell[];
    avlObs: OBCell[];
    sem_id: string
    semIdList: string[]
    chartType: string;
}


const defaultState: State = {
    avlObs: [],
    selObs: [],
    sem_id: '2017A_U033',
    semIdList: [],
    chartType: 'altitude'
}

const container_obs_to_cells = (container_obs: ObservationBlock[]): OBCell[] => {
    let cells: any[] = []
    let uid = 0
    Object.entries(container_obs).forEach((cid_obs: any) => {
        const cid = cid_obs[0]
        const obs = cid_obs[1].splice(0, 1, 1)
        const cidCell = { id: cid, type: 'container' }
        //cells.push(cidCell) //ignore containers for now
        obs.forEach((ob: ObservationBlock, idx: number) => {
            const obCell: OBCell = {
                cid: cid,
                name: ob.metadata.name,
                type: 'ob',
                id: JSON.stringify(uid),
                ra: ob.target?.ra,
                dec: ob.target?.dec,
                ob: ob
            }
            const tgt = ob.target
            if (tgt) obCell['target'] = tgt
            cells.push(obCell)
            uid += 1
        })
    })
    return cells
}

export const SelectionToolView = (props: Props) => {

    const chartTypes = ['altitude', 'air mass', 'parallactic angle', 'lunar angle']

    const [avlObs, setAvlObs] = useState(defaultState.avlObs)
    const [selObs, setSelObs] = useState(defaultState.selObs)
    const [chartType, setChartType] = useState(defaultState.chartType)
    const [semIdList, setSemIdList] = useState(defaultState.semIdList)
    const [sem_id, setSemId] =
        useQueryParam('sem_id', withDefault(StringParam, defaultState.sem_id))
    const socket = React.useContext(SocketContext);
    const [ avg, setAvg] = React.useState(0) 
    let ping_pong_times: number[] = []
    let start_time: number

    useEffect(() => {
        get_obs_from_semester(props.observer_id, sem_id).then((container_obs: ObservationBlock[]) => {
            const cells = container_obs_to_cells(container_obs)
            setAvlObs(cells)
        })
    }, [])

    useEffect(() => {
        console.log('sem_id changed')
        get_obs_from_semester(props.observer_id, sem_id).then((container_obs: ObservationBlock[]) => {
            const cells = container_obs_to_cells(container_obs)
            setAvlObs(cells)
            setSelObs([])
        })
    }, [sem_id])

    useEffect(() => { //run when props.observer_id changes
        get_sem_id_list(props.observer_id)
            .then((lst: string[]) => {
                setSemIdList(() => [...lst])
            })
    }, [props.observer_id])

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

        socket.on('my_response', function (msg, cb) {
            const txt = 'received #' + msg.count + ': ' + msg.data
            console.log(txt)
            if (cb) cb()
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

    }, [])

    const handleSemIdSubmit = (new_sem_id: string) => {
        // console.log('submit button pressed')
        setSemId(new_sem_id)
    }

    const handleChartTypeSelect = (newChartType: string) => {
        setChartType(newChartType)
    }

    const submitOB = () => {
        console.log('submitting new OB!')
        const data = {ob: selObs[0].ob}
        socket.emit('submit_ob', data)
    }

    const classes = useStyles()
    return (
        <div>
            {/* <span>{avg} ms</span> */}
            <Grid container spacing={1} className={classes.grid}>
                <Grid item xs={8}>
                    <DropDown
                        placeholder={'semester id'}
                        arr={semIdList}
                        value={sem_id}
                        handleChange={handleSemIdSubmit}
                        label={'Semester ID'}
                    />
                    <Button disabled={selObs.length===0} variant="contained" onClick={submitOB}>Submit Top Selected OB</Button>
                    <OBQueue
                        sem_id={sem_id}
                        selObs={selObs as OBCell[]}
                        setSelObs={setSelObs}
                        avlObs={avlObs as OBCell[]}
                        setAvlObs={setAvlObs}
                    />
                </Grid>
                <Grid item xs={4}>
                    <DropDown
                        placeholder={'Chart Type'}
                        arr={chartTypes}
                        value={chartType}
                        handleChange={handleChartTypeSelect}
                        label={'ChartType'}
                    />
                    <Paper className={classes.widepaper} elevation={3}>
                        <Tooltip title="View selected OB target charts here">
                            <h2>Sky View</h2>
                        </Tooltip>
                        <SkyView chartType={chartType} selObs={selObs} />
                    </Paper >
                </Grid>
            </Grid>
        </div>
    )
}