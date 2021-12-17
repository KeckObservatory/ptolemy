import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import React, { useEffect, useState } from 'react'
import { makeStyles } from '@mui/styles'
import { ObservationBlock, OBCell } from "../../typings/ptolemy"
import { Theme } from '@mui/material/styles'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { reorder, move, create_draggable, CreateDroppable } from './../dnd_divs'

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

interface Props {
    sem_id: string;
    avlObs: OBCell[];
    setAvlObs: Function;
    selObs: OBCell[];
    setSelObs: Function;
}


const DragOBCell = (obCell: OBCell) => {
    return (
        <div>
            <p>
                OB name: {obCell.name}
            </p>
            <p>
                Type: {obCell.type}
            </p>
            {obCell.ra && <p> Ra: {obCell.ra} Dec: {obCell.dec} </p>}
        </div>
    )
}

export const OBQueue = (props: Props) => {

    const classes = useStyles();
    const avlTitle= "Available OBs/Containers"
    const avlTooltip= "Observation Blocks/containers available for selected semester"
    const selTitle="Selected OBs/Containers"
    const selTooltip= "Observation Block/containers in selected queue"

    useEffect(() => {
    }, [props])

    useEffect(() => {
    }, [])


    const onDragEnd = (result: any) => {
        const { source, destination } = result;
        if (!destination) return;
        const sKey: 'selObs' | 'avlObs' = source.droppableId;
        const dKey: 'selObs' | 'avlObs' = destination.droppableId;

        if (sKey === dKey) { //shuffling items around
            let newObs = [...props[dKey]]
            newObs = reorder(newObs, source.index, destination.index)
            if (sKey === 'selObs') {
                props.setSelObs(newObs)
            }
            else {
                props.setAvlObs(newObs)
            }
        } else { // new item in state
            const result = move(props[sKey], props[dKey], source, destination);
            if (sKey === 'selObs') {
                props.setSelObs(result[sKey])
                props.setAvlObs(result[dKey])
            }
            else {
                props.setSelObs(result[dKey])
                props.setAvlObs(result[sKey])
            }
        }
    }

    return (
        <Grid container spacing={1} >
            <DragDropContext onDragEnd={onDragEnd}>
                <Grid className={classes.cell} item xs={6}>
                    {CreateDroppable(props.avlObs, 'id', 'avlObs', avlTooltip, avlTitle, DragOBCell)}
                </Grid>
                <Grid className={classes.cell} item xs={6}>
                    {CreateDroppable(props.selObs, 'id', 'selObs', selTooltip ,selTitle, DragOBCell)}
                </Grid>
            </DragDropContext>
        </Grid>
    )
}
