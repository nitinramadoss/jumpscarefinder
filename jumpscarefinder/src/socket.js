import { io } from 'socket.io-client';

const URL = "https://deenaserver.deenareviews.com/";

export const socket = io.connect(URL);