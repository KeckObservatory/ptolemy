import React from 'react';
import {io} from "socket.io-client";

const IS_PRODUCTION: boolean = process.env.REACT_APP_ENVIRONMENT==='production'
console.log(`is PRODUCTION? set to ${IS_PRODUCTION}`) 
const url = IS_PRODUCTION? "https://vm-appserver.keck.hawaii.edu": "localhost:50007" 
const path = IS_PRODUCTION? '/ex_eng_ws_app' : ''
export const socket = io(url, {path: path, transports: ['websocket'], secure: true, rejectUnauthorized: false});
export const SocketContext = React.createContext(socket);