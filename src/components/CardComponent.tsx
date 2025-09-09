// src/components/CardComponent.tsx

import React from 'react';
import type { Card as CardType } from '../engine/types';

interface CardProps {
    card: CardType;
    // Style prop for motion component
    style?: React.CSSProperties;
}

export const CardComponent: React.FC<CardProps> = ({ 
    card,
    ...motionProps
}) => {

    return (
        <div 
            id={`card-container-${card.id}`}
            className="card"
            {...motionProps}
        >
            <img src={`/images/decks/default/${card.imageFile}`} alt="Card" className="card-image" />
            {card.value > 0 && <div className="card-power-indicator">{card.value}</div>}
        </div>
    );
};
