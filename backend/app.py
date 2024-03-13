import argparse
import logging
from flask import Flask, request
from flask_socketio import SocketIO 
from engineio.payload import Payload
from flask_cors import CORS
import configparser
import os
from LoggerClient import Logger as dl
import json

Payload.max_decode_packets = 500
async_mode = "eventlet" 
app = Flask(__name__, static_url_path='', static_folder='../build')
CORS(app, supports_credentials=True)
socketio = SocketIO(app, async_mode=async_mode, cors_allowed_origins="*")

def create_logger(fileName='/kroot/var/log/ptolemy.log',
                  subsystem="PTOLEMY",
                  author='xxxx',
                  progid='xxxx',
                  semid='xxxx',
                  loggername='ddoi',
                  configLocation=None):
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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
        kwargs = {'subsystem':subsystem, 
                  'author':author, 
                  'progid':progid, 
                  'semid':semid, 
                  'server':os.uname().nodename,
                  'loggername': loggername}
        zmq_log_handler = dl.ZMQHandler(configLocation, local=False, **kwargs)
        logger.addHandler(zmq_log_handler)
    except Exception as err:
        print('zmq log handler failed. not going to add. err: {err}')
    logger.setLevel(logging.INFO)
    return logger

cfg_name = "./cfg.ini"
config_parser = configparser.ConfigParser()
config_parser.read(cfg_name)

logger = create_logger(filename=config_parser['LOGGER']['filename'],
                       subsystem='PTOLEMY')

from frontend_routes import *
from logger_routes import *

@socketio.on('connected')
def connected():
    print('Client connected', request.sid)

@socketio.on('disconnect')
def disconnect():
    print('Client disconnected', request.sid)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Setup websocket host")
    parser.add_argument('--host', type=str, required=False, default='0.0.0.0',
                         help="hostname (localhost as default)")
    parser.add_argument('--port', type=int, required=False, default=50008,
                         help="port to listen on")
    parser.add_argument('--debug', type=bool, required=False, default=True,
                         help="debug for development")
    args=parser.parse_args()

    socketio.run(app, debug=args.debug, host=args.host, port=args.port, use_reloader=False)
