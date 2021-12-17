#!/usr/bin/python
# -*- coding: latin-1 -*-
import yaml

import numpy as np
import os
import pymongo
import random
import string
from itertools import product
import pprint
import pdb
from functools import wraps
import urllib
from getpass import getpass
seed = 1984739
random.seed(seed)
import datetime
from papahana_flask_server_demo.config import config_collection

INST_MAPPING = { 
                 'DEIMOS': {'DE', 'DF'},
                 'ESI': {'EI'},
                 'HIRES': {'HI'},
                 'KCWI': {'KB', 'KF'}, 
                 'LRIS': {'LB', 'LR'},
                 'MOSFIRE': {'MF'},
                 'OSIRIS': {'OI', 'OS'},
                 'NIRES': {'NR', 'NI', 'NS'},
                 'NIRC2': {'N2', 'NC'},
                }



pis = {
"Michael Bluth": 5555,
"Lindsay Bluth-F�nke": 7766,
"Gob Bluth": 8877,
"George Michael Bluth": 8899,
"Maeby F�nke": 7799,
"Buster Bluth": 8765,
"Tobias F�nke": 9998,
"George Bluth Sr.": 1144,
"Lucille Bluth": 7644,
}

observers = [
"Narrator",
"Oscar Bluth",
"Lucille Austero",
"Barry Zuckerkorn",
"Kitty Sanchez",
"Steve Holt",
"Lupe",
"Annyong Bluth",
"Carl Weathers",
"Maggie Lizer",
"Stefan Gentles",
"Marta Estrella",
"Cindi Lightballoon",
"John Beard",
"Ann Veal",
"Wayne Jarvis",
"Dr. Fishman",
"Stan Sitwell",
"Sally Sitwell",
"Mort Meyers",
"Starla",
"Tony Wonder",
"Gene Parmesan",
"Terry Veal",
"Rita Leeds",
"Larry Middleman",
"Bob Loblaw",
"Ron Howard",
"DeBrie Bardeaux",
"Rebel Alley",
"Herbert Love",
"Marky Bark",
"Argyle Austero",
"Paul 'P-Hound' Huan",
"Mark Cherry",
"Murphy Brown F�nke",
"Lottie Dottie Da",
"Dusty Radler"
]

comments = [
"Here?s some money. Go see a star war.",
"I don?t understand the question and I won?t respond to it.",
"I am one of the few honest people I have ever known.",
"I?m a scholar. I enjoy scholarly pursuits.",
"I?ve made a huge tiny mistake.",
"I hear the jury?s still out on science.",
]

wrap_str = ['north', 'south']

status = [
    "undefined", 
    "completed", 
    "broken",
    "invalid",
    "progressing",
    "inqueue",
]

spectral_types = ['V', 'R', 'I', 'J', 'H', 'K']


kcwi_science = ['KCWI_ifu_sci_dither', 'KCWI_ifu_sci_stare']

containers = ['Army', 'The Alliance of Magicians', 'Tantamount Studios', 'Orange County Prison', 'Milford School', 'Dr. F�nke\'s 100% Natural Good-Time Family-Band Solution']
NOBS = 100 # number of observation blocks
randContainerName = lambda: random.choice(containers)
randOBIds = lambda x=5: [int(x) for x in list(np.random.choice( range(0,NOBS+1), size=random.randint(0, x), replace=False))]


semesters = [str(x)+y for x, y in product(range(2019,2022), ['A', 'B'])]
letters = string.ascii_lowercase

# random generators 
randString = lambda x=4: ''.join(random.choice(letters) for i in range(x))
randFloat = lambda mag=10: mag * random.uniform(0,1)
randBool = lambda: bool(random.choice([0,1, None]))
randInt = lambda lr=0, ur=100: random.randint(lr, ur)
randArrStr = lambda x=1, y=1: [randString(x) for _ in range(random.randint(1, y)) ]
optionalRandString = lambda x=4: random.choice([None, randString(x)])
optionalRandArrString = lambda x, y=1: random.choice([None, randArrStr(x, y)])
sampleInst = lambda: random.choice(list(INST_MAPPING.keys()))
randPI = lambda: random.choice(list(pis))
randObserver = lambda: random.choice(observers)
randSemester = lambda: random.choice(semesters)
randPIList = lambda x=1: lambda x=1: list(np.random.choice(list(pis), size=random.randint(1, x), replace=False))
randObserverList = lambda x=1: list(np.random.choice(observers, size=random.randint(1, x), replace=False))
randComment = lambda: random.choice(comments)
optionalRandComment = lambda: random.choice([None, randComment()])
randSemesterList = lambda x=3: list(np.random.choice(semesters, size=random.randint(0, x), replace=False))
# randStatus = lambda: random.choice(status)
rand_kcwi_science = lambda: random.choice(status)
z_fill_number = lambda x, zf=2: str(x).zfill(2)
raDeg = z_fill_number(randInt(0, 360))
arcMinutes = z_fill_number(randInt(0, 60))
arcSeconds = z_fill_number(randInt(0, 60))

decDeg = z_fill_number(randInt(0, 90))
elevation = random.choice(['+', '-'])

def randStatus():
    rstat = random.choice(status)
    executions = []
    for x in range(0, randInt(0,6)):
        executions.append(generate_random_executions())

    schema = {'state': rstat, 'executions': executions}
    return schema

def generate_container(_id=None):

    ob_set = set()
    n_ob = random.randint(0, 9)
    for indx in range(0, n_ob):
        ob_val = random.randint(0, len(ob_blocks)-1)
        ob_set.update({ob_blocks[ob_val]})

    schema = {
        "semester": randSemester(),
        "name": randContainerName(),
        "observation_blocks": list(ob_set),
        "comment": randComment()
    }

    return schema


def random_dates():
    start_date = datetime.date(2018, 1, 1)
    end_date = datetime.date(2021, 2, 1)

    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_number_of_days = random.randrange(days_between_dates)
    random_date = start_date + datetime.timedelta(days=random_number_of_days)

    return random_date


def generate_ra():
    raDeg = z_fill_number(randInt(0, 360))
    arcMinutes = z_fill_number(randInt(0, 60))
    arcSeconds = z_fill_number(randInt(0, 60))
    ra = " ".join([raDeg, arcMinutes, arcSeconds])
    return ra

def generate_dec():
    arcMinutes = z_fill_number(randInt(0, 60))
    arcSeconds = z_fill_number(randInt(0, 60))
    decDeg = z_fill_number(randInt(0, 90))
    elevation = random.choice(['+', '-'])
    dec = elevation+" ".join([decDeg, arcMinutes, arcSeconds])
    return dec

def remove_none_values_in_dict(method):
    '''None values in dict returned by method are removed
    '''
    @wraps(method)
    def remove_none(*args, **kw):
        result = method(*args, **kw)
        return {key: val for key, val in result.items() if val is not None}
    return remove_none

def generate_semester(sem, nLen, maxLen=6):
    return {'_id': sem,
            'semester': sem,
            'obs_id': randObserverList(maxLen), 
            'comment': optionalRandComment()
           }

def generate_semesters(nSem, nLen=5, maxLen=6):
    return [ generate_semester(sem, nLen, maxLen) for sem in semesters[0:nSem] ]

def generate_mag(nLen=2):
    return {'band': spectral_types[random.randint(0, len(spectral_types)-1)],
            'mag': randFloat(nLen)}

def generate_mags(maxMags=2):
    return [ generate_mag() for _ in range( random.randint( 1, maxMags ) ) ]

@remove_none_values_in_dict
def generate_observation(nLen, maxArr):
    '''not used atm'''
    schema = {
        'instrument': sampleInst(),
        'exposure_sequences': randArrStr(nLen, maxArr),
        'associations': randArrStr(nLen, maxArr),
        'comment': optionalRandComment()
    }
    return schema

@remove_none_values_in_dict
def generate_signature(maxArr):
    pi_name = randPI()
    schema = {
        'name': 'standard stars #' + str(random.randint(0, 9)),
        'pi_id': pis[pi_name],
        'sem_id': str(randSemester()) + '_K000' + str(random.randint(0, 9)),
        'instrument': 'KCWI',
        'comment': optionalRandComment()
    }
    return schema

@remove_none_values_in_dict
def generate_program(container_list):
    observers = []
    for i in range(0, random.randint(0, 9)):
        pi_name = randPI()
        observers.append(pis[pi_name])

    pi_name = str(randPI())
    while pi_name in observers:
        observers.remove(pi_name)

    ob_set = set()
    n_ob = random.randint(0, 9)
    for indx in range(0, n_ob):
        ob_val = random.randint(0, len(container_list)-1)
        ob_set.update({container_list[ob_val]})

    schema = {
        'name': 'Program #' + str(random.randint(0, 99)),
        'sem_id': str(randSemester()) + '_K000' + str(random.randint(0, 9)),
        'container_list': list(ob_set),
        'comment': optionalRandComment()
    }
    return schema

def generate_dither():
    dmin, dmax = [random.randint(-15, 15), random.randint(-15, 15)].sort()
    schema = {
        'min': dmin,
        'max': dmax,
        'letter': random.choice(string.ascii_lowercase).upper(),
        'guide': 'Guided'
    }
    return schema

@remove_none_values_in_dict
def generate_kcwi_science(nLen, maxArr):
    name = rand_kcwi_science()
    cam = random.choice([ "BL","BM","BH1","BH2", "RL","RM","RH1","RH2"])
    camIsBlue = cam[0] is 'B'
    cwave = random.randint(3500, 6500) if camIsBlue else random.randint(6500, 10000)
    schema = {
        "name": name,
        "version": "0.1",
        "det1_exptime": random.randint(0,3600),
        "det1_nexp": random.randint(0,99),
        "det2_exptime": random.randint(0,3600),
        "det2_nexp": random.randint(0,99),
        "cfg_cam_grating": random.choice([ "BL","BM","BH1","BH2", "RL","RM","RH1","RH2" ]),
        "cfg_cam_cwave": random.randint(6500,10000),
        "cfg_slicer": random.choice(["Small", "Medium", "Large"])
    }
    if 'dither' in name:
        schema["seq_ditarray"] = generate_dither()
        schema["seq_ndither"] = random.randint(0,99)
    return schema


def generate_kcwi_acquisiton(nLen, maxArr):
    schema = {
        "name": "KCWI_ifu_acq_direct",
        "version": "0.1",
        "script": "KCWI_ifu_acq_direct",
        "guider_po": random.choice( ["REF","IFU"] ),
        "guider_gs_ra": random.uniform(0, 24) % 1000,
        "guider_gs_dec": random.uniform(-90, 90) % 1000,
        "guider_gs_mode": random.choice(["Automatic", "Operator", "User"])
    }
    return schema

def generate_science(nLen, maxArr, inst='KCWI'):
    if inst=='KCWI':
        schema = generate_kcwi_science(nLen, maxArr)
    else:
        schema = generate_kcwi_science(nLen, maxArr) # fill this in later
    return schema

def generate_acquisition(nLen, maxArr, inst='KCWI'):
    if inst=='KCWI':
        schema = generate_kcwi_acquisiton(nLen, maxArr)
    else:
        schema = {
            'instrument_setup': randString(),
            'acquisition_method': randString(),
            'guider_selection': optionalRandString(),
            'ao_modes': optionalRandArrString(nLen, maxArr),
            'offset_stars': optionalRandArrString(nLen, maxArr),
            'slitmasks': optionalRandArrString(nLen, maxArr),
            'position_angles': optionalRandArrString(nLen, maxArr),
            'comment': optionalRandComment()
        }
    return schema


def generate_random_executions():
    rdate = random_dates()
    random_time = datetime.datetime.now().replace(hour=random.randint(0, 23),
                                                  minute=random.randint(0, 59))

    random_date = f'{(rdate)} {random_time.strftime("%H:%M:%S")}'

    return random_date


@remove_none_values_in_dict
def generate_target():
    schema = {
        'name': randString(), 
        'ra': generate_ra(), 
        'dec': generate_dec(), 
        'equinox': randFloat(), 
        'frame': randString(), 
        'ra_offset': randFloat(), 
        'dec_offset': randFloat(),
        'pa': randInt(),
        'pm_ra': randFloat(), 
        'pm_dec': randFloat(), 
        'epoch': randFloat(), 
        'obstime': randFloat(), 
        'mag': generate_mags(), 
        'wrap': wrap_str[random.randint(0, 1)],
        'd_ra': randFloat(), 
        'd_dec': randFloat(), 
        'comment': optionalRandComment()
    }
    return schema

@remove_none_values_in_dict
def generate_observation_block(nLen, maxArr, inst='KCWI', _id=None):
    schema = {
        'signature': generate_signature(maxArr),
        'version': "0.1",
        'target': random.choice( [ None, generate_target() ] ),
        'acquisition': random.choice( [ None, generate_acquisition( nLen, maxArr, inst ) ] ),
        'science': random.choice( [None, generate_science( nLen, maxArr, inst ) ] ),
        'associations': randArrStr( nLen, maxArr ),
        'priority': randFloat(100),
        'status': randStatus(),
        'comment': optionalRandComment()
    }
    if _id:
        schema['_id'] = _id
    return schema

def read_mode(config='config.live.yaml'):
    with open(config) as file:
        mode_dict = yaml.load(file, Loader=yaml.FullLoader)['mode']

    mode = mode_dict['config']

    return mode


def read_config(mode, config='config.live.yaml'):
    with open(config) as file:
        config = yaml.load(file, Loader=yaml.FullLoader)[mode]

    return config

if __name__=='__main__':
    seed = 1984739
    random.seed(seed)
    dbName = 'ptolemy'
    mode = 'dev'
    
    # Create ob_blocks collection
    collName = 'ob_blocks'
    remote = True # run on remote server (n)
    mode = read_mode()
    config = read_config(mode)
    coll = config_collection('obCollect', mode=mode, conf=config)
    coll.drop()
    coll.create_index([('signature.pi_id', pymongo.DESCENDING)])
    coll.create_index([('signature.sem_id', pymongo.DESCENDING)])
    nLen = 5
    maxArr = 5
    inst = 'KCWI'
    ob_blocks = []
    print("...generating OBs")
    for idx in range(NOBS):
        doc = generate_observation_block(nLen, maxArr, inst)
        result = coll.insert_one(doc)
        ob_blocks.append(str(result.inserted_id))
        # assert result.inserted_id == str(idx), 'check that idx was sed properly'
    # Create containers collection
    collName = 'containers'
    remote = True # run on remote server (n)
    # coll = create_collection(dbName, collName, port=27017, mode=mode)
    coll = config_collection('containerCollect', mode=mode, conf=config)
    coll.drop()
    print("...generating containers")
    nContainers = 20
    container_list = []
    for idx in range(nContainers):
        doc = generate_container(ob_blocks)
        result = coll.insert_one(doc)

        container_list.append(str(result.inserted_id))
        # assert result.inserted_id == str(idx), 'check that idx was sed properly'

    # create Program collection
    coll = config_collection('prgCollect', mode=mode, conf=config)
    coll.drop()
    n_prgs = 50
    print("...generating programs")
    for idx in range(n_prgs):
        doc = generate_program(container_list)
        result = coll.insert_one(doc)
