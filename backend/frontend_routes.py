from app import app, socketio

from flask_socketio import emit, disconnect 
from flask import session, send_from_directory, request, copy_current_request_context
from threading import Lock
import shelve
from obdm import OBDM
import os
import json

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

@socketio.on('send_ob')
def send_ob():
    """Sends OB stored on disk"""
    obdm = myData['obdm']
    data = {'ob': obdm.ob}
    # print('\nsending ob\n')
    return data
    # emit('return_ob', data, broadcast=True)

@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    data = { 'ob_queue': myData['ob_queue']}
    return data

@socketio.on('set_ob_queue')
def new_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    print('new ob queue')
    print(data)
    myData['ob_queue'] = data.get('ob_queue', [])
    emit('send_ob_queue', data, broadcast=True)

@socketio.on("request_submitted_ob")
def request_submitted_ob():
    """Sends the submitted ob, stored on disk"""
    clientid = request.sid
    data = { 'ob': myData['obdm'].ob}
    return data

@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to local storage, and sends it to execution engine and frontend."""
    print('\rsubmitting new ob\r')
    ob = data.get('ob')
    myData['obdm'] = OBDM(ob) 
    emit('send_submitted_ob', data, broadcast=True)
    emit('ob_to_xcute', data, broadcast=True)

@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    """Sets sequence queue to local storage, and sends it to execution engine and frontend"""
    print('new sequence queue')
    seqQueue = data.get('sequence_queue')
    myData['sequence_queue'] = seqQueue
    emit('sequence_queue_broadcast', data, broadcast=True)
    emit('sequence_queue_to_xcute', data, broadcast=True)

@socketio.on('new_sequence_boneyard')
def new_sequence_boneyard(data):
    """Sets sequence queue boneyard to local storage, and sends it to execution engine and frontend"""
    print('new sequence boneyard')
    seq = data.get('sequence_boneyard')
    myData['sequence_boneyard'] = seq
    emit('sequence_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_event_queue')
def new_event_queue(data):
    """Sets event queue to local storage, and sends it to execution engine and frontend"""
    print('new event queue')
    eq = data.get('event_queue')
    myData['event_queue'] = eq
    emit('event_queue_broadcast', data, broadcast=True)
    emit('event_queue_to_xcute', data, broadcast=True)

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
    myData['task'] = task
    myData['events'] = DEFAULT_EVENTS 
    eventData = {'event_queue': myData['events']}
    eventBoneyardData = {'event_boneyard': []}
    emit('task_broadcast', data, broadcast=True)
    emit('event_queue_broadcast', eventData, broadcast=True)
    emit('event_boneyard_broadcast', eventBoneyardData, broadcast=True)
    emit('task_to_xcute', eventData, broadcast=True)

@socketio.event
def my_ping():
    emit('my_pong')