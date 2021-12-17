import React from 'react';
import {io} from "socket.io-client";

const IS_PRODUCTION: boolean = process.env.REACT_APP_ENVIRONMENT==='production'? true : false
console.log(`is PRODUCTION? set to ${IS_PRODUCTION}`) 
const ENDPOINT = "ws://127.0.0.1:5000"
export const socket = io(ENDPOINT, {transports: ['websocket'], secure: true, rejectUnauthorized: false});
export const SocketContext = React.createContext(socket);