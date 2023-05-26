
import configparser
from app import app, socketio
import requests 
from flask import send_from_directory, request
import pdb

cfg_name="./cfg.ini"
config_parser = configparser.ConfigParser()
config_parser.read(cfg_name)

@app.route('/api/log/get_logs')
def get_logs():
    print('logs requested')
    print('request.args', request.args)
    url = config_parser["URLS"]["logger_url"]
    url += '/api/log/get_logs'
    print('querying url:', url)
    resp = requests.get(url, params=dict(request.args))
    logs = resp.json()
    return 200, logs 
