import { ObservationBlock, OBCell } from "./../typings/ptolemy"
import Tooltip from '@mui/material/Tooltip'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { makeStyles } from '@mui/styles'

export const useStyles = makeStyles((theme: any) => ({
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
        width: '45%'
    },
}))


interface CreateDivProps {
    provided: any;
    snapshot: any;
    formChild: JSX.Element;
}
const CreateDiv = (props: CreateDivProps) => {
    const classes = useStyles()
    const acc = { acc: classes.droppableDragging, accDrag: classes.droppable } as any
    const className = props.snapshot.isDragging ? { ...props.provided.draggableProps, ...acc.accDrag } : acc.acc
    return (
        <div
            ref={props.provided.innerRef}
            {...props.provided.draggableProps}
            {...props.provided.dragHandleProps}
            className={className}
        >
            {props.formChild}
        </div>
    )
}



export const CreateDroppable = (cells: any[], idKey: string, key: string, tooltip: string, title: string, childDiv: Function) => {

    const classes = useStyles();
    return (
        <Paper className={classes.paper} elevation={3}>
            <Tooltip title={tooltip}>
                <h2>{title}</h2>
            </Tooltip>
            <Droppable key={key} droppableId={key}>
                {(provided: any, snapshot: any) => {
                    return (
                        <div
                            className={snapshot.isDraggingOver
                                ? classes.droppableDragging : classes.droppable}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {cells.length > 0 &&
                                cells.map((cell: any, idx: number) => {
                                    return (create_draggable(cell, cell[idKey], idx, childDiv))
                                })
                            }
                            {provided.placeholder}
                        </div>)
                }}
            </Droppable>
        </Paper >
    )
}

export const create_draggable = (cell: any, cellId: string, idx: number, childDiv: Function) => {
    return (
        <Draggable
            key={cellId}
            draggableId={cellId}
            index={idx}
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