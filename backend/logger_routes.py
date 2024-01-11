
import configparser
from app import app 
from flask import request, jsonify
import pdb
from LoggerClient import getlogz_functions as glf 

DATE_FORMAT = '%Y-%m-%d %H:%M:%S.%f'
cfg_name="./cfg.ini"
config_parser = configparser.ConfigParser()
config_parser.read(cfg_name)

@app.route('/api/log/get_logs')
def get_logs():
    print('logs requested')
    print('request.args', request.args)
    url = config_parser["ZMQ_LOGGING_SERVER"]["url"]
    print('querying url:', url)
    params = dict(request.args)

    minutes = params.get('minutes', None)
    n_logs = params.get('n_logs', None)
    if isinstance(minutes, str):
        minutes = float(minutes) 
    if isinstance(n_logs, str):
        n_logs = int(n_logs) 

    logs = glf.get_logz(
        url,
        params.get('subsystem', None),
        params.get('loggername', 'ddoi'),
        minutes,
        params.get('startDate', None),
        params.get('endDate', None),
        n_logs,
        DATE_FORMAT)
    return jsonify(logs) 
