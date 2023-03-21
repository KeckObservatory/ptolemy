
import React, { MouseEventHandler, useEffect, useState } from 'react'
import { ObservationBlock, Science } from '../../typings/ptolemy'
import { DragDropContext } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'
import ReactJson, { OnCopyProps, ThemeKeys } from 'react-json-view'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, FormControl, Paper, Tooltip } from '@mui/material'
import JsonViewTheme from '../json_view_theme'
import { SocketContext } from '../../contexts/socket';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
                socket.emit('new_sequence_boneyard', { sequence_boneyard: newSeq, ob: props.ob })
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
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        maxHeight: 50,
                        margin: '0px',
                        padding: '4px'
                    }}

                >
                    <h2 style={{ margin: '0px' }}>Selected OB</h2>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '0px',
                        margin: '4px',
                    }}
                >
                    <Tooltip title="Change the color theme of the OB JSON display">
                        <JsonViewTheme
                            theme={theme as ThemeKeys | null | undefined}
                            setTheme={setTheme}
                        />
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
                </AccordionDetails>
            </Accordion>
            <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                <Button variant="contained" onClick={props.submitSeq}>Submit Top Seq</Button>
            </FormControl>
            <FormControl sx={{ width: 200, margin: '4px', marginTop: '16px' }}>
                <Button variant="contained" onClick={props.submitAcq}>Submit Acquisition</Button>
            </FormControl>
            <DragDropContext onDragEnd={onDragEnd}>
                {CreateDroppable(props.sequences, 'seq1', 'seqQueue', 'Sort sequences here', 'Sequence Queue', DragSeqCell, isDragDisabled)}
                {CreateDroppable(props.sequenceBoneyard, 'seqboneyard', 'seqBoneyard', 'Discarded sequences live here', 'Sequence Boneyard', DragSeqCell, false)}
            </DragDropContext>
        </React.Fragment >
    )
}