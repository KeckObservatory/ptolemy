from app import app, socketio
from flask_socketio import emit, disconnect 
from flask import session, send_from_directory, request, copy_current_request_context
from threading import Lock
import shelve
from obdm import OBDM
import os
import json
import logging
import pdb

from execution_engine.core.ExecutionEngine import ExecutionEngine 
from execution_engine.core.Queues.BaseQueue import DDOIBaseQueue
from execution_engine.core.Queues.ObservingQueue.ObservingBlockItem import ObservingBlockItem
from execution_engine.core.Queues.SequenceQueue.SequenceItem import SequenceItem
from execution_engine.core.Queues.EventQueue.EventItem import EventItem

myData = shelve.open('./public/session_data')
global thread
thread = None
thread_lock = Lock()
 
with open('./public/ob.json') as f:
    ob = json.load(f)[0]
obdm = OBDM(ob)

myData['obdm'] = obdm
myData['sequence_queue'] = [] 
myData['ob_queue'] = []


def create_logger(fileName='client-xcute.log'):
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    fl = logging.FileHandler(fileName)
    fl.setLevel(logging.INFO)
    fl.setFormatter(formatter)
    logger = logging.getLogger()
    logger.addHandler(ch)
    logger.addHandler(fl)
    logger.setLevel(logging.INFO)
    return logger

logger = create_logger()
cfg="./cfg.ini"
ee = ExecutionEngine(logger=logger, cfg=cfg)
ee.obs_q.set_queue([])

DEFAULT_EVENTS = [
    'BEGIN_SLEW', 'CONFIGURE_FOR_ACQUISITION', 'WAITFOR_SLEW',
    'WAITFOR_ROTATOR', 'START_GUIDING', 'ACQUIRE', 'WAITFOR_ACQUIRE', 'WAITFOR_CONFIGURE_SCIENCE',
    'EXECUTE_OBSERVATION', 'POST_OBSERVATION_CLEANUP'
]
myData['event_queue'] = DEFAULT_EVENTS 

@app.route('/ptolemy')
def index():
    """Returns frontend html-js-css bundle"""
    print(app.static_folder)
    print(os.path.exists(os.path.join(app.static_folder, 'index.html')))
    return send_from_directory(app.static_folder, 'index.html')

@socketio.on('request_ob')
def request_ob():
    """Sends OB stored on EE (first item in queue)"""
    logging.info('sending ob request recieved')
    ob_rows = [ x.OB for x in [*ee.obs_q.queue] ] #TODO write this in OBQueue Class
    logging.info(f'ob_rows len {len(ob_rows)}')
    if len(ob_rows) > 0:
        row = ob_rows[0]
        ob = ee.ODBInterface.get_OB_from_id(row['ob_id']) 
        data = {'ob': ob}
        _id = ob['_id']
        logging.info(f'sending ob {_id}')
        emit('send_submitted_ob', data, room=request.sid)

@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    print(f'sending ob_queue to {request.sid}')
    ob_queue = [ x.OB for x in [*ee.obs_q.queue] ] #TODO write this in OBQueue Class
    print(ob_queue)
    data = { 'ob_queue': ob_queue }
    emit('send_ob_queue', data, room=request.sid)

@socketio.on('set_ob_queue')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    logging.info('new ob queue')
    logging.info(data)
    ob_rows = data.get('ob_queue')

    ee.obs_q.set_queue([ObservingBlockItem(x) for x in ob_rows])
    emit('send_ob_queue', data, broadcast=True)

@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to local storage, and sends it to execution engine and frontend."""
    logging.info('submitting new ob from frontend')
    ob_queue = [ x.OB for x in [*ee.obs_q.queue] ] #TODO write this in OBQueue Class
    submittedId = ob_queue[0].get('ob_id')
    logging.info(f"submitted obid: {submittedId}")
    if not submittedId==data['ob']['_id']:
        logging.warning(f"submitted obid matches? : {submittedId==data['ob']['_id']}")
    emit('send_submitted_ob', data, broadcast=True)

@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    """Sets sequence queue to EE, and sends it to the frontend"""
    seqQueue = data.get('sequence_queue')
    ob = data.get('ob')
    newSequenceQueue = [ SequenceItem(x, ob) for x in seqQueue ]
    ee.seq_q.set_queue(newSequenceQueue)
    print(f'new_sequence_queue {seqQueue}')
    emit('sequence_queue_broadcast', data, broadcast=True)

@socketio.on('new_sequence_boneyard')
def new_sequence_boneyard(data):
    """Sets sequence queue boneyard to local storage, and sends it to execution engine and frontend"""
    seq = data.get('sequence_boneyard')
    print('new sequence boneyard', seq)
    ee.seq_q.boneyard = seq
    emit('sequence_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_event_queue')
def new_event_queue(data):
    """Sets event queue to local storage, and sends it to execution engine and frontend"""
    eq = data.get('event_queue')
    logging.info('new event queue')
    newQueue = []
    eventIds = [ x.split('@')[1] for x in eq ]
    for eid in eventIds:
        evtItem = next((item for item in [*ee.ev_q.queue] if item.id == eid), None)
        newQueue.append(evtItem)
    ee.ev_q.set_queue(newQueue)
    emit('event_queue_broadcast', data, broadcast=True)

@socketio.on('new_event_boneyard')
def new_event_boneyard(data):
    """Sets event queue boneyard to local storage, and sends it to execution engine and frontend"""
    print('new event boneyard')
    eb = data.get('event_boneyard')
    myData['event_boneyard'] = eb
    emit('event_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_task')
def new_task(data):
    """Sets task to local storage, resets events to defaults (tbd: translator module replaces default events)
    resets event boneyard and broadcasts to frontend and execution engine"""
    task = data.get('task')
    seq_queue = [*ee.seq_q.queue]
    newSeq = seq_queue[0]
    logging.info('new task set')
    logging.info(f'new seq {task}')
    ee.ev_q.load_events_from_sequence(newSeq)
    logging.info(f'new seq from queue{newSeq}')
    ev_queue = [ { 'func_name': x.func_name, 'id': x.id } for x in [*ee.ev_q.queue] ] #TODO write this in EventQueue Class
    eventData = {'event_queue': ev_queue}
    eventBoneyardData = {'event_boneyard': []}
    emit('task_broadcast', data, broadcast=True)
    emit('event_queue_broadcast', eventData, broadcast=True)
    emit('event_boneyard_broadcast', eventBoneyardData, broadcast=True)

@socketio.event
def my_ping():
    emit('my_pong')