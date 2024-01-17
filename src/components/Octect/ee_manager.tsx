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
    const [pauseToggle, setPauseToggle] = React.useState(props.pause)
    const [haltToggle, setHaltToggle] = React.useState(props.halt)

    const socket = React.useContext(SocketContext);
    const handleOpen = () => {
        setOpen(true);
    };
    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        console.log('EEManager useEffect', props.pause, props.halt)
        setPauseToggle(props.pause)
        setHaltToggle(props.halt)
    }, [props.pause, props.halt])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean, type: string) => {
        const data = { [type]: checked }
        console.log('toggle_pause_halt', data, 'checked', checked, 'value', event.target.value, 'target checked', event.target.checked)
        console.log('event', event)
        if (type === 'pause') {
            setPauseToggle(checked)
        }
        if (type === 'halt') {
            setHaltToggle(checked)
        }
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
                                    <Switch
                                        checked={pauseToggle}
                                        onChange={(event, checked) => handleChange(event, checked, 'pause')}
                                        name="pause" />
                                }
                                label="Pause Event"
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={haltToggle}
                                        onChange={(event, checked) => handleChange(event, checked, 'halt')}
                                        name="halt" />
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