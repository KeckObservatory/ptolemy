import React, { MouseEventHandler } from 'react'
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControlLabel,
    Snackbar,
    Stack,
    Switch,
    Tooltip
} from '@mui/material'
import { BooleanParam, StringParam, useQueryParam, withDefault } from 'use-query-params'
import ReactJson, { ThemeKeys } from 'react-json-view'
import { SocketContext } from '../../contexts/socket';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SelectedEventTable from './selected_event_table'
import { EEManager } from './ee_manager'
import { OBSequence, ScienceMetadata, ScienceParameters } from '../../typings/ptolemy'

export interface EventDict {
    id: string,
    subsystem: string,
    sem_id: string,
    event_type: string,
    args: object,
    script_name: string,
    block: boolean
}

interface Props {
    setSnackbarOpen: Function
    snackbarMsg: string
    snackbarOpen: boolean
    sequence: OBSequence 
    releaseEventQueueLock: MouseEventHandler<HTMLButtonElement>
    submitEvent: Function 
    enableClipboard: any
    collapseStringsAfter: any
    collapsed: any
    iconStyle: any
    events: EventDict[];
    eventBoneyard: EventDict[];
    pause: boolean;
    halt: boolean;
}

export const EventQueueColumn = (props: Props) => {

    const socket = React.useContext(SocketContext);
    const [theme, setTheme] =
        useQueryParam('theme', withDefault(StringParam, 'bespin'))

    const [hideCompletedEvents, setHideCompletedEvents] = useQueryParam('hide_completed_events', withDefault(BooleanParam, false))

    const [open, setOpen] = React.useState(false)

    const [role, _] = useQueryParam('role', withDefault(StringParam, "Observer"));

    const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        props.setSnackbarOpen(false);
    };

    const clearEventQueues = () => {
        socket.emit('new_event_boneyard', { event_boneyard: [] })
        socket.emit('new_event_queue', { event_queue: [] })
    }


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    
    const handleYes = () => {
        clearEventQueues()
        handleClose()
    }

    const hide_submitted_events = (checked: boolean) => {
        setHideCompletedEvents(checked)
    }

    const disableQueueUnlock = role === "Observer"
    let selSeqText = "Selected Sequence:"
    const metadata = props.sequence?.metadata as ScienceMetadata
    metadata && (selSeqText += " " + metadata.sequence_number)
    const parameters = props.sequence?.parameters as ScienceParameters
    parameters?.target_info_object && (selSeqText += " " + parameters.target_info_object )


    return (
        <React.Fragment>
            <Accordion
                sx={{
                    margin: '4px'
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        maxHeight: 50,
                        margin: '0px',
                        padding: '4px'
                    }}

                >
                    <h2 style={{ margin: '0px' }}>{selSeqText}</h2>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        padding: '0px',
                        margin: '4px',
                    }}
                >
                    <ReactJson
                        src={props.sequence as OBSequence}
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
                <EEManager pause={props.pause} halt={props.halt} />
                {/* <Button disabled={role.includes('OA')} variant="contained" onClick={props.submitEvent}>Submit Event</Button> */}
                <Button disabled={disableQueueUnlock} variant="contained" onClick={props.releaseEventQueueLock}>Release Event Queue Lock</Button>
                <Tooltip title="Hide Events that have been completed">
                    <FormControlLabel
                        label=""
                        value={hideCompletedEvents}
                        control={<Switch value={hideCompletedEvents} />}
                        onChange={(_, checked) => hide_submitted_events(checked)
                        }
                    />
                </Tooltip>
            </Stack>
            <Stack sx={{ margin: '8px', height: '40px' }} direction="row" spacing={2}>
                <div>
                    <Button disabled={role.includes('OA')} variant="contained" onClick={handleClickOpen}>
                        Clear Event and Boneyard
                    </Button>
                    <Dialog
                        open={open}
                        onClose={handleClose}
                    >
                        <DialogTitle id="alert-dialog-title">
                            {"Clearing Event Queue and Boneyard"}
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                Are you sure?
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleClose}>No</Button>
                            <Button onClick={handleYes} autoFocus>
                                Yes
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            </Stack>
            <Snackbar
                open={props.snackbarOpen}
                autoHideDuration={6000}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                onClose={handleSnackbarClose}>
                <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
                    {props.snackbarMsg}
                </Alert>
            </Snackbar>
            <SelectedEventTable
                role={role}
                events={props.events}
                eventBoneyard={props.eventBoneyard}
                submitEvent={props.submitEvent}
                hideCompletedEvents={hideCompletedEvents}
            />
        </React.Fragment>
    )
}