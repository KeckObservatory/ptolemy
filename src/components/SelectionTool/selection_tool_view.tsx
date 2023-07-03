import React, { useEffect, useState, useContext } from 'react'
import { get_sem_id_list, make_semid_scoby_table_and_containers } from '../../api/utils'
import { DetailedContainer, OBCell, ObservationBlock, Scoby, SemesterIds } from '../../typings/ptolemy'
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
import { ob_api_funcs } from '../../api/ApiRoot'
import TwoDView from './sky-view/two_d_view'

interface OBServerData {
    ob: ObservationBlock
}

interface OBQueueData {
    ob_id_queue: string[]
}

interface Props {
}

interface State {
    selObs: ObservationBlock[];
    avlObRows: Scoby[];
    selObRows: Scoby[];
    sem_id: string
    semIdList: string[]
    chartType: string;
}


const defaultState: State = {
    avlObRows: [],
    selObs: [],
    selObRows: [],
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
    const [avlObRows, setavlObRows] = useState(defaultState.avlObRows)
    const [selObs, setSelObs] = useState(defaultState.selObs)
    const [selObRows, setSelObRows] = useState(defaultState.selObRows)
    const [chartType, setChartType] = useState(defaultState.chartType)
    const [avg, setAvg] = useState(0)

    const [semIdList, setSemIdList] = useState(defaultState.semIdList)
    const [sem_id, setSemId] =
        useQueryParam('sem_id', withDefault(StringParam, defaultState.sem_id))

    const [submittedOB, changeSubmittedOB] = React.useState({} as ObservationBlock)

    let start_time: number
    let ping_pong_times: number[] = []

    useEffect(() => {
        make_semid_scoby_table_and_containers(sem_id).then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
            const [scoby, cont] = scoby_cont
            setavlObRows(scoby)
        })

        get_sem_id_list()
            .then((semesters: SemesterIds) => {
                setSemIdList(() => [...semesters.associations])
            })

        console.log('requesting obs data from backend')

        socket.emit('request_ob_queue')
        socket.emit('request_ob')
        create_connections()
    }, [])

    useEffect(() => {
        make_semid_scoby_table_and_containers(sem_id)
            .then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
                const [scoby, cont] = scoby_cont
                setavlObRows(scoby)
            })
    }, [sem_id])

    const on_table_select_rows = (newSelObs: ObservationBlock[]) => {
        console.log(newSelObs)
        setSelObs(newSelObs)
        const ids = newSelObs.map((ob: ObservationBlock) => ob._id)
        socket.emit('set_ob_queue', { ob_id_queue: ids, obs: newSelObs })
    }

    const set_ob_queue_from_server = async (ob_queue_data: OBQueueData) => {
        console.log('setting ob_queue', ob_queue_data)
        const ob_ids = ob_queue_data.ob_id_queue
        const obs = ob_ids.length > 0 ? await ob_api_funcs.get_many(ob_ids) : []
        ob_queue_data && setSelObs(obs)
    }

    const set_ob_from_server = (ob_data: OBServerData) => {
        console.log('new selected OB: ', ob_data)
        const ob = ob_data.ob
        changeSubmittedOB(ob)
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

        socket.on('broadcast_ob_queue_from_server', set_ob_queue_from_server)

        socket.on('broadcast_submitted_ob_from_server', set_ob_from_server)

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
            <Grid container spacing={1} sx={
                {
                    textAlign: 'left',
                    margin: '8px',
                    display: 'flex',
                    maxWidth: '1800px',
                }
            }
            >
                <Grid item xs={6}>
                    <AvailableOBTable rows={avlObRows} setSelObs={on_table_select_rows} setSelObRows={setSelObRows} />
                </Grid>
                <Grid item xs={6}>
                    <SelectedQueue
                        selObs={selObs}
                        setSelObs={setSelObs}
                        submittedOB={submittedOB}
                    />
                </Grid>
                <Grid item xs={6}>
                    <TwoDView selObRows={selObRows} />
                </Grid>
                <Grid item xs={6}>
                    <DropDown
                        placeholder={'Chart Type'}
                        arr={chartTypes}
                        value={chartType}
                        handleChange={handleChartTypeSelect}
                        label={'ChartType'}
                    />
                    <Tooltip title="View selected OB target charts here">
                        <h2>Sky View</h2>
                    </Tooltip>
                    <SkyView chartType={chartType} selObRows={selObRows} />
                </Grid>
            </Grid>
        </React.Fragment>
    )
}