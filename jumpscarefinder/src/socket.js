import { io } from 'socket.io-client';

const URL = process.env.ENDPOINT;

export const socket = io.connect(URL);