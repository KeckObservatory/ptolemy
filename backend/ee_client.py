import socketio
import requests
import traceback
import os
import json
import argparse
from execution_engine.core.ExecutionEngine import ExecutionEngine
from app import create_logger
import configparser
try:
    import ktl
except ImportError:
    ktl = ''

sio = socketio.Client()


@sio.event
def get_ee_state():
    logger.info(f'get_ee_state event triggered. sending state back to server')
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
        data['ob_id_boneyard'] = ee.obs_q.boneyard
        # get sequence queue and sequence boneyard
        data['sequence_queue'] = ee.seq_q.sequences
        data['sequence_boneyard'] = ee.seq_q.boneyard
        # get event queue and event boneyard
        evts = ee.ev_q.get_queue_as_list()
        data['event_queue'] = evts

        evtBoneyard = [x.as_dict() for x in ee.ev_q.boneyard]
        data['event_boneyard'] = evtBoneyard
        data['event_queue_locked'] = ee.ev_q.block_event.is_set()
        isPaused = ktl.read(config_parser['KTL']['service'], 'pause')
        isHalted = ktl.read(config_parser['KTL']['service'], 'halt')
        data['pause'] = isPaused
        data['halt'] = isHalted
        logger.info('sending ee state to frontend')
        return {'status': 'OK', 'data': data}
    except RuntimeError as err:
        logger.warning(err)
        return {'status': 'ERR', 'msg': f'{err}'}


@sio.event
def get_ob_ids():
    return {'status': 'OK', 'data': ee.obs_q.obIds}


@sio.event
def new_ob_queue(data):
    ob_id_queue = data.get('ob_id_queue', [])
    obs = data.get('obs', False)

    ee.obs_q.obIds = ob_id_queue
    write_to_file(
        {'ob_queue': ob_id_queue, 'ob_boneyard': ee.obs_q.boneyard}, state_file_name)
    outData = {}
    if obs:
        try:
            ee.magiq_interface.check_if_connected_to_magiq_server()
            resp = ee.magiq_interface.add_target_list_to_magiq(obs, logger)
        except requests.exceptions.ConnectionError as err:
            msg = f'did not add target to magiq.'
            logger.warning(msg)
            outData = {'status': 'OK, MAGIQ_ERR', 'msg': msg}
    logger.info(f'new ob queue len: {len(ob_id_queue)}')
    return {**outData, 'data': data}


@sio.event
def new_ob_boneyard(data):
    ee.obs_q.boneyard = data['ob_id_boneyard']
    write_to_file({'ob_queue': ee.obs_q.obIds,
                  'ob_boneyard': data['ob_id_boneyard']}, state_file_name)
    return {'status': 'OK', 'data': data}


@sio.event
def sync_obs_with_magiq(data):
    obs = data.get('obs')
    resp = ee.magiq_interface.add_target_list_to_magiq(
        obs, config_parser, logger)


@sio.event
def ee_submit_ob(data):
    submittedId = data.get('ob_id')  # item in the queue
    ee.obs_q.submitted_ob_id = submittedId
    logger.info(f"submitted obid: {submittedId}")
    outData = {}
    try:
        ob = ee.ODBInterface.get_OB_from_id(submittedId)
        broadcastData = {'ob': ob}
        outData['data'] = broadcastData
        ee.seq_q.sequences = ob.get('observations', [])
        ee.ev_q.set_queue([])

    except RuntimeError as err:
        data = {'msg': str(err)}
        return {'status': 'RUNTIME_ERR', 'msg': f'{err}'}

    logger.info("sending new obqueue and boneyard to clients")
    ob_id_boneyard = [x for x in ee.obs_q.boneyard]
    idx = ee.obs_q.obIds.index(submittedId)
    write_to_file({'ob_queue': ee.obs_q.obIds,
                  'ob_boneyard': ob_id_boneyard}, state_file_name)

    try:
        ee.magiq_interface.check_if_connected_to_magiq_server()
        target = ob.get('target')
        resp = ee.magiq_interface.select_target_in_magiq(
            ob.get('target'), idx, logger)
    except requests.exceptions.ConnectionError as err:
        msg = f'did not highlight target in magiq.'
        logger.warning(msg)
        return {'status': 'OK, MAGIQ_ERROR', 'data': {'ob': ob}, 'msg': msg}
    except Exception as err:
        msg = f'did not highlight target in magiq.'
        logger.warning(msg)
        return {'status': 'OK, MAGIQ_ERROR', 'data': {'ob': ob}, 'msg': msg}
    return {'status': 'OK', 'data': {'ob': ob}}


@sio.event
def ee_new_seq_queue(data):
    seqQueue = data.get('sequence_queue')
    ee.seq_q.sequences = seqQueue
    logger.info(f'new_sequence_queue len: {len(seqQueue)}')
    return {'status': 'OK', 'data': data}


@sio.event
def ee_new_seq_boneyard(data):
    sequenceBoneyard = data.get('sequence_boneyard')
    logger.info(f'new sequence boneyard len {len(sequenceBoneyard)}')
    ee.seq_q.boneyard = sequenceBoneyard
    return {'status': 'OK', 'data': data}


@sio.event
def ee_new_event_queue(data):
    eq = data.get('event_queue')
    logger.info(f'new event queue len: {len(eq)}')
    newQueue = []
    oldQueue = [*ee.ev_q.queue]
    for eventStr in eq:  # sorting in queue
        try:
            evt = get_event(oldQueue, eventStr)
            if evt:
                newQueue.append(evt)
        except Exception as err:
            return {'status': 'ERR', 'msg': f'{err}'}
    ee.ev_q.set_queue(newQueue)
    ev_queue = ee.ev_q.get_queue_as_list()
    eventData = {'event_queue': ev_queue}
    return {'status': 'OK', 'data': eventData}


@sio.event
def ee_new_event_boneyard(data):
    eb = data.get('event_boneyard')
    logger.info(f'new event boneyard len{len(eb)}')
    newBoneyard = []
    oldBoneyard = [*ee.ev_q.boneyard]
    for eventDict in eb:  # sorting in boneyard
        try:
            evt = get_event(oldBoneyard, eventDict)
            if evt:
                newBoneyard.append(evt)
        except Exception as err:
            return {'status': 'ERR', 'msg': f'{err}'}

    ee.ev_q.boneyard = newBoneyard
    boneyardDict = [x.as_dict() for x in newBoneyard]
    eventBoneyardData = {'event_boneyard': boneyardDict}
    return {'status': 'OK', 'data': eventBoneyardData}


@sio.event
def ee_event_queue_boneyard_swap(data):
    evtPool = [*ee.ev_q.boneyard, *list(ee.ev_q.queue)]
    eventStrs = data.get('event_queue')
    boneyardStrs = data.get('event_boneyard')
    # event queue creation
    try:
        newQueue = build_list(evtPool, eventStrs)
        ee.ev_q.set_queue(newQueue)
        # boneyard cereation
        newBoneyard = build_list(evtPool, boneyardStrs)
    except Exception as err:
        return {'status': 'ERR', 'msg': f'{err}'}
    ee.ev_q.boneyard = newBoneyard
    outData = make_event_out_data()
    return {'status': 'OK', 'data': outData}


def get_event(arr, eventDict):
    eid = eventDict['id']
    evtItem = next((item for item in [*arr] if item.id == eid), None)
    if not evtItem:
        msg = f'CANNOT FIND {eventDict["script_name"]}'
        logger.error(msg)
        raise Exception(msg)
    return evtItem


def build_list(arr, eventDicts):
    outArr = []
    for eventDict in eventDicts:
        evt = get_event(arr, eventDict)
        if evt:
            outArr.append(evt)
    return outArr


def make_event_out_data():
    ev_queue = ee.ev_q.get_queue_as_list()
    boneyardDict = [x.as_dict() for x in ee.ev_q.boneyard]
    outData = {'event_queue': ev_queue, 'event_boneyard': boneyardDict}
    return outData


def get_fresh_sequence_and_observations(ob, sequence_number, boneyard_sequence_numbers):
    selIdx = next((idx for idx, seq in enumerate(
        ob['observations']) if seq['metadata']['sequence_number'] == sequence_number))
    freshSequenceQueue = [*ob['observations']]
    freshSequence = freshSequenceQueue.pop(selIdx)  # remove submitted sequence
    # remove already submitted sequences
    freshBoneyard = [freshSequenceQueue.pop(idx) for idx, seq in enumerate(
        freshSequenceQueue) if seq['metadata']['sequence_number'] in boneyard_sequence_numbers]
    freshBoneyard = [freshSequence, *freshBoneyard] # add submitted seq to boneyard
    return freshSequenceQueue, freshBoneyard, freshSequence


def get_fresh_ob():
    # Get a fresh OB for the new task
    ob_id = ee.obs_q.submitted_ob_id
    if len(ob_id) == 0:
        logger.warning('ob queue empty')
        raise Exception('ob queue is empty')
    ob = ee.ODBInterface.get_OB_from_id(ob_id)
    return ob


@sio.event
def ee_new_task(data):
    task = data.get('task')
    logger.info(f'new task getting set to {task}')
    isAcquisition = data.get('isAcq', False)

    try:
        ob = get_fresh_ob()
    except Exception as err:
        logger.warning(f'new_task error: {err}')
        return {'status': 'ERR', 'msg': f'{err}'}

    outData = {}
    if isAcquisition:
        logger.info('acquisition getting set')
        acqSeq = ob.get('acquisition', False)
        target = ob.get('target', False)
        if not acqSeq or not target:
            data = {'msg': 'no acquisition or target in ob'}
            return {'status': 'ERR', 'msg': f'{err}'}
        logger.info(
            f"new acquistion task from queue {acqSeq['metadata']['script']}")
        ee.ev_q.load_events_from_acquisition_and_target(ob)
        outData = { **outData }
    else:  # is sequence
        if len(ee.seq_q.sequences) == 0:
            msg = 'sequence queue empty'
            logger.warning(msg)
            return {'status': 'ERR', 'msg': msg}
        boneyard_sequence_numbers = [
            x['metadata']['sequence_number'] for x in ee.seq_q.boneyard]

        sequence_number = task['metadata']['sequence_number']
        # set fresh sequences and boneyard
        freshSequenceQueue, freshBoneyard, freshSequence = \
            get_fresh_sequence_and_observations( ob, sequence_number, boneyard_sequence_numbers )
        ee.seq_q.sequences = freshSequenceQueue
        ee.seq_q.boneyard = freshBoneyard 
        ob['status']['current_seq'] = sequence_number
        ee.ODBInterface.update_OB(ob) #TODO: fix this function so that OB updates
        outData = {**outData,
                   'sequence_boneyard': freshBoneyard,
                   'sequence_queue': freshSequenceQueue}
        logger.info(f'new sequence from queue: {sequence_number}')
        ee.ev_q.load_events_from_sequence(freshSequence, ob)
    ee.ev_q.boneyard = []
    outData = {**outData, 'event_queue_and_boneyard': make_event_out_data()}
    return {'status': 'OK', 'data': outData, 'isAcq': isAcquisition}


@sio.event
def ee_submit_event(data):
    eventDict = data.get('submitted_event')

    logger.info(f'submitting event {eventDict["script_name"]}')

    if len(ee.ev_q.get_queue_as_list()) == 0:
        msg = 'event_queue_empty'
        logger.warning(msg)
        return {'status': 'ERR', 'msg': msg}
    # aquire lock
    isBlocked = ee.ev_q.block_event.is_set()
    if isBlocked:
        logger.warning('queue locked. sending msg to frontend')
        return {'status': 'ERR', 'msg': 'event queue locked'}

    freshEvent = {**eventDict}
    try:
        ob = get_fresh_ob()
        if eventDict['event_type'] == 'sequence':
            seqNo = eventDict['args']['sequence']['metadata']['sequence_number']
            freshSeq = next((seq for seq in [
                            *ob['observations']] if seq['metadata']['sequence_number'] == seqNo), None)
            args = {'sequence': freshSeq, 'OB': ob}
        elif eventDict['event_type'] == 'acquisition':
            args = ob

        freshEvent['args'] = args
    except Exception as err:
        msg = f'failed to get fresh ob: {err}'
        logger.warning(msg)
        return {'status': 'ERR', 'msg': msg}
    try:
        ee.ev_q.dispatch_event(freshEvent)
    except Exception as err:
        logger.info(f'dispatch event failed, reason: {err}')
        logger.info(f'{traceback.format_exc()}')
        return {'status': 'ERR', 'msg': 'dispatch_event failed'}
    # broadcast new queue and boneyard
    outData = make_event_out_data()
    return {'status': 'OK', 'data': outData}


@sio.event
def ee_release_event_queue_lock():
    logger.info('release_event_queue_lock event triggered')
    ee.ev_q.block_event.clear()
    ee.server_connection.send({"message": "release_event_queue_lock"})
    return {'status': 'OK', 'msg': 'event queue lock released'}


@sio.event
def connect():
    logger.info('EE connected to server')


@sio.event
def disconnect():
    logger.info('EE disconnected from server')


@sio.event
def hello(a, b, c):
    logger.info(a, b, c)


def write_to_file(item, fileName):
    with open(fileName, 'w') as outfile:
        json.dump(item, outfile)


if __name__ == '__main__':
    logger = create_logger(subsystem='EXECUTION_ENGINE')
    cfg_name = "./cfg.ini"
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
    args = parser.parse_args()

    url = f'http://{args.host}:{args.port}'

    sio.connect(url, transports='polling')
    sio.wait()
