import React, { useEffect, useState, useContext } from 'react'
import { get_obs_from_semester, get_sem_id_list, make_semid_scoby_table_and_containers } from '../../api/utils'
import { ContainerObs, DetailedContainer, OBCell, ObservationBlock, Scoby, SemesterIds } from '../../typings/papahana'
import { makeStyles } from '@mui/styles'
import { useQueryParam, StringParam, withDefault } from 'use-query-params'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import SkyView from './sky-view/sky_view'
import DropDown from '../drop_down'
import AvailableOBTable from './available_ob_table'
import SelectedQueue from './selected_queue'
import FormControl from '@mui/material/FormControl'

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


    const [avlObs, setAvlObs] = useState(defaultState.avlObs)
    const [selObs, setSelObs] = useState(defaultState.selObs)
    const [chartType, setChartType] = useState(defaultState.chartType)

    const [semIdList, setSemIdList] = useState(defaultState.semIdList)
    const [sem_id, setSemId] =
        useQueryParam('sem_id', withDefault(StringParam, defaultState.sem_id))


    useEffect(() => {
        make_semid_scoby_table_and_containers(sem_id).then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
            const [scoby, cont] = scoby_cont
            setAvlObs(scoby)
        })
    }, [])

    useEffect(() => {
        make_semid_scoby_table_and_containers(sem_id).then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
            const [scoby, cont] = scoby_cont
            setAvlObs(scoby)
            setSelObs([])
        })
    }, [sem_id])

    useEffect(() => {
        get_sem_id_list()
            .then((semesters: SemesterIds) => {
                setSemIdList(() => [...semesters.associations])
            })
    }, [])

    const handleSemIdSubmit = (new_sem_id: string) => {
        setSemId(new_sem_id)
    }

    const handleChartTypeSelect = (newChartType: string) => {
        setChartType(newChartType)
    }

    const classes = useStyles()
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
                    <AvailableOBTable rows={avlObs} setSelObs={setSelObs} />
                </Grid>
                <Grid item xs={6}>
                    <SelectedQueue selObs={selObs} setSelObs={setSelObs} />
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
        </React.Fragment>
    )
}