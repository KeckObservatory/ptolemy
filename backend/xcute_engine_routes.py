from app import socketio
from flask_socketio import emit 
import json
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

logging.info('init ee engine')
ee = ExecutionEngine(logger=logger, cfg=cfg)
logging.info('ee engine initialized')
 
@socketio.on('send_ob')
def send_ob():
    """Sends OB stored on EE (first item in queue)"""

    logging.info('sending ob request recieved')
    ob_queue = ee.ob_q.get_queue_as_json()
    if len(ob_queue) > 0:
        ob=ob_queue[0]
    else:
        ob = dict() 
    data = {'ob': ob}
    logging.info('sending ob')

    logging.info('sending ob', ob)
    emit('sent_ob', data)
    # return data


@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    ob_queue = ee.ob_q.get_queue_as_json()
    data = { 'ob_queue': ob_queue }
    return data

@socketio.on('set_ob_queue')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    logging.info('new ob queue')
    logging.info(data)
    ob_queue = data.get('ob_queue')
    ee.ob_q.set_queue(ob_queue)
    emit('send_ob_queue', data, broadcast=True)

@socketio.on("request_submitted_ob")
def request_submitted_ob():
    """Sends the submitted ob, stored by EE"""
    ob_queue = ee.ob_q.get_queue_as_json()
    ob = ob_queue[0]
    data = {'ob': ob}
    return data

@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to EE, and sends it to the frontend."""
    logging.info('submitting new ob')
    ob_queue = ee.ob_q.get_queue_as_json()
    ob = ob_queue[0]
    ee.sel_ob = ob
    data = {'ob': ob}
    emit('send_submitted_ob', data, broadcast=True)

@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    """Sets sequence queue to EE, and sends it to the frontend"""
    seqQueue = data.get('sequence_queue')
    logging.info(f'new sequence queue: {seqQueue}')
    newSequenceQueue = [ SequenceItem.from_sequence(x) for x in seqQueue ]
    ee.seq_q.set_queue(newSequenceQueue)
    emit('sequence_queue_broadcast', data, broadcast=True)

@socketio.on('new_sequence_boneyard')
def new_sequence_boneyard(data):
    """Sets sequence queue in execution engine and sends it to frontend"""
    seqBoneyard = data.get('sequence_boneyard')
    logging.info(f'new sequence boneyard: {seqBoneyard}')
    newSequenceBoneyard = [ SequenceItem.from_sequence(x) for x in seqBoneyard ]
    ee.seq_q.boneyard = newSequenceBoneyard
    emit('sequence_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_event_queue')
def new_event_queue(data):
    """Sets event queue to EE, and sends it to frontend"""
    eventQueue = data.get('event_queue')
    logging.info(f'new event queue: {eventQueue}')
    newEventQueue = [ EventItem.from_event(x) for x in eventQueue ]
    ee.event_q.set_queue(newEventQueue)
    emit('event_queue_broadcast', data, broadcast=True)

@socketio.on('new_event_boneyard')
def new_event_boneyard(data):
    """Sets event boneyard in execution engine and sends it to frontend"""
    eventBoneyard = data.get('event_boneyard')
    logging.info(f'new sequence boneyard: {eventBoneyard}')
    newEventBoneyard = [ EventItem.from_event(x) for x in eventBoneyard ]
    ee.evt_q.boneyard = newEventBoneyard
    emit('event_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_task')
def new_task(data):
    """Sets task (sequence/acquisition) and appends to event array"""
    task = data.get('task')
    #TODO: EE stores the task (selected sequence/acquistition)
    ee.set_task(task)
    #TODO confirm that load_events_from_sequence does not remove existing events from queue
    events = ee.evt_queue.load_events_from_sequence(task)
    eventData = { 'event_queue': events }
    emit('task_broadcast', data, broadcast=True)
    emit('event_queue_broadcast', eventData, broadcast=True)

@socketio.event
def my_ping():
    logging.info('ping!Pong!')
    emit('my_pong')