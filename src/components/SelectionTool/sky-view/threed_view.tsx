import React from 'react';
import * as util from './sky_view_util'
import Plot from 'react-plotly.js';
import { Scoby } from '../../../typings/ptolemy';
import { LngLatEl } from './sky_view';
import NightPicker from './night_picker'
import dayjs, { Dayjs } from 'dayjs';

interface Data {
  time: Date,
  az: number,
  alt: number,
  tgt: string,
  ra?: number,
  dec?: number,
}

interface Props {
  selObs: Scoby[]
}


const format_az_alt_values = (azAlt: [number, number][], times: Date[], sd: Scoby): Data[] => {
  let data: Data[] = []
  for (let idx = 0; idx < times.length; idx++) {
    const nm = sd.name ? sd.name.replaceAll(/[\W+]+/g, '_') : "unlabled_tgt"
    const d: Data = {
      time: times[idx],
      az: azAlt[idx][0],
      alt: azAlt[idx][1],
      tgt: nm,
      ra: sd.ra_deg,
      dec: sd.dec_deg
    }
    data.push(d)
  }
  return data
}

const spherical_2_cartesian = (r: number, az: number, el: number) => {
  const pidh = Math.PI / 180
  const thetaRad = (az + 90) * pidh
  const inclinationRad = (90 - el) * pidh
  const x = r * Math.cos(thetaRad) * Math.sin(inclinationRad)
  const y = r * Math.sin(thetaRad) * Math.sin(inclinationRad)
  const z = r * Math.cos(inclinationRad)
  return [x, y, z]
}

const ThreeDView = (props: Props) => {

  const KECK_LONG = 360 - 155.4747 // Keck Observatory longitude west of Greenwich [deg]
  const KECK_LAT = 19.8260 //[deg]
  const KECK_ELEVATION = 4144.9752 // m
  const keckLngLat: LngLatEl = { lng: KECK_LONG, lat: KECK_LAT, ele: KECK_ELEVATION }

  const [date, setDate] = React.useState(dayjs)
  const [lngLatEl, setLngLatEl] = React.useState(keckLngLat)

  const nadir = util.get_nadir(lngLatEl, date.toDate())
  const times = util.get_times(nadir, 105)

  let scoby_deg: Scoby[] = []
  props.selObs.forEach((s: Scoby) => {
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
    const azEl = util.get_target_traj(ra, dec, times, lngLatEl) as [number, number][]
    console.log('axEl', azEl)

    let [xx, yy, zz, az, el] = [[] as number[], [] as number[], [] as number[], [] as number[], [] as number[]]
    const texts: string[] = []
    azEl.forEach((ae: [number, number], idx: number) => {
      const [x, y, z] = spherical_2_cartesian(1, ae[0], ae[1])
      xx.push(x)
      yy.push(y)
      zz.push(z)
      let txt = ""
      txt += `az: ${ae[0]}<br>`
      txt += `el: ${ae[1]}<br>`
      txt += `date: ${times[idx].toUTCString()}`
      texts.push(txt)
    })

    const trace = {
      x: xx,
      y: yy,
      z: zz,
      text: texts,
      hovorinfo: 'text',
      hovertemplate: '<b>%{text}</b>', //disable to show xyz coords
      line: {
        width: 10
      },
      textposition: 'top left',
      type: 'scatter3d',
      mode: 'lines',
      namelength: -1,
      name: sd.name
    }
    traces.push(trace)
    // const data = format_az_alt_values(azAlt, times, sd)
    // mergedData = [...mergedData, ...data]
    // myData.push(data)
  })

  const h = .5
  const r = Math.cos(Math.PI / 6)
  const n = 360
  let x = [] as number[]
  let y = [] as number[]
  let z = [] as number[]
  for (let i = 0; i < n; i++) {
    x.push(r * Math.cos(Math.PI / 180 * i))
    y.push(r * Math.sin(Math.PI / 180 * i))
    z.push(h)
  }
  console.log(x, y)

  let zz = [] as number[][]
  for (let i = 0; i < n; i++) {
    zz.push(z)
  }

  const pTrace: Partial<Plotly.PlotData | any> = {
    z: z,
    x: x,
    y: y,
    opacity: 0.5,
    color: "rgb(0,0,0)",
    type: 'mesh3d',
    name: 'telescope bottom limit',
    hoverinfo: "none",
    hovermode: false
  }
  traces.push(pTrace)

  const layout: Partial<Plotly.Layout> = {
    width: 900,
    height: 800,
    title: 'Target Trajectories',
    xaxis: {
      range: [-1, 1],
      ticks: "",
      nticks: 0,
      showticklabels: false
    },
    yaxis: {
      range: [-1, 1],
      ticks: "",
      showticklabels: false
    },
    margin: {
      l: 24,
      r: 24,
      b: 24,
      t: 50,
      pad: 4
    },
    scene: {
      zaxis: {
        title: "",
        range: [0, 1],
        showgrid: false,
        showspikes: false,
        showticklabels: false
      },
      xaxis: {
        title: "",
        showgrid: false,
        showspikes: false,
        showticklabels: false
      },
      yaxis: {
        title: "",
        showgrid: false,
        showspikes: false,
        showticklabels: false
      },
      camera: {
        eye: {
          x: 0,
          y: 0.0,
          z: 1.5
        }
      },
      annotations: [{
        xref: 'paper',
        yref: 'paper',
        x: 0,
        xanchor: 'right',
        y: 1,
        yanchor: 'bottom',
        text: 'North',
        showarrow: false
      }, {
        xref: 'paper',
        yref: 'paper',
        x: 1,
        xanchor: 'left',
        y: 0,
        yanchor: 'top',
        text: 'West',
        showarrow: false
      }]
    }
  }

  const handleDateChange = (date: Dayjs | null) => {
    if (date) setDate(date)
  }

  return (
    <React.Fragment>
      <NightPicker date={date} handleDateChange={handleDateChange} />
      <Plot
        data={traces}
        layout={layout}
      />
    </React.Fragment>
  );

}

export default ThreeDView