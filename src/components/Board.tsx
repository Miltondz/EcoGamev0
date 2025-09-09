// src/components/Board.tsx

import React, { useState, useEffect, useRef } from 'react';
import { nodeSystem } from '../engine/NodeSystem';
import { gameStateManager } from '../engine/GameStateManager';
import { CardComponent } from './CardComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { Deck } from './Deck';
import { DiscardPile } from './DiscardPile';
import { turnManager } from '../engine/TurnManager';
import { uiPositionManager } from '../engine/UIPositionManager';

interface BoardProps {
    onNodeClick: (nodeId: string) => void;
    isRepairMode: boolean;
}

export const Board: React.FC<BoardProps> = ({ onNodeClick, isRepairMode }) => {
    const { isEcoExposed, ecoRevealedCard } = gameStateManager;
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const ecoAreaRef = useRef<HTMLDivElement>(null);
    const playAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ecoRevealedCard) {
            setIsCardFlipped(true);
        } else {
            setIsCardFlipped(false);
        }
    }, [ecoRevealedCard]);

    useEffect(() => {
        if (ecoAreaRef.current) {
            const rect = ecoAreaRef.current.getBoundingClientRect();
            uiPositionManager.register('eco', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        }
        if (playAreaRef.current) {
            const rect = playAreaRef.current.getBoundingClientRect();
            uiPositionManager.register('playArea', { x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        }
    }, []);

    return (
        <div className="play-area flex-grow flex flex-col items-center justify-between p-4" ref={playAreaRef}>
            {/* ECO's Side */}
            <div className="w-full flex flex-col items-center">
                <div
                    ref={ecoAreaRef}
                    className={`eco-area p-4 border-2 rounded-lg transition-all ${isEcoExposed ? 'border-yellow-400 shadow-yellow-400/50 shadow-lg' : 'border-red-800'}`}
                >
                    <h2 className="text-red-400 text-2xl">ECO</h2>
                    <p>HP: {gameStateManager.ecoHp} / {gameStateManager.maxEcoHp}</p>
                    {isEcoExposed && <div className="text-yellow-400 animate-pulse">EXPOSED</div>}
                </div>
                <div className="eco-hand flex justify-center my-4 h-44">
                    <AnimatePresence>
                        {ecoRevealedCard && (
                            <motion.div
                                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, transition: { duration: 0.3 } }}
                                style={{ perspective: '1000px' }}
                            >
                                <motion.div
                                    style={{ transformStyle: 'preserve-3d' }}
                                    animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <div style={{ backfaceVisibility: 'hidden' }}>
                                        <CardComponent 
                                            card={{
                                                id: 'back',
                                                suit: 'Spades',
                                                rank: '0',
                                                value: 0,
                                                imageFile: 'card-back.jpg',
                                            }}
                                        />
                                    </div>
                                    <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', top: 0, left: 0 }}>
                                        <CardComponent 
                                            card={{
                                                id: ecoRevealedCard.id,
                                                suit: ecoRevealedCard.suit,
                                                rank: ecoRevealedCard.rank,
                                                value: ecoRevealedCard.value,
                                                imageFile: ecoRevealedCard.imageFile,
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Middle Row: Deck, Play Zone, Discard Pile */}
            <div className="w-full flex justify-around items-center">
                <Deck onClick={() => turnManager.drawCard()} />
                <div className="w-48 h-64 bg-black bg-opacity-40 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400">
                    Play Card Here
                </div>
                <DiscardPile />
            </div>

            {/* Nodes */}
            <div className="w-full flex justify-center space-x-4">
                {nodeSystem.allNodes.map(node => (
                    <div
                        key={node.id}
                        className={`node p-3 border rounded-lg text-center transition-all ${
                            isRepairMode && node.damage > 0 ? 'cursor-pointer border-yellow-400 bg-yellow-900 hover:bg-yellow-800' : 'border-gray-600 bg-gray-800'
                        } ${node.damage > 0 ? 'border-orange-500' : 'border-green-500'}`}
                        onClick={() => onNodeClick(node.id)}
                    >
                        <div className="font-bold">{node.name}</div>
                        <div>Damage: {node.damage} / {node.maxDamage}</div>
                        {node.damage > 0 && <div className="text-orange-400">Damaged</div>}
                        {node.isCollapsed && <div className="text-red-500 font-bold">COLLAPSED</div>}
                    </div>
                ))}
            </div>
        </div>
    );
};