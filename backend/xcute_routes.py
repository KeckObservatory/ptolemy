from app import app, socketio

from flask_socketio import emit, disconnect
from flask import session, send_from_directory, copy_current_request_context
from threading import Lock
import shelve
from obdm import OBDM
import os
import json

@socketio.on('send_seq_queue_from_xcute')
def send_seq_queue_from_xcute(data):
    '''send sequence queue from xcute to frontend'''
    emit('sequence_queue_broadcast', data, broadcast=True)

@socketio.on('send_seq_queue_from_frontend')
def send_seq_queue_from_frontend(data):
    '''send sequence queue from frontend to xcute'''
    emit('sequence_queue_to_xcute', data, broadcast=True)

@socketio.on('send_evt_queue_from_xcute')
def send_evt_queue_from_xcute(data):
    '''send event queue from xcute to frontend'''
    emit('event_queue_broadcast', data, broadcast=True)

@socketio.on('send_evt_queue_from_frontend')
def send_evt_queue_from_frontend(data):
    '''send event queue from frontend to xcute'''
    emit('event_queue_to_xcute', data, broadcast=True)

@socketio.on('send_ob_from_xcute')
def send_ob_from_xcute(data):
    '''send ob from xcute to frontend'''
    emit('send_ob', data, broadcast=True)

@socketio.on('send_ob_from_frontend')
def send_ob_from_frontend(data):
    '''send ob from frontend to xcute'''
    emit('ob_to_xcute', data, broadcast=True)

@socketio.on('send_task_from_xcute')
def send_task_from_cute(data):
    '''send task from xcute to frontend'''
    emit('send_task', data, broadcast=True)

@socketio.on('send_task_from_frontend')
def send_task_from_frontend(data):
    '''send task from frontend to xcute'''
    emit('task_to_xcute', data, broadcast=True)