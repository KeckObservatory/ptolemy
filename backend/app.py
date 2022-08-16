import argparse
from threading import Lock
import pdb
import json
import eventlet
eventlet.monkey_patch()
from flask import Flask, render_template, session, request, \
    copy_current_request_context, send_from_directory
from obdm import OBDM
from flask_socketio import SocketIO, emit, disconnect
from engineio.payload import Payload
from flask_cors import CORS
import shelve

Payload.max_decode_packets = 500
async_mode = "eventlet" 
app = Flask(__name__, static_url_path='', static_url_path='', static_folder='../build')
CORS(app, send_wildcard=True)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode, cors_allowed_origins="*")

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

@app.route('/')
def index():
    return render_template('index.html', async_mode=socketio.async_mode)

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

@socketio.on('submit_ob')
def submit_ob(data):
    print('submitting new ob')
    ob = data.get('ob')
    myData['obdm'] = OBDM(ob) 
    emit('new_ob', data, broadcast=True)

@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    print('new sequence queue')
    seq = data.get('sequence_queue')
    myData['sequence_queue'] = seq
    emit('sequence_queue_broadcast', data, broadcast=True)

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

@socketio.on('disconnect')
def disconnect():
    print('Client disconnected', request.sid)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Setup websocket host")
    parser.add_argument('--host', type=str, required=False, default='0.0.0.0',
                         help="hostname (localhost as default)")
    parser.add_argument('--port', type=int, required=False, default=50007,
                         help="port to listen on")
    parser.add_argument('--debug', type=bool, required=False, default=True,
                         help="debug for development")
    args=parser.parse_args()

    socketio.run(app, debug=args.debug, host=args.host, port=args.port)