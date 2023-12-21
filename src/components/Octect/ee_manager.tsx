import React from 'react';
import {
    Button,
    Switch,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    FormLabel,
    FormGroup,
    FormControlLabel,
} from '@mui/material'

import { SocketContext } from '../../contexts/socket';

export const EEManager = () => {
    const [open, setOpen] = React.useState(false)
    const [isPaused, setIsPaused] = React.useState(false)
    const [isStopped, setIsStopped] = React.useState(false)

    const socket = React.useContext(SocketContext);
    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean, type: string) => {
        const data = {[type]: checked}
        if (type === 'pause') {
            setIsPaused(checked)
        } else if (type === 'halt') {
            setIsStopped(checked)
        }
        socket.emit('toggle_pause_halt_event', data)
    }

    return (
        <React.Fragment>
            <Button variant="contained" onClick={handleOpen}>
                Open EE Manager
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
            >
                <DialogTitle id="alert-dialog-title">
                    {"EE Manager"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Pause/Stop events
                    </DialogContentText>
                    <FormControl component="fieldset" variant="standard">
                        <FormLabel component="legend">Event Options</FormLabel>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Switch checked={isPaused} onChange={(event, checked) => handleChange(event, checked, 'pause')} name="gilad" />
                                }
                                label="Pause Event"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={isStopped} onChange={(event, checked) => handleChange(event, checked, 'halt')} name="jason" />
                                }
                                label="Stop Event"
                            />
                        </FormGroup>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}