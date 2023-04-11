import logging
import requests

def convert_target_to_targetlist_row(target, acquisition):
    tparams = target.get('parameters')
    aparams = acquisition.get('parameters', False)
    name = tparams.get('target_info_name')
    if len(name) > 17: 
        name = name[0:16]
    else:
        name = name.ljust(16)
    ra = tparams['target_coord_ra'].replace(':', ' ') + " "
    dec = tparams['target_coord_dec'].replace(':', ' ') + " "
    mags = tparams.get('target_info_mag', False)
    magnitude = str(mags[0]['target_info_mag']) + " " if mags else False
    epoch = str(tparams['target_coord_epoch']) + " "
    rowStr = name + ra + dec + epoch
    if magnitude:
        rotStr += 'vmag=' + magnitude

    if aparams:
        raOffset = str(aparams.get('tcs_coord_raoff')) + " "
        decOffset = str(aparams.get('tcs_coord_decoff')) + " "
        wrap = str(aparams.get('rot_cfg_wrap')) + " "
        rotMode = aparams.get('rot_cfg_mode') + ' '

        rowStr += 'raOffset=' + raOffset
        rowStr += 'decOffset=' + decOffset
        rowStr += 'rotmode=' + rotMode
        rowStr += 'wrap=' + wrap
    return rowStr

def convert_obs_to_targetlist(obs):

    targetListStr = ""
    for ob in obs:
        target = ob.get('target', False)
        acquisition = ob.get('acquisition', False)
        if not target or not acquisition:
            logging.debug('ob has either no target or acquisition. not going to add')
            continue
        row = convert_target_to_targetlist_row(target, acquisition) 
        targetListStr += row + '\n'
    return targetListStr

def add_target_list_to_magiq(obs, cfg):
    # setup URL base
    server = cfg['MAGIQSERVER']['server']
    port = cfg['MAGIQSERVER']['port']
    urlbase = f'http://{server}:{port}'

    # cls.remove_target_list(urlbase, logger) #likely not needed
    url = urlbase + '/setTargetlist'
    targetList = convert_obs_to_targetlist(obs)
    data = {'targetlist': targetList}
    logging.info(f'adding target list via: {url}')
    response = requests.post(url, data=data)
    logging.info(f'response: status code: {response.status_code}')