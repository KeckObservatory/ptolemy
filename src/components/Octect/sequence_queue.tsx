
import React, { useEffect, useState } from 'react'
import { Science } from '../../typings/ptolemy'
import { makeStyles } from '@mui/styles'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { reorder, move, create_draggable, CreateDroppable } from './../dnd_divs'

export const useStyles = makeStyles((theme: any) => ({
    grid: {
        textAlign: 'center',
        margin: theme.spacing(1),
        display: 'flex',
        width: '100%',
    },
    paper: {
        padding: '8px',
        margin: '4px',
        minWidth: theme.spacing(20),
        width: '95%',
        elevation: 3,
    },
    droppableDragging: {
        background: theme.palette.divider,
        margin: theme.spacing(1),
        padding: theme.spacing(1),
        minHeight: theme.spacing(5),
    },
    droppable: {
        background: theme.palette.divider,
        margin: theme.spacing(1),
        padding: theme.spacing(0),
        minHeight: theme.spacing(5),
    },
    cell: {
        width: '20%'
    },
}))

interface Props {
    sequence_queue: Science[];
    sequence_boneyard: Science[];
    socket: any;
}


const DragSeqCell = (seqCell: Science) => {
    return (
        <div>
            <p> id: {seqCell.metadata.sequence_number} </p>
            <p> sequence: {seqCell.metadata.ui_name} </p>
            <p> Type: {seqCell.metadata.type} </p>
            <p>{JSON.stringify(seqCell.parameters)}</p>
        </div>
    )
}

const SequenceQueue = (props: Props) => {
    const classes = useStyles();

    const onDragEnd = (result: any) => {
        console.log('on drag end entered')
        const { source, destination } = result;
        if (!destination) return;
        const sKey: string = source.droppableId;
        const dKey: string = destination.droppableId;


        if (sKey === dKey) { //shuffling items around
            let newSeq = [...props.sequence_queue]
            newSeq = reorder(newSeq, source.index, destination.index)
            if (dKey === 'seqQueue') {
                // props.setSequences(newSeq)
                props.socket.emit('new_sequence_queue', {sequence_queue: newSeq})
            }
            else {
                props.socket.emit('new_sequence_boneyard', {sequence_boneyard: newSeq})
                // setDiscardedSequences(newSeq)
            }
        } else { // item in droppable 
            if (dKey === 'seqQueue') { // sequence added to sequence queue
                const result = move(props.sequence_boneyard, props.sequence_queue, source, destination);
                // props.setSequences(result[dKey])
                props.socket.emit('new_sequence_queue', {sequence_queue: result[dKey]})
                // setDiscardedSequences(result[sKey])
                props.socket.emit('new_sequence_boneyard', {sequence_boneyard: result[sKey]})
            }
            else { // sequence added to boneyard
                const result = move(props.sequence_queue, props.sequence_boneyard, source, destination);
                console.log('result', result)
                // props.setSequences(result[sKey])
                props.socket.emit('new_sequence_queue', {sequence_queue: result[sKey]})
                props.socket.emit('new_sequence_boneyard', {sequence_boneyard: result[dKey]})
                // setDiscardedSequences(result[dKey])
            }
        }
    }
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {CreateDroppable(props.sequence_queue, 'seq1', 'seqQueue', 'Sort sequences here', 'Sequence Queue', DragSeqCell)}
            {CreateDroppable(props.sequence_boneyard, 'seqboneyard', 'seqBoneyard', 'Discarded sequences live here', 'Sequence Boneyard', DragSeqCell)}
        </DragDropContext>
    )
}

export default SequenceQueue;