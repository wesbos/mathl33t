import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export default function Store() {
  const [isOpen, setIsOpen] = useState(false);
  const score = useGameStore(state => state.score);
  const storeItems = useGameStore(state => state.storeItems);
  const inventory = useGameStore(state => state.inventory);
  const purchaseItem = useGameStore(state => state.purchaseItem);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        <span className="text-xl">🛍️</span>
        Store
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Store</h2>
          <div className="flex items-center gap-4">
            <div className="text-xl font-semibold">💰 {score} points</div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {storeItems.map((item) => {
            const owned = inventory.includes(item.id);
            const canAfford = score >= item.price;

            return (
              <div
                key={item.id}
                className="border rounded-lg p-4 flex items-center justify-between bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    <div className="text-purple-600 font-semibold mt-1">
                      💰 {item.price} points
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => purchaseItem(item.id)}
                  disabled={owned || !canAfford}
                  className={`px-4 py-2 rounded-lg ${
                    owned
                      ? 'bg-green-100 text-green-700'
                      : canAfford
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {owned ? 'Owned' : canAfford ? 'Buy' : 'Cannot afford'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          Earn more points by solving math problems!
        </div>
      </div>
    </div>
  );
}
