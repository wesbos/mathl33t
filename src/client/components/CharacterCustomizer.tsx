import React, { useState } from 'react';
import { useGameStore, CHARACTER_OPTIONS } from '../store/gameStore';

export default function CharacterCustomizer() {
  const [isOpen, setIsOpen] = useState(false);
  const appearance = useGameStore(state => state.appearance);
  const updateAppearance = useGameStore(state => state.updateAppearance);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
      >
        <span className="text-xl">👤</span>
        Customize
      </button>
    );
  }

  const ColorOption = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full ${selected ? 'ring-2 ring-white ring-offset-2 ring-offset-purple-600' : ''}`}
      style={{ backgroundColor: color }}
    />
  );

  const StyleOption = ({ style, selected, onClick }: { style: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full ${
        selected
          ? 'bg-purple-600 text-white'
          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      }`}
    >
      {style}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Character Customization</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Skin Color */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Skin Color</h3>
            <div className="flex gap-2 flex-wrap">
              {CHARACTER_OPTIONS.skinColors.map((color) => (
                <ColorOption
                  key={color}
                  color={color}
                  selected={color === appearance.skinColor}
                  onClick={() => updateAppearance({ skinColor: color })}
                />
              ))}
            </div>
          </div>

          {/* Eye Color */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Eye Color</h3>
            <div className="flex gap-2 flex-wrap">
              {CHARACTER_OPTIONS.eyeColors.map((color) => (
                <ColorOption
                  key={color}
                  color={color}
                  selected={color === appearance.eyeColor}
                  onClick={() => updateAppearance({ eyeColor: color })}
                />
              ))}
            </div>
          </div>

          {/* Hair Style */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Hair Style</h3>
            <div className="flex gap-2 flex-wrap">
              {CHARACTER_OPTIONS.hairStyles.map((style) => (
                <StyleOption
                  key={style}
                  style={style}
                  selected={style === appearance.hairStyle}
                  onClick={() => updateAppearance({ hairStyle: style })}
                />
              ))}
            </div>
          </div>

          {/* Hair Color */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Hair Color</h3>
            <div className="flex gap-2 flex-wrap">
              {CHARACTER_OPTIONS.hairColors.map((color) => (
                <ColorOption
                  key={color}
                  color={color}
                  selected={color === appearance.hairColor}
                  onClick={() => updateAppearance({ hairColor: color })}
                />
              ))}
            </div>
          </div>

          {/* Lip Color */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Lip Color</h3>
            <div className="flex gap-2 flex-wrap">
              {CHARACTER_OPTIONS.lipColors.map((color) => (
                <ColorOption
                  key={color}
                  color={color}
                  selected={color === appearance.lipColor}
                  onClick={() => updateAppearance({ lipColor: color })}
                />
              ))}
            </div>
          </div>

          {/* Shirt Color */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Shirt Color</h3>
            <div className="flex gap-2 flex-wrap">
              {CHARACTER_OPTIONS.shirtColors.map((color) => (
                <ColorOption
                  key={color}
                  color={color}
                  selected={color === appearance.shirtColor}
                  onClick={() => updateAppearance({ shirtColor: color })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
