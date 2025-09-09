// src/components/HUD.tsx

import React from 'react';
import { gameStateManager } from '../engine/GameStateManager';
import { ecoAI } from '../engine/EcoAI';

export const HUD: React.FC = () => {
    return (
        <div className="relative flex-shrink-0 w-full p-4 text-white flex justify-between bg-black bg-opacity-50 h-20">
            <div>
                <div>PV: {gameStateManager.pv}</div>
                <div>COR: {gameStateManager.sanity}</div>
                <div>PA: {gameStateManager.pa}</div>
            </div>
            <div>
                <div>Turn: {gameStateManager.turn}</div>
                <div>Phase: {gameStateManager.phase}</div>
            </div>
            <div>
                <div>Eco HP: {gameStateManager.ecoHp}</div>
                <div>Eco Phase: {ecoAI.currentPhase}</div>
                {gameStateManager.isEcoExposed && <div className="text-red-500">Eco Exposed!</div>}
            </div>
        </div>
    );
};
