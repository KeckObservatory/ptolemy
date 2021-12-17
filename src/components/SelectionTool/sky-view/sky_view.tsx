
import React from 'react';
import { useD3 } from '../../../hooks/useD3'
import * as d3 from 'd3'
import { OBCell, ObservationBlock, Target } from '../../../typings/ptolemy'
// import * as dayjs from 'dayjs'
import * as util from './sky_view_util'
import {skyview} from './sky_view_d3'
import { useQueryParam, NumericObjectParam, NumberParam, StringParam, withDefault, DateParam } from 'use-query-params'

interface Props {
    outerHeight: number
    outerWidth: number
    selObs: OBCell[] | ObservationBlock[];
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

    const HT_OFFSET = 600 // hawaii time offset from ut time [minutes]
    const KECK_LONG = 360 - 155.4747 // Keck Observatory longitude west of Greenwich [deg]
    const KECK_LAT = 19.8260 //[deg]
    const KECK_ELEVATION = 4144.9752 // m
    const today = new Date()
    const keckLngLat: LngLatEl = {lng: KECK_LONG, lat: KECK_LAT, ele: KECK_ELEVATION}

    const [date, setDate] = useQueryParam('date', withDefault(DateParam, today))
    const [offset, setOffset] = useQueryParam('offset', withDefault(NumberParam, HT_OFFSET))
    const [lngLatEl, setLngLatEl] = useQueryParam('lngLatEl', withDefault(NumericObjectParam, keckLngLat as any))

    React.useEffect(() => {
       setDate(date) 
       setLngLatEl(lngLatEl) 
    }, [])

    React.useEffect(() => {
        d3.selectAll("svg > *").remove(); // clear old scales and points
    }, [props.selObs, props.chartType])

    let targets: Target[] = []
    props.selObs.forEach((obSel: OBCell | ObservationBlock) => {
        if (obSel.target) targets.push(obSel.target)
    })

    targets = targets.map((target: Target) => {
        target.ra_deg = util.ra_dec_to_deg(target.ra, false)
        target.dec_deg = util.ra_dec_to_deg(target.dec, true)
        return target
    })

    let ref = useD3((svg: any) => { skyview(svg, 
         props.chartType, props.outerHeight, props.outerWidth,
         props.marginLeft, props.marginRight, props.marginTop, 
         props.marginBottom,
         targets,
         date,
         lngLatEl,
         ) })

    return (
        <svg
            ref={ref as any}
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