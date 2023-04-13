import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd'
import { SocketContext } from '../../contexts/socket'
import { ObservationBlock, Scoby } from '../../typings/ptolemy';
import { CreateDroppable, move, reorder } from '../dnd_divs';
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
                console.log('ob queue ids:', ids)
                socket.emit('set_ob_queue', { ob_id_queue: ids })
            }
            else {
                let newBoneyard = [...props.obBoneyard]
                newBoneyard = reorder(newBoneyard, source.index, destination.index)
                const ids = newBoneyard.map((ob: ObservationBlock) => ob._id)
                console.log('ob boneyard ids:', ids)
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


    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {CreateDroppable(props.selObs, 'ob1', 'obQueue', 'Sort OB here', 'OB Queue', DragDiv, false)}
            {CreateDroppable(props.obBoneyard, 'obboneyard', 'seqBoneyard', 'Discarded OBs live here', 'OB Boneyard', DragDiv, false)}
        </DragDropContext>
    )
}