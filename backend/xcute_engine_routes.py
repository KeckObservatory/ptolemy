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
cfg=""

ee = ExecutionEngine(logger=logger, cfg=cfg)
 
@socketio.on('send_ob')
def send_ob():
    """Sends OB stored on EE"""
    #TODO: Get OB from DB and send to users. Until then use this.
    with open('./public/ob.json') as f:
        ob = json.load(f)[0]
    data = {'ob': ob}
    logging.info('sending ob')
    return data


@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    ob_queue = ee.ob_q.get_queue_as_json()
    data = { 'ob_queue': ob_queue}
    return data

@socketio.on('set_ob_queue')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    logging.info('new ob queue')
    logging.info(data)
    ob_queue = data.get('ob_queue')
    #TODO: is this right? Put many OB items?
    ee.ob_q.put_many(ob_queue)
    emit('send_ob_queue', data, broadcast=True)

@socketio.on("request_submitted_ob")
def request_submitted_ob():
    """Sends the submitted ob, stored by EE"""
    #TODO EE needs to store selected OB id or JSON
    ob_queue = ee.ob_q.get_queue_as_json
    ob = ob_queue[0]
    data = {'ob': ob}
    return data

@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to EE, and sends it to the frontend."""
    logging.info('submitting new ob')
    #TODO EE needs to store the selected OB's id or JSON 
    ob_queue = ee.ob_q.get_queue_as_json
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
    #TODO: store sequence boneyard as a queue
    ee.seq_boneyard_q.set_queue( newSequenceBoneyard )
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
    #TODO: store event boneyard as a queue
    ee.evt_boneyard_q.set_queue( newEventBoneyard )
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
    emit('my_pong')