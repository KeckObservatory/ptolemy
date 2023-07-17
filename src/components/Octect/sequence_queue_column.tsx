
import React, { MouseEventHandler, useEffect, useState } from 'react'
import { ObservationBlock, Science } from '../../typings/ptolemy'
import { DragDropContext } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'
import ReactJson, { OnCopyProps, ThemeKeys } from 'react-json-view'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, FormControl, Paper, Stack, Tooltip } from '@mui/material'
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
            if (dKey === 'seqQueue') {
                let newSeq = [...props.sequences]
                newSeq = reorder(newSeq, source.index, destination.index)
                // props.setSequences(newSeq)
                socket.emit('new_sequence_queue', { sequence_queue: newSeq, ob: props.ob })
            }
            else {
                let newBoneyard = [...props.sequenceBoneyard]
                newBoneyard = reorder(newBoneyard, source.index, destination.index)
                socket.emit('new_sequence_boneyard', { sequence_boneyard: newBoneyard, ob: props.ob })
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

    const handle_edit_ob = () => {
        const id = props.ob._id
        let url = 'https://www3build.keck.hawaii.edu/sandbox/ttucker/observers/papahana_frontend/build/index.html?'
        url += `ob_id=${id}&tab_index=0`
        console.log(`opening url ${url} in new tab`)
        window.open(url, '_blank')

    }

    const isDragDisabled = false

    return (
        <React.Fragment>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        maxHeight: 50,
                        marginTop: '4px',
                        paddingLeft: '4px'
                    }}

                >
                    <h2 style={{ margin: '0px', marginRight: '10px' }}>Selected OB</h2>
                    <Tooltip title={'Open separate tab in the ODT that reads the OB'}>
                        <Button sx={{margin: '0px'}} onClick={handle_edit_ob}>EDIT OB</Button>
                    </Tooltip>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '0px',
                        margin: '4px',
                    }}
                >
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
            <Stack sx={{ margin: '8px', height: '40px' }} direction="row" spacing={2}>
                <Tooltip title={'Request target acquisition'}>
                    <Button variant="contained" onClick={props.submitAcq}>Request Acquisition</Button>
                </Tooltip>
                <Tooltip title={'Send sequence to event queue'}>
                    <Button variant="contained" onClick={props.submitSeq}>Submit Top Seq</Button>
                </Tooltip>
            </Stack>
            <DragDropContext onDragEnd={onDragEnd}>
                {CreateDroppable(props.sequences, 'seq1', 'seqQueue', 'Sort sequences here', 'Target Queue', DragSeqCell, isDragDisabled)}
                <Accordion sx={{
                    margin: '4px',
                }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            maxHeight: 50,
                            margin: '0px',
                            padding: '4px'
                        }}

                    >
                        <h2 style={{ margin: '0px' }}>Target Queue Boneyard</h2>
                    </AccordionSummary>
                    <AccordionDetails
                        sx={{
                            padding: '0px',
                            margin: '4px',
                        }}
                    >
                        {CreateDroppable(props.sequenceBoneyard, 'seqboneyard', 'seqBoneyard', 'Discarded sequences live here', '', DragSeqCell, false)}

                    </AccordionDetails>
                </Accordion>
            </DragDropContext>
        </React.Fragment >
    )
}