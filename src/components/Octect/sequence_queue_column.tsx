
import React, { MouseEventHandler, useEffect, useState } from 'react'
import { ObservationBlock, Science } from '../../typings/ptolemy'
import { DragDropContext } from 'react-beautiful-dnd'
import { reorder, move, CreateDroppable } from './../dnd_divs'
import ReactJson, { OnCopyProps, ThemeKeys } from 'react-json-view'
import { BooleanParam, StringParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, FormControl, FormControlLabel, Paper, Stack, Switch, Tooltip } from '@mui/material'
import JsonViewTheme from '../json_view_theme'
import { SocketContext } from '../../contexts/socket';
import { useTheme } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SelectedSequenceTable from './selected_sequence_table'

interface Props {
    enableClipboard: boolean | ((copy: OnCopyProps) => void) | undefined
    collapseStringsAfter: number | false | undefined
    collapsed: number | boolean | undefined
    iconStyle: "circle" | "triangle" | "square" | undefined
    submitAcq: MouseEventHandler<HTMLButtonElement>
    submitSeq: MouseEventHandler<HTMLButtonElement>
    sequences: Science[];
    sequenceBoneyard: Science[];
    ob: ObservationBlock;
}


const DragSeqCell = (seqCell: Science) => {

    const [jsontheme, _] = useQueryParam('theme', withDefault(StringParam, 'bespin'))
    const theme = useTheme()
    return (
        <div style={{ 'background': theme.palette.secondary.dark }}>
            <p> id: {seqCell.metadata.sequence_number} </p>
            <p> sequence: {seqCell.metadata.ui_name} </p>
            <ReactJson
                src={seqCell as object}
                theme={jsontheme as ThemeKeys | undefined}
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

    const [theme, setTheme] =
        useQueryParam('theme', withDefault(StringParam, 'bespin'))

    const [hideCompletedSequences, setHideCompletedSequences] = 
        useQueryParam('hide_completed_sequences', withDefault(BooleanParam, false))

    const hide_submitted_sequences = (checked: boolean) => {
        setHideCompletedSequences(checked)
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
                        <Button sx={{ margin: '0px' }} onClick={handle_edit_ob}>EDIT OB</Button>
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
                <Tooltip title="Hide sequences that have been completed">
                    <FormControlLabel
                        label=""
                        value={hideCompletedSequences}
                        control={<Switch value={hideCompletedSequences} />}
                        onChange={(_, checked) => hide_submitted_sequences(checked)
                        }
                    />
                </Tooltip>
            </Stack>
            <SelectedSequenceTable
                ob={props.ob}
                sequences={props.sequences}
                sequenceBoneyard={props.sequenceBoneyard}
                submitSeq={props.submitSeq} 
                hideCompletedSequences={hideCompletedSequences}
            />
        </React.Fragment >
    )
}