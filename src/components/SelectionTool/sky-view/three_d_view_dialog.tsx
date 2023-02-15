import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Scoby } from '../../../typings/ptolemy';

interface Props {
  selObs: Scoby[] 
}

export default function OBSubmit(props: Props) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Button variant="contained" onClick={handleClickOpen}>
        Submit Top OB 
      </Button>
      <Dialog
        open={open}
        onClose={handleClose}
      >
        <DialogTitle id="alert-dialog-title">
          {"Submitting OB"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
              Are you sure? Submitting a new OB may result in lost work.
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}