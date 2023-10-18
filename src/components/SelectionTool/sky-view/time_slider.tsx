import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import Slider from "@mui/material/Slider";
import dayjs from "dayjs";
import React from "react";

interface Props {
    nadir: Date
    times: Date[]
    time: Date
    setTime: Function
} 

const TimeSlider = (props: Props) => {

    const valueLabelFormat = (value: number) => {
        const dte = dayjs(value)
        return dte.format('HH:mm')
    }

    const handleHourOffsetChange = (event: Event, value: number | number[]) => {
        if (typeof (value) === 'number') {
            const dte = new Date(value)
            props.setTime(dte)
        }
    }

    const marks = props.times.map((dte: Date) => {
        return { value: dte.valueOf() }
    })

    return (
        <Box padding={0}>
            <FormLabel id="hour-offset-from-now-label">{`HT: ${dayjs(props.time).format('HH:mm')}`}</FormLabel>
            <Slider
                aria-label="Hours from now"
                onChange={handleHourOffsetChange}
                value={props.time.valueOf()}
                valueLabelDisplay="auto"
                valueLabelFormat={valueLabelFormat}
                step={null}
                min={props.times[0].valueOf()}
                max={props.times[props.times.length - 1].valueOf()}
                marks={marks}
            />
        </Box>
    )
}

export default TimeSlider
