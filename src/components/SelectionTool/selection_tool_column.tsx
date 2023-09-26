import React, { useEffect, useState } from 'react'
import { get_sem_id_list, make_semid_scoby_table_and_containers } from '../../api/utils'
import { DetailedContainer, ObservationBlock, Scoby, SemesterIds } from '../../typings/ptolemy'
import { useQueryParam, StringParam, withDefault, BooleanParam } from 'use-query-params'
import { SocketContext } from '../../contexts/socket';
import DropDown from '../drop_down'
import AvailableOBTable from './available_ob_table'
import SelectedOBTable from './selected_ob_table'
import FormControl from '@mui/material/FormControl'
import { ob_api_funcs } from '../../api/ApiRoot'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import { UploadDialog } from './upload_dialog';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

interface OBQueueData {
    ob_id_queue: string[]
}

interface OBBoneyardData {
    ob_id_boneyard: string[]
}

interface Props {
    selOBs: ObservationBlock[];
    setSelOBs: Function;
    obBoneyard: ObservationBlock[];
    setOBBoneyard: Function;
}

interface State {
    avlObRows: Scoby[];
    selObRows: Scoby[];
    sem_id: string
    semIdList: string[]
    chartType: string;
    hideCompletedOBs: boolean
}


const defaultState: State = {
    avlObRows: [],
    selObRows: [],
    sem_id: '',
    semIdList: [],
    chartType: 'altitude',
    hideCompletedOBs: false
}

export const SelectionToolColumn = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [avlObRows, setavlObRows] = useState(defaultState.avlObRows)
    const [semIdList, setSemIdList] = useState(defaultState.semIdList)
    const [hideCompletedOBs, setHideCompletedOBs] = useQueryParam('hide_completed_obs', withDefault(BooleanParam, defaultState.hideCompletedOBs))
    const [sem_id, setSemId] =
        useQueryParam('sem_id', withDefault(StringParam, defaultState.sem_id))

    useEffect(() => {

        const set_rows = async () => {
            const [scoby, _] = await make_semid_scoby_table_and_containers(sem_id)
            setavlObRows(() => [...scoby])

            const semesters = await get_sem_id_list()
            setSemIdList(() => [...semesters.associations])
        }

        set_rows()
        create_connections()
    }, [])

    useEffect(() => {
        console.log('semid changed, rerendering selectiotool column')
        make_semid_scoby_table_and_containers(sem_id)
            .then((scoby_cont: [Scoby[], DetailedContainer[]]) => {
                const [scoby, cont] = scoby_cont
                setavlObRows(scoby)
            })
    }, [sem_id])

    const on_table_select_rows = (newSelObs: ObservationBlock[]) => {
        console.log(newSelObs)
        props.setSelOBs(newSelObs)
        const ids = newSelObs.map((ob: ObservationBlock) => ob._id)
        socket.emit('set_ob_queue', { ob_id_queue: ids, obs: newSelObs })
        socket.emit('set_ob_boneyard', { ob_id_boneyard: [] })
    }

    const create_connections = React.useCallback(() => {

        const set_ob_queue_from_server = async (ob_queue_data: OBQueueData) => {
            const ob_ids = ob_queue_data.ob_id_queue
            const obs = ob_ids.length > 0 ? await ob_api_funcs.get_many(ob_ids) : []
            ob_queue_data && props.setSelOBs(obs)
        }

        const set_ob_boneyard_from_server = async (ob_boneyard_ids: OBBoneyardData) => {
            const ob_ids = ob_boneyard_ids.ob_id_boneyard
            const obs = ob_ids.length > 0 ? await ob_api_funcs.get_many(ob_ids) : []
            ob_boneyard_ids && props.setOBBoneyard(obs)
        }

        socket.on('broadcast_ob_queue_from_server', set_ob_queue_from_server)
        socket.on('broadcast_ob_boneyard_from_server', set_ob_boneyard_from_server)
    }, [])

    const handleSemIdSubmit = (new_sem_id: string) => {
        setSemId(new_sem_id)
    }


    const onSubmitOB = (idx: number) => {
        if (props.selOBs.length == 0) {
            console.log('ob queue empty. not submitting ob')
            return
        }
        const ob_id = props.selOBs[idx]._id
        console.log('submitting ob', ob_id)
        socket.emit('submit_ob', { ob_id: ob_id })
    }

    const save_sel_ob_as_json = () => {
        // Create a blob with the data we want to download as a file
        const blob = new Blob([JSON.stringify(props.selOBs, null, 4)], { type: 'text/plain' })
        // Create an anchor element and dispatch a click event on it
        // to trigger a download
        const a = document.createElement('a')
        a.download = 'selected_obs.json'
        a.href = window.URL.createObjectURL(blob)
        const clickEvt = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
        })
        a.dispatchEvent(clickEvt)
        a.remove()
    }

    const upload_sel_obs_from_json = (obs: ObservationBlock[]) => {
        const ids = obs.map((ob: ObservationBlock) => ob._id)
        const obData = { ob_id_queue: ids, obs: obs }
        socket.emit('set_ob_queue', obData)
    }

    const hide_submitted_obs = (checked: boolean) => {
        setHideCompletedOBs(checked)
    }

    const sync_sel_ob_with_magiq = () => {
        const obData = { obs: props.selOBs }
        socket.emit('sync_with_magiq', obData)
    }

    return (
        <React.Fragment>
            <Accordion
                sx={{
                    margin: '4px'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        margin: "0px",
                        padding: "4px",
                        maxHeight: 50,
                    }}
                >
                    <h2
                        style={{ margin: "0px" }}
                    >Available OBs</h2>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '0px',
                        margin: '4px',
                    }}

                >
                    <FormControl sx={{ m: 0, width: 150 }}>
                        <DropDown
                            placeholder={'semester id'}
                            arr={semIdList}
                            value={sem_id}
                            handleChange={handleSemIdSubmit}
                            label={'Semester ID'}
                            highlightOnEmpty={true}
                        />
                    </FormControl>
                    <AvailableOBTable rows={avlObRows} setSelOBs={on_table_select_rows} />
                </AccordionDetails>
            </Accordion>
            <Stack sx={{ margin: '8px', height: '40px' }} direction="row" spacing={2}>
                <Tooltip title="Syncronize Queue with MAGIQ Target list">
                    <IconButton aria-label='copy' onClick={sync_sel_ob_with_magiq}>
                        <SyncIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Save selected OBs as JSON">
                    <IconButton aria-label='copy' onClick={save_sel_ob_as_json}>
                        <SaveIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Load selected OBs as JSON">
                    <UploadDialog upload_sel_obs_from_json={upload_sel_obs_from_json} />
                </Tooltip>
                <Tooltip title="Hide OBs that have been completed">
                    <FormControlLabel
                        label=""
                        value={hideCompletedOBs}
                        control={<Switch value={hideCompletedOBs} />}
                        onChange={(_, checked) => hide_submitted_obs(checked)
                        }
                    />
                </Tooltip>
            </Stack>
            {/* <SelectedOBTable
                selOBs={props.selOBs}
                setSelOBs={props.setSelOBs}
                obBoneyard={props.obBoneyard}
                onSubmitOB={onSubmitOB}
                hideCompletedOBs={hideCompletedOBs}
            /> */}
        </React.Fragment >
    )
}