// src/engine/HallucinationSystem.ts
import { deckManager } from './DeckManager';
import { gameStateManager } from './GameStateManager';
import { gameLogSystem } from './GameLogSystem';
import type { HallucinationCard } from './types';

const hallucinationCards: HallucinationCard[] = [
    {
        id: 'hallucination-1',
        suit: 'none',
        rank: 'hallucination',
        value: 0,
        imageFile: 'missing-card.jpg',
        isHallucination: true,
        effect: 'lose_sanity',
        description: 'Your family calls to you from the riverbank. You lose 2 COR.',
    },
    {
        id: 'hallucination-2',
        suit: 'none',
        rank: 'hallucination',
        value: 0,
        imageFile: 'missing-card.jpg',
        isHallucination: true,
        effect: 'discard_hand',
        description: 'The lighthouse ignites with your heart. Discard your entire hand.',
    },
    {
        id: 'hallucination-3',
        suit: 'none',
        rank: 'hallucination',
        value: 0,
        imageFile: 'missing-card.jpg',
        isHallucination: true,
        effect: 'cannot_play_spades',
        description: 'You hear footsteps behind you. You cannot play Spades this turn.',
    },
];

class HallucinationSystem {
    private hallucinationLevel: number = 0;

    get level() {
        return this.hallucinationLevel;
    }

    increase(amount: number) {
        this.hallucinationLevel += amount;
        gameLogSystem.addMessage(`Hallucination level increased to ${this.hallucinationLevel}`);
    }

    decrease(amount: number) {
        this.hallucinationLevel = Math.max(0, this.hallucinationLevel - amount);
        gameLogSystem.addMessage(`Hallucination level decreased to ${this.hallucinationLevel}`);
    }

    addHallucinationToDeck() {
        const card = hallucinationCards[Math.floor(Math.random() * hallucinationCards.length)];
        deckManager.addCardToDeck(card);
        deckManager.shuffle();
    }

    applyHallucinationEffect(card: HallucinationCard) {
        gameLogSystem.addMessage(`Hallucination effect: ${card.description}`);
        switch (card.effect) {
            case 'lose_sanity':
                gameStateManager.dealSanityDamage(2);
                break;
            case 'discard_hand':
                deckManager.discard(gameStateManager.hand);
                gameStateManager.hand = [];
                break;
            case 'cannot_play_spades':
                gameStateManager.addPlayerStatusEffect('cannotPlaySpades');
                break;
        }
    }
}

export const hallucinationSystem = new HallucinationSystem();
