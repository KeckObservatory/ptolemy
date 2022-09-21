import React, { useEffect, useState, useContext } from 'react'
import { get_obs_from_semester, get_sem_id_list, make_semid_scoby_table_and_containers } from '../../api/utils'
import { ContainerObs, DetailedContainer, OBCell, ObservationBlock, Scoby, SemesterIds } from '../../typings/papahana'
import { makeStyles } from '@mui/styles'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import { SocketContext } from './../../contexts/socket';
import Tooltip from '@mui/material/Tooltip'
import SkyView from './sky-view/sky_view'
import DropDown from '../drop_down'
import AvailableOBTable from './available_ob_table'
import SelectedQueue from './selected_queue'
import FormControl from '@mui/material/FormControl'
import ThreeDView from './sky-view/threed_view'

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


interface OBServerData {
    ob: ObservationBlock
}

interface OBQueueData {
    ob_queue: Scoby[] 
}

interface Props {
}

interface State {
    selObs: Scoby[];
    avlObs: Scoby[];
    sem_id: string
    semIdList: string[]
    chartType: string;
}


const defaultState: State = {
    avlObs: [],
    selObs: [],
    sem_id: '',
    semIdList: [],
    chartType: 'altitude'
}

const container_obs_to_cells = (container_obs: any) => {
    let cells: any[] = []
    let uid = 0
    Object.entries(container_obs).forEach((cid_obs: any) => {
        const cid = cid_obs[0]
        const obs = cid_obs[1]
        obs.forEach((ob: ObservationBlock, idx: number) => {
            const obCell: OBCell = {
                cid: cid,
                name: ob.metadata.name,
                type: 'ob',
                id: JSON.stringify(uid),
                ra: ob.target?.parameters.target_coord_ra,
                dec: ob.target?.parameters.target_coord_dec
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

    const socket = React.useContext(SocketContext);
    const [avlObs, setAvlObs] = useState(defaultState.avlObs)
    const [selObs, setSelObs] = useState(defaultState.selObs)
    const [chartType, setChartType] = useState(defaultState.chartType)
    const [avg, setAvg] = useState(0)

    const [semIdList, setSemIdList] = useState(defaultState.semIdList)
    const [sem_id, setSemId] =
        useQueryParam('sem_id', withDefault(StringParam, defaultState.sem_id))

    const [submittedOB, changeSubmittedOB] = React.useState({} as ObservationBlock)
    const [submittedOBRow, changeSubmittedOBRow] = React.useState({} as Scoby)

    let start_time: number
    let ping_pong_times: number[] = []
    const classes = useStyles()

    useEffect(() => {
        make_semid_scoby_table_and_containers(sem_id).then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
            const [scoby, cont] = scoby_cont
            setAvlObs(scoby)
        })

        get_sem_id_list()
            .then((semesters: SemesterIds) => {
                setSemIdList(() => [...semesters.associations])
            })

        console.log('requesting obs data from backend')

        socket.emit('request_ob_queue', set_ob_queue_from_server)
        socket.emit('request_submitted_ob', set_ob_from_server)
        create_connections()
    }, [])

    useEffect(() => {
        make_semid_scoby_table_and_containers(sem_id)
            .then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
                const [scoby, cont] = scoby_cont
                setAvlObs(scoby)
                // setSelObs([])
            })
    }, [sem_id])

    const on_table_select_rows = (newSelObs: Scoby[]) => {
        console.log(newSelObs)
        setSelObs(newSelObs)
        socket.emit('set_ob_queue', {ob_queue: newSelObs})
    }

    const set_ob_queue_from_server = (ob_queue_data: OBQueueData) => {
        console.log('setting ob_queue', ob_queue_data)
        ob_queue_data && setSelObs(ob_queue_data.ob_queue)
    }

    const set_ob_from_server = (ob_data: OBServerData) => {
        const ob = ob_data.ob
        console.log('new selected OB: ', ob)

        const row: Scoby = {
            sem_id: ob.metadata.sem_id,
            container_id: '',
            ob_id: ob._id,
            container_name: '',
            name: ob.metadata?.name as string,
            ra: ob.target?.parameters.target_coord_ra,
            dec: ob.target?.parameters.target_coord_dec,
            comment: ob.comment as string,
            ob_type: ob.metadata?.ob_type as string,
            version: ob.metadata?.version as string,
        }
        changeSubmittedOBRow(row)
    }

    const create_connections = React.useCallback(() => {

        console.log('creating connections')

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
            setAvg(Math.round(10 * sum / ping_pong_times.length) / 10)
        });

        socket.on('send_ob_queue', set_ob_queue_from_server)

        socket.on('send_submitted_ob', set_ob_from_server)

    }, [])

    const handleSemIdSubmit = (new_sem_id: string) => {
        setSemId(new_sem_id)
    }

    const handleChartTypeSelect = (newChartType: string) => {
        setChartType(newChartType)
    }

    return (
        <React.Fragment>
            <FormControl sx={{ m: 2, width: 150 }}>
                <DropDown
                    placeholder={'semester id'}
                    arr={semIdList}
                    value={sem_id}
                    handleChange={handleSemIdSubmit}
                    label={'Semester ID'}
                    highlightOnEmpty={true}
                />
            </FormControl>
            <Grid container spacing={1} className={classes.grid}>
                <Grid item xs={6}>
                    <AvailableOBTable rows={avlObs} setSelObs={on_table_select_rows} />
                </Grid>
                <Grid item xs={6}>
                    <SelectedQueue
                        selObs={selObs}
                        setSelObs={setSelObs}
                        submittedOB={submittedOB}
                        changeSubmittedOBRow={changeSubmittedOBRow}
                        submittedOBRow={submittedOBRow}
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
                        <ThreeDView selObs={selObs} />
                        <SkyView chartType={chartType} selObs={selObs} />
                    </Paper >
                </Grid>
            </Grid>
        </React.Fragment>
    )
}