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
        
        console.log(`🎴 DeckManager: Inicializado con ${this.deck.length} cartas para jugador y ${this.ecoDeck.length} cartas para Eco`);
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
            [this.ecoDeck[i], this.ecoDeck[j]] = [this.ecoDeck[j], this.ecoDeck[i]];
        }
    }

    drawCards(count: number = 1): Card[] {
        console.log(`🎴 DeckManager: Robando ${count} carta(s) para jugador. Mazo actual: ${this.deck.length}`);
        const drawnCards: Card[] = [];
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                console.log(`🔄 DeckManager: Mazo vacío, mezclando descarte (${this.discardPile.length} cartas)`);
                this.deck = [...this.discardPile];
                this.discardPile = [];
                this.shuffle();
            }
            if (this.deck.length > 0) {
                const card = this.deck.pop()!;
                drawnCards.push(card);
                console.log(`✅ DeckManager: Robada carta: ${card.rank} de ${card.suit}`);
            }
        }
        return drawnCards;
    }

    drawFromEcoDeck(count: number = 1): Card[] {
        console.log(`🧪 DeckManager: Eco robando ${count} carta(s). Mazo Eco actual: ${this.ecoDeck.length}`);
        const drawnCards: Card[] = [];
        for (let i = 0; i < count; i++) {
            if (this.ecoDeck.length === 0) {
                console.log(`🔄 DeckManager: Mazo Eco vacío, mezclando descarte (${this.ecoDiscardPile.length} cartas)`);
                this.ecoDeck = [...this.ecoDiscardPile];
                this.ecoDiscardPile = [];
                this.shuffleEcoDeck();
            }
            if (this.ecoDeck.length > 0) {
                const card = this.ecoDeck.pop()!;
                drawnCards.push(card);
                console.log(`✅ DeckManager: Eco robó carta: ${card.rank} de ${card.suit}`);
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
