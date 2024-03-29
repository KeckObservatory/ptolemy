from app import app, socketio, config_parser, logger
from flask_socketio import emit
from flask import send_from_directory, request 
import os
import pdb
try:
    import ktl
except ImportError:
    ktl = ''

@app.route('/ptolemy')
def index():
    """Returns frontend html-js-css bundle"""
    print(app.static_folder)
    print(os.path.exists(os.path.join(app.static_folder, 'index.html')))
    return send_from_directory(app.static_folder, 'index.html')

def send_ee_state(msg):
    if msg['status'] == 'OK':
        emit('broadcast_ee_state_from_server',
                msg['data'], room=request.sid)
    else:
        emit('snackbar_msg', msg, room=request.sid)

@socketio.on("request_ee_state")
def request_ee_state():
    """Sends OB stored on EE (first item in queue)"""
    logger.info(f'request_ee_state event triggerd by {request.sid}')

    emit('get_ee_state', callback=send_ee_state, broadcast=True)

@socketio.on("refresh_ee_state")
def refresh_ee_state():
    """Sends OB stored on EE (first item in queue)"""
    logger.info(f'refresh_ee_state event triggerd by {request.sid}')
    # be aware that this is a broadcast, and will trigger all clients to refresh
    emit('ee_refresh_queues', callback=send_ee_state, broadcast=True)



@socketio.on("request_ob_queue")
def request_ob_queue():
    """Sends list of selected OBs stored on disk"""
    logger.info(f'sending ob_queue to {request.sid}')

    def send_ob_queue(msg):
        if msg['status'] == 'OK':
            data = {'ob_id_queue': msg['data']}
            emit('broadcast_ob_queue_from_server', data, room=request.sid)
    emit('get_ob_ids', callback=send_ob_queue, broadcast=True)


@socketio.on('set_ob_queue')
def set_ob_queue(data):
    """Sets list of Selected OBs, stored on disk"""
    def send_ob_queue(msg):
        if 'OK' in msg['status']:
            emit('broadcast_ob_queue_from_server', msg['data'], room=request.sid)
        if 'MAGIC_ERR' in msg['status']:
            emit('snackbar_msg', msg, room=request.sid)

    emit('new_ob_queue', data, callback=send_ob_queue, broadcast=True)


@socketio.on('set_ob_boneyard')
def set_ob_boneyard(data):
    """Sets list of Selected OBs, stored on disk"""
    ob_ids = data.get('ob_id_boneyard')
    logger.info(f'new ob queue boneyard len: {len(ob_ids)}')

    def send_ob_boneyard(msg):
        if msg['status'] == 'OK':
            emit('broadcast_ob_boneyard_from_server',
                 msg['data'], broadcast=True)
    emit('new_ob_boneyard', data,
         callback=send_ob_boneyard, broadcast=True)


@socketio.on('sync_with_magiq')
def sync_with_magiq(data):
    emit('sync_obs_with_magic', data, broadcast=True)


@socketio.on('submit_ob')
def submit_ob(data):
    """Sets submitted OB to local storage, and sends it to execution engine and frontend."""
    logger.info('submitting new ob from frontend')

    def broadcast_submitted_ob(msg):
        if 'OK' in msg['status']:
            ob = msg['data']['ob']
            broadcastData = {'ob': ob}
            emit('broadcast_submitted_ob_from_server', broadcastData, broadcast=True)
            seq = ob.get('observations', [])
            emit('sequence_queue_broadcast', {'sequence_queue': seq}, broadcast=True)
        if 'MAGIQ_ERROR' in msg['status']:
            emit('snackbar_msg', msg, room=request.sid)
        elif msg['status'] == 'RUNTIME_ERROR':
            emit('snackbar_msg', msg, room=request.sid)
    emit('ee_submit_ob', data, callback=broadcast_submitted_ob, broadcast=True)


@socketio.on('new_sequence_queue')
def new_sequence_queue(data):
    """Sets sequence queue to EE, and sends it to the frontend"""
    def broadcast_seq_queue(msg):
        if msg['status'] == 'OK':
            emit('sequence_queue_broadcast', msg['data'], broadcast=True)
    emit('ee_new_seq_queue', data, callback=broadcast_seq_queue, broadcast=True)


@socketio.on('new_sequence_boneyard')
def new_sequence_boneyard(data):
    """Sets sequence queue boneyard to local storage, and sends it to execution engine and frontend"""
    def broadcast_seq_boneyard(msg):
        if msg['status'] == 'OK':
            emit('sequence_boneyard_broadcast', msg['data'], broadcast=True)
    emit('ee_new_seq_boneyard', data,
         callback=broadcast_seq_boneyard, broadcast=True)


@socketio.on('new_event_queue')
def new_event_queue(data):
    """Sets event queue to local storage, and sends it to execution engine and frontend"""
    def broadcast_event_queue(msg):
        if msg['status'] == 'OK':
            emit('event_queue_broadcast', msg['data'], broadcast=True)
        elif msg['status'] == 'EVENT_ERROR':
            emit('snackbar_msg', msg, room=request.sid)
    emit('ee_new_event_queue', data, callback=broadcast_event_queue, broadcast=True)


@socketio.on('new_event_boneyard')
def new_event_boneyard(data):
    """Sets event queue boneyard to local storage, and sends it to execution engine and frontend"""
    def broadcast_event_boneyard(msg):
        if msg['status'] == 'OK':
            emit('event_boneyard_broadcast', msg['data'], broadcast=True)
        elif msg['status'] == 'EVENT_ERROR':
            emit('snackbar_msg', msg, room=request.sid)
    emit('ee_new_event_boneyard', data,
         callback=broadcast_event_boneyard, broadcast=True)


@socketio.on('event_queue_boneyard_swap')
def event_queue_boneyard_swap(data):
    def broadcast_event_boneyard(msg):
        if msg['status'] == 'OK':
            emit('new_event_queue_and_boneyard', msg['data'], broadcast=True)
        else:
            emit('snackbar_msg', msg, room=request.sid)
    emit('ee_event_queue_boneyard_swap', data,
         callback=broadcast_event_boneyard, broadcast=True)


@socketio.on('new_task')
def new_task(data):
    """Sets task to local storage, resets events to defaults (tbd: translator module replaces default events)
    resets event boneyard and broadcasts to frontend and execution engine"""
    def broadcast_new_task(msg):
        if msg['status'] == 'OK':
            sequenceBoneyard = msg['data'].get('sequence_boneyard', False)
            seqQueue = msg['data'].get('sequence_queue', False)
            task = msg['data'].get('selected_task', False)
            isSeq = not msg.get('isAcq', True)
            if isSeq:
                emit('sequence_boneyard_broadcast',
                     {'sequence_boneyard': sequenceBoneyard,
                      'selected_task': task}, broadcast=True)
                emit('sequence_queue_broadcast', 
                     {'sequence_queue': seqQueue,
                      'selected_task': task}, broadcast=True)
            emit('task_broadcast', data, broadcast=True)
            outData = msg['data']['event_queue_and_boneyard']
            emit('new_event_queue_and_boneyard', outData, broadcast=True)
        else:
            emit('snackbar_msg', msg, room=request.sid)
    emit('ee_new_task', data, callback=broadcast_new_task, broadcast=True)


@socketio.on('submit_event')
def submit_event(data):
    def broadcast_submit_event(msg):
        if msg['status'] == 'OK':
            emit('new_event_queue_and_boneyard', msg['data'], broadcast=True)
        else:
            emit('snackbar_msg', msg, room=request.sid)
    emit('ee_submit_event', data, callback=broadcast_submit_event, broadcast=True)


@socketio.on('release_event_queue_lock')
def release_event_queue_lock():
    def broadcast_release_event_queue_lock(msg):
        emit('snackbar_msg', msg, broadcast=True)
        data = {'event_queue_locked': False}
        emit('event_queue_locked', data, broadcast=True)
    emit('ee_release_event_queue_lock', callback=broadcast_release_event_queue_lock, broadcast=True)

@socketio.on('toggle_pause_halt')
def toggle_pause_halt(data):
    keys = data.keys()
    msg = ''
    service = config_parser['KTL']['service']
    if 'pause' in keys: 
        isPaused = data.get('pause')
        ktl.write(service, 'pause', isPaused)
        msg += f'{service}:pause set to {isPaused}\n'
    if 'halt' in keys: 
        isHalted = data.get('halt')
        ktl.write(service, 'halt', isHalted)
        msg += f'{service}:halt set to {isHalted} '
    logger.info(msg)
    emit('snackbar_msg', {'msg': msg}, broadcast=True)
    emit('paused_halted_broadcast', data, broadcast=True)