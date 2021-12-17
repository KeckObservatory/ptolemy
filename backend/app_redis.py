import argparse
from threading import Lock
import pdb
import json
import eventlet
eventlet.monkey_patch()
from flask import Flask, render_template, session, request, \
    copy_current_request_context 
from obdm import OBDM
from flask_socketio import SocketIO, emit, disconnect
from engineio.payload import Payload
import os
from flask_cors import CORS
import shelve
import redis
import pickle

Payload.max_decode_packets = 500
async_mode = "eventlet" 
app = Flask(__name__, static_url_path='', static_folder='../build')
CORS(app, send_wildcard=True)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode, cors_allowed_origins="*")

myData = redis.Redis()

thread = None
thread_lock = Lock()
myDict = {'a': 0, 'b': 0, 'c': 0} 
 
with open('./public/ob.json') as f:
    ob = json.load(f)[0]
obdm = OBDM(ob)
myString = 'default'
queue = ['default1', 'default2']
md = {'string': myString, 'queue': pickle.dumps(queue), 'dict': pickle.dumps(myDict), 'obdm': pickle.dumps(obdm)}
myData.mset(md)

@app.route('/')
def index():
    return render_template('index.html', async_mode=socketio.async_mode)

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
    obdm = pickle.loads(myData.get('obdm'))
    data = {'ob': obdm.ob}
    print('\nsending ob\n')
    emit('return_ob', data, broadcast=True)

@socketio.on('increment_ob_version')
def increment_ob_version():
    print('in increment_ob_version')
    obdm = pickle.loads(myData.get('obdm'))
    version = (float(obdm.ob['metadata']['version']) * 10 + 1) / 10.0
    obdm.ob['metadata']['version'] = version
    myData.set('obdm', pickle.dumps(obdm))
    data = {'ob': obdm.ob}
    print(f'\nemmiting ob version: {version}\n')
    emit('new_ob', data, broadcast=True)

@socketio.on('ob_broadcast')
def dict_broadcast(data):
    ob =  data.get('ob')
    myData.set('obdm', pickle.dumps(OBDM(ob)))
    print(f"\nobdm {pickle.loads(myData.get('obdm'))} recieved. emitting ob to subscribers\n")
    emit('new_ob', data, broadcast=True)

@socketio.on('send_dict')
def send_dict():
    myDict = pickle.loads(myData.get('dict'))
    data = {'dict': myDict}
    print('\nsending dict\n')
    emit('return_dict', data, broadcast=True)

@socketio.on('dict_broadcast')
def dict_broadcast(data):
    myData.set('dict', pickle.dumps(data.get('dict', {})))
    print(f"\nmyDict {pickle.loads(myData.get('dict'))} recieved. emitting to subscribers\n")
    emit('new_dict', data, broadcast=True)

@socketio.on('string_broadcast')
def string_broadcast(data):
    myString = data.get('string', '')
    myData.set('string', myString )
    print(f"\nmyString {myString} recieved. emitting to subscribers\n")
    emit('new_string', data, broadcast=True)

@socketio.on('push_queue')
def push_queue(data):
    queue = pickle.loads(myData.get('queue'))
    queue.append(data.get('tail', ''))
    myData.set('queue', pickle.dumps(queue))
    print(f"\nqueue {queue} recieved. emitting to subscribers\n")
    emit('new_queue', {'queue': queue}, broadcast=True)

@socketio.on('pop_queue')
def pop_queue():
    queue = pickle.loads(myData.get('queue'))
    item = queue.pop() if len(queue) > 0 else queue
    myData.set('queue', pickle.dumps(queue))
    print(f"\nitem {item} popped from queue. emitting new queue to subscribers\n")
    emit('new_queue', {'queue': queue}, broadcast=True)

@socketio.event
def my_ping():
    emit('my_pong')

@socketio.event
def connect():
    obdm = pickle.loads(myData.get('obdm'))
    dict = pickle.loads(myData.get('dict'))
    queue = pickle.loads(myData.get('queue'))
    data = {
            'data': 'Connected',
            'ob': obdm.ob,
            'dict': dict,
            'string': myData.get('string'),
            'queue': queue,
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
    parser.add_argument('--port', type=int, required=False, default=5000,
                         help="port to listen on")
    parser.add_argument('--debug', type=bool, required=False, default=True,
                         help="debug for development")
    args=parser.parse_args()

    socketio.run(app, debug=args.debug, host=args.host, port=args.port)