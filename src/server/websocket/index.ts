import { WebSocket } from 'ws';

interface Player {
  id: string;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
}

interface GameState {
  players: Map<string, Player>;
}

const gameState: GameState = {
  players: new Map()
};

// Keep track of all connected clients with their player IDs
const clients = new Map<WebSocket, string>();

export function setupWebSocketServer(ws: WebSocket) {
  console.log('Setting up new WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data.type, data);

      switch (data.type) {
        case 'JOIN':
          console.log(`Player ${data.username} (${data.playerId}) joined`);
          gameState.players.set(data.playerId, {
            id: data.playerId,
            username: data.username,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
          });
          clients.set(ws, data.playerId);

          // Send immediate game state after join
          const joinStateMessage = JSON.stringify({
            type: 'GAME_STATE',
            players: Array.from(gameState.players.values())
          });
          ws.send(joinStateMessage);
          break;

        case 'MOVE':
          const player = gameState.players.get(data.playerId);
          if (player) {
            player.position = data.position;
            player.rotation = data.rotation;

            // Broadcast position update immediately
            const gameStateMessage = JSON.stringify({
              type: 'GAME_STATE',
              players: Array.from(gameState.players.values())
            });

            clients.forEach((_, client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(gameStateMessage);
              }
            });
          }
          break;

        case 'LEAVE':
          const playerId = clients.get(ws);
          if (playerId) {
            console.log(`Player ${playerId} left`);
            gameState.players.delete(playerId);
            clients.delete(ws);

            // Broadcast after player leaves
            const leaveStateMessage = JSON.stringify({
              type: 'GAME_STATE',
              players: Array.from(gameState.players.values())
            });

            clients.forEach((_, client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(leaveStateMessage);
              }
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    // Clean up when client disconnects
    const playerId = clients.get(ws);
    if (playerId) {
      console.log(`Player ${playerId} disconnected`);
      gameState.players.delete(playerId);
      clients.delete(ws);

      // Broadcast updated game state after player leaves
      const gameStateMessage = JSON.stringify({
        type: 'GAME_STATE',
        players: Array.from(gameState.players.values())
      });

      clients.forEach((_, client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(gameStateMessage);
        }
      });
    }
  });

  // Send welcome message
  ws.send(JSON.stringify({ type: 'CONNECTED' }));
}
