
import React, { useEffect, useState } from 'react'
import { Science } from '../../typings/ptolemy'
import { makeStyles } from '@mui/styles'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'

//@ts-ignore
const DragEventCell = (strObj) => {
    return (
        <div>
            <p> event: {strObj.id} </p>
        </div>
    )
}

const convert_string_array_to_object_array = (strArray: string[]) => {
    let obj = []
    for (let idx = 0; idx < strArray.length; idx++) {
        obj.push( { id: strArray[idx] })
    }
    return obj
}

interface Props {
    event_queue: string[];
    event_boneyard: string[];
    socket: any;
}

const EventQueue = (props: Props) => {

    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        const sKey: string = source.droppableId;
        const dKey: string = destination.droppableId;
        console.log('skey, dkey', sKey, dKey)


        if (sKey === dKey) { //shuffling items around
            if (dKey === 'eventQueue') {
                let newSeq = [...props.event_queue]
                newSeq = reorder(newSeq, source.index, destination.index)
                props.socket.emit('new_event_queue', {event_queue: newSeq})
            }
            else {
                let newBoneyard = [...props.event_boneyard]
                newBoneyard = reorder(newBoneyard, source.index, destination.index)
                props.socket.emit('new_event_boneyard', {event_boneyard: newBoneyard})
            }
        } else { // item in droppable 
            if (dKey === 'eventQueue') { // event added to event queue
                const result = move(props.event_boneyard, props.event_queue, source, destination);
                // props.setSequences(result[dKey])
                props.socket.emit('new_event_queue', {event_queue: result[dKey]})
                // setDiscardedSequences(result[sKey])
                props.socket.emit('new_event_boneyard', {event_boneyard: result[sKey]})
            }
            else { // event added to boneyard
                const result = move(props.event_queue, props.event_boneyard, source, destination);
                console.log('result', result)
                // props.setSequences(result[sKey])
                props.socket.emit('new_event_queue', {event_queue: result[sKey]})
                props.socket.emit('new_event_boneyard', {event_boneyard: result[dKey]})
                // setDiscardedSequences(result[dKey])
            }
        }
    }
    const event_items = convert_string_array_to_object_array(props.event_queue)
    const boneyard_items = convert_string_array_to_object_array(props.event_boneyard)
    const isDragDisabled = true 
    
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {CreateDroppable(event_items, 'id', 'eventQueue', 'Sort events here', 'Event Queue', DragEventCell, isDragDisabled)}
            {CreateDroppable(boneyard_items, 'id', 'eventBoneyard', 'Discarded events live here', 'Event Boneyard', DragEventCell, isDragDisabled)}
        </DragDropContext>
    )
}

export default EventQueue