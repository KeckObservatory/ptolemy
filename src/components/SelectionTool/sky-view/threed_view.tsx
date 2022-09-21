import React from 'react';
import * as util from './sky_view_util'

import Plot from 'react-plotly.js';
import { Scoby } from '../../../typings/ptolemy';
import { LngLatEl } from './sky_view';

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

const spherical_2_cartesian = (r: number, theta: number, phi: number) => {
  const pidh = Math.PI / 180
  const thetaRad = theta * pidh
  const phiRad = phi * pidh
  const x = r * Math.cos(thetaRad) * Math.sin(phiRad)
  const y = r * Math.sin(thetaRad) * Math.sin(phiRad)
  const z = r * Math.cos(phiRad)
  return [x, y, z]
}

const ThreeDView = (props: Props) => {

  const KECK_LONG = 360 - 155.4747 // Keck Observatory longitude west of Greenwich [deg]
  const KECK_LAT = 19.8260 //[deg]
  const KECK_ELEVATION = 4144.9752 // m
  const today = new Date()
  const keckLngLat: LngLatEl = { lng: KECK_LONG, lat: KECK_LAT, ele: KECK_ELEVATION }

  const [date, setDate] = React.useState(today)
  const [lngLatEl, setLngLatEl] = React.useState(keckLngLat)

  const nadir = util.get_nadir(lngLatEl, date)
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


  let myData: Data[][] = []
  let mergedData: Data[] = []
  let traces: any[] = []
  scoby_deg.forEach((sd: Scoby) => {
    const ra = sd.ra_deg as number
    const dec = sd.dec_deg as number
    const azAlt = util.get_target_traj(ra, dec, times, lngLatEl) as [number, number][]

    let [xx, yy, zz] = [[] as number[], [] as number[], [] as number[]]
    azAlt.forEach((ae: [number, number]) => {
      const [x, y, z] = spherical_2_cartesian(1, ae[0], ae[1])
      xx.push(x)
      yy.push(y)
      zz.push(z)
    })

    const trace = {
      x: xx,
      y: yy,
      z: zz,
      type: 'scatter3d',
      mode: 'lines'
    }
    traces.push(trace)
    // const data = format_az_alt_values(azAlt, times, sd)
    // mergedData = [...mergedData, ...data]
    // myData.push(data)
  })

  const h = .5
  const r = 1
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

  const pTrace = {
    z: z,
    x: x,
    y: y,
    opaciy: 0.5,
    type: 'mesh3d',
  }
  traces.push(pTrace)

  return (
    <Plot
      data={traces}
      layout={{ width: 900, height: 800, title: 'Simple scatter' }}
    />

  );

}

export default ThreeDView