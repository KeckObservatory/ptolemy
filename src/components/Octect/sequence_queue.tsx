
import React, { useEffect, useState } from 'react'
import { ObservationBlock, Science } from '../../typings/ptolemy'
import { makeStyles } from '@mui/styles'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { reorder, move, create_draggable, CreateDroppable } from './../dnd_divs'
import ReactJson, { ThemeKeys } from 'react-json-view'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

interface Props {
    sequences: Science[];
    sequenceBoneyard: Science[];
    setSequences: Function;
    setSequenceBoneyard: Function;
    socket: any;
    ob: ObservationBlock;
}


const DragSeqCell = (seqCell: Science) => {

    const [theme, setTheme] = useQueryParam('theme', withDefault(StringParam, 'bespin'))
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
        const { source, destination } = result;
        if (!destination || !source) return;
        const sKey: string = source.droppableId;
        const dKey: string = destination.droppableId;
        if (sKey === dKey) { //shuffling items around
            let newSeq = [...props.sequences]
            newSeq = reorder(newSeq, source.index, destination.index)
            if (dKey === 'seqQueue') {
                // props.setSequences(newSeq)
                props.socket.emit('new_sequence_queue', { sequence_queue: newSeq, ob: props.ob })
            }
            else {
                props.socket.emit('new_sequence_boneyard', { sequence_boneyard: newSeq })
            }
        } else { // item in droppable 
            if (dKey === 'seqQueue') { // sequence added to sequence queue
                const moveResult = move(props.sequenceBoneyard, props.sequences, source, destination);
                props.socket.emit('new_sequence_queue', { sequence_queue: moveResult[dKey], ob: props.ob })
                props.socket.emit('new_sequence_boneyard', { sequence_boneyard: moveResult[sKey], ob: props.ob })
            }
            else { // sequence added to boneyard
                const moveResult = move(props.sequences, props.sequenceBoneyard, source, destination);
                props.socket.emit('new_sequence_queue', { sequence_queue: moveResult[sKey], ob: props.ob })
                props.socket.emit('new_sequence_boneyard', { sequence_boneyard: moveResult[dKey], ob: props.ob })
            }
        }
    }
    const isDragDisabled = false
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {CreateDroppable(props.sequences, 'seq1', 'seqQueue', 'Sort sequences here', 'Sequence Queue', DragSeqCell, isDragDisabled)}
            {CreateDroppable(props.sequenceBoneyard, 'seqboneyard', 'seqBoneyard', 'Discarded sequences live here', 'Sequence Boneyard', DragSeqCell, false)}
        </DragDropContext>
    )
}

export default SequenceQueue;