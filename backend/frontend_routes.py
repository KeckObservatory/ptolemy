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
    ob_ids = ee.obs_q.get_ob_ids() 
    if len(ob_ids) > 0:
        try: 
            # get most recent ob from db
            ob = ee.ODBInterface.get_OB_from_id(ob_ids[0]) 
            data = {'ob': ob}
            _id = ob['_id']
            logging.info(f'sending ob {_id}')
            emit('broadcast_submitted_ob_from_server', data, room=request.sid)
        except RuntimeError as err: 
            data = {'msg': f'{err}'}
            emit('snackbar_msg', data, room=request.sid)
            return

@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    logging.info(f'sending ob_queue to {request.sid}')
    ob_id_queue = ee.obs_q.get_ob_ids() 
    data = { 'ob_id_queue': ob_id_queue }
    emit('broadcast_ob_queue_from_server', data, room=request.sid)

@socketio.on('set_ob_queue')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    ob_ids = data.get('ob_id_queue')
    logging.info(f'new ob queue len: {len(ob_ids)}')

    ee.obs_q.set_queue([ObservingBlockItem(x) for x in ob_ids])
    emit('broadcast_ob_queue_from_server', data, broadcast=True)

@socketio.on('set_ob_boneyard')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    ob_ids = data.get('ob_id_boneyard')
    logging.info(f'new ob queue len: {len(ob_ids)}')
    ee.obs_q.boneyard = ob_ids
    emit('broadcast_ob_boneyard_from_server', data, broadcast=True)

@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to local storage, and sends it to execution engine and frontend."""
    logging.info('submitting new ob from frontend')
    submittedId = ee.obs_q.get().ob_id # gets first ob id and sends it to the boneyard 
    ee.obs_q.submitted_ob_id = submittedId
    logging.info(f"submitted obid: {submittedId}")
    logging.info(f"submitted obid matches? : {submittedId==data['ob_id']}")
    try:
        ob = ee.ODBInterface.get_OB_from_id(submittedId) 
        broadcastData = { 'ob': ob }
        emit('broadcast_submitted_ob_from_server', broadcastData, broadcast=True)
    except RuntimeError as err:
        data = {'msg': str(err)}
        emit('snackbar_msg', data, room=request.sid)
    logging.info("sending new obqueue and boneyard to clients")
    broadcastBoneyard = { 'ob_id_boneyard': [ x.ob_id for x in ee.obs_q.boneyard ] }
    ob_id_queue = ee.obs_q.get_ob_ids() 
    obQueueData = { 'ob_id_queue': ob_id_queue }
    emit('broadcast_ob_queue_from_server', obQueueData, broadcast=True)
    emit('broadcast_ob_boneyard_from_server', broadcastBoneyard, broadcast=True)

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
    seqBoneyard = data.get('sequence_boneyard')
    logging.info(f'new sequence boneyard len {len(seqBoneyard)}')
    ee.seq_q.boneyard = seqBoneyard
    emit('sequence_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_event_queue')
def new_event_queue(data):
    """Sets event queue to local storage, and sends it to execution engine and frontend"""
    eq = data.get('event_queue')
    logging.info('new event queue')
    newQueue = []
    event_ids = [ x.split('@')[1] for x in eq ]
    for eid in event_ids:
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
        ob_id = ee.obs_q.submitted_ob_id() 
        if len(ob_id) == 0:
            logging.warning('ob queue empty')
            data = {'msg': 'ob queue empty'}
            emit('snackbar_msg', data, room=request.sid)
            return
        try: 
            ob = ee.ODBInterface.get_OB_from_id(ob_id) 
        except RuntimeError as err: 
            data = {'msg': f'{err}'}
            emit('snackbar_msg', data, room=request.sid)
            return
            
        acqSeq = ob.get('acquisition', False) 
        newTask = SequenceItem(acqSeq, ob)
        if not acqSeq:
            data = {'msg': 'no acquisition in ob'}
            emit('snackbar_msg', data, room=request.sid)
            return
    else: # is sequence
        seq_queue = [*ee.seq_q.queue]
        if len(seq_queue) == 0:
            logging.warning('sequence queue empty')
            data = {'msg': 'sequence queue empty'}
            emit('snackbar_msg', data, room=request.sid)
            return
        else:
            newTask = ee.seq_q.get()
            seqBoneyardData = { 'sequence_boneyard': [ x.sequence for x in ee.seq_q.boneyard ]}
            seqQueueData = { 'sequence_queue': ee.seq_q.get_sequences() }
            emit('sequence_boneyard_broadcast', seqBoneyardData, broadcast=True)
            emit('sequence_queue_broadcast', seqQueueData, broadcast=True)

    logging.info(f'new task from queue {newTask}')
    ee.ev_q.load_events_from_sequence(newTask)
    ev_queue = ee.ev_q.get_queue_as_list() 
    ee.ev_q.boneyard = []
    eventData = {'event_queue': ev_queue}
    eventBoneyardData = {'event_boneyard': ee.ev_q.boneyard}
    emit('task_broadcast', data, broadcast=True)
    emit('event_queue_broadcast', eventData, broadcast=True)
    emit('event_boneyard_broadcast', eventBoneyardData, broadcast=True)

@socketio.on('submit_event')
def submit_event():
    logging.info('submitting event...')

    if len(ee.ev_q.get_queue_as_list()) == 0: 
        logging.warning('event queue empty')
        data = { 'msg': 'event queue empty'}
        emit('snackbar_msg', data, room=request.sid)
        return
    #aquire lock 
    isBlocked = not ee.ev_q.lock.acquire(block=False)
    if isBlocked:
        logging.warning('queue locked. sending msg to frontend')
        data = { 'msg': 'event queue locked'}
        emit('snackbar_msg', data, room=request.sid)
        return
    else: 
        ee.ev_q.lock.release() # checking a lock blocks it. need to release
        

    ee.ev_q.dispatch_event()
    # broadcast new queue and boneyard
    ev_queue = ee.ev_q.get_queue_as_list() 
    ev_boneyard = [ x.as_dict() for x in ee.ev_q.boneyard ]
    eventData = {'event_queue': ev_queue}
    eventBoneyardData = {'event_boneyard': ev_boneyard} 
    emit('event_queue_broadcast', eventData, broadcast=True)
    emit('event_boneyard_broadcast', eventBoneyardData, broadcast=True)

@socketio.on('release_event_queue_lock')
def release_event_queue_lock():
    #TODO: add logic to handle FE button press
    logging.info('release_event_queue_lock event triggered')
        

@socketio.on('is_event_queue_locked')
def is_event_queue_locked():
    data = { 'event_queue_locked': False }
    emit('event_queue_locked', data, broadcast=True)

@socketio.event
def my_ping():
    emit('my_pong')