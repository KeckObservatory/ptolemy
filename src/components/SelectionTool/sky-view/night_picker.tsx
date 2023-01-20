import * as React from 'react';
import TextField from '@mui/material/TextField';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

const datePickerStyle = {
    margin: '16px',
}

interface Props {
    date: Dayjs
    handleDateChange: (date: Dayjs | null, keyboardInputValue?: string | undefined) => void
}

export default function NightPicker(props: Props) {

    return (
        <LocalizationProvider sx={datePickerStyle} dateAdapter={AdapterDayjs}>
            <DatePicker
                views={['year', 'month', 'day']}
                label="Date of observation"
                value={dayjs(props.date)}
                onChange={props.handleDateChange}
                renderInput={(params: any) => <TextField {...params} helperText={null} />}
            />
        </LocalizationProvider>
    );
}

NightPicker.defaultProps = { date: new Date() }

