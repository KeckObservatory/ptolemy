import React from 'react';
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import { useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import OBSubmit from './ob_submit'
import { socket } from '../../contexts/socket'
import { ob_api_funcs } from '../../api/ApiRoot';
import { ObservationBlock, Scoby } from '../../typings/ptolemy';

interface Props {
    selObs: Scoby[];
    setSelObs: Function;
    submittedOB: ObservationBlock
    changeSubmittedOBRow: Function
    submittedOBRow: Scoby
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

const DragDiv = (row: Scoby) => {

    return (
        <div>
            <p>
                OB name: {row.name}
            </p>
            <p>
                Type: {row.ob_type}
            </p>
            {row.ra && <p> Ra: {row.ra} Dec: {row.dec} </p>}
        </div>
    )
}

const create_draggable = (row: Scoby, idx: number) => {
    return (
        <Draggable
            key={row.ob_id}
            draggableId={row.ob_id as string}
            index={idx}
        >
            {(provided, snapshot) => CreateDiv(
                {
                    provided: provided,
                    snapshot: snapshot,
                    formChild: DragDiv(row)

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
    row?: Scoby
}

const SubmittedNook = (props: NookProps) => {
    return (
        <Paper elevation={3} sx={{ margin: '4px', minWidth: '200px', maxWidth: '715px', padding: '9px' }}>
            <Tooltip title={'Submitted OB'}>
                <h3>Submitted OB</h3>
            </Tooltip>
            {props.row && DragDiv(props.row)}
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
        let newObs = [...props.selObs]
        newObs = reorder(newObs, source.index, destination.index)
        props.setSelObs(newObs)
        socket.emit('set_ob_queue', { ob_queue: newObs })
    }

    const onSubmitOB = (result: any) => {
        const ob_id = props.selObs[0].ob_id as string
        ob_api_funcs.get(ob_id).then((ob: ObservationBlock) => {
            console.log('submitting ob')
            socket.emit('submit_ob', { ob: ob })
        })
    }

    const create_droppable = (rows: Scoby[],
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
                                {rows !== undefined &&
                                    rows.map((row: Scoby, idx: number) => {
                                        return (create_draggable(row, idx))
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
                <SubmittedNook row={props.submittedOBRow} />
            </DragDropContext>
            <DragDropContext onDragEnd={onDragEnd}>
                {create_droppable(props.selObs, 'selObs', selTooltip, selTitle, onSubmitOB)}
            </DragDropContext>
        </React.Fragment>
    )
}

export default SelectedQueue