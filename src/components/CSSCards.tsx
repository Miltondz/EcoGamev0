// src/components/CSSCards.tsx

import React from 'react';
import { gameStateManager } from '../engine/GameStateManager';
import { turnManager } from '../engine/TurnManager';

export const CSSCards: React.FC = () => {
  const cards = gameStateManager.hand;

  const handleCardClick = (card: any) => {
    console.log('Playing card:', card);
    turnManager.playCard(card);
  };

  const getSuitColor = (suit: string) => {
    switch (suit) {
      case 'Hearts': return '#dc2626'; // Red
      case 'Diamonds': return '#dc2626'; // Red
      case 'Spades': return '#1f2937'; // Black
      case 'Clubs': return '#1f2937'; // Black
      default: return '#6b7280'; // Gray
    }
  };

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'Hearts': return '♥';
      case 'Diamonds': return '♦';
      case 'Spades': return '♠';
      case 'Clubs': return '♣';
      default: return '?';
    }
  };

  if (cards.length === 0) {
    return (
      <div className="css-cards-container">
        <div className="no-cards">No cards in hand</div>
      </div>
    );
  }

  return (
    <div className="css-cards-container">
      <div className="cards-hand">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="css-card"
            onClick={() => handleCardClick(card)}
            style={{
              left: `${index * 80}px`,
              zIndex: index,
            }}
          >
            <div className="card-content">
              <div 
                className="card-rank top-left"
                style={{ color: getSuitColor(card.suit) }}
              >
                {card.rank}
              </div>
              <div 
                className="card-suit center"
                style={{ color: getSuitColor(card.suit) }}
              >
                {getSuitSymbol(card.suit)}
              </div>
              <div 
                className="card-rank bottom-right"
                style={{ color: getSuitColor(card.suit) }}
              >
                {card.rank}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
