from app import app, socketio

from flask_socketio import emit, disconnect
from flask import session, send_from_directory, copy_current_request_context
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
myString = 'default'
queue = ['default1', 'default2']
myData['queue'] = queue
myData['string'] = myString

myData['obdm'] = obdm
myData['sequence_queue'] = [] 

DEFAULT_EVENTS = [
    'BEGIN_SLEW', 'CONFIGURE_FOR_ACQUISITION', 'WAITFOR_SLEW',
    'WAITFOR_ROTATOR', 'START_GUIDING', 'ACQUIRE', 'WAITFOR_ACQUIRE', 'WAITFOR_CONFIGURE_SCIENCE',
    'EXECUTE_OBSERVATION', 'POST_OBSERVATION_CLEANUP'
]
myData['event_queue'] = DEFAULT_EVENTS 

@app.route('/ptolemy')
def index():
    print(app.static_folder)
    print(os.path.exists(os.path.join(app.static_folder, 'index.html')))
    return send_from_directory(app.static_folder, 'index.html')

@socketio.event
def disconnect_request():
    @copy_current_request_context
    def can_disconnect():
        disconnect()
    session['receive_count'] = session.get('receive_count', 0) + 1
    emit('my_response',
         {'data': 'Disconnected!', 'count': session['receive_count']},
         callback=can_disconnect)

@socketio.on('send_ob')
def send_ob():
    obdm = myData['obdm']
    data = {'ob': obdm.ob}
    print('\nsending ob\n')
    return data
    # emit('return_ob', data, broadcast=True)



@socketio.on('increment_ob_version')
def increment_ob_version():
    print('in increment_ob_version')
    obdm = myData['obdm']
    version = (float(obdm.ob['metadata']['version']) * 10 + 1) / 10.0
    obdm.ob['metadata']['version'] = version
    myData['obdm'] = obdm
    data = {'ob': obdm.ob['metadata']}
    print(f'\nemmiting ob version: {version}\n')
    emit('new_ob', data, broadcast=True)

@socketio.on('new_ob_queue')
def new_ob_queue(data):
    print('new sequence queue')
    seq = data.get('sequence_queue')
    myData['sequence_queue'] = seq
    emit('sequence_queue_broadcast', data, broadcast=True)
    emit('sequence_queue_to_xcute', data, broadcast=True)

@socketio.on('submit_ob')
def submit_ob(data):
    print('submitting new ob')
    ob = data.get('ob')
    myData['obdm'] = OBDM(ob) 
    emit('send_submitted_ob', data, broadcast=True)
    emit('ob_to_xcute', data, broadcast=True)

@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    print('new sequence queue')
    seq = data.get('sequence_queue')
    myData['sequence_queue'] = seq
    emit('sequence_queue_broadcast', data, broadcast=True)
    emit('sequence_queue_to_xcute', data, broadcast=True)

@socketio.on('new_sequence_boneyard')
def new_sequence_boneyard(data):
    print('new sequence boneyard')
    seq = data.get('sequence_boneyard')
    myData['sequence_boneyard'] = seq
    emit('sequence_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_event_queue')
def new_event_queue(data):
    print('new event queue')
    eq = data.get('event_queue')
    myData['event_queue'] = eq
    emit('event_queue_broadcast', data, broadcast=True)
    emit('event_queue_to_xcute', data, broadcast=True)

@socketio.on('new_event_boneyard')
def new_event_boneyard(data):
    print('new event boneyard')
    eb = data.get('event_boneyard')
    myData['event_boneyard'] = eb
    emit('event_boneyard_broadcast', data, broadcast=True)

@socketio.on('new_task')
def send_task(data):
    print('new task')
    task = data.get('task')
    myData['task'] = task
    myData['events'] = DEFAULT_EVENTS 
    eventData = {'event_queue': myData['events']}
    eventBoneyardData = {'event_boneyard': []}
    emit('task_broadcast', data, broadcast=True)
    emit('event_queue_broadcast', eventData, broadcast=True)
    emit('event_boneyard_broadcast', eventBoneyardData, broadcast=True)
    emit('task_to_xcute', eventData, broadcast=True)

@socketio.on('string_broadcast')
def string_broadcast(data):
    myString = data.get('string', '')
    myData['string'] = myString
    print(f"\nmyString {myString} recieved. emitting to subscribers\n")
    emit('new_string', data, broadcast=True)

@socketio.on('push_queue')
def push_queue(data):
    queue = myData['queue'] 
    queue.append(data.get('tail', ''))
    myData['queue'] = queue
    print(f"\nqueue {queue} recieved. emitting to subscribers\n")
    emit('new_queue', {'queue': queue}, broadcast=True)

@socketio.on('pop_queue')
def pop_queue():
    queue = myData['queue'] 
    item = queue.pop() if len(queue) > 0 else queue
    myData['queue'] = queue
    print(f"\nitem {item} popped from queue. emitting new queue to subscribers\n")
    emit('new_queue', {'queue': queue}, broadcast=True)

@socketio.event
def my_ping():
    emit('my_pong')

@socketio.event
def connect():

    obdm = myData['obdm'] 
    data = {
            'data': 'Connected',
            'ob': obdm.ob,
            'string': myData['string'],
            'queue': myData['queue'],
            'count': 0
            }
    emit('my_response', data)
    emit('my_response', data)