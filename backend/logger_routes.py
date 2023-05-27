
import configparser
from app import app 
from flask import request
import pdb
from DDOILoggerClient import getlogz_functions as glf 

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
    nLogs = params.get('nLogs', None)
    if isinstance(minutes, str):
        minutes = float(minutes) 
    if isinstance(nLogs, str):
        nLogs = int(nLogs) 

    logs = glf.get_logz(
        url,
        params.get('subsystem', None),
        minutes,
        params.get('startDate', None),
        params.get('endDate', None),
        nLogs,
        DATE_FORMAT)
    return logs 
