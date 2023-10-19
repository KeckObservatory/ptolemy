import socketio
import os
import json
import argparse
from execution_engine.core.ExecutionEngine import ExecutionEngine 
from frontend_routes import create_logger
import configparser

sio = socketio.Client(logger=True, engineio_logger=True)

@sio.event
def get_ee_state():
    logger.info(f'get_ee_state event triggerd. sending state back to server')
    submittedId = ee.obs_q.submitted_ob_id
    data = dict() 
    try: 
        # get most recent ob from db
        if len(submittedId) > 0:
            ob = ee.ODBInterface.get_OB_from_id(submittedId) 
            data['ob'] = ob
            _id = ob['_id']
            logger.info(f'sending ob {_id}')
        # get ob queue and ob boneyard
        data['ob_id_queue'] = ee.obs_q.obIds 
        data['ob_id_boneyard'] = [ x.ob_id for x in ee.obs_q.boneyard ]
        # get sequence queue and sequence boneyard
        data['sequence_queue'] = ee.seq_q.sequences 
        data['sequence_boneyard'] = [ x.sequence for x in ee.seq_q.boneyard ]
        # get event queue and event boneyard
        evts = ee.ev_q.get_queue_as_list()
        data['event_queue'] = evts 

        evtBoneyard = [x.as_dict() for x in ee.ev_q.boneyard]
        data['event_boneyard'] = evtBoneyard 
        logger.info('sending ee state to frontend')
        return {'status': 'OK', 'data': data}
    except RuntimeError as err: 
        logger.warning(err)
        data = {'msg': f'{err}'}
        return {'status': 'ERR', 'data': data}

@sio.event
def connect():
    logger.info('connected to server')


@sio.event
def disconnect():
    logger.info('disconnected from server')


@sio.event
def hello(a, b, c):
    logger.info(a, b, c)

def write_to_file(item, fileName):
    with open(fileName, 'w') as outfile:
        json.dump(item, outfile)



if __name__ == '__main__':
    logger = create_logger(subsystem='EXECUTION_ENGINE')
    cfg_name="./cfg.ini"
    state_file_name = "/ddoi/state/ptolemy_state.json"
    config_parser = configparser.ConfigParser()
    config_parser.read(cfg_name)
    ee = ExecutionEngine(logger=logger, cfg=cfg_name)

    if os.path.exists(state_file_name):
        with open(state_file_name, 'r') as openfile:
            state = json.load(openfile)
            init_ob_queue = state.get('ob_queue', [])
    else:
        init_ob_queue = []

    ee.obs_q.obIds = init_ob_queue

    parser = argparse.ArgumentParser(description="Setup websocket host")
    parser.add_argument('--host', type=str, required=False, default='0.0.0.0',
                         help="hostname (localhost as default)")
    parser.add_argument('--port', type=int, required=False, default=50008,
                         help="port to listen on")
    args=parser.parse_args()

    url = f'http://{args.host}:{args.port}'

    sio.connect(url, transports='polling')
    sio.wait()