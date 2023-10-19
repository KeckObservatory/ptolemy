import React from 'react';
import { useD3 } from '../../../hooks/useD3'
import * as d3 from 'd3'
import { Scoby } from '../../../typings/ptolemy'
import * as util from './sky_view_util'
import { skyview } from './sky_view_d3'
import { useQueryParam, NumericObjectParam, withDefault, DateParam } from 'use-query-params'
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { TIMEZONE } from '../two-d-view/two_d_view';
dayjs.extend(utc)
dayjs.extend(timezone)

interface Props {
    outerHeight: number
    outerWidth: number
    selOBRows: Scoby[]
    chartType: string
    marginLeft: number;
    marginRight: number;
    marginTop: number;
    marginBottom: number;
}

export interface LngLatEl {
    lng: number;
    lat: number;
    ele: number;
}

export default function SkyView(props: Props) {

    const KECK_LONG = 360 - 155.4747 // Keck Observatory longitude west of Greenwich [deg]
    const KECK_LAT = 19.8260 //[deg]
    const KECK_ELEVATION = 4144.9752 // m
    const keckLngLat: LngLatEl = { lng: KECK_LONG, lat: KECK_LAT, ele: KECK_ELEVATION }

    const today = dayjs(new Date()).tz(TIMEZONE).toDate()
    const [date, setDate] = useQueryParam('date', withDefault(DateParam, today))

    React.useEffect(() => {
        setDate(date)
        return () => {
            console.log('deconstructing sky-view')
            d3.select('#sky-view').selectAll("svg > * ").remove()
        } // clear old scales and points
    }, [])

    React.useEffect(() => {
        // d3.selectAll("svg > *").remove(); // clear old scales and points
        d3.select('#sky-view').selectAll("svg > * ").remove(); // clear old scales and points
        // d3.selectAll('g > *').remove(); // clear old scales and points

    }, [props.selOBRows, props.chartType])

    let scoby_deg: Scoby[] = []
    props.selOBRows.forEach((s: Scoby) => {
        if (s.ra && s.dec) {
            // console.log('ra: ', s.ra, 'dec: ', s.dec)
            let sd = {
                ...s,
                ra_deg: util.ra_dec_to_deg(s.ra, false),
                dec_deg: util.ra_dec_to_deg(s.dec, true)
            }
            scoby_deg.push(sd)
        }
    })

    let ref = useD3((svg: any) => {
        skyview(svg,
            props.chartType, props.outerHeight, props.outerWidth,
            props.marginLeft, props.marginRight, props.marginTop,
            props.marginBottom,
            scoby_deg,
            date,
            keckLngLat,
        )
    })

    return (
        <svg
            ref={ref as any}
            id="sky-view"
            style={{
                height: props.outerHeight,
                width: props.outerWidth,
            }}
        >
        </svg>
    );
}

SkyView.defaultProps = {
    outerWidth: 1000,
    outerHeight: 625,
    marginRight: 0,
    marginLeft: 120,
    marginTop: 0,
    marginBottom: 60,
}