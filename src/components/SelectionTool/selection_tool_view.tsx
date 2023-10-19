import React, { useEffect, useState } from 'react'
import { get_sem_id_list, make_semid_scoby_table_and_containers } from '../../api/utils'
import { DetailedContainer, ObservationBlock, Scoby, SemesterIds } from '../../typings/ptolemy'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import Grid from '@mui/material/Grid'
import { SocketContext } from './../../contexts/socket';
import Tooltip from '@mui/material/Tooltip'
import SkyView from './sky-view/sky_view'
import DropDown from '../drop_down'
import { ob_api_funcs } from '../../api/ApiRoot'
import TwoDView from './two-d-view/two_d_view'
import Aladin from './target-resolver/aladin'

interface OBServerData {
    ob: ObservationBlock
}

interface OBQueueData {
    ob_id_queue: string[]
}

interface Props {
}

interface State {
    selOBs: ObservationBlock[];
    avlObRows: Scoby[];
    selOBRows: Scoby[];
    sem_id: string
    semIdList: string[]
    chartType: string;
}


const defaultState: State = {
    avlObRows: [],
    selOBs: [],
    selOBRows: [],
    sem_id: '',
    semIdList: [],
    chartType: 'altitude'
}

const obs_to_scoby = (obs: ObservationBlock[]) => {
    let scoby: Scoby[] = []
    obs.forEach((ob: ObservationBlock) => {
        const s: Scoby = {
            row_id: 'from ob',
            sem_id: ob.metadata.sem_id,
            container_id: 'from ob',
            container_name: 'from ob',
            ob_id: ob._id,
            name: ob.metadata.name,
            ra: ob.target?.parameters.target_coord_ra,
            dec: ob.target?.parameters.target_coord_dec,
            comment: ob.metadata.comment,
            ob_type: ob.metadata.ob_type,
            version: ob.metadata.version as string,
        }
        scoby.push(s)
    })

    return scoby
}

export const SelectionToolView = (props: Props) => {

    const chartTypes = ['altitude', 'air mass', 'parallactic angle', 'lunar angle']

    const socket = React.useContext(SocketContext);
    const [avlObRows, setavlObRows] = useState(defaultState.avlObRows)
    const [selOBs, setSelOBs] = useState(defaultState.selOBs)
    const [selOBRows, setSelObRows] = useState(defaultState.selOBRows)
    const [chartType, setChartType] = useState(defaultState.chartType)

    const [semIdList, setSemIdList] = useState(defaultState.semIdList)
    const [sem_id, setSemId] =
        useQueryParam('sem_id', withDefault(StringParam, defaultState.sem_id))

    const [submittedOB, changeSubmittedOB] = React.useState({} as ObservationBlock)

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
        create_connections()
    }, [])

    useEffect(() => {
        make_semid_scoby_table_and_containers(sem_id)
            .then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
                const [scoby, cont] = scoby_cont
                setavlObRows(scoby)
            })
    }, [sem_id])

    const set_ob_queue_from_server = async (ob_queue_data: OBQueueData) => {
        console.log('setting ob_queue', ob_queue_data)
        const ob_ids = ob_queue_data.ob_id_queue
        const obs = ob_ids.length > 0 ? await ob_api_funcs.get_many(ob_ids) : []
        ob_queue_data && setSelOBs(obs)
        const ob_scoby = obs_to_scoby(obs)
        setSelObRows(ob_scoby)
    }

    const create_connections = React.useCallback(() => {
        console.log('creating connections')
        socket.on('broadcast_ob_queue_from_server', set_ob_queue_from_server)
    }, [])

    const handleChartTypeSelect = (newChartType: string) => {
        setChartType(newChartType)
    }

    return (
        <React.Fragment>
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
                    {selOBRows.length > 0 && (
                        <Aladin
                            selOBRows={selOBRows}
                        />
                    )}
                </Grid>
                <Grid item xs={6}>
                    <TwoDView selOBRows={selOBRows} />
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
                    <SkyView chartType={chartType} selOBRows={selOBRows} />
                </Grid>
            </Grid>
        </React.Fragment>
    )
}