from app import app, socketio
from flask_socketio import emit 
from flask import send_from_directory, request
import os
import logging
import pdb

from execution_engine.core.ExecutionEngine import ExecutionEngine 
from execution_engine.core.Queues.BaseQueue import DDOIBaseQueue
from execution_engine.core.Queues.ObservingQueue.ObservingBlockItem import ObservingBlockItem
from execution_engine.core.Queues.SequenceQueue.SequenceItem import SequenceItem
from execution_engine.core.Queues.EventQueue.EventItem import EventItem

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
    obs = [ x.ob_info for x in [*ee.obs_q.queue] ] #TODO write this in OBQueue Class
    if len(obs) > 0:
        try: 
            # get most recent ob from db
            ob = ee.ODBInterface.get_OB_from_id(obs[0]['_id']) 
        except RuntimeError as err: 
            data = {'msg': f'{err}'}
            emit('snackbar_msg', data, room=request.sid)
            return
        data = {'ob': ob}
        _id = ob['_id']
        logging.info(f'sending ob {_id}')
        emit('broadcast_submitted_ob_from_server', data, room=request.sid)

@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    logging.info(f'sending ob_queue to {request.sid}')
    ob_queue = [ x.ob_info for x in [*ee.obs_q.queue] ] #TODO write this in OBQueue Class
    data = { 'ob_queue': ob_queue }
    emit('broadcast_ob_queue_from_server', data, room=request.sid)

@socketio.on('set_ob_queue')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    obs = data.get('ob_queue')
    logging.info(f'new ob queue len: {len(obs)}')

    ee.obs_q.set_queue([ObservingBlockItem(x) for x in obs])
    emit('broadcast_ob_queue_from_server', data, broadcast=True)

@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to local storage, and sends it to execution engine and frontend."""
    logging.info('submitting new ob from frontend')
    ob_queue = [ x.ob_info for x in [*ee.obs_q.queue] ] #TODO write this in OBQueue Class
    submittedId = ob_queue[0].get('_id')
    logging.info(f"submitted obid: {submittedId}")
    logging.info(f"submitted obid matches? : {submittedId==data['ob']['_id']}")
    emit('broadcast_submitted_ob_from_server', data, broadcast=True)

@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    """Sets sequence queue to EE, and sends it to the frontend"""
    seqQueue = data.get('sequence_queue')
    ob = data.get('ob')
    newSequenceQueue = [ SequenceItem(x, ob) for x in seqQueue ]
    ee.seq_q.set_queue(newSequenceQueue)
    logging.info(f'new_sequence_queue len: {len(seqQueue)}')
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
    emit('event_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_task')
def new_task(data):
    """Sets task to local storage, resets events to defaults (tbd: translator module replaces default events)
    resets event boneyard and broadcasts to frontend and execution engine"""
    task = data.get('task')
    logging.info(f'new task getting set to {task}')
    isAcquisition = data.get('isAcq', False)
    if isAcquisition:
        logging.info('acquisition getting set')
        obs = [ x.ob_info for x in [*ee.obs_q.queue] ] #TODO write this in OBQueue Class
        if len(obs) == 0:
            logging.warning('ob queue empty')
            data = {'msg': 'ob queue empty'}
            emit('snackbar_msg', data, room=request.sid)
            return
        try: 
            ob = ee.ODBInterface.get_OB_from_id(obs[0]['_id']) 
        except RuntimeError as err: 
            data = {'msg': f'{err}'}
            emit('snackbar_msg', data, room=request.sid)
            return
            
        newTask = ob.get('acquisition', False) 
        if not newTask:
            data = {'msg': 'no acquisition in ob'}
            emit('snackbar_msg', data, room=request.sid)
            return
    else:
        seq_queue = [*ee.seq_q.queue]
        if len(seq_queue) == 0:
            logging.warning('sequence queue empty')
            data = {'msg': 'sequence queue empty'}
            emit('snackbar_msg', data, room=request.sid)
            return
        else:
            newTask = seq_queue[0]
    logging.info(f'new task from queue {newTask}')
    ee.ev_q.load_events_from_sequence(newTask)
    ev_queue = [ x.as_dict() for x in [*ee.ev_q.queue] ] #TODO write this in EventQueue Class
    eventData = {'event_queue': ev_queue}
    eventBoneyardData = {'event_boneyard': []}
    emit('task_broadcast', data, broadcast=True)
    emit('event_queue_broadcast', eventData, broadcast=True)
    emit('event_boneyard_broadcast', eventBoneyardData, broadcast=True)

@socketio.on('submit_event')
def submit_event():
    logging.info('submitting event...to be implemented')

    if ee.ev_q.queue.empty():
        logging.warning('event queue empty')
        data = { 'msg': 'event queue empty'}
        emit('snackbar_msg', data, room=request.sid)
        return
    #TODO: check if event_queue_locked
    #queueLocked = ee.is_queue_locked()
    queueLocked = True 
    # do ee stuff 
    if not queueLocked:
        pass
    else:
        logging.info('queue locked. sending msg to frontend')
        data = { 'msg': 'event queue locked'}
        emit('snackbar_msg', data, room=request.sid)
        

@socketio.on('is_event_queue_locked')
def is_event_queue_locked():
    data = { 'event_queue_locked': False }
    emit('event_queue_locked', data, broadcast=True)

@socketio.event
def my_ping():
    emit('my_pong')