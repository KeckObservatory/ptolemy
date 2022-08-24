import * as d3 from 'd3'
import { Scoby, Target } from '../../../typings/papahana'
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

const format_values = (values: number[], times: Date[], sd: Scoby, units: string, chartType: string): Data[] => {
    let data: Data[] = []
    for (let idx = 0; idx < times.length; idx++) {
        const nm = sd.name ? sd.name.replaceAll(/[\W+]+/g, '_') : "unlabled_tgt"
        const d: Data = {
            time: times[idx], value: values[idx], units: units,
            type: chartType,
            tgt: nm,
            ra: sd.ra_deg,
            dec: sd.dec_deg

        }
        data.push(d)
    }
    return data
}

const make_data = (scoby_deg: Scoby[], units: string, chartType: string, date: Date, lngLatEl: LngLatEl ) => {

    const nadir = util.get_nadir(lngLatEl, date)
    const times = util.get_times(nadir, 105)
    let myData: Data[][] = []
    let mergedData: Data[] = []

    scoby_deg.forEach((sd: Scoby) => {
        const values = get_chart_data(sd, times, chartType, lngLatEl)
        const data = format_values(values, times, sd, units, chartType)
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
    bars.forEach((date: Date) => {
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
        hourFormatted = hour % 12 || 12, // hour returned in 24 hour format
        minuteFormatted = minute < 10 ? "0" + minute : minute,
        morning = hour < 12 ? "am" : "pm";

    return month + "/" + day + "/" + year + " " + hourFormatted + ":" +
        minuteFormatted + morning;
}

const get_chart_data = (sd: Scoby, times: Date[], chartType: string, lngLatEl: LngLatEl): number[] => {
    let val;
    const ra = sd.ra_deg as number
    const dec = sd.dec_deg as number
    switch (chartType) {
        case 'altitude': {
            val = util.get_target_traj(ra, dec, times, lngLatEl)
            val = val.map((azAlt: any) => azAlt[1]) as number[]
            break;
        }
        case 'air mass': {
            val = util.get_air_mass(ra, dec, times, lngLatEl)
            break;
        }
        case 'parallactic angle': {
            val = util.get_parallactic_angle(ra, dec, times, lngLatEl)
            break;
        }
        case 'lunar angle': {
            val = util.get_lunar_angle(ra, dec, times, lngLatEl)
            break;
        }
        default: {
            val = util.get_target_traj(ra, dec, times, lngLatEl)
            val = val.map((azAlt: any) => azAlt[1]) as number[]
        }
    }
    return val
}

const init_hovors = (svg: any, tgts: string[], height: number) => {

    //dots appear over line when cursored over
    for (const idx in tgts) {
        svg.append('circle')
            .attr('class', 'marker' + tgts[idx])
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
        .attr('height', height - 315)
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
    scoby_deg: Scoby[],
    date: Date,
    lngLatEl: LngLatEl
) => {
    const height = outerHeight - marginTop - marginBottom
    const width = outerWidth - marginRight - marginLeft

    if (chartType==='altitude') var units = 'degrees'
    else if (chartType==='air mass') var units = ''
    else if (chartType==='parallactic angle') var units = 'degrees'
    else if (chartType==='lunar angle') var units = 'degrees'
    else units = ''

    const myData = make_data(scoby_deg, units, chartType, date, lngLatEl)
    console.log('myData', myData)
    if (myData.length <= 0) return
    const startDate = myData[0][0].time
    const endDate = myData[0][myData[0].length - 1].time

    const suncalc = SunCalc.getTimes(startDate, lngLatEl.lng, lngLatEl.lat)

    const xScale = d3.scaleTime([startDate, endDate],
        [marginLeft, width]
    )

    if (chartType === 'altitude') {
        var yScale = d3.scaleLinear([20, 90],
            [height, marginTop]
        )
        var valueTxt = "Alt [deg]"
        var units = 'degrees'
    }
    else if (chartType === 'air mass') {
        var yScale = d3.scaleLinear([0, 5],
            [height, marginTop]
        )

        var valueTxt = "Air Mass []"
    }
    else if (chartType === 'parallactic angle') {
        var yScale = d3.scaleLinear([-90, 90],
            [height, marginTop]
        )

        var valueTxt = "Parallactic Angle [deg]"
    }
    else if (chartType === 'lunar angle') {
        var yScale = d3.scaleLinear([-90, 90],
            [height, marginTop]
        )

        var valueTxt = "Lunar Angle [deg]"
    }
    else {
        const values = myData[0].map((x: Data) => {
            return x.value
        })
        const min = Math.min(...values)
        const max = Math.max(...values)
        var yScale = d3.scaleLinear([min, max],
            [height, marginTop]
        )
        var valueTxt = "value [?]"
    }



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
        const [xp, _] = d3.pointer(event, svg.node())
        const xpoint = xScale.invert(xp)
        var d: any
        var keyData: any[] = []
        for (const idx in myData) {
            const i = bisectDate(myData[idx], xpoint, 1)
            const d0 = myData[idx][i - 1]
            const d1 = myData[idx][i]
            if (!d1) continue
            d = xpoint.getTime() - d0.time.getTime() > d1.time.getTime() - xpoint.getTime() ? d1 : d0;
            // svg.selectAll('.marker.' + myData[idx][0].tgt)
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

    const lineClass = svg.selectAll('path')
        .data(myData)
        .join('path')
        .attr('class', 'chart-lines')
        .attr('d', line.curve(d3.curveBasis))
        .style('stroke', (d: any | Data[]) => colors(d[0].tgt))
        .style('stroke-width', 2)
        .style('fill', 'transparent')

    svg
        .on("mousemove", moveRuler)
        .on("mouseleave", hideRuler)

    // add the axes
    // axes go on last
    const xOffset = height
    const xTxtOffset = xOffset + 40
    const yOffset = marginLeft
    const yTxtOffset = yOffset - 60
    add_axes(svg, xScale, yScale, width, height, xOffset, xTxtOffset, yOffset, yTxtOffset, valueTxt)
}