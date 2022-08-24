import * as SunCalc from 'suncalc'
import { LngLatEl } from './sky_view'

export const KECK_LONG = 360 - 155.4747 // Keck Observatory longitude west of Greenwich [deg]
const KECK_LAT = 19.8260 //[deg]
const KECK_ELEVATION = 4.1449752 // km
const RADIUS_EARTH = 6378.1000 // km
const ATMOSPHERE_HEIGHT = 50.000 // km


export const date_to_juld = (date: Date) => {
    return (date.getTime() / 86400000) + 2440587.5 //do not offset
}

export const get_gmt = (date?: Date) => {
    if (!date) date = new Date()
    const JD = date_to_juld(date)
    const T = (JD - 2451545) / 36525;
    let ThetaGMST = 67310.54841 + (876600 * 3600 + 8640184.812866) * T 
    + .093104 * (T**2) - ( 6.2 * 10**-6 ) * ( T**3 )
    ThetaGMST = ( ThetaGMST % ( 86400 * ( ThetaGMST / Math.abs(ThetaGMST) ) ) / 240) % 360

    return ThetaGMST 
}

export const ra_dec_to_deg = (time: string, dec = false) => {
    let [hours, min, sec] = time.split(':')
    let deg
    if (dec) {
        let sign = 1
        if (hours[0] === '+') hours = hours.substring(1);
        if (hours[0] === '-') {
            hours = hours.substring(1);
            sign = -1;
        }
        deg = sign * parseInt(hours, 10) // dec is already in degrees
            + parseInt(min, 10) / 60
            + parseInt(sec, 10) / 60 ** 2
    }

    else {
        deg = 15 * parseInt(hours, 10) // convert hours to deg
            + 15 * parseInt(min, 10) / 60
            + 15 * parseInt(sec, 10) / 60 ** 2
    }
    return deg
}

const cosd = (deg: number): number => {
    return Math.cos(Math.PI / 180 * deg)
}

const sind = (deg: number): number => {
    return Math.sin(Math.PI / 180 * deg)
}

const tand = (deg: number): number => {
    return Math.tan(Math.PI / 180 * deg)
}

export const ra_dec_to_az_alt = (ra: number, dec: number, date: Date, lngLatEl: LngLatEl): [number, number] => {
    /* Taken from Jean Meeus's Astronomical Algorithms textbook. Using equations
    13.3 & 13.4*/
    const hourAngle = (get_gmt(date) + lngLatEl.lng - ra) % 360
    const tanAzNum = sind(hourAngle)
    const tanAzDen = cosd(hourAngle) * sind(lngLatEl.lat) - tand(dec) * cosd(lngLatEl.lat)
    const az = Math.atan2(tanAzNum, tanAzDen) //radians
    const sinEl = sind(lngLatEl.lat) * sind(dec) + cosd(lngLatEl.lat) * cosd(dec) * cosd(hourAngle)
    const el = Math.asin(sinEl) // radians
    return [(180 / Math.PI * az), (180 / Math.PI * el)]
}

const linspace = (start: number, end: number, nLen: number, endpoint = true) => {
    const step = (end - start) / nLen;
    return Array.from({ length: nLen }, (_, idx) => start + step * idx)
}

const addHours = (date: Date, hours: number): Date => {
    const newDate = new Date(date.getTime())
    newDate.setTime(date.getTime() + hours * 3600000)
    return newDate
}

export const get_nadir = (lngLatEl: LngLatEl, date?: Date) => {
    if (!date) {
        date = new Date()
    }
    let times = SunCalc.getTimes(date, lngLatEl.lat, lngLatEl.lng)
    if (date < times.sunrise) { // sun has not risen yet. use yesterday.
        date.setDate(date.getDate() - 1)
        times = SunCalc.getTimes(date, lngLatEl.lat, lngLatEl.lng)
    }
    return times.nadir
}

export const get_times = (nadir: Date, nPoints: number = 20) => {
    const deltaNadir = linspace(-6, 6, nPoints)
    let times: Date[] = []
    deltaNadir.forEach((hour: number) => {
        times.push(addHours(nadir, hour))
    })
    return times
}


export const get_target_traj = (ra: number, dec: number, times: Date[], lngLatEl: LngLatEl): [number, number][] => {
    let traj: [number, number][] = []
    times.forEach((d: Date) => {
        traj.push(ra_dec_to_az_alt(ra, dec, d, lngLatEl))
    })
    return traj
}

const air_mass = (alt: number) => { // Homogeneous spherical atmosphsere with elevated observer
    const y = KECK_ELEVATION / ATMOSPHERE_HEIGHT
    const z = RADIUS_EARTH / ATMOSPHERE_HEIGHT
    const a2 = ATMOSPHERE_HEIGHT * ATMOSPHERE_HEIGHT
    const r = RADIUS_EARTH + KECK_ELEVATION
    const g = ATMOSPHERE_HEIGHT - KECK_ELEVATION
    const zenith = 90 - alt
    const firstTerm = (r * r) * cosd(zenith) * cosd(zenith) / ( a2 )
    const secondTerm = 2 * RADIUS_EARTH * (g) / a2
    const thirdTerm = y * y
    const forthTerm = (y + z) * cosd(zenith)
    const X = Math.sqrt(firstTerm + secondTerm - thirdTerm + 1) - forthTerm
    return X
}

export const get_air_mass = (ra: number, dec: number, times: Date[], lngLatEl: LngLatEl) => {
    const azAlt = get_target_traj(ra, dec, times, lngLatEl)
    // const airmass = azAlt.map((a: [number, number]) => { 
    //     const zenith = 90 - a[1]
    //     return 1/cosd(zenith) 
    // })
    const airmass = azAlt.map((a: [number, number]) => { return air_mass(a[1]) })
    return airmass
}

export const parallatic_angle = (ra: number, dec: number, date: Date, lngLatEl: LngLatEl) => {
    const hourAngle = (get_gmt(date) + lngLatEl.lng - ra) % 360
    const numerator = sind(hourAngle)
    const denominator: number = tand(lngLatEl.lat)
        * cosd(dec)
        - sind(dec) * cosd(hourAngle)
    return Math.atan2(numerator, denominator) * 180 / Math.PI 
}

export const get_parallactic_angle = (ra: number, dec: number, times: Date[], lngLatEl: LngLatEl): number[] => {
    let ang: number[] = []
    times.forEach((date: Date) => {
        ang.push(parallatic_angle(ra, dec, date, lngLatEl))
    })
    return ang
}

const angular_separation = (lon1: number, lat1: number, lon2: number, lat2: number): number => {
    const sdlon = sind(lon2 - lon1)
    const cdlon = cosd(lon2 - lon1)
    const slat1 = sind(lat1)
    const slat2 = sind(lat2)
    const clat1 = cosd(lat1)
    const clat2 = cosd(lat2)

    const numerator1 = clat2 * sdlon
    const numerator2 = clat1 * slat2 - slat1 * clat2 * cdlon
    const denominator = slat1 * slat2 + clat1 * clat2 * cdlon
    const numerator = Math.sqrt(numerator1 * numerator1 + numerator2 * numerator2)
    return Math.atan(numerator / denominator) * 180 / Math.PI
}

export const get_lunar_angle = (ra: number, dec: number, times: Date[], lngLatEl: LngLatEl): number[] => {
    let ang: number[] = []
    times.forEach((date: Date) => {
        const sc = SunCalc.getMoonPosition(date, lngLatEl.lat, lngLatEl.lng)
        const moonPos = [sc.altitude, sc.azimuth] as [number, number]
        const tgtPos = ra_dec_to_az_alt(ra, dec, date, lngLatEl)
        const angle = angular_separation(tgtPos[1], tgtPos[0], moonPos[1], moonPos[0])
        ang.push(angle)
    })
    return ang
}