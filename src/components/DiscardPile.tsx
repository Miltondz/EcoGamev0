// src/components/DiscardPile.tsx

import React from 'react';
import { CardComponent } from './CardComponent';
import { deckManager } from '../engine/DeckManager';

export const DiscardPile: React.FC = () => {
    const discardPile = deckManager.getDiscardPile();
    const topCard = discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

    return (
        <div className="relative w-48 h-64">
            <p className="text-white absolute -top-6 text-center w-full">Discard: {discardPile.length}</p>
            {topCard ? (
                <CardComponent 
                    card={topCard}
                />
            ) : (
                <div className="w-full h-full rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center text-gray-400">
                    Empty
                </div>
            )}
        </div>
    );
};
