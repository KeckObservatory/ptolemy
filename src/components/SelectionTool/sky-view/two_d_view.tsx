import React from 'react';
import * as util from './sky_view_util'
import Plot from 'react-plotly.js';
import { Scoby } from '../../../typings/ptolemy';
import { LngLatEl } from './sky_view';
import NightPicker from './night_picker'
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import * as SunCalc from 'suncalc'
import { BooleanParam, DateParam, DateTimeParam, NumberParam, StringParam, useQueryParam, withDefault } from 'use-query-params';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Slider, Switch, Tooltip, Typography } from '@mui/material';

dayjs.extend(utc)
dayjs.extend(timezone)

export const TIMEZONE = "Pacific/Honolulu"

interface Props {
    selObRows: Scoby[]
}

const deg_2_rad = (deg: number) => deg * Math.PI / 180
const KECK_GEOMETRY: any = {
    K1: {
        r0: 0,
        r1: 18,
        r2: 0,
        r3: 33.3,
        t0: 0,
        t1: 361,
        t2: 5.3,
        t3: 146.2
    },
    K2: {
        r0: 0,
        r1: 18,
        r2: 0,
        r3: 36.8,
        t0: 0,
        t1: 361,
        t2: 185.3,
        t3: 332.8
    }
}

const make_disk_polar = (r1: number, r2: number, th1: number, th2: number) => {

    let rr1 = [] as number[]
    let tt1 = [] as number[]
    let rr2 = [] as number[]
    let tt2 = [] as number[]
    for (let th = th1; th < th2; th++) {
        rr1.push(r1)
        tt1.push(th)
        rr2.push(r2)
        tt2.push(th)
    }

    const r = [...rr1, ...rr2.reverse(), rr1[0]]
    const theta = [...tt1, ...tt2.reverse(), tt1[0]]

    const pTrace: Partial<Plotly.PlotData | any> = {
        r: r,
        theta: theta,
        opacity: .5,
        color: "rgb(0,0,0)",
        line: {
            color: "rgb(0,0,0)",
            width: 0
        },
        type: 'scatterpolar',
        fill: 'toself',
        mode: 'lines',
        name: 'telescope bottom limit',
        hoverinfo: "none",
        hovermode: false,
    }
    return pTrace
}

const TwoDView = (props: Props) => {

    const KECK_LONG = 360 - 155.4747 // Keck Observatory longitude west of Greenwich [deg]
    const KECK_LAT = 19.8260 //[deg]
    const KECK_ELEVATION = 4144.9752 // m
    const N_POINTS = 105
    const keckLngLat: LngLatEl = { lng: KECK_LONG, lat: KECK_LAT, ele: KECK_ELEVATION }

    const today = dayjs(new Date()).tz(TIMEZONE).toDate()
    const [date, setDate] = useQueryParam('date', withDefault(DateParam, today))
    const [dome, setDome] = useQueryParam('dome', withDefault(StringParam, "K2"))
    const [showMoon, setShowMoon] = useQueryParam('show_moon', withDefault(BooleanParam, true))
    const [showCurrLoc, setShowCurrLoc] = useQueryParam('show_current_location', withDefault(BooleanParam, true))


    const nadir = util.get_nadir(keckLngLat, date)
    const times = util.get_times(nadir, N_POINTS)

    const [time, setTime] = useQueryParam('time', withDefault(DateTimeParam, nadir))

    let scoby_deg: Scoby[] = []
    props.selObRows.forEach((s: Scoby) => {
        if (s.ra && s.dec) {
            let sd = {
                ...s,
                ra_deg: util.ra_dec_to_deg(s.ra, false),
                dec_deg: util.ra_dec_to_deg(s.dec, true)
            }
            scoby_deg.push(sd)
        }
    })

    let traces: any[] = []


    scoby_deg.forEach((sd: Scoby) => {
        const ra = sd.ra_deg as number
        const dec = sd.dec_deg as number
        const azEl = util.get_target_traj(ra, dec, times, keckLngLat) as [number, number][]
        // console.log('axEl', azEl)

        let [rr, tt] = [[] as number[], [] as number[]]
        const texts: string[] = []
        azEl.forEach((ae: [number, number], idx: number) => {
            if (ae[1] >= 0) {
                rr.push(90 - ae[1])
                tt.push(ae[0])

                let txt = ""
                txt += `Az: ${ae[0].toFixed(2)}<br>`
                txt += `El: ${ae[1].toFixed(2)}<br>`
                txt += `Airmass: ${util.air_mass(ae[1]).toFixed(2)}<br>`
                txt += `Date: ${times[idx].toString()}`
                texts.push(txt)
            }
        })

        const trace = {
            r: rr,
            theta: tt,
            text: texts,
            hovorinfo: 'text',
            hovertemplate: '<b>%{text}</b>', //disable to show xyz coords
            line: {
                width: 10
            },
            textposition: 'top left',
            type: 'scatterpolar',
            mode: 'lines',
            namelength: -1,
            name: sd.name
        }
        traces.push(trace)
    })

    if (showMoon) {
        let [rr, tt] = [[] as number[], [] as number[]]
        const texts: string[] = []
        times.forEach((time: Date, idx: number) => {
            const azel = SunCalc.getMoonPosition(time, keckLngLat.lat, keckLngLat.lng)
            const ae = [azel.azimuth * 180 / Math.PI, azel.altitude * 180 / Math.PI]
            const r = 90 - ae[1]
            if (r <= 90) {
                rr.push(90 - ae[1])
                tt.push(ae[0])
                let txt = ""
                txt += `Az: ${ae[0].toFixed(2)}<br>`
                txt += `El: ${ae[1].toFixed(2)}<br>`
                txt += `Airmass: ${util.air_mass(ae[1]).toFixed(2)}<br>`
                txt += `Date: ${times[idx].toString()}`
                texts.push(txt)
            }
        })

        const trace = {
            r: rr,
            theta: tt,
            text: texts,
            opacity: .5,
            hovorinfo: 'text',
            color: "rgb(0,0,0)",
            hovertemplate: '<b>%{text}</b>', //disable to show xyz coords
            line: {
                width: 10
            },
            textposition: 'top left',
            type: 'scatterpolar',
            mode: 'lines',
            namelength: -1,
            name: 'Moon'
        }
        traces.push(trace)
    }

    if (showCurrLoc) {

        let [rr, tt] = [[] as number[], [] as number[]]
        const texts: string[] = []
        console.log('current location time', time)

        if (showMoon) {
            const azel = SunCalc.getMoonPosition(time, keckLngLat.lat, keckLngLat.lng)
            const ae = [azel.azimuth * 180 / Math.PI, azel.altitude * 180 / Math.PI]
            const r = 90 - ae[1]
            if (r <= 90) {
                rr.push(90 - ae[1])
                tt.push(ae[0])
                let txt = ""
                txt += `Az: ${ae[0].toFixed(2)}<br>`
                txt += `El: ${ae[1].toFixed(2)}<br>`
                txt += `Airmass: ${util.air_mass(ae[1]).toFixed(2)}<br>`
                txt += `Date: ${time.toString()}`
                texts.push(txt)
            }
        }
        scoby_deg.forEach((sd: Scoby) => { //add current location trace
            const ra = sd.ra_deg as number
            const dec = sd.dec_deg as number
            const azEl = util.get_target_traj(ra, dec, [time], keckLngLat) as [number, number][]
            const r = 90 - azEl[0][1]
            if (r <= 90) {
                rr.push(r)
                tt.push(azEl[0][0])
                let txt = ""
                txt += `Az: ${azEl[0][0].toFixed(2)}<br>`
                txt += `El: ${azEl[0][1].toFixed(2)}<br>`
                txt += `Airmass: ${util.air_mass(azEl[0][1]).toFixed(2)}<br>`
                txt += `Date: ${time.toString()}`
                texts.push(txt)
            }
        })

        const trace = {
            r: rr,
            theta: tt,
            text: texts,
            hovorinfo: 'text',
            hovertemplate: '<b>%{text}</b>', //disable to show xyz coords
            color: "rgb(0,0,0)",
            textposition: 'top left',
            type: 'scatterpolar',
            mode: 'markers',
            marker: { size: 12, color: 'red' },
            namelength: -1,
            name: 'Current location'
        }
        traces.push(trace)
    }

    const r0 = 90 - KECK_GEOMETRY[dome].r0
    const r1 = 90 - KECK_GEOMETRY[dome].r1
    const t0 = KECK_GEOMETRY[dome].t0
    const t1 = KECK_GEOMETRY[dome].t1
    const r2 = 90 - KECK_GEOMETRY[dome].r2
    const r3 = 90 - KECK_GEOMETRY[dome].r3
    const t2 = KECK_GEOMETRY[dome].t2
    const t3 = KECK_GEOMETRY[dome].t3
    const d1 = make_disk_polar(r0, r1, t0, t1)
    const d2 = make_disk_polar(r2, r3, t2, t3)
    const shape = {
        ...d1,
        r: [...d1.r, ...d2.r],
        theta: [...d1.theta, ...d2.theta]
    }
    traces.push(shape)


    const layout: Partial<Plotly.Layout> = {
        width: 900,
        height: 800,
        title: 'Target Trajectories',
        polar: {

            radialaxis: {
                showticklabels: true,
                tickmode: "array",
                tickvals: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
                ticktext: ['90', '80', '70', '60', '50', '40', '30', '20', '10', '0'],
            },
            angularaxis: {
                showticklabels: true,
                rotation: +90,
                direction: "clockwise"
            },
        },
        margin: {
            l: 40,
            r: 40,
            b: 40,
            t: 40,
            pad: 4
        },
        annotations: [{
            xref: 'paper',
            yref: 'paper',
            x: 0.45,
            xanchor: 'right',
            y: 1,
            yanchor: 'middle',
            text: 'North',
            showarrow: false
        }, {
            xref: 'paper',
            yref: 'paper',
            x: 1,
            xanchor: 'left',
            y: .55,
            yanchor: 'top',
            text: 'East',
            showarrow: false
        }]
    }

    const handleDomeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDome(event.target.value)
    }

    const handleDateChange = (date: Dayjs | null) => {
        if (date) setDate(date.tz(TIMEZONE).toDate())
    }

    const handleHourOffsetChange = (event: Event, value: number | number[]) => {
        if (typeof (value) === 'number') {
            const dte = new Date(value)
            setTime(dte)
        }
    }

    const valueLabelFormat = (value: number) => {
        const dte = new Date(value)
        return dte.toTimeString()
    }

    const marks = times.map( (dte: Date) => {
        return {value: dte.valueOf()}
    })


    return (
        <React.Fragment>
            <NightPicker date={date} handleDateChange={handleDateChange} />
            <Box padding={0}>
                <FormLabel id="hour-offset-from-now-label">Hour Offset From Now</FormLabel>
                    <Slider
                        aria-label="Hours from now"
                        onChange={handleHourOffsetChange}
                        defaultValue={nadir.valueOf()}
                        valueLabelDisplay="auto"
                        valueLabelFormat={valueLabelFormat}
                        step={null}
                        min={times[0].valueOf()}
                        max={times[times.length-1].valueOf()}
                        marks={marks}
                    />
            </Box>
            <FormControl>
                <FormLabel id="dome-row-radio-buttons-group-label">Dome</FormLabel>
                <RadioGroup
                    row
                    aria-labelledby="dome-row-radio-buttons-group-label"
                    name="dome-radio-buttons-group"
                    value={dome}
                    onChange={handleDomeChange}
                >
                    <FormControlLabel value="K1" control={<Radio />} label="K1" />
                    <FormControlLabel value="K2" control={<Radio />} label="K2" />
                </RadioGroup>
            </FormControl>
            <FormControlLabel
                label="Show Current Location"
                value={showCurrLoc}
                control={<Switch checked={showCurrLoc} />}
                onChange={(_, checked) => setShowCurrLoc(checked)}
            />
            <FormControlLabel
                label="Show Moon"
                value={showMoon}
                control={<Switch checked={showMoon} />}
                onChange={(_, checked) => setShowMoon(checked)}
            />
            <Plot
                data={traces}
                layout={layout}
            />
        </React.Fragment>
    );

}

export default TwoDView