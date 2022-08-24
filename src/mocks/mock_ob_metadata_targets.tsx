import { ObservationBlock } from "../typings/papahana"

export const mock_targets: Partial<ObservationBlock>[] = [
    {
      "_id": "626c2a5f55785777e0514b70",
      "target": {
        "metadata": {
          "name": "multi_object_target",
          "template_type": "target",
          "ui_name": "Multi-Object Spectroscopy Target",
          "version": "0.1.1"
        },
        "parameters": {
          "rot_cfg_pa": 4.417269215621521,
          "seq_constraint_obstime": "2021-04-22 15:08:04",
          "target_coord_dec": "+88:34:34",
          "target_coord_epoch": "2000",
          "target_coord_frame": "FK5",
          "target_coord_pm_dec": 2.528285280477612,
          "target_coord_pm_ra": 9.783768159522216,
          "target_coord_ra": "02:49:55",
          "target_info_comment": "Observe on the first run of the semester.",
          "target_info_magnitude": [{
            "target_info_band": "J",
            "target_info_mag": 0.1725062571465783
          }],
          "target_info_name": "qdhh"
        }
      }
    },
    {
      "_id": "626c2a5f55785777e0514b80",
      "target": {
        "metadata": {
          "name": "multi_object_target",
          "template_type": "target",
          "ui_name": "Multi-Object Spectroscopy Target",
          "version": "0.1.1"
        },
        "parameters": {
          "rot_cfg_pa": 0.054208797503082495,
          "seq_constraint_obstime": "2021-04-22 15:08:04",
          "target_coord_dec": "+24:37:22",
          "target_coord_epoch": "2000",
          "target_coord_frame": "FK5",
          "target_coord_pm_dec": 7.0154115884710535,
          "target_coord_pm_ra": 7.410625109444643,
          "target_coord_ra": "13:23:57",
          "target_info_magnitude": [{
            "target_info_band": "H",
            "target_info_mag": 0.9942277284355379
          }],
          "target_info_name": "hmap"
        },
      }
    },
    {
      "_id": "626c56d3b26aa4d070cecc44"
    }
  ]
  



export const mock_metadata: Partial<ObservationBlock>[] = [
    {
      "_id": "626c2a5f55785777e0514b70",
      "metadata": {
        "instrument": "KCWI",
        "name": "standard stars #5",
        "ob_type": "science",
        "pi_id": 1144,
        "priority": 100,
        "sem_id": "2022A_U124",
        "version": "0.1.0",
        "comment": "adsfeazdae" 
      }
    },
    {
      "_id": "626c2a5f55785777e0514b80",
      "metadata": {
        "comment": "High Priority",
        "instrument": "KCWI",
        "name": "standard stars #7",
        "ob_type": "science",
        "pi_id": 7766,
        "priority": 100,
        "sem_id": "2022A_U124",
        "version": "0.1.0"
      }
    },
    {
      "_id": "626c56d3b26aa4d070cecc44",
      "metadata": {
        "comment": "",
        "instrument": "KCWI",
        "name": "Made by ODT",
        "ob_type": "engineering",
        "pi_id": 4866,
        "priority": 0,
        "sem_id": "2022A_U124",
        "version": "0.1.0"
      }
    }
  ]
  


