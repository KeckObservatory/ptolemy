from app import app, socketio
import configparser
from flask_socketio import emit 
from flask import send_from_directory, request
import os
import traceback
import logging
import pdb
from DDOILoggerClient import DDOILogger as dl
import json

from execution_engine.core.ExecutionEngine import ExecutionEngine 
from execution_engine.core.Queues.ObservingQueue.ObservingBlockItem import ObservingBlockItem
from execution_engine.core.Queues.SequenceQueue.SequenceItem import SequenceItem

def create_logger(fileName='/ddoi/log/ptolemy.log', subsystem="PTOLEMY", author='xxxx', progid='xxxx', semid='xxxx', configLoc=None):
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(formatter)
    fl = logging.FileHandler(fileName)
    fl.setLevel(logging.INFO)
    fl.setFormatter(formatter)
    logger = logging.getLogger(subsystem)
    logger.addHandler(ch)
    logger.addHandler(fl)
    try:
        zmq_log_handler = dl.ZMQHandler(subsystem, configLoc, author, progid, semid)
        logger.addHandler(zmq_log_handler)
    except Exception as err:
        print('zmq log handler failed. not going to add')
    logger.setLevel(logging.INFO)
    return logger

exen_logger = create_logger(subsystem='EXECUTION_ENGINE')
cfg_name="./cfg.ini"
state_file_name = "/ddoi/state/ptolemy_state.json"
config_parser = configparser.ConfigParser()
config_parser.read(cfg_name)
ee = ExecutionEngine(logger=exen_logger, cfg=cfg_name)

logger = create_logger(subsystem='PTOLEMY')

def write_to_file(item):
    with open(state_file_name, 'w') as outfile:
        json.dump(item, outfile)

if os.path.exists(state_file_name):
    with open(state_file_name, 'r') as openfile:
        state = json.load(openfile)
        init_ob_queue = state.get('ob_queue', [])
else:
    init_ob_queue = []

ee.obs_q.set_queue([ObservingBlockItem(x) for x in init_ob_queue])

@app.route('/ptolemy')
def index():
    """Returns frontend html-js-css bundle"""
    print(app.static_folder)
    print(os.path.exists(os.path.join(app.static_folder, 'index.html')))
    return send_from_directory(app.static_folder, 'index.html')

@socketio.on('request_ob')
def request_ob():
    """Sends OB stored on EE (first item in queue)"""
    logger.info('sending ob request recieved')
    ob_ids = ee.obs_q.get_ob_ids() 
    if len(ob_ids) > 0:
        try: 
            # get most recent ob from db
            ob = ee.ODBInterface.get_OB_from_id(ob_ids[0]) 
            data = {'ob': ob}
            _id = ob['_id']
            logger.info(f'sending ob {_id}')
            emit('broadcast_submitted_ob_from_server', data, room=request.sid)
        except RuntimeError as err: 
            data = {'msg': f'{err}'}
            emit('snackbar_msg', data, room=request.sid)
            return

@socketio.on("request_ee_state")
def request_ee_state():
    """Sends OB stored on EE (first item in queue)"""
    logger.info(f'request_ee_state event triggerd by {request.sid}')
    submittedId = ee.obs_q.submitted_ob_id
    data = dict() 
    try: 
        # get most recent ob from db
        if len(submittedId) > 0:
            ob = ee.ODBInterface.get_OB_from_id(submittedId) 
            data['ob'] = ob
            _id = ob['_id']
            logger.info(f'sending ob {_id}')
        # get ob queue and ob boneyard
        ob_id_queue = ee.obs_q.get_ob_ids() 
        data['ob_id_queue'] = ob_id_queue 
        data['ob_id_boneyard'] = [ x.ob_id for x in ee.obs_q.boneyard ]
        # get sequence queue and sequence boneyard
        data['sequence_queue'] = ee.seq_q.get_sequences() 
        data['sequence_boneyard'] = [ x.sequence for x in ee.seq_q.boneyard ]
        # get event queue and event boneyard
        evts = ee.ev_q.get_queue_as_list()
        data['event_queue'] = evts 

        evtBoneyard = [x.as_dict() for x in ee.ev_q.boneyard]
        data['event_boneyard'] = evtBoneyard 
        logger.info('sending ee state to frontend')
        emit('broadcast_ee_state_from_server', data, room=request.sid)
    except RuntimeError as err: 
        logger.warning(err)
        data = {'msg': f'{err}'}
        emit('snackbar_msg', data, room=request.sid)
        return

@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    logger.info(f'sending ob_queue to {request.sid}')
    ob_id_queue = ee.obs_q.get_ob_ids() 
    data = { 'ob_id_queue': ob_id_queue }
    emit('broadcast_ob_queue_from_server', data, room=request.sid)

@socketio.on('set_ob_queue')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    ob_ids = data.get('ob_id_queue')
    obs = data.get('obs', False)
    write_to_file({'ob_queue': ob_ids, 'ob_boneyard': ee.obs_q.boneyard})
    
    ee.obs_q.set_queue([ObservingBlockItem(x) for x in ob_ids])
    if obs:
        try:
            ee.magiq_interface.check_if_connected_to_magiq_server()
            ee.magiq_interface.add_target_list_to_magiq(obs)
        except Exception as err:
            msg = f'did not add target to magiq. reason: {err}'
            logger.warning(msg)
            data = { 'msg': msg}
            emit('snackbar_msg', data, room=request.sid)
    logger.info(f'new ob queue len: {len(ob_ids)}')

    emit('broadcast_ob_queue_from_server', data, broadcast=True)

@socketio.on('set_ob_boneyard')
def set_ob_boneyard(data):
    """Sets list of Selected OBs, stored on disk"""
    ob_ids = data.get('ob_id_boneyard')
    logger.info(f'new ob queue boneyard len: {len(ob_ids)}')
    ee.obs_q.boneyard = ob_ids

    ob_id_queue = ee.obs_q.get_ob_ids() 
    write_to_file({'ob_queue': ob_id_queue, 'ob_boneyard': ob_ids})
    emit('broadcast_ob_boneyard_from_server', data, broadcast=True)

@socketio.on('sync_with_magiq')
def sync_with_magiq(data):
    obs = data.get('obs')
    ee.magiq_interface.add_target_list_to_magiq(obs, config_parser)

@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to local storage, and sends it to execution engine and frontend."""
    logger.info('submitting new ob from frontend')
    submittedId = data.get('ob_id')#  item in the queue
    ee.obs_q.submitted_ob_id = submittedId
    logger.info(f"submitted obid: {submittedId}")
    try:
        ob = ee.ODBInterface.get_OB_from_id(submittedId) 
        broadcastData = { 'ob': ob }
        emit('broadcast_submitted_ob_from_server', broadcastData, broadcast=True)
        ee.seq_q.set_queue([])
        ee.ev_q.set_queue([])
    except RuntimeError as err:
        data = {'msg': str(err)}
        emit('snackbar_msg', data, room=request.sid)

    logger.info("sending new obqueue and boneyard to clients")
    ob_id_boneyard = [ submittedId, *[ x for x in ee.obs_q.boneyard ] ]
    ee.obs_q.boneyard = ob_id_boneyard
    broadcastBoneyard = { 'ob_id_boneyard': ob_id_boneyard }
    ob_id_queue = ee.obs_q.get_ob_ids() 
    idx = ob_id_queue.index(submittedId)
    ob_id_queue.remove(submittedId)

    ee.obs_q.set_queue([ObservingBlockItem(x) for x in ob_id_queue])
    obQueueData = { 'ob_id_queue': ob_id_queue }
    logger.info(f"new ob_queue length: {len(ob_id_queue)}, new ob boneyard length {len(ob_id_boneyard)}")
    write_to_file({'ob_queue': ob_id_queue, 'ob_boneyard': ob_id_boneyard })
    emit('broadcast_ob_queue_from_server', obQueueData, broadcast=True)
    emit('broadcast_ob_boneyard_from_server', broadcastBoneyard, broadcast=True)

    try:
        ee.magiq_interface.select_target_in_magiq(ob.get('target'), idx)
    except Exception as err:
        msg = f'did not highlight target in magiq. reason: {err}'
        logger.warning(msg)
        data = { 'msg': msg}
        emit('snackbar_msg', data, room=request.sid)

@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    """Sets sequence queue to EE, and sends it to the frontend"""
    seqQueue = data.get('sequence_queue')
    ob = data.get('ob')
    newSequenceQueue = [ SequenceItem(x, ob) for x in seqQueue ]
    ee.seq_q.set_queue(newSequenceQueue)
    logger.info(f'new_sequence_queue len: {len(seqQueue)}')
    emit('sequence_queue_broadcast', data, broadcast=True)

@socketio.on('new_sequence_boneyard')
def new_sequence_boneyard(data):
    """Sets sequence queue boneyard to local storage, and sends it to execution engine and frontend"""
    seqBoneyard = data.get('sequence_boneyard')
    ob = data.get('ob')
    logger.info(f'new sequence boneyard len {len(seqBoneyard)}')
    ee.seq_q.boneyard = [ SequenceItem(x, ob) for x in seqBoneyard ]
    emit('sequence_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_event_queue')
def new_event_queue(data):
    """Sets event queue to local storage, and sends it to execution engine and frontend"""
    eq = data.get('event_queue')
    logger.info(f'new event queue len: {len(eq)}')
    newQueue = []
    oldQueue = [*ee.ev_q.queue]
    for eventStr in eq: #sorting in queue
        evt = get_event(oldQueue, eventStr)
        if evt: newQueue.append(evt)

    ee.ev_q.set_queue(newQueue)
    ev_queue = ee.ev_q.get_queue_as_list() 
    eventData = {'event_queue': ev_queue}
    emit('event_queue_broadcast', eventData, broadcast=True)

@socketio.on('new_event_boneyard')
def new_event_boneyard(data):
    """Sets event queue boneyard to local storage, and sends it to execution engine and frontend"""
    print('new event boneyard')
    eb = data.get('event_boneyard')
    logger.info(f'new event boneyard len{len(eb)}')
    newBoneyard = []
    oldBoneyard = [*ee.ev_q.boneyard]
    for eventDict in eb: # sorting in boneyard
        evt = get_event(oldBoneyard, eventDict )
        if evt: newBoneyard.append(evt) 

    ee.ev_q.boneyard = newBoneyard
    boneyardDict = [x.as_dict() for x in newBoneyard]
    eventBoneyardData = {'event_boneyard': boneyardDict}
    emit('event_boneyard_broadcast', eventBoneyardData, broadcast=True)

def get_event(arr, eventDict):
    eid = eventDict['id']
    evtItem = next((item for item in [*arr] if item.id == eid), None)
    if not evtItem:
        msg = f'CANNOT FIND {eventDict["script_name"]}'
        data = {'msg': msg}
        emit('snackbar_msg', data, room=request.sid)
        logger.error(msg)
    return evtItem 

def build_list(arr, eventDicts):
    outArr = []
    for eventDict in eventDicts:
        evt = get_event(arr, eventDict)
        if evt: outArr.append(evt)
    return outArr

def make_event_out_data():
    ev_queue = ee.ev_q.get_queue_as_list() 
    boneyardDict = [x.as_dict() for x in ee.ev_q.boneyard]
    outData = { 'event_queue': ev_queue, 'event_boneyard': boneyardDict}
    return outData

@socketio.on('event_queue_boneyard_swap')
def event_queue_boneyard_swap(data):
    evtPool = [*ee.ev_q.boneyard, *list(ee.ev_q.queue)]
    eventStrs = data.get('event_queue')
    boneyardStrs = data.get('event_boneyard')
    #event queue creation
    newQueue = build_list(evtPool, eventStrs)
    ee.ev_q.set_queue(newQueue)
    #boneyard cereation
    newBoneyard = build_list(evtPool, boneyardStrs)
    ee.ev_q.boneyard = newBoneyard
    outData = make_event_out_data()

    emit('new_event_queue_and_boneyard', outData, broadcast=True)

def get_fresh_sequence(ob, seqItem):
    sequence_number = seqItem.sequence['metadata']['sequence_number']
    newSequence = next(seq for seq in ob['observations'] if seq['metadata']["sequence_number"] == sequence_number)
    newSeqItem = seqItem
    newSeqItem.sequence = newSequence
    newSeqItem.OB = ob
    return  sequence_number, newSeqItem

def get_fresh_ob():
    # Get a fresh OB for the new task
    ob_id = ee.obs_q.submitted_ob_id 
    if len(ob_id) == 0:
        logger.warning('ob queue empty')
        raise Exception('ob queue is empty')
    ob = ee.ODBInterface.get_OB_from_id(ob_id)
    return ob

def get_fresh_event(event):
    # Get fresh ob and use that data
    try:
        ob = get_fresh_ob()
    except Exception as err:
        logger.warning('new_task error: {err}')
        data = {'msg': f'{err}'}
        emit('snackbar_msg', data, room=request.sid)
        return

    if 'acquisition' in event['event_type']: # args is ob
        args = ob
    if 'sequence' in event['event_type']: # args is {'sequence': sequence, 'ob': ob}
        sequence_number = event['args']['sequence']['metadata']['sequence_number']
        newSequence = next(seq for seq in ob['observations'] if seq['metadata']["sequence_number"] == sequence_number)
        args = {'sequence': newSequence, 'OB': ob}

    event['args'] = args
    return event

    

@socketio.on('new_task')
def new_task(data):
    """Sets task to local storage, resets events to defaults (tbd: translator module replaces default events)
    resets event boneyard and broadcasts to frontend and execution engine"""
    task = data.get('task')
    logger.info(f'new task getting set to {task}')
    isAcquisition = data.get('isAcq', False)

    try:
        ob = get_fresh_ob()
    except Exception as err:
        logger.warning(f'new_task error: {err}')
        data = {'msg': f'{err}'}
        emit('snackbar_msg', data, room=request.sid)
        return

    if isAcquisition:
        logger.info('acquisition getting set')
        acqSeq = ob.get('acquisition', False) 
        target = ob.get('target', False)
        if not acqSeq or not target:
            data = {'msg': 'no acquisition or target in ob'}
            emit('snackbar_msg', data, room=request.sid)
            return
        logger.info(f"new acquistion task from queue {acqSeq['metadata']['script']}")
        ee.ev_q.load_events_from_acquisition_and_target(ob)
    else: # is sequence
        seq_queue = [*ee.seq_q.queue]
        if len(seq_queue) == 0:
            logger.warning('sequence queue empty')
            data = {'msg': 'sequence queue empty'}
            emit('snackbar_msg', data, room=request.sid)
            return
        else:
            seqItem = ee.seq_q.get()
            sequence_number, newSeqItem = get_fresh_sequence(ob, seqItem)
            ob['status']['surrent_seq'] = sequence_number
            #TODO: update OB status with current sequence_number
            ee.ODBInterface.update_OB(ob)


            seqBoneyardData = { 'sequence_boneyard': [ x.sequence for x in ee.seq_q.boneyard ]}
            seqQueueData = { 'sequence_queue': ee.seq_q.get_sequences() }
            emit('sequence_boneyard_broadcast', seqBoneyardData, broadcast=True)
            emit('sequence_queue_broadcast', seqQueueData, broadcast=True)
            logger.info(f'new sequence from queue {newSeqItem.sequence}')
            ee.ev_q.load_events_from_sequence(newSeqItem)
    ee.ev_q.boneyard = []
    outData = make_event_out_data()

    emit('task_broadcast', data, broadcast=True)
    emit('new_event_queue_and_boneyard', outData, broadcast=True)

@socketio.on('submit_event')
def submit_event(data):

    eventDict = data.get('submitted_event')
    eventDict = get_fresh_event(eventDict) # Retrieve most recent OB data

    logger.info(f'submitting event {eventDict["script_name"]}')

    if len(ee.ev_q.get_queue_as_list()) == 0: 
        logger.warning('event queue empty')
        data = { 'msg': 'event queue empty'}
        emit('snackbar_msg', data, room=request.sid)
        return
    #aquire lock 
    isBlocked = ee.ev_q.block_event.is_set()
    if isBlocked:
        logger.warning('queue locked. sending msg to frontend')
        data = { 'msg': 'event queue locked'}
        emit('snackbar_msg', data, room=request.sid)
        return
    try:    
        ee.ev_q.dispatch_event(eventDict)
    except Exception as err:
        logger.info(f'dispatch event failed, reason: {err}')
        logger.info(f'{traceback.format_exc()}')
        data = { 'msg': 'dispatch_event failed' }
    # broadcast new queue and boneyard
    outData = make_event_out_data()
    emit('new_event_queue_and_boneyard', outData, broadcast=True)

@socketio.on('release_event_queue_lock')
def release_event_queue_lock():
    logger.info('release_event_queue_lock event triggered')
    ee.ev_q.block_event.clear()
    ee.server_connection.send({"message": "release_event_queue_lock"})
        

@socketio.on('is_event_queue_locked')
def is_event_queue_locked():
    data = { 'event_queue_locked': False }
    emit('event_queue_locked', data, broadcast=True)

@socketio.event
def my_ping():
    emit('my_pong')
