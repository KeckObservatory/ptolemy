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
  airmass: number,
  alt: number,
  tgt: string,
  ra?: number,
  dec?: number,
}

interface Props {
  selObs: Scoby[]
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

const make_disk = () => {

  const h = Math.sin(19 * (Math.PI / 180))
  const r = Math.cos(19 * (Math.PI / 180))
  const n = 360
  let x = [] as number[]
  let y = [] as number[]
  let z = [] as number[]
  for (let i = 0; i < n; i++) {
    x.push(r * Math.cos(Math.PI / 180 * i))
    y.push(r * Math.sin(Math.PI / 180 * i))
    z.push(h)
  }
  let zz = [] as number[][]
  for (let i = 0; i < n; i++) {
    zz.push(z)
  }

  const pTrace: Partial<Plotly.PlotData | any> = {
    z: z,
    x: x,
    y: y,
    opacity: .5,
    color: "rgb(0,0,0)",
    line: {
      width: 10  
    },
    type: 'mesh3d',
    mode: 'lines',
    name: 'telescope bottom limit',
    hoverinfo: "none",
    hovermode: false,
  }
  return pTrace
}

const get_cylinder = (r: number = 1, h: number = Math.sin((Math.PI / 180) * 19)) => {
  let x = [-1., -1., -0.98078525, -0.98078525, -0.98078525,
  -0.98078525, -0.9238795, -0.9238795, -0.9238795, -0.9238795,
  -0.8314696, -0.8314696, -0.8314696, -0.8314696, -0.70710677,
  -0.70710677, -0.70710677, -0.70710677, -0.55557024, -0.55557024,
  -0.55557024, -0.55557024, -0.38268346, -0.38268346, -0.38268346,
  -0.38268346, -0.19509032, -0.19509032, -0.19509032, -0.19509032,
    0., 0., 0., 0., 0.19509032,
    0.19509032, 0.19509032, 0.19509032, 0.38268346, 0.38268346,
    0.38268346, 0.38268346, 0.55557024, 0.55557024, 0.55557024,
    0.55557024, 0.70710677, 0.70710677, 0.70710677, 0.70710677,
    0.8314696, 0.8314696, 0.8314696, 0.8314696, 0.9238795,
    0.9238795, 0.9238795, 0.9238795, 0.98078525, 0.98078525,
    0.98078525, 0.98078525, 1., 1.]
  let y = [0., 0., -0.19509032, -0.19509032, 0.19509032,
    0.19509032, -0.38268346, -0.38268346, 0.38268346, 0.38268346,
    -0.55557024, -0.55557024, 0.55557024, 0.55557024, -0.70710677,
    -0.70710677, 0.70710677, 0.70710677, -0.8314696, -0.8314696,
    0.8314696, 0.8314696, -0.9238795, -0.9238795, 0.9238795,
    0.9238795, -0.98078525, -0.98078525, 0.98078525, 0.98078525,
    -1., -1., 1., 1., -0.98078525,
    -0.98078525, 0.98078525, 0.98078525, -0.9238795, -0.9238795,
    0.9238795, 0.9238795, -0.8314696, -0.8314696, 0.8314696,
    0.8314696, -0.70710677, -0.70710677, 0.70710677, 0.70710677,
    -0.55557024, -0.55557024, 0.55557024, 0.55557024, -0.38268346,
    -0.38268346, 0.38268346, 0.38268346, -0.19509032, -0.19509032,
    0.19509032, 0.19509032, 0., 0.]
  let z = [-1., 1., -1., 1., -1., 1., -1., 1., -1., 1., -1., 1., -1.,
    1., -1., 1., -1., 1., -1., 1., -1., 1., -1., 1., -1., 1.,
  -1., 1., -1., 1., -1., 1., -1., 1., -1., 1., -1., 1., -1.,
    1., -1., 1., -1., 1., -1., 1., -1., 1., -1., 1., -1., 1.,
  -1., 1., -1., 1., -1., 1., -1., 1., -1., 1., -1., 1.]
  const i = [32, 32, 36, 36, 40, 40, 44, 44, 48, 48, 52, 52, 56, 56, 60, 60, 62,
    62, 58, 58, 54, 54, 50, 50, 46, 46, 42, 42, 38, 38, 34, 34, 30, 30,
    26, 26, 22, 22, 18, 18, 14, 14, 10, 10, 6, 6, 2, 2, 0, 0, 4,
    4, 8, 8, 12, 12, 16, 16, 20, 20, 41, 33, 25, 17, 9, 1, 7, 15,
    23, 31, 39, 47, 55, 63, 57, 49, 41, 25, 9, 7, 23, 39, 55, 57, 41,
    9, 23, 55, 41, 23, 24, 24, 28, 28, 28, 36, 44, 52, 60, 58, 50, 42,
    34, 26, 18, 10, 2, 4, 12, 20, 28, 44, 60, 50, 34, 18, 2, 12, 28,
    60, 34, 2, 28, 34]
  const j = [33, 37, 37, 41, 41, 45, 45, 49, 49, 53, 53, 57, 57, 61, 61, 63, 63,
    59, 59, 55, 55, 51, 51, 47, 47, 43, 43, 39, 39, 35, 35, 31, 31, 27,
    27, 23, 23, 19, 19, 15, 15, 11, 11, 7, 7, 3, 3, 1, 1, 5, 5,
    9, 9, 13, 13, 17, 17, 21, 21, 25, 37, 29, 21, 13, 5, 3, 11, 19,
    27, 35, 43, 51, 59, 61, 53, 45, 33, 17, 1, 15, 31, 47, 63, 49, 25,
    7, 39, 57, 9, 55, 25, 29, 29, 33, 32, 40, 48, 56, 62, 54, 46, 38,
    30, 22, 14, 6, 0, 8, 16, 24, 36, 52, 58, 42, 26, 10, 4, 20, 44,
    50, 18, 12, 60, 2]
  const k = [37, 36, 41, 40, 45, 44, 49, 48, 53, 52, 57, 56, 61, 60, 63, 62, 59,
    58, 55, 54, 51, 50, 47, 46, 43, 42, 39, 38, 35, 34, 31, 30, 27, 26,
    23, 22, 19, 18, 15, 14, 11, 10, 7, 6, 3, 2, 1, 0, 5, 4, 9,
    8, 13, 12, 17, 16, 21, 20, 25, 24, 33, 25, 17, 9, 1, 7, 15, 23,
    31, 39, 47, 55, 63, 57, 49, 41, 25, 9, 7, 23, 39, 55, 57, 41, 9,
    23, 55, 41, 23, 41, 29, 28, 33, 32, 36, 44, 52, 60, 58, 50, 42, 34,
    26, 18, 10, 2, 4, 12, 20, 28, 44, 60, 50, 34, 18, 2, 12, 28, 60,
    34, 2, 28, 34, 28]

  z = z.map(v => h * v)
  x = x.map(v => r * v)
  y = y.map(v => r * v)
  return [x, y, z, i, j, k]
}

const make_cylinder_disk = (
  r: number, // outer radius
  ri: number, // inner radius
  h: number, // height
  a: number = 0, // base height
  startAng: number = 0,
  endAng: number = 360,
  nt: number = 100, // n theta
  nh: number = 3, // n theta
  nr: number = 3, // n theta
) => {
  const dTheta = Math.PI / 180 * (endAng - startAng) / nt //radians
  const dHeight = (h - a) / nh
  const dRadius = (r - ri) / nr
  let [x, y, z] = [[] as number[], [] as number[], [] as number[]]
  let [i, j, k] = [[] as number[], [] as number[], [] as number[]]
  // console.log(nt * nh * nr, dTheta, dHeight, dRadius)

  for (let jdx = 0; jdx < nh - 1; jdx++) {
    for (let kdx = 0; kdx < nr - 1; kdx++) {
      for (let idx = 0; idx < nt - 1; idx++) {
        const thIdx = startAng + idx * dTheta
        const heightJdx = a + jdx * dHeight
        const radiusKdx = ri + kdx * dRadius
        x.push(radiusKdx * Math.cos(thIdx))
        y.push(radiusKdx * Math.sin(thIdx))
        z.push(heightJdx)
      }
    }
  }
  // let [x, y, z, i, j, k] = get_cylinder()

  const pTrace: Partial<Plotly.PlotData | any> = {
    z: z,
    x: x,
    y: y,
    opacity: 1,
    color: "rgb(0,0,0)",
    type: 'surface',
    mode: 'lines',
    name: 'telescope bottom limit',
    // hoverinfo: "none",
    // hovermode: false
  }
  console.log('cylinder trace', pTrace)
  return pTrace
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

    let [xx, yy, zz] = [[] as number[], [] as number[], [] as number[]]
    const texts: string[] = []
    azEl.forEach((ae: [number, number], idx: number) => {
      const [x, y, z] = spherical_2_cartesian(1, ae[0], ae[1])
      xx.push(x)
      yy.push(y)
      zz.push(z)
      let txt = ""
      txt += `Az: ${ae[0].toFixed(2)}<br>`
      txt += `El: ${ae[1].toFixed(2)}<br>`
      txt += `Airmass: ${util.air_mass(ae[1]).toFixed(2)}<br>`
      txt += `Date: ${times[idx].toUTCString()}`
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

  // const pTrace = make_disk()
  // const pTrace = make_cylinder_disk(1, 0, .5, 0, 0, 360, 36, 3, 3)
  // traces.push(pTrace)
  traces.push(make_disk())

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
        showticklabels: false,
        zeroline: false
      },
      xaxis: {
        title: "",
        showgrid: false,
        showspikes: false,
        showticklabels: false,
        zeroline: false
      },
      yaxis: {
        title: "",
        showgrid: false,
        showspikes: false,
        showticklabels: false,
        zeroline: false
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
        text: 'East',
        showarrow: false
      }]
    },
  };



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