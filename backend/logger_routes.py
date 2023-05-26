
import configparser
from app import app, socketio
import requests 
from flask import send_from_directory, request
import pdb
from DDOILoggerClient import getlogz_functions as glf 

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
    params = dict(request.args)
    logs = glf.get_logz(
        params.get('subsystem', None),
        params.get('minutes', None),
        params.get('startDate', None),
        params.get('endtDate', None),
        params.get('nLogs', None),
        params.get('dateFormat', '%Y-%m-%dT%H-%M-%S'),
                 )
    return logs 
