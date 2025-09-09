// src/components/Deck.tsx

import React, { useRef, useEffect } from 'react';
import { deckManager } from '../engine/DeckManager';
import { uiPositionManager } from '../engine/UIPositionManager';
import { CardComponent } from './CardComponent';
import type { Card as CardType } from '../engine/types';

interface DeckProps {
    onClick: () => void;
}

export const Deck: React.FC<DeckProps> = ({ onClick }) => {
    const remainingCards = deckManager.getDeckCount();
    const deckRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (deckRef.current) {
            const rect = deckRef.current.getBoundingClientRect();
            uiPositionManager.register('deck', { x: rect.left, y: rect.top });
        }
    }, []);

    const cardBack: CardType = {
        id: 'card-back',
        suit: 'none',
        rank: 'none',
        value: 0,
        imageFile: 'card-back.jpg'
    };

    return (
        <div className="relative w-48 h-64" onClick={onClick} ref={deckRef}>
            <p className="text-white absolute -top-6 text-center w-full">Deck: {remainingCards}</p>
            {remainingCards > 0 ? (
                <CardComponent 
                    card={cardBack}
                />
            ) : (
                <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400">
                    Empty
                </div>
            )}
        </div>
    );
};
