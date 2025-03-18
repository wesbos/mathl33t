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

export function setupWebSocketServer(ws: WebSocket) {
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case 'JOIN':
          gameState.players.set(data.playerId, {
            id: data.playerId,
            username: data.username,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
          });
          break;

        case 'MOVE':
          const player = gameState.players.get(data.playerId);
          if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
          }
          break;

        case 'LEAVE':
          gameState.players.delete(data.playerId);
          break;
      }

      // Broadcast updated game state to all connected clients
      const gameStateMessage = JSON.stringify({
        type: 'GAME_STATE',
        players: Array.from(gameState.players.values())
      });

      ws.send(gameStateMessage);
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    // Cleanup when connection closes
  });
}
