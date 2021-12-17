
#!/usr/bin/env python
import time
import sys
import socket
import os
import pdb

class FileSocket:
    def __init__(self, socketio):
        self.BUFFER_SIZE = 4096
        self.TIMEOUT = 5.0 * 60
        self.host = '0.0.0.0' 
        self.port = 9111 
        self.socketio = socketio
        self.SEPARATOR = "<SEPERATOR>"

        self.soc = socket.socket()
        self._init_soc()

    
    def _init_soc(self):
        # check and turn on TCP Keepalive
        x = self.soc.getsockopt( socket.SOL_SOCKET, socket.SO_KEEPALIVE)
        if( x == 0):
            print ( 'Socket Keepalive off, turning on' )
            x = self.soc.setsockopt( socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
            print ( 'setsockopt=', x )
        else:
            print ( 'Socket Keepalive already on' )

        print ( "host:port = %s:%d" % ( self.host, self.port ) )
        self.soc.bind( ( self.host, self.port ) )
        self.soc.listen( 1 )
        print ( "Waiting for incoming client requests..." )
        self.soc.settimeout( self.TIMEOUT )

    def run(self):
        count = 0
        while True:
            count += 1
            filename = "file%d" % count
            try:
                conn, addr = self.soc.accept()
                #Open one recv.txt file in write mode
                # Receive any data from client side
                received = conn.recv(self.BUFFER_SIZE).decode()
                filename, filesize = received.split(self.SEPARATOR)
                filename = os.path.basename(filename)
                RecvData = conn.recv(self.BUFFER_SIZE)
                self.socketio.emit(
                    'new_file', {'filename': os.path.basename(filename),
                                    'file': RecvData}, broadcast=True)
                # Close the file opened at server side once copy is completed
                print("\n File has been emmitted successfully \n")
            
            except socket.timeout:
                print ( 'Socket timeout, loop and try recv() again' )
                time.sleep( self.TIMEOUT )
                continue

            except Exception as err:
                print ( f'Other Socket err {err}, exit and try creating socket again' )
                break

            print ( 'received %s from %s', conn, addr )

        try:
            self.soc.close()
        except:
            pass