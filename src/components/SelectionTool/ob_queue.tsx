import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd'
import { SocketContext } from '../../contexts/socket'
import { ObservationBlock, Scoby } from '../../typings/ptolemy';
import { CreateDroppable, move, reorder } from '../dnd_divs';
import { Accordion, AccordionDetails, AccordionSummary, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
interface Props {
    selOBs: ObservationBlock[];
    obBoneyard: ObservationBlock[];
}

const DragDiv = (ob: ObservationBlock) => {

    const theme = useTheme()
    return (
        <div style={{'background': theme.palette.primary.light, color: 'black'}}>
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
                let newSelObs = [...props.selOBs]
                newSelObs = reorder(newSelObs, source.index, destination.index)
                const ids = newSelObs.map((ob: ObservationBlock) => ob._id)
                console.log('ob queue ids:', ids)
                socket.emit('set_ob_queue', { ob_id_queue: ids, obs: newSelObs })
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
                const moveResult = move(props.obBoneyard, props.selOBs, source, destination);

                const selIds = moveResult[dKey].map((ob: ObservationBlock) => ob._id)
                const boneyardIds = moveResult[sKey].map((ob: ObservationBlock) => ob._id)
                socket.emit('set_ob_queue', { ob_id_queue: selIds, obs: moveResult[dKey] })
                socket.emit('set_ob_boneyard', { ob_id_boneyard: boneyardIds })
            }
            else { // ob added to boneyard
                const moveResult = move(props.selOBs, props.obBoneyard, source, destination);
                const selIds = moveResult[sKey].map((ob: ObservationBlock) => ob._id)
                const boneyardIds = moveResult[dKey].map((ob: ObservationBlock) => ob._id)
                socket.emit('set_ob_queue', { ob_id_queue: selIds, obs: moveResult[sKey] })
                socket.emit('set_ob_boneyard', { ob_id_boneyard: boneyardIds })
            }
        }
    }


    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {CreateDroppable(props.selOBs, 'ob1', 'obQueue', 'Sort OB here', 'Star List', DragDiv, false)}

            <Accordion sx={{
                margin: '4px',
            }}>
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
                    >OB Boneyard</h2>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '0px',
                        margin: '4px',
                    }}

                >
                    {CreateDroppable(props.obBoneyard, 'obboneyard', 'sequenceBoneyard', 'Discarded OBs live here', '', DragDiv, false)}
                </AccordionDetails>
            </Accordion>
        </DragDropContext>
    )
}