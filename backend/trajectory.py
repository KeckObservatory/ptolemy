import os
import numpy as np
import astropy as ap
from astropy.coordinates import SkyCoord, EarthLocation, AltAz, get_moon
from astropy.coordinates.angle_utilities import angular_separation
import astropy.units as u
from astropy.time import Time
from astroplan import Observer
from datetime import datetime, timedelta

# constants
DEG_TO_RAD = np.pi/180
hourOffset = -10 # Hawaii is 10 hours behind utc.
keck = EarthLocation.of_site('Keck Observatory')
keckObs = Observer.at_site("Keck Observatory", timezone="US/Hawaii")

#inputs (to be input)
ra, dec = "17:31:16", "+33:27:43"
now = datetime.now() - timedelta(hours=hourOffset)

def get_midnight(now):
    nearestSet = keckObs.sun_set_time(time, which='nearest')
    utcoffset = hourOffset * u.hour  # Hawaii Daylight Time
    todayMidnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    if time < nearestSet: # today's sunrise already occured
        print('using today\'s midnight')
        midnight = Time(todayMidnight) - utcoffset
    else: # today's sunrise has not risen yet
        print('using yesterday\'s midnight')
        yesterdayMidnight = todayMidnight - timedelta(days=1)
        midnight = Time(now.replace()) - utcoffset
    return midnight

def get_times(midnight):
    deltaMidnight = np.linspace(-5, 5, 100)*u.hour
    return midnight+deltaMidnight

def get_target_frame():
    now = datetime.now() - timedelta(hours=hourOffset)
    midnight = get_midnight(now)
    times = get_times(midnight)
    tgtFrame = AltAz(obstime=times, location=keck)
    return tgtFrame

def get_target_traj(ra, dec):
    tgt = SkyCoord(ra=ra, dec=dec, frame='icrs', unit=(u.hourangle, u.deg))
    tgtFrame = get_target_frame()
    tgtTraj = tgt.transform_to(tgtFrame)
    return tgtTraj 

def get_air_mass(ra, dec):
    tgt = SkyCoord(ra=ra, dec=dec, frame='icrs', unit=(u.hourangle, u.deg))
    tgtTraj = get_target_traj(tgt)
    return tgtTraj.secz

def get_parallactic_angle(ra, dec):
    tgt = SkyCoord(ra=ra, dec=dec, frame='icrs', unit=(u.hourangle, u.deg))
    now = datetime.now() - timedelta(hours=hourOffset)
    midnight = get_midnight(now)
    times = get_times(midnight)
    return keckObs.parallactic_angle(times, tgt).deg # in deg

def get_lunar_angle(ra, dec):
    tgt = SkyCoord(ra=ra, dec=dec, frame='icrs', unit=(u.hourangle, u.deg))
    tgtFrame = get_target_frame()
    tgtTraj = tgt.transform_to(tgtFrame)
    now = datetime.now() - timedelta(hours=hourOffset)
    midnight = get_midnight(now)
    times = get_times(midnight)
    moonTraj = get_moon(times, location=keck).transform_to(tgtFrame) # can be costly
    latLngTgtMoon = list(zip(tgtTraj.az, tgtTraj.alt, moonTraj.az, moonTraj.alt))
    latLngTgtMoon = [ [x.radian for x in sublist] for sublist in latLngTgtMoon ]
    angleOfSeparation = [angular_separation(*x) / DEG_TO_RAD for x in latLngTgtMoon] # in deg
    return angleOfSeparation