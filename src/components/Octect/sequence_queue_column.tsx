
import React, { MouseEventHandler, useEffect, useState } from 'react'
import { ObservationBlock, Science } from '../../typings/ptolemy'
import { DragDropContext } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'
import ReactJson, { OnCopyProps, ThemeKeys } from 'react-json-view'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, FormControl, Paper, Tooltip } from '@mui/material'
import JsonViewTheme from '../json_view_theme'
import { SocketContext } from '../../contexts/socket';

interface Props {
    enableClipboard: boolean | ((copy: OnCopyProps) => void) | undefined
    collapseStringsAfter: number | false | undefined
    collapsed: number | boolean | undefined
    iconStyle: "circle" | "triangle" | "square" | undefined
    submitAcq: MouseEventHandler<HTMLButtonElement> | undefined
    submitSeq: MouseEventHandler<HTMLButtonElement> | undefined
    sequences: Science[];
    sequenceBoneyard: Science[];
    setSequences: Function;
    setSequenceBoneyard: Function;
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

export const SequenceQueueColumn = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [theme, setTheme] =
        useQueryParam('theme', withDefault(StringParam, 'bespin'))

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
                socket.emit('new_sequence_queue', { sequence_queue: newSeq, ob: props.ob })
            }
            else {
                socket.emit('new_sequence_boneyard', { sequence_boneyard: newSeq })
            }
        } else { // item in droppable 
            if (dKey === 'seqQueue') { // sequence added to sequence queue
                const moveResult = move(props.sequenceBoneyard, props.sequences, source, destination);
                socket.emit('new_sequence_queue', { sequence_queue: moveResult[dKey], ob: props.ob })
                socket.emit('new_sequence_boneyard', { sequence_boneyard: moveResult[sKey], ob: props.ob })
            }
            else { // sequence added to boneyard
                const moveResult = move(props.sequences, props.sequenceBoneyard, source, destination);
                socket.emit('new_sequence_queue', { sequence_queue: moveResult[sKey], ob: props.ob })
                socket.emit('new_sequence_boneyard', { sequence_boneyard: moveResult[dKey], ob: props.ob })
            }
        }
    }
    const isDragDisabled = false
    return (

        <React.Fragment>
            <Paper sx={{
                padding: 2,
                margin: 1,
                // minWidth: '800px',
                // maxWidth: '800px',
                minHeight: 25,
                elevation: 3,
            }}
            >
                <Tooltip title="Change the color theme of the OB JSON display">
                    <div>
                        <JsonViewTheme
                            theme={theme as ThemeKeys | null | undefined}
                            setTheme={setTheme}
                        />
                    </div>
                </Tooltip>
                <ReactJson
                    src={props.ob as object}
                    theme={theme as ThemeKeys | undefined}
                    iconStyle={props.iconStyle}
                    collapsed={props.collapsed}
                    collapseStringsAfterLength={props.collapseStringsAfter}
                    enableClipboard={props.enableClipboard}
                    onEdit={false}
                />
            </Paper>
            <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                <Button variant="contained" onClick={props.submitSeq}>Submit Top Sequence</Button>
            </FormControl>
            <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                <Button variant="contained" onClick={props.submitAcq}>Submit Acquisition</Button>
            </FormControl>
            <Paper sx={{
                padding: 2,
                margin: 1,
                // minWidth: '800px',
                // maxWidth: '800px',
                minHeight: 25,
                elevation: 3,
            }}
                elevation={3}>
            </Paper >
            <DragDropContext onDragEnd={onDragEnd}>
                {CreateDroppable(props.sequences, 'seq1', 'seqQueue', 'Sort sequences here', 'Sequence Queue', DragSeqCell, isDragDisabled)}
                {CreateDroppable(props.sequenceBoneyard, 'seqboneyard', 'seqBoneyard', 'Discarded sequences live here', 'Sequence Boneyard', DragSeqCell, false)}
            </DragDropContext>
        </React.Fragment>
    )
}