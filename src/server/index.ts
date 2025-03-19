import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupWebSocketServer } from './websocket';

const server = createServer();
const wss = new WebSocketServer({ server, path: '/ws' });

setupWebSocketServer(wss);

server.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
  console.log('WebSocket server running on ws://localhost:3001/ws');
});
