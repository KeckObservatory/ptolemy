import Tooltip from '@mui/material/Tooltip'
import Paper from '@mui/material/Paper'
import { Droppable, Draggable } from 'react-beautiful-dnd'
import { OBCell } from '../typings/ptolemy'

interface CreateDivProps {
    provided: any;
    snapshot: any;
    obCell: OBCell;
}

const CreateRow = (props: CreateDivProps) => {
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
        <tr
            ref={props.provided.innerRef}
            {...props.provided.draggableProps}
            {...props.provided.dragHandleProps}
            style={className}
        >
            <td style={{ width: "120px" }}>{props.obCell.name}</td>
            <td style={{ width: "120px" }}>{props.obCell.type}</td>
            <td style={{ width: "60px" }}>{props.obCell.ra}</td>
            <td style={{ width: "60px" }}>{props.obCell.dec}</td>
        </tr>
    )
}

export const CreateDroppableTable = (cells: any[], idKey: string, key: string, tooltip: string, title: string) => {
    return (
        <Paper sx={{
            padding: '8px',
            margin: '4px',
            minWidth: '80px',
            width: '95%',
            elevation: 3,
        }} elevation={3}>
            <Tooltip title={tooltip}>
                <h2>{title}</h2>
            </Tooltip>
            <Droppable droppableId={key}>
                {(provided, snapshot) => (
                    <table
                        ref={provided.innerRef}
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
                    >
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Ra</th>
                                <th>Dec</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cells.length > 0 &&
                                cells.map((cell: any, idx: number) => {
                                    return (create_draggable(cell, cell[idKey], idx))
                                })
                            }
                            {provided.placeholder}
                        </tbody>
                    </table>
                )}
            </Droppable>
        </Paper >
    )
}

export const create_draggable = (cell: any, cellId: string, idx: number) => {
    return (
        <Draggable key={cell.id} draggableId={cell.id} index={idx}>
            {(provided, snapshot) => (
                CreateRow(
                    {
                        provided: provided,
                        snapshot: snapshot,
                        obCell: cell
                    })
            )}
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