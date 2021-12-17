import React from 'react';
import { useD3 } from '../../../hooks/useD3'
import * as d3 from 'd3'
import { OBCell, Target } from '../../../typings/ptolemy'
// import dayjs from 'dayjs'
import * as util from './sky_view_util'
import { LngLatEl } from './sky_view'
import * as SunCalc from 'suncalc'

interface Data {
    time: Date,
    value: number,
    type: string,
    tgt: string,
    units?: string,
    ra?: number,
    dec?: number,
}

const format_values = (values: number[], times: Date[], target: Target, units?: string): Data[] => {
    let data: Data[] = []
    for (let idx = 0; idx < times.length; idx++) {
        const d: Data = {
            time: times[idx], value: values[idx], units: units,
            type: 'trajectory', tgt: target.name,
            ra: target.ra_deg,
            dec: target.dec_deg

        }
        data.push(d)
    }
    return data
}

const check_calc = (nadir: Date, offset: number = 600) => {
    console.log('nadir', nadir)
    console.log('juld', util.date_to_juld(nadir, offset))
    console.log('gst', util.get_gmt(nadir))
    console.log('lst', util.get_gmt(nadir) - util.KECK_LONG)
    let [ra, dec] = ["17:31:16", "+33:27:43"] as any[]
    ra = util.ra_dec_to_deg(ra, false)
    dec = util.ra_dec_to_deg(dec, true)
    console.log('ra', ra)
    console.log('dec', dec)
}

const make_data = (targets: Target[], chartType: string, date: Date, lngLatEl: LngLatEl) => {

    const nadir = util.get_nadir(lngLatEl, date)
    // check_calc(nadir)
    const times = util.get_times(nadir, 105)
    let myData: Data[][] = []
    let mergedData: Data[] = []

    targets.forEach((target: Target) => {
        const azAlt = util.ra_dec_to_az_alt(target.ra_deg as number, target.dec_deg as number, nadir, lngLatEl)
        const values = get_chart_data(target, times, chartType, date, lngLatEl)
        const data = format_values(values, times, target, 'degrees')
        mergedData = [...mergedData, ...data]
        myData.push(data)

    })
    return myData
}


const add_axes = (svg: any, xScale: d3.ScaleTime<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>, width: number, height: number,
    xOffset: number, xTxtOffset: number, yOffset: number, yTxtOffset: number,
    yLabel = "Value [ ]") => {
    // Add the x Axis
    const xAxisGenerator = d3.axisBottom(xScale).ticks(12)
    const xAxis = svg.append("g")

    xAxis.call(xAxisGenerator)
        .attr("transform", "translate(0," + xOffset + ")")
        .style("font-size", "1rem")

    // text label for the x axis
    svg.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            xTxtOffset + ")")
        .style("text-anchor", "middle")
        .text("Date")
        .style("font-size", "1rem")
        .style("fill", "white");

    // Add the y Axis

    const yAxisGenerator = d3.axisLeft(yScale)
    const yAxis = svg.append("g")

    yAxis
        .attr("transform", "translate(" + yOffset + ", 0)")
        .style("font-size", "1rem")
        .call(yAxisGenerator)

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 + yTxtOffset)
        .attr("x", 0 - (height / 2))
        .style("text-anchor", "middle")
        .text(yLabel)
        .style("fill", "white")
        .style("font-size", "1rem");
}

const init_static_lines = (svg: any,
    xScale: d3.ScaleTime<number, number, never>,
    yScale: d3.ScaleLinear<number, number, never>,
    startDate: Date, width: number, height: number, suncalc: any) => {

    //get sunrise/sunset times
    const bars: Date[] = [suncalc.sunsetStart, suncalc.sunset, suncalc.sunrise, suncalc.sunriseEnd] 
    bars.forEach( (date: Date) => {
            svg.append('rect')
                .attr('x', xScale(date))
                .attr('y', 0)
                .attr('height', height)
                .attr('width', 1)
                .attr('class', 'druler')
                .style('stroke', 'lightgray')
                .style("visibility", "visible")
                .style('opacity', 1);
    })


    svg.append('rect')
        .attr('x', xScale(startDate))
        .attr('y', yScale(30))
        .attr('height', 2)
        .attr('width', width)
        .attr('class', 'druler')
        .style('stroke', 'lightgray')
        .style("visibility", "visible")
        .style('opacity', 1);
    // const URL = "https://www.keck.hawaii.edu/software/db_api/metrics.php?date=" + dateStr 
    // const values = ["dusk_12deg", "dusk_18deg", "dawn_12deg", "dawn_18deg"]
    // console.log(URL)
    // fetch(URL, {mode: 'no-cors'}).then(response => {
    //     console.log(response); 
    //     response.json();
    // }).then( (json:any) => {
    //     console.log(json)
    //     values.forEach( (key: string) => {
    //         const timeStr = json[0][key]
    //         const [hour, minutes] = timeStr.split(':')
    //         const d: dayjs.Dayjs = dayjs(dateStr)
    //         d.set('hour', parseInt(hour, 10))
    //         d.set('minute', parseInt(minutes, 10))
    //         svg.append('rect')
    //             .attr('x', xScale(d.toDate()))
    //             .attr('y', 0)
    //             .attr('height', height)
    //             .attr('width', 2)
    //             .attr('class', 'druler')
    //             .style('stroke', 'lightgray')
    //             .style("visibility", "visible")
    //             .style('opacity', 1);
    //     })
    // })
    // .catch( (err) => {
    //     console.error("Error:", err)
    // })
    //horizontal line is drawn at 30 deg mark 
}

const formatDate = (date: Date) => {
    var year = date.getFullYear(),
        month = date.getMonth() + 1, // months are zero indexed
        day = date.getDate(),
        hour = date.getHours(),
        minute = date.getMinutes(),
        second = date.getSeconds(),
        hourFormatted = hour % 12 || 12, // hour returned in 24 hour format
        minuteFormatted = minute < 10 ? "0" + minute : minute,
        morning = hour < 12 ? "am" : "pm";

    return month + "/" + day + "/" + year + " " + hourFormatted + ":" +
        minuteFormatted + morning;
}

const get_chart_data = (target: Target, times: Date[], chartType: string, date: Date, lngLatEl: LngLatEl, offset: number = 600): number[] => {
    let val;
    switch (chartType) {
        case 'altitude': {
            val = util.get_target_traj(target.ra_deg as number, target.dec_deg as number, times, date, lngLatEl, offset)
            val = val.map((azAlt: any) => azAlt[1]) as number[]
            break;
        }
        case 'air mass': {
            val = util.get_air_mass(target.ra_deg as number, target.dec_deg as number, times, date, lngLatEl, offset)
            break;
        }
        case 'parallactic angle': {
            val = util.get_parallactic_angle(target.ra_deg as number, target.dec_deg as number, times, lngLatEl, offset)
            break;
        }
        case 'lunar angle': {
            val = util.get_lunar_angle(target.ra_deg as number, target.dec_deg as number, times, lngLatEl)
            break;
        }
        default: {
            val = util.get_target_traj(target.ra_deg as number, target.dec_deg as number, times, date, lngLatEl, offset)
            val = val.map((azAlt: any) => azAlt[1]) as number[]
        }
    }
    return val
}

const init_hovors = (svg: any, tgts: string[], height: number) => {

    //dots appear over line when cursored over
    for (const idx in tgts) {
        svg.append('circle')
            .attr('class', 'marker ' + tgts[idx])
            .attr('cx', 100)
            .attr('cy', 100)
            .attr('r', 5)
            .attr('fill', 'grey')
            .style('opacity', 0)
    }

    //tooltip with legend appears when cursor is on canvas
    const tooltip = d3.select("body")
        .append("h1")
        .attr('class', 'tooltip')
        .style("position", "absolute")
        .style("background-color", "#515151")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("opacity", .75)
        .style("font", "13px sans-serif")
        .style("padding", "10px")
        .style("visibility", "hidden")
        .style('pointer-events', 'none')
        .style('display', 'none')

    //vertical line is drawn offset from cursor
    const ruler = svg.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', height)
        .attr('width', 2)
        .attr('class', 'ruler')
        .style('stroke', 'lightgray')
        .attr('opacity', 0)

    return [tooltip, ruler]
}

const bisectDate = d3.bisector(function (d: any) { return d.time; }).left;

export const skyview = (svg: any, chartType: string, outerHeight: number, outerWidth: number,
    marginLeft: number, marginRight: number,
    marginTop: number, marginBottom: number,
    targets: Target[],
    date: Date,
    lngLatEl: LngLatEl
) => {
    const myData = make_data(targets, chartType, date, lngLatEl)
    if (myData.length <= 0) return
    const startDate = myData[0][0].time
    const endDate = myData[0][myData[0].length - 1].time
    const values = myData.flat().map(d => d.value)
    const yMin: number = d3.min(values) as number
    const yMax: number = d3.max(values) as number

    const height = outerHeight - marginTop - marginBottom
    const width = outerWidth - marginRight - marginLeft

    const suncalc = SunCalc.getTimes(startDate, lngLatEl.lng, lngLatEl.lat)

    const xScale = d3.scaleTime([startDate, endDate],
        [marginLeft, width]
    )


    const yScale = d3.scaleLinear([20, 90],
        [height, marginTop]
    )

    let tdx = 0
    const tgts = myData.map(d => {
        let t = d[0].tgt
        t = t ? t : JSON.stringify(tdx)
        tdx++
        return t
    })

    const colors = d3.scaleOrdinal(
        tgts, d3.schemeCategory10
    )

    const line = d3.line()
        .x((d: any | Data) => xScale(d.time))
        .y((d: any | Data) => yScale(d.value))

    let tgtNames: string[] = []
    for (let idx = 0; idx < myData.length; idx++) {
        let t = myData[idx][0].tgt as string
        t = t ? t : JSON.stringify(idx)
        tgtNames.push(t)
    }


    init_static_lines(svg, xScale, yScale, startDate, width, height, suncalc)

    const [tooltip, ruler] = init_hovors(svg, tgtNames, width)

    const moveRuler = (event: any) => {
        const [xp, yp] = d3.pointer(event, svg.node())
        const xpoint = xScale.invert(xp)
        var d: any
        var keyData: any[] = []
        for (const idx in myData) {
            const i = bisectDate(myData[idx], xpoint, 1)
            const d0 = myData[idx][i - 1]
            const d1 = myData[idx][i]
            if (!d1) continue
            d = xpoint.getTime() - d0.time.getTime() > d1.time.getTime() - xpoint.getTime() ? d1 : d0;
            svg.selectAll('.marker.' + myData[idx][0].tgt)
                .attr('cx', xScale(d.time))
                .attr('cy', yScale(d.value))
                .style('opacity', 1);

            const c = colors(d.tgt)
            const ra = Math.round(d.ra * 1000) / 1000
            const dec = Math.round(d.dec * 1000) / 1000
            const value = Math.round(d.value * 1000) / 1000
            const k: any = { time: d.time, color: c, ra: ra, dec: dec, txt: d.tgt, value: value }
            keyData.push(k)
        }

        if (!d) return

        tooltip
            .style("opacity", .75)
            .style("visibility", "visible")
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px")
            .style('font-size', '20px')
            .style("display", "inline-block")
            .html(`
            <div>
                <h4>${formatDate(d.time)}</h4>
            </div>
            `)
            .selectAll("mylegend")
            .data(keyData)
            .enter() //for each line, list out name and value
            .append('div')
            .style('background-color', (d: any) => d.color)
            .html((d: any) => {
                return d.txt + ': ' + d.value
            })

        ruler
            .attr('x', xScale(d.time))
            .style('opacity', 1);
    }

    const hideRuler = () => {
        d3.selectAll('.ruler')
            .style('opacity', 0);
        d3.selectAll('.marker')
            .style('opacity', 0);
        d3.selectAll('.label')
            .style('opacity', 0);
        tooltip
            .style("opacity", 0)
    }

    svg
        .on("mousemove", moveRuler)
        .on("mouseleave", hideRuler)

    const lineClass = svg.selectAll('path')
        .data(myData)
        .join('path')
        .attr('class', 'chart-lines')
        .attr('d', line.curve(d3.curveBasis))
        .style('stroke', (d: any | Data[]) => colors(d[0].tgt))
        .style('stroke-width', 2)
        .style('fill', 'transparent')

    // add the axes
    // axes go on last
    const xOffset = height
    const xTxtOffset = xOffset + 40
    const yOffset = marginLeft
    const yTxtOffset = yOffset - 60
    const valueTxt = "Alt [deg]"
    add_axes(svg, xScale, yScale, width, height, xOffset, xTxtOffset, yOffset, yTxtOffset, valueTxt)
}