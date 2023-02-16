
import React, { useEffect, useState } from 'react'
import { ObservationBlock, Science } from '../../typings/ptolemy'
import { makeStyles } from '@mui/styles'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { reorder, move, create_draggable, CreateDroppable } from './../dnd_divs'
import ReactJson, { ThemeKeys } from 'react-json-view'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

interface Props {
    sequence_queue: Science[];
    sequence_boneyard: Science[];
    socket: any;
    ob: ObservationBlock;
}


const DragSeqCell = (seqCell: Science) => {

    const [theme, setTheme] =
        useQueryParam('theme', withDefault(StringParam, 'bespin'))
    return (
        <div>
            <p> id: {seqCell.metadata.sequence_number} </p>
            <p> sequence: {seqCell.metadata.ui_name} </p>
            <ReactJson
                src={seqCell as object}
                theme={theme as ThemeKeys | undefined}
                iconStyle={'circle'}
                collapsed={1}
                collapseStringsAfterLength={15}
                enableClipboard={true}
                onEdit={false}
            />
        </div>
    )
}

const SequenceQueue = (props: Props) => {

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
                props.socket.emit('new_sequence_queue', { sequence_queue: newSeq, ob: props.ob })
            }
            else {
                props.socket.emit('new_sequence_boneyard', { sequence_boneyard: newSeq })
                // setDiscardedSequences(newSeq)
            }
        } else { // item in droppable 
            if (dKey === 'seqQueue') { // sequence added to sequence queue
                const result = move(props.sequence_boneyard, props.sequence_queue, source, destination);
                // props.setSequences(result[dKey])
                props.socket.emit('new_sequence_queue', { sequence_queue: result[dKey], ob: props.ob })
                // setDiscardedSequences(result[sKey])
                props.socket.emit('new_sequence_boneyard', { sequence_boneyard: result[sKey], ob: props.ob })
            }
            else { // sequence added to boneyard
                const result = move(props.sequence_queue, props.sequence_boneyard, source, destination);
                console.log('result', result)
                // props.setSequences(result[sKey])
                props.socket.emit('new_sequence_queue', { sequence_queue: result[sKey], ob: props.ob })
                props.socket.emit('new_sequence_boneyard', { sequence_boneyard: result[dKey], ob: props.ob })
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