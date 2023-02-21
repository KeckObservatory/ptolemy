import Tooltip from '@mui/material/Tooltip'
import Paper from '@mui/material/Paper'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { makeStyles } from '@mui/styles'

interface CreateDivProps {
    provided: any;
    snapshot: any;
    formChild: JSX.Element;
}
const CreateDiv = (props: CreateDivProps) => {
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
    } as any
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



export const CreateDroppable = (cells: any[], idKey: string, key: string, tooltip: string, title: string, childDiv: Function, isDraggable: boolean) => {
    return (
        <Paper sx={
            {
                padding: '8px',
                margin: '4px',
                minWidth: '80px',
                width: '95%',
                elevation: 3,
            }
        }
            elevation={3}>
            <Tooltip title={tooltip}>
                <h2>{title}</h2>
            </Tooltip>
            <Droppable key={key} droppableId={key}>
                {(provided: any, snapshot: any) => {
                    return (
                        <div
                            className={snapshot.isDraggingOver
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
                            {cells.length > 0 &&
                                cells.map((cell: any, idx: number) => {
                                    return (create_draggable(cell, `idx-${idx}`, idx, childDiv, isDraggable))
                                })
                            }
                            {provided.placeholder}
                        </div>)
                }}
            </Droppable>
        </Paper >
    )
}

export const create_draggable = (cell: any, cellId: string, idx: number, childDiv: Function, isDraggable: boolean) => {
    return (
        <Draggable
            key={cellId}
            draggableId={cellId}
            index={idx}
            isDragDisabled={isDraggable}
        >
            {(provided, snapshot) => CreateDiv(
                {
                    provided: provided,
                    snapshot: snapshot,
                    formChild: childDiv(cell)
                })
            }
        </Draggable>
    )
}

/**
 * Moves an item from one list to another list.
 */
export const move = (source: any, destination: any, droppableSource: any, droppableDestination: any) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result: any = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

export const reorder = (list: Array<any>, startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};