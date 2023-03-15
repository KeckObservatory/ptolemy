import React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { IconButton, Tooltip } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import { ObservationBlock } from '../../typings/ptolemy';

interface Props {
    upload_sel_obs_from_json: Function
}

export const UploadDialog = (props: Props) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const fileLoad = (evt: React.ChangeEvent<HTMLInputElement>) => {
        //@ts-ignore
        const file = evt.target?.files[0] as Blob
        const fileReader = new FileReader()
        fileReader.readAsText(file, "UTF-8");
        fileReader.onload = e => {
            const contents = e.target?.result as string
            const obs: ObservationBlock[] = contents? JSON.parse(contents): {}
            props.upload_sel_obs_from_json(obs);
            setOpen(false)
        };
    };
    return (
        <div>

            <Tooltip title="Upload Selected OBs from .json file">
                <IconButton  area-label='upload' onClick={handleClickOpen} >
                    <UploadIcon />
                </IconButton>
            </Tooltip>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Upload Selected OBs from .json file"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Select the file to upload
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <input
                        accept="*.json"
                        style={{ display: 'none' }}
                        id="raised-button-file"
                        type="file"
                        multiple
                        onChange={fileLoad}
                    />
                    <label htmlFor="raised-button-file">
                        <Button variant="outlined" component="span" color="primary"
                        >
                            Upload File
                        </Button>
                    </label>
                </DialogActions>
            </Dialog>
        </div>
    );
}