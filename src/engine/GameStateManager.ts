// src/engine/GameStateManager.ts

import type { Card } from './types';
import { scenarioLoader } from './ScenarioLoader';
import { deckManager } from './DeckManager';
import { floatingNumbersSystem } from './FloatingNumbersSystem';

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
    
    // Card selection and interaction state
    private _selectedCards: Card[] = [];
    private _currentAction: 'none' | 'repair' | 'focus' | 'search' = 'none';
    private _targetNodeId: string | null = null;
    private _isNodeSelectionMode: boolean = false;

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
    get selectedCards() { return this._selectedCards; }
    get currentAction() { return this._currentAction; }
    get targetNodeId() { return this._targetNodeId; }
    get isNodeSelectionMode() { return this._isNodeSelectionMode; }

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
    set criticalDamageBoost(value: number) { this._criticalDamageBoost = value; this.notify(); }

    clearCardsToDraw() {
        this._cardsToDraw = [];
        this.notify();
    }
    
    // Card selection methods
    selectCard(card: Card) {
        if (!this._selectedCards.find(c => c.id === card.id)) {
            this._selectedCards.push(card);
            this.notify();
        }
    }
    
    deselectCard(card: Card) {
        this._selectedCards = this._selectedCards.filter(c => c.id !== card.id);
        this.notify();
    }
    
    clearSelectedCards() {
        this._selectedCards = [];
        this.notify();
    }
    
    setCurrentAction(action: 'none' | 'repair' | 'focus' | 'search') {
        this._currentAction = action;
        this.notify();
    }
    
    setNodeSelectionMode(enabled: boolean) {
        this._isNodeSelectionMode = enabled;
        if (!enabled) {
            this._targetNodeId = null;
        }
        this.notify();
    }
    
    setTargetNode(nodeId: string | null) {
        this._targetNodeId = nodeId;
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
            this._selectedCards = [];
            this._currentAction = 'none';
            this._targetNodeId = null;
            this._isNodeSelectionMode = false;
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
            this._selectedCards = [];
            this._currentAction = 'none';
            this._targetNodeId = null;
            this._isNodeSelectionMode = false;
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
        const oldHp = this.ecoHp;
        this.ecoHp = Math.max(0, this.ecoHp - amount);
        const actualDamage = oldHp - this.ecoHp;
        
        // 📊 Mostrar números flotantes sobre el retrato del ECO
        if (actualDamage > 0) {
            // Posición aproximada del retrato del ECO (esto puede ajustarse)
            const ecoPortraitPosition = { x: 1100, y: 300 }; // Esquina superior derecha
            floatingNumbersSystem.showDamage(actualDamage, ecoPortraitPosition);
            console.log(`❤️ GameState: ECO recibió ${actualDamage} de daño - mostrando números flotantes`);
        }
        
        this.checkForGameOver();
    }

    recoverSanity(amount: number) {
        const oldSanity = this.sanity;
        this.sanity = Math.min(this._maxSanity, this.sanity + amount);
        const actualHealing = this.sanity - oldSanity;
        
        // 📊 Mostrar números flotantes de curación de cordura
        if (actualHealing > 0) {
            const playerSanityPosition = { x: 180, y: 350 };
            floatingNumbersSystem.showSanityHealing(actualHealing, playerSanityPosition);
            console.log(`🌿 GameState: Jugador recuperó ${actualHealing} de cordura - mostrando números flotantes`);
        }
    }

    addCardsToHand(cards: Card[]) {
        if (!cards || cards.length === 0) return;
        this.hand = [...this.hand, ...cards];
    }

    dealDamageToPlayer(amount: number) {
        const oldPv = this.pv;
        this.pv = Math.max(0, this.pv - amount);
        const actualDamage = oldPv - this.pv;
        
        // 📊 Mostrar números flotantes sobre el retrato del jugador
        if (actualDamage > 0) {
            // Posición aproximada del retrato del jugador (esto puede ajustarse)
            const playerPortraitPosition = { x: 180, y: 300 }; // Esquina superior izquierda
            floatingNumbersSystem.showDamage(actualDamage, playerPortraitPosition);
            console.log(`👤 GameState: Jugador recibió ${actualDamage} de daño HP - mostrando números flotantes`);
        }
        
        this.checkForGameOver();
    }

    dealSanityDamage(amount: number) {
        const oldSanity = this.sanity;
        this.sanity = Math.max(0, this.sanity - amount);
        const actualDamage = oldSanity - this.sanity;
        
        // 📊 Mostrar números flotantes de cordura sobre el retrato del jugador
        if (actualDamage > 0) {
            // Posición ligeramente desplazada para cordura
            const playerSanityPosition = { x: 180, y: 350 }; // Un poco más abajo que HP
            floatingNumbersSystem.showSanityDamage(actualDamage, playerSanityPosition);
            console.log(`🧠 GameState: Jugador recibió ${actualDamage} de daño de cordura - mostrando números flotantes`);
        }
        
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