#!/usr/bin/env python
import sys
import socketio
import os
import pdb
import asyncio
from generate_data import generate_row
from threading import Thread, Lock


HOST = '0.0.0.0'
PORT = '5000'

sockaddr = 'http://' + HOST + ':' + PORT 
soc = socketio.Client() 
soc.connect(sockaddr)
lock = Lock()

def increment_obdm_version( ):
    print('triggering return_ob')
    # soc.emit('send_ob')
    soc.emit('increment_ob_version')

if __name__ == "__main__":
    threads = [ Thread(target=increment_obdm_version) for x in range(50) ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()