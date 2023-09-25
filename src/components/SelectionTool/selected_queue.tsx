import React from 'react';
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import { useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import OBSubmit from './ob_submit'
import { socket } from '../../contexts/socket'
import { ObservationBlock, Scoby } from '../../typings/ptolemy';

interface Props {
    selOBs: ObservationBlock[];
    setSelOBs: Function;
    submittedOB: ObservationBlock
}

interface CreateDivProps {
    provided: any;
    snapshot: any;
    formChild: JSX.Element;
}

const CreateDiv = (props: CreateDivProps) => {
    // const acc = { acc: classes.droppableDragging, accDrag: classes.droppable } as any
    const acc = {
        acc: {
            margin: '4px',
            padding: '4px',
            minHeight: '20px',
        }, accDrag: {
            margin: '4px',
            padding: '0px',
            minHeight: '20px',
        }
    }
    const className = props.snapshot.isDragging ? { ...props.provided.draggableProps, ...acc.accDrag } : acc.acc
    return (
        <div
            ref={props.provided.innerRef}
            {...props.provided.draggableProps}
            {...props.provided.dragHandleProps}
            className={className}
        >
            <Paper elevation={24}>
                {props.formChild}
            </Paper>
        </div>
    )
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

const create_draggable = (ob: ObservationBlock, idx: number) => {
    return (
        <Draggable
            key={ob._id}
            draggableId={ob._id as string}
            index={idx}
        >
            {(provided, snapshot) => CreateDiv(
                {
                    provided: provided,
                    snapshot: snapshot,
                    formChild: DragDiv(ob)

                })
            }
        </Draggable>
    )
}

const reorder = (list: Array<any>, startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

interface NookProps {
    ob?: ObservationBlock
}

const SubmittedNook = (props: NookProps) => {
    return (
        <Paper elevation={3} sx={{ margin: '4px', minWidth: '200px', maxWidth: '715px', padding: '9px' }}>
            <Tooltip title={'Submitted OB'}>
                <h3>Submitted OB</h3>
            </Tooltip>
            {props.ob && DragDiv(props.ob)}
        </Paper >
    )
}


const SelectedQueue = (props: Props) => {

    const selTitle = "Selected OBs"
    const selTooltip = "Observation Blocks in queue"

    useEffect(() => {
    }, [props])

    useEffect(() => {
    }, [props.submittedOB])


    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        //@ts-ignore
        let newObs = [...props.selOBs]
        newObs = reorder(newObs, source.index, destination.index)
        props.setSelOBs(newObs)
        const ids = newObs.map((ob: ObservationBlock) => ob._id)
        socket.emit('set_ob_queue', { ob_id_queue: ids, obs: newObs })
    }

    const onSubmitOB = () => {
        const ob_id = props.selOBs[0]._id
        console.log('submitting ob', ob_id)
        socket.emit('submit_ob', { ob_id: ob_id })
    }

    const create_droppable = (obs: ObservationBlock[],
        key: string,
        tooltip: string,
        title: string,
        onSubmitOB: Function) => {
        return (
            <Paper sx={{
                padding: '8px',
                margin: '4px',
                maxWidth: '715px',
                minWidth: '200px',
            }}
                elevation={3}>
                <Tooltip title={tooltip}>
                    <h3>{title}</h3>
                </Tooltip>
                <OBSubmit onSubmitOB={onSubmitOB} />
                <Droppable key={key} droppableId={key}>
                    {(provided: any, snapshot: any) => {
                        return (
                            <div
                                style={snapshot.isDraggingOver
                                    ? {
                                        margin: '4px',
                                        padding: '4px',
                                        minHeight: '20px',
                                    } : {
                                        margin: '4px',
                                        padding: '0px',
                                        minHeight: '20px',
                                    }
                                }
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                            >
                                {obs !== undefined &&
                                    obs.map((ob: ObservationBlock, idx: number) => {
                                        return (create_draggable(ob, idx))
                                    })
                                }
                                {provided.placeholder}
                            </div>)
                    }}
                </Droppable>
            </Paper >
        )
    }
    return (
        <React.Fragment>
            <DragDropContext onDragEnd={onDragEnd}>
                <SubmittedNook ob={props.submittedOB} />
            </DragDropContext>
            <DragDropContext onDragEnd={onDragEnd}>
                {create_droppable(props.selOBs, 'selOBs', selTooltip, selTitle, onSubmitOB)}
            </DragDropContext>
        </React.Fragment>
    )
}

export default SelectedQueue