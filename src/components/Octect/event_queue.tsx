
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
    const classes = useStyles();

    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        const sKey: string = source.droppableId;
        const dKey: string = destination.droppableId;


        if (sKey === dKey) { //shuffling items around
            let newSeq = [...props.event_queue]
            newSeq = reorder(newSeq, source.index, destination.index)
            if (dKey === 'eventQueue') {
                props.socket.emit('new_event_queue', {event_queue: newSeq})
            }
            else {
                props.socket.emit('new_event_boneyard', {event_boneyard: newSeq})
            }
        } else { // item in droppable 
            if (dKey === 'seqQueue') { // event added to event queue
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
    
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {CreateDroppable(event_items, 'id', 'eventQueue', 'Sort events here', 'Event Queue', DragEventCell)}
            {CreateDroppable(boneyard_items, 'id', 'eventBoneyard', 'Discarded events live here', 'Event Boneyard', DragEventCell)}
        </DragDropContext>
    )
}

export default EventQueue