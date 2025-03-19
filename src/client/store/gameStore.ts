import { create } from 'zustand';

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
  onAnswer?: (selectedAnswer: number) => void;
}

interface StoreItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  description: string;
}

interface Player {
  id: string;
  username: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  appearance?: CharacterAppearance;
}

interface CharacterAppearance {
  skinColor: string;
  eyeColor: string;
  hairColor: string;
  hairStyle: string;
  lipColor: string;
  shirtColor: string;
}

interface GameState {
  isLoggedIn: boolean;
  username: string | null;
  playerId: string | null;
  score: number;
  streak: number;
  highScore: number;
  currentProblem: MathProblem | null;
  solvedProblems: string[];
  inventory: string[];
  storeItems: StoreItem[];
  players: Map<string, Player>;
  socket: WebSocket | null;
  appearance: CharacterAppearance;
  setLoggedIn: (status: boolean) => void;
  setUsername: (username: string) => void;
  setScore: (score: number) => void;
  setProblem: (problem: MathProblem | null) => void;
  addSolvedProblem: (id: string) => void;
  purchaseItem: (itemId: string) => boolean;
  updatePlayerPosition: (position: { x: number; y: number; z: number }, rotation: { x: number; y: number; z: number }) => void;
  connectToServer: () => void;
  updateAppearance: (updates: Partial<CharacterAppearance>) => void;
}

// Available customization options
export const CHARACTER_OPTIONS = {
  skinColors: [
    "#8D5524", // dark brown
    "#C68642", // medium brown
    "#E0AC69", // light brown
    "#F1C27D", // very light brown
    "#FFDBAC", // pale
    "#FFE0BD"  // very pale
  ],
  eyeColors: [
    "#634e34", // brown
    "#2c1810", // dark brown
    "#238a41", // green
    "#3B83BD", // blue
    "#a5673f", // hazel
    "#808080"  // grey
  ],
  hairColors: [
    "#090806", // black
    "#71635A", // dark brown
    "#B7A69E", // light brown
    "#D4B494", // blonde
    "#B58143", // golden
    "#E8E1E1"  // white
  ],
  hairStyles: [
    "short",
    "medium",
    "long",
    "curly",
    "spiky",
    "bald"
  ],
  lipColors: [
    "#EC9BA7", // pink
    "#C94A50", // red
    "#B83F45", // dark red
    "#A15843", // brown
    "#E2BCB1", // nude
    "#F4C3B2"  // light pink
  ],
  shirtColors: [
    "#5B84B1", // default blue
    "#E74C3C", // red
    "#2ECC71", // green
    "#F1C40F", // yellow
    "#9B59B6", // purple
    "#34495E"  // navy
  ]
};

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'laptop',
    name: 'Gaming Laptop',
    price: 100,
    icon: '💻',
    description: 'A powerful gaming laptop for all your needs'
  },
  {
    id: 'phone',
    name: 'Smartphone',
    price: 50,
    icon: '📱',
    description: 'The latest smartphone model'
  },
  {
    id: 'candy',
    name: 'Candy Bar',
    price: 5,
    icon: '🍫',
    description: 'A delicious chocolate bar'
  },
  {
    id: 'soda',
    name: 'Soda',
    price: 3,
    icon: '🥤',
    description: 'An ice-cold refreshing drink'
  }
];

// Default appearance
const DEFAULT_APPEARANCE: CharacterAppearance = {
  skinColor: CHARACTER_OPTIONS.skinColors[2],
  eyeColor: CHARACTER_OPTIONS.eyeColors[0],
  hairColor: CHARACTER_OPTIONS.hairColors[1],
  hairStyle: CHARACTER_OPTIONS.hairStyles[0],
  lipColor: CHARACTER_OPTIONS.lipColors[0],
  shirtColor: CHARACTER_OPTIONS.shirtColors[0]
};

export const useGameStore = create<GameState>((set, get) => ({
  isLoggedIn: false,
  username: null,
  playerId: null,
  score: 0,
  streak: 0,
  highScore: 0,
  currentProblem: null,
  solvedProblems: [],
  inventory: [],
  storeItems: STORE_ITEMS,
  players: new Map(),
  socket: null,
  appearance: DEFAULT_APPEARANCE,

  setLoggedIn: (status) => {
    set({ isLoggedIn: status });
    if (status) {
      get().connectToServer();
    }
  },

  setUsername: (username) => set({ username }),

  setScore: (score) => set((state) => ({
    score,
    highScore: Math.max(state.highScore, score)
  })),

  setProblem: (problem) => set({ currentProblem: problem }),

  addSolvedProblem: (id) => set((state) => ({
    solvedProblems: [...state.solvedProblems, id]
  })),

  purchaseItem: (itemId) => set((state) => {
    const item = state.storeItems.find(i => i.id === itemId);
    if (!item || state.score < item.price) {
      return state;
    }

    new Audio('/sounds/purchase.mp3').play().catch(() => {});

    return {
      score: state.score - item.price,
      inventory: [...state.inventory, itemId]
    };
  }),

  updatePlayerPosition: (position, rotation) => {
    const { socket, playerId, username } = get();
    if (!socket || !playerId || !username) return;

    socket.send(JSON.stringify({
      type: 'MOVE',
      playerId,
      position,
      rotation
    }));
  },

  updateAppearance: (updates) => {
    set((state) => ({
      appearance: { ...state.appearance, ...updates }
    }));

    // If connected to server, send appearance update
    const { socket, playerId, appearance } = get();
    if (socket && playerId) {
      socket.send(JSON.stringify({
        type: 'APPEARANCE',
        playerId,
        appearance: { ...appearance, ...updates }
      }));
    }
  },

  connectToServer: () => {
    const socket = new WebSocket(`ws://${window.location.host}/ws`);
    const playerId = Math.random().toString(36).substring(7);
    const defaultUsername = `Player${Math.floor(Math.random() * 1000)}`;

    set({ socket, playerId });
    if (!get().username) {
      set({ username: defaultUsername });
    }

    socket.addEventListener('open', () => {
      console.log('Connected to server');
      const { username, playerId } = get();
      const joinMessage = {
        type: 'JOIN',
        playerId,
        username: username || defaultUsername
      };
      console.log('Sending JOIN message:', joinMessage);
      socket.send(JSON.stringify(joinMessage));
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        if (data.type === 'GAME_STATE') {
          const players = new Map();
          data.players.forEach((player: Player) => {
            if (player.id !== get().playerId) {
              console.log('Adding player:', player);
              players.set(player.id, player);
            }
          });
          set({ players });
          console.log('Updated players:', players);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    socket.addEventListener('close', () => {
      console.log('WebSocket connection closed, reconnecting...');
      set({ socket: null, players: new Map() });
      setTimeout(() => get().connectToServer(), 3000);
    });

    socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Send LEAVE message when window closes
    window.addEventListener('beforeunload', () => {
      if (socket.readyState === WebSocket.OPEN) {
        const leaveMessage = {
          type: 'LEAVE',
          playerId: get().playerId
        };
        console.log('Sending LEAVE message:', leaveMessage);
        socket.send(JSON.stringify(leaveMessage));
      }
    });
  }
}));
