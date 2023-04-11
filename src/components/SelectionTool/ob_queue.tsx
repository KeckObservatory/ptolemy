import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd'
import OBSubmit from './ob_submit'
import { SocketContext } from '../../contexts/socket'
import { ObservationBlock, Scoby } from '../../typings/ptolemy';
import { CreateDroppable, move, reorder } from '../dnd_divs';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import SyncIcon from '@mui/icons-material/Sync';
import SaveIcon from '@mui/icons-material/Save';
import { UploadDialog } from './upload_dialog';
import Stack from '@mui/material/Stack';
interface Props {
    selObs: ObservationBlock[];
    obBoneyard: ObservationBlock[];
}

const DragDiv = (ob: ObservationBlock) => {

    return (
        <div>
            <p>
                OB name: {ob.metadata?.name}
            </p>
            <p>
                Type: {ob.metadata?.ob_type}
            </p>
            {ob.target?.metadata.name &&
                <p> Target Name: {ob.target.metadata.name} </p>}
            {ob.target?.parameters.target_coord_ra &&
                <p> Ra: {ob.target.parameters.target_coord_ra}
                    Dec: {ob.target.parameters.target_coord_dec} </p>}
        </div>
    )
}

export const OBQueue = (props: Props) => {

    const socket = React.useContext(SocketContext);

    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination || !source) return;
        const sKey: string = source.droppableId;
        const dKey: string = destination.droppableId;
        if (sKey === dKey) { //shuffling items around
            if (dKey === 'obQueue') {
                let newSelObs = [...props.selObs]
                newSelObs = reorder(newSelObs, source.index, destination.index)
                const ids = newSelObs.map((ob: ObservationBlock) => ob._id)
                // props.setSequences(newSeq)
                socket.emit('set_ob_queue', { ob_id_queue: ids })
            }
            else {
                let newBoneyard = [...props.obBoneyard]
                newBoneyard = reorder(newBoneyard, source.index, destination.index)
                const ids = newBoneyard.map((ob: ObservationBlock) => ob._id)
                socket.emit('set_ob_boneyard', { ob_id_boneyard: ids })
            }
        } else { // ob in droppable 
            if (dKey === 'obQueue') { // ob added to ob queue
                const moveResult = move(props.obBoneyard, props.selObs, source, destination);

                const selIds = moveResult[dKey].map((ob: ObservationBlock) => ob._id)
                const boneyardIds = moveResult[sKey].map((ob: ObservationBlock) => ob._id)
                socket.emit('set_ob_queue', { ob_id_queue: selIds })
                socket.emit('set_ob_boneyard', { ob_id_boneyard: boneyardIds })
            }
            else { // ob added to boneyard
                const moveResult = move(props.selObs, props.obBoneyard, source, destination);
                const selIds = moveResult[sKey].map((ob: ObservationBlock) => ob._id)
                const boneyardIds = moveResult[dKey].map((ob: ObservationBlock) => ob._id)
                socket.emit('set_ob_queue', { ob_id_queue: selIds })
                socket.emit('set_ob_boneyard', { ob_id_boneyard: boneyardIds })
            }
        }
    }

    const onSubmitOB = () => {
        if (props.selObs.length == 0) {
            console.log('ob queue empty. not submitting ob')
            return
        }
        const ob_id = props.selObs[0]._id
        console.log('submitting ob', ob_id)
        socket.emit('submit_ob', { ob_id: ob_id })
    }

    const save_sel_ob_as_json = () => {
        // Create a blob with the data we want to download as a file
        const blob = new Blob([JSON.stringify(props.selObs, null, 4)], { type: 'text/plain' })
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
        const obData = { ob_id_queue: ids }
        socket.emit('set_ob_queue', obData)
    }

    const sync_sel_ob_with_magiq = () => {
        const obData = { obs : props.selObs }
        socket.emit('sync_with_magiq', obData)
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Stack direction="row" spacing={2}>
                <OBSubmit onSubmitOB={onSubmitOB} />
                <Tooltip title="Syncronize Queue with MAGIQ Starlist">
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
            </Stack>
            {CreateDroppable(props.selObs, 'ob1', 'obQueue', 'Sort OB here', 'OB Queue', DragDiv, false)}
            {CreateDroppable(props.obBoneyard, 'obboneyard', 'seqBoneyard', 'Discarded OBs live here', 'OB Boneyard', DragDiv, false)}
        </DragDropContext>
    )
}