// src/engine/DeckManager.ts

import type { Card, Event, Suit } from './types';
import cardsData from '../data/cards.json';
import { scenarioLoader } from './ScenarioLoader';

function mapSuitToType(suit: string): Suit {
    switch (suit.toLowerCase()) {
        case 'spades': return 'Spades';
        case 'hearts': return 'Hearts';
        case 'clubs': return 'Clubs';
        case 'diamonds': return 'Diamonds';
        default: return 'none';
    }
}

class DeckManager {
    private deck: Card[] = [];
    private discardPile: Card[] = [];
    private ecoDeck: Card[] = [];
    private ecoDiscardPile: Card[] = [];
    private events: Event[] = [];

    constructor() {
        this.deck = cardsData.map(card => ({
            ...card,
            suit: mapSuitToType(card.suit),
        }));
        this.ecoDeck = cardsData.map(card => ({
            ...card,
            suit: mapSuitToType(card.suit),
        }));
        this.events = []; // Will be loaded from scenario
        this.shuffle();
        this.shuffleEcoDeck();
    }

    reset() {
        this.deck = cardsData.map(card => ({
            ...card,
            suit: mapSuitToType(card.suit),
        }));
        this.discardPile = [];
        this.ecoDeck = cardsData.map(card => ({
            ...card,
            suit: mapSuitToType(card.suit),
        }));
        this.ecoDiscardPile = [];
        this.shuffle();
        this.shuffleEcoDeck();
    }

    loadEvents() {
        this.events = scenarioLoader.events;
    }

    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    shuffleEcoDeck() {
        for (let i = this.ecoDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.ecoDeck[i], this.ecoDeck[j]] = [this.ecoDeck[j], this.deck[i]];
        }
    }

    drawCards(count: number = 1): Card[] {
        const drawnCards: Card[] = [];
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                this.deck = [...this.discardPile];
                this.discardPile = [];
                this.shuffle();
            }
            if (this.deck.length > 0) {
                drawnCards.push(this.deck.pop()!);
            }
        }
        return drawnCards;
    }

    drawFromEcoDeck(count: number = 1): Card[] {
        const drawnCards: Card[] = [];
        for (let i = 0; i < count; i++) {
            if (this.ecoDeck.length === 0) {
                this.ecoDeck = [...this.ecoDiscardPile];
                this.ecoDiscardPile = [];
                this.shuffleEcoDeck();
            }
            if (this.ecoDeck.length > 0) {
                drawnCards.push(this.ecoDeck.pop()!);
            }
        }
        return drawnCards;
    }

    discard(cards: Card[]) {
        this.discardPile.push(...cards);
    }

    discardToEcoPile(cards: Card[]) {
        this.ecoDiscardPile.push(...cards);
    }

    getEvent(cardId: string): Event | undefined {
        return this.events.find(event => event.id === cardId);
    }

    addCardToDeck(card: Card) {
        this.deck.push(card);
    }

    getDeckCount(): number {
        return this.deck.length;
    }

    getDiscardPile(): Card[] {
        return this.discardPile;
    }
}

export const deckManager = new DeckManager();
