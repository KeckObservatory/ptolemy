import argparse
from threading import Lock
import eventlet
eventlet.monkey_patch()
from flask import Flask, request
from flask_socketio import SocketIO 
from engineio.payload import Payload
from flask_cors import CORS

Payload.max_decode_packets = 500
async_mode = "eventlet" 
app = Flask(__name__, static_url_path='', static_folder='../build')
CORS(app, send_wildcard=True)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode=async_mode, cors_allowed_origins="*")


# @app.route('/')
# def index():
#     return render_template('index.html', async_mode=socketio.async_mode)


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