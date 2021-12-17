from functools import wraps
from obdm import OBDM, add_method
import science as sc
import os

ob = {
    "metadata": {
    "name": "standard stars #9",
    "pi_id": 7766,
    "sem_id": "2021B_K0008",
    "instrument": "KCWI",
    "comment": "I'm a scholar. I enjoy scholarly pursuits."
    },
    "version": "0.1",
    "science": [{
        "name": "completed",
        "version": "0.1",
        "det1_exptime": 1637,
        "det1_nexp": 88,
        "det2_exptime": 3185,
        "det2_nexp": 94,
        "cfg_cam_grating": "RL",
        "cfg_cam_cwave": 7581,
        "cfg_slicer": "Medium"
    }],
    "acquisition":{"name":"KCWI_ifu_acq_direct",
    "guider_gs_dec":30.2401,
    "guider_gs_mode":
    "User",
    "guider_gs_ra":3.5337,
    "guider_po":"IFU",
    "script":"KCWI_ifu_acq_direct",
    "version":"0.1"},
    "associations": [
        "jrai",
        "bqtm",
        "hcon"
    ],
    "priority": 28.82745766552508,
    "status": {
        "state": "inqueue",
        "executions": [
        "2019-06-07 03:07:32",
        "2018-02-16 08:38:32",
        ]
    },
    "_id": "0"
    }

if __name__=='__main__':
    obdm = OBDM(ob)
    print(obdm.metadata)
    add_method(OBDM)(sc.KCWI_ifu_sci_dither)
    add_method(OBDM)(sc.KCWI_ifu_acq_direct)
    OBDM.KCWI_ifu_sci_dither()
    OBDM.KCWI_ifu_acq_direct()
