// src/engine/GameStateManager.ts

import type { Card } from './types';
import { scenarioLoader } from './ScenarioLoader';
import { deckManager } from './DeckManager';

export enum GamePhase {
    EVENT,
    PLAYER_ACTION,
    ECO_ATTACK,
    MAINTENANCE,
    GAME_OVER,
}

type PlayerStatusEffect = 'cannotPlaySpades';

class GameStateManager {
    private _pv: number = 20;
    private _sanity: number = 20;
    private _pa: number = 2;
    private _hand: Card[] = [];
    private _phase: GamePhase = GamePhase.EVENT;
    private _turn: number = 1;
    private _ecoHp: number = 50;
    private _isEcoExposed: boolean = false;
    private _victory: boolean | null = null;
    private _playerStatusEffects: PlayerStatusEffect[] = [];
    private _ecoRevealedCard: Card | null = null;
    private _cardsToDraw: Card[] = [];

    private _maxAP: number = 2;
    private _maxHandSize: number = 5;
    private _maxSanity: number = 20;
    private _criticalDamageBoost: number = 0;
    private _maxEcoHp: number = 50;

    private listeners: (() => void)[] = [];

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    get pv() { return this._pv; }
    get sanity() { return this._sanity; }
    get pa() { return this._pa; }
    get hand() { return this._hand; }
    get phase() { return this._phase; }
    get turn() { return this._turn; }
    get ecoHp() { return this._ecoHp; }
    get isEcoExposed() { return this._isEcoExposed; }
    get isGameOver() { return this._victory !== null; }
    get victory() { return this._victory; }
    get playerStatusEffects() { return this._playerStatusEffects; }
    get ecoRevealedCard() { return this._ecoRevealedCard; }
    get maxEcoHp() { return this._maxEcoHp; }
    get cardsToDraw() { return this._cardsToDraw; }
    get maxAP() { return this._maxAP; }
    get maxHandSize() { return this._maxHandSize; }
    get criticalDamageBoost() { return this._criticalDamageBoost; }
    get maxPV() { return 20; } // Valor máximo hardcoded por ahora
    get maxSanity() { return this._maxSanity; }

    set pv(value: number) { this._pv = Math.max(0, value); this.notify(); }
    set sanity(value: number) { this._sanity = Math.max(0, value); this.notify(); }
    set pa(value: number) { this._pa = Math.max(0, value); this.notify(); }
    set hand(value: Card[]) { this._hand = value; this.notify(); }
    set phase(value: GamePhase) { this._phase = value; this.notify(); }
    set turn(value: number) { this._turn = value; this.notify(); }
    set ecoHp(value: number) { this._ecoHp = Math.max(0, value); this.notify(); }
    set isEcoExposed(value: boolean) { this._isEcoExposed = value; this.notify(); }
    set victory(value: boolean | null) { this._victory = value; this.notify(); }
    set playerStatusEffects(value: PlayerStatusEffect[]) { this._playerStatusEffects = value; this.notify(); }
    set ecoRevealedCard(value: Card | null) { this._ecoRevealedCard = value; this.notify(); }

    clearCardsToDraw() {
        this._cardsToDraw = [];
        this.notify();
    }

    reset() {
        try {
            const config = scenarioLoader.config;
            this._pv = config.initialPlayerStats.PV;
            this._sanity = config.initialPlayerStats.COR;
            this._pa = config.initialPlayerStats.PA;
            this._maxAP = config.initialPlayerStats.PA;
            this._maxHandSize = config.initialPlayerStats.handSize;
            this._ecoHp = config.initialEcoHP;
            this._maxEcoHp = config.initialEcoHP;
            this._hand = [];
            this._phase = GamePhase.EVENT;
            this._turn = 1;
            this._isEcoExposed = false;
            this._victory = null;
            this._playerStatusEffects = [];
            this._ecoRevealedCard = null;
            this._cardsToDraw = [];
            this.notify();
        } catch (error) {
            console.error('Error resetting game state:', error);
            // Fallback to default values
            this._pv = 20;
            this._sanity = 20;
            this._pa = 2;
            this._maxAP = 2;
            this._maxHandSize = 5;
            this._ecoHp = 50;
            this._maxEcoHp = 50;
            this._hand = [];
            this._phase = GamePhase.EVENT;
            this._turn = 1;
            this._isEcoExposed = false;
            this._victory = null;
            this._playerStatusEffects = [];
            this._ecoRevealedCard = null;
            this._cardsToDraw = [];
            this.notify();
        }
    }

    spendActionPoints(amount: number) {
        if (this.pa >= amount) {
            this.pa -= amount;
            return true;
        }
        return false;
    }

    dealDamageToEco(amount: number) {
        this.ecoHp = Math.max(0, this.ecoHp - amount);
        this.checkForGameOver();
    }

    recoverSanity(amount: number) {
        this.sanity = Math.min(this._maxSanity, this.sanity + amount);
    }

    addCardsToHand(cards: Card[]) {
        if (!cards || cards.length === 0) return;
        this.hand = [...this.hand, ...cards];
    }

    dealDamageToPlayer(amount: number) {
        this.pv = Math.max(0, this.pv - amount);
        this.checkForGameOver();
    }

    dealSanityDamage(amount: number) {
        this.sanity = Math.max(0, this.sanity - amount);
        this.checkForGameOver();
    }

    addPlayerStatusEffect(effect: PlayerStatusEffect) {
        if (!this._playerStatusEffects.includes(effect)) {
            this._playerStatusEffects.push(effect);
            this.notify();
        }
    }

    removePlayerStatusEffect(effect: PlayerStatusEffect) {
        this._playerStatusEffects = this._playerStatusEffects.filter(e => e !== effect);
        this.notify();
    }

    checkForGameOver() {
        if (this.pv <= 0 || this.sanity <= 0 || deckManager.getDeckCount() === 0) {
            this.victory = false;
            this.phase = GamePhase.GAME_OVER;
        } else if (this.ecoHp <= 0) {
            this.victory = true;
            this.phase = GamePhase.GAME_OVER;
        }
    }
}

export const gameStateManager = new GameStateManager();