
import React, { MouseEventHandler } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton } from '@mui/material';
import { ObservationBlock, Science } from '../../typings/ptolemy'
import ReactJson, { OnCopyProps, ThemeKeys } from 'react-json-view'
import { BooleanParam, StringParam, useQueryParam, withDefault } from 'use-query-params'
import { Button, FormControlLabel, Stack, Switch, Tooltip } from '@mui/material'
import { useTheme } from '@mui/material/styles';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SelectedSequenceTable from './selected_sequence_table'
import { socket } from '../../contexts/socket';

interface Props {
    enableClipboard: boolean | ((copy: OnCopyProps) => void) | undefined
    collapseStringsAfter: number | false | undefined
    collapsed: number | boolean | undefined
    iconStyle: "circle" | "triangle" | "square" | undefined
    submitAcq: MouseEventHandler<HTMLButtonElement>
    submitSeq: Function
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

    const handle_refresh_ob = () => {
        socket.emit('refresh_ob')
    }

    const isDragDisabled = false

    let selOBText = 'Selected OB'
    props.ob?.metadata?.name && (selOBText += 'Name: ' + props.ob.metadata.name)
    props.ob?.target?.parameters.target_info_name && (selOBText += 'Target: ' + props.ob.target.parameters.target_info_name)

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
                    <h2 style={{ margin: '0px', marginRight: '10px' }}>{selOBText}</h2>
                    <Tooltip title={'Open separate tab in the ODT that reads the OB'}>
                        <Button sx={{ margin: '0px' }} onClick={handle_edit_ob}>EDIT OB</Button>
                    </Tooltip>
                    <Tooltip title={'Select to refresh EE state with most recent OB'}>
                        <IconButton onClick={handle_refresh_ob} aria-label='refresh-ob'>
                            <RefreshIcon />
                        </IconButton>
                        {/* <Button sx={{ margin: '0px' }} onClick={handle_refresh_ob}>RefreOB</Button> */}
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