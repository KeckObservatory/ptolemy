import React, { useEffect } from 'react';
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

interface Props {
    pause: boolean
    halt: boolean
}

export const EEManager = (props: Props) => {
    const [open, setOpen] = React.useState(false)

    const socket = React.useContext(SocketContext);
    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const data = {[type]: event.target.value}
        console.log('toggle_pause_halt', data)
        socket.emit('toggle_pause_halt', data)
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
                                    <Switch checked={props.pause} onChange={(event) => handleChange(event, 'pause')} name="pause" />
                                }
                                label="Pause Event"
                            />
                            <FormControlLabel
                                control={
                                    <Switch checked={props.halt} onChange={(event) => handleChange(event, 'halt')} name="halt" />
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