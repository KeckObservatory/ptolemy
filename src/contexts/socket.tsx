import React from 'react';
import {io} from "socket.io-client";
import { RWindow } from '../typings/ptolemy';

declare let window: RWindow
const url = window.BASE_URL + ':50008';
const path = '';
export const socket = io(url, {path: path, transports: ['websocket'], secure: true, rejectUnauthorized: false});
export const SocketContext = React.createContext(socket);
