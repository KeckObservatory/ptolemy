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
    return (
        <div
            ref={props.provided.innerRef}
            {...props.provided.draggableProps}
            {...props.provided.dragHandleProps}
        >
            <Paper elevation={24}>
                {props.formChild}
            </Paper>
        </div>
    )
}



export const CreateDroppable = (cells: any[], idKey: string, key: string, tooltip: string, title: string, childDiv: Function, isDragDisabled: boolean) => {
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
                                    //careful that idxKey is unique for each droppable
                                    return (create_draggable(cell, `${idKey}-${idx}`, idx, childDiv, isDragDisabled))
                                })
                            }
                            {provided.placeholder}
                        </div>)
                }}
            </Droppable>
        </Paper >
    )
}

export const create_draggable = (cell: any, cellId: string, idx: number, childDiv: Function, isDragDisabled: boolean) => {
    return (
        <Draggable
            key={cellId}
            draggableId={cellId}
            index={idx}
            isDragDisabled={isDragDisabled}
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

const removeFromList = (list: any[], idx: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(idx, 1);
    return [removed, result]
}

const addToList = (list: any[], idx: number, element: any) => {
    const result = Array.from(list);
    result.splice(idx, 0, element )
    return result
}

/**
 * Moves an item from one list to another list.
 */
export const move = (source: any, destination: any, droppableSource: any, droppableDestination: any) => {
    console.log('inside move', 'source', source, 'dest', destination, 'dropSource', droppableSource, 'dropDest', droppableDestination)
    const [removed, sourceClone] = removeFromList(source, droppableSource.index)
    const destClone = addToList(destination, droppableDestination.index, removed)

    console.log('removed', removed, 'sourceClone', sourceClone, 'destClone', destClone)

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