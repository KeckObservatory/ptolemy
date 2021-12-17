import pdb
from time import sleep
from threading import Thread, Event
import random
import numpy as np
from numpy.random import poisson
import os
import glob
from random_data import *
import string
import datetime
import io
import shutil
import eventlet


seed = 1984739
random.seed(seed)
letters = string.ascii_lowercase
# random generators


def randSign(): return random.choice(['+', '-'])
def randString(x=4): return ''.join(random.choice(letters) for i in range(x))


def randFloat(mag=10): return mag * random.uniform(0, 1)
def randBool(): return bool(random.choice([0, 1, None]))
def randInt(lr=0, ur=100): return random.randint(lr, ur)
def randArrStr(x=1, y=1): return [randString(x)
                                  for _ in range(random.randint(1, y))]


def optionalRandString(x=4): return random.choice([None, randString(x)])
def optionalRandArrString(x, y=1): return random.choice(
    [None, randArrStr(x, y)])


def sampleInst(): return random.choice(list(INST_MAPPING.keys()))
def randPI(): return random.choice(list(pis))
def randObserver(): return random.choice(observers)


def randPIList(x=1): return lambda x=1: list(np.random.choice(
    list(pis), size=random.randint(1, x), replace=False))
def randObserverList(x=1): return list(np.random.choice(
    observers, size=random.randint(1, x), replace=False))


def randComment(): return random.choice(comments)
def optionalRandComment(): return random.choice([None, randComment()])
# randStatus = lambda: random.choice(status)
def rand_kcwi_science(): return random.choice(status)
def z_fill_number(x, zf=2): return str(x).zfill(zf)


raDeg = z_fill_number(randInt(0, 360))
arcMinutes = z_fill_number(randInt(0, 60))
arcSeconds = z_fill_number(randInt(0, 60))


def generate_koaid(inst):
    date = datetime.datetime.now()
    numStr = z_fill_number(randInt(0, 20_000), 5)
    ii = random.choice(list(inst))
    dateStr = date.strftime('%Y%m%d')
    koaid = '.'.join([ii, dateStr, numStr])
    return koaid


def gen_ra_dec():
    ra = z_fill_number(randInt(0, 24)) + ':' \
        + z_fill_number(randInt(0, 60)) + ':' \
        + z_fill_number(randInt(0, 60)) + '.' \
        + str(randInt(0, 9))

    dec = randSign() \
        + z_fill_number(randInt(0, 90)) + ':' \
        + z_fill_number(randInt(0, 60)) + ':' \
        + z_fill_number(randInt(0, 60)) + '.' \
        + str(randInt(0, 9))

    return ra, dec


def generate_row():
    row = {}
    inst = random.choice(list(INST_MAPPING.keys()))
    koaid = generate_koaid(inst)
    row['rowId'] = z_fill_number(randInt(0, 360), 3)
    row['koaid'] = koaid 
    row['instrument'] = inst 
    row['date'] = datetime.date.today().strftime('%Y-%m-%dT%H:%M:%S')
    row['ingestType'] = randInt(0,2)
    row['filename'] = koaid + '.fits'
    row['filehand'] = '/koadata37/DEIMOS/20181203/lev0/' + row['filename']
    return row

def get_random_fits():
    fileNames = glob.glob('./public/*.fits')
    filename = random.choice(fileNames)
    bufferSize = os.path.getsize(filename)
    return filename
    
    

def generate_file_buff(row=None, save=False):
    if not row:
        row = generate_row()
    filename = row['koaid']
    filename += '.fits'
    buff = io.StringIO()
    [buff.write(key + ':' + val + '\n') for key, val in row.items() if val]
    buff.seek(0)
    if save:
        with open(filename, 'w') as fd:
            shutil.copyfileobj(buff, fd)
    return buff, filename


thread = Thread()
threadStopEvent = Event()


class RandomRows(Thread):
    def __init__(self, socketio):
        super(RandomRows, self).__init__()
        self.mean = 6 
        self.socketio = socketio 
        self.rowId = 0
        self.switch = False 
        self.emitFile = False

    def switchOn(self, checked): 
        self.switch = checked 

    def switchOff(self): 
        self.switch = False

    def downloadFiles(self, checked):
        self.emitFile = checked

    def random_row_generator(self):
        """Generate random row on separate thread on a
        poisson distribution. Emit socketio instance
        """
        while self.switch:
            print(f'generating file {self.switch}')
            print(f'sending file? {self.emitFile}')
            row = generate_row()
            row['rowId'] = str(self.rowId)
            self.socketio.emit('new_row', {'metadata': row})
            if self.emitFile:
                # buff, filename = generate_file_buff(row, False)
                filename = get_random_fits()
                with open(filename, 'rb') as f:
                    self.socketio.emit(
                        'new_file', {'filename': os.path.basename(filename),
                                     'file': f.read()})
            pause = poisson(self.mean)
            print(f'pausing for: {pause} seconds')
            eventlet.sleep(pause)
            self.rowId += 1