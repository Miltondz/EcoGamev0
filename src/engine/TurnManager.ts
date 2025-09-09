// src/engine/TurnManager.ts

import { gameStateManager, GamePhase } from './GameStateManager';
import { deckManager } from './DeckManager';
import { ecoAI } from './EcoAI';
import { hallucinationSystem } from './HallucinationSystem';
import { scenarioLoader } from './ScenarioLoader';
import { cardEffectEngine } from './CardEffectEngine';
import { nodeSystem } from './NodeSystem';
import { gameLogSystem } from './GameLogSystem';
import { vfxSystem } from './VFXSystem';
import { uiPositionManager } from './UIPositionManager';
import type { Card, Event, HallucinationCard } from './types';

class TurnManager {
    public currentEvent: Event | null = null;

    async startGame(scenarioId: string = 'default') {
        try {
            await scenarioLoader.load(scenarioId);
            nodeSystem.initialize();
            gameStateManager.reset();
            const ecoHand = deckManager.drawFromEcoDeck(5);
            ecoAI.setHand(ecoHand);
            this.drawPlayerHand(gameStateManager.maxHandSize);
            this.advancePhase();
        } catch (error) {
            console.error('Error starting game:', error);
            gameLogSystem.addMessage('Error starting game. Using default settings.', 'system', 'info');
            // Continue with game initialization even if scenario loading fails
            nodeSystem.initialize();
            gameStateManager.reset();
            this.drawPlayerHand(gameStateManager.maxHandSize);
            this.advancePhase();
        }
    }

    advancePhase() {
        if (gameStateManager.isGameOver) return;

        let nextPhase: GamePhase;
        switch (gameStateManager.phase) {
            case GamePhase.EVENT:
                this.executeEventPhase();
                nextPhase = GamePhase.PLAYER_ACTION;
                break;
            case GamePhase.PLAYER_ACTION:
                this.executePlayerActionPhase();
                return; // Wait for player input
            case GamePhase.ECO_ATTACK:
                this.executeEcoAttackPhase();
                nextPhase = GamePhase.MAINTENANCE;
                break;
            case GamePhase.MAINTENANCE:
                this.executeMaintenancePhase();
                nextPhase = GamePhase.EVENT;
                break;
            default:
                return;
        }
        gameStateManager.phase = nextPhase;
        setTimeout(() => this.advancePhase(), 50);
    }

    endPlayerTurn() {
        if (gameStateManager.phase === GamePhase.PLAYER_ACTION) {
            gameStateManager.removePlayerStatusEffect('cannotPlaySpades');
            gameStateManager.phase = GamePhase.ECO_ATTACK;
            this.advancePhase();
        }
    }

    playCard(card: Card) {
        if (gameStateManager.phase !== GamePhase.PLAYER_ACTION) {
            gameLogSystem.addMessage("Cannot play card: not player's turn.", 'system', 'info');
            return;
        }

        if (gameStateManager.pa < 1) {
            gameLogSystem.addMessage("Cannot play card: no AP remaining.", 'system', 'info');
            return;
        }

        const startPosition = uiPositionManager.get('playerHand') || { x: 0, y: 0 };
        const endPosition = uiPositionManager.get('eco') || { x: 0, y: 0 };
        vfxSystem.triggerSuitEffect(card.suit, startPosition, endPosition);

        gameStateManager.hand = gameStateManager.hand.filter(c => c.id !== card.id);
        cardEffectEngine.applyEffect(card);
    }

    performFocus(cardToDiscard: Card) {
        if (gameStateManager.phase !== GamePhase.PLAYER_ACTION) {
            gameLogSystem.addMessage("Cannot focus: not player's turn.", 'system', 'info');
            return;
        }

        if (gameStateManager.pa < 1) {
            gameLogSystem.addMessage("Cannot focus: no AP remaining.", 'system', 'info');
            return;
        }

        gameStateManager.spendActionPoints(1);
        gameStateManager.hand = gameStateManager.hand.filter(c => c.id !== cardToDiscard.id);
        deckManager.discard([cardToDiscard]);
        this.drawPlayerHand(1);
        gameLogSystem.addMessage(`Focused, discarded ${cardToDiscard.rank} and drew a new card.`, 'player', 'focus');
    }

    drawCard() {
        if (gameStateManager.phase !== GamePhase.PLAYER_ACTION) {
            gameLogSystem.addMessage("Cannot draw card: not player's turn.", 'system', 'info');
            return;
        }

        if (gameStateManager.pa <= 0) {
            gameLogSystem.addMessage("Cannot draw card: no AP remaining.", 'system', 'info');
            return;
        }

        gameStateManager.spendActionPoints(1);
        this.drawPlayerHand(1);
        gameLogSystem.addMessage('Spent 1 AP to draw a card.', 'player', 'draw');
    }

    private drawPlayerHand(count: number) {
        const startPosition = uiPositionManager.get('deck') || { x: 0, y: 0 };
        const endPosition = uiPositionManager.get('playerHand') || { x: 0, y: 0 };
        
        for (let i = 0; i < count; i++) {
            const cards = deckManager.drawCards(1);
            const card = cards.length > 0 ? cards[0] : null;
            
            if (!card) {
                gameLogSystem.addMessage("No more cards to draw.", 'system', 'info');
                break;
            }

            if ('isHallucination' in card && (card as HallucinationCard).isHallucination) {
                hallucinationSystem.applyHallucinationEffect(card as HallucinationCard);
                deckManager.discard([card]);
                i--; // Don't count hallucinations towards the draw count
            } else {
                gameStateManager.hand.push(card);
                vfxSystem.dealCard({
                    card,
                    startPosition,
                    endPosition: { x: endPosition.x + i * 100, y: endPosition.y },
                    delay: i * 0.2,
                });
            }
        }
    }

    private executeEventPhase() {
        gameLogSystem.addMessage(`Turn ${gameStateManager.turn}: Event Phase`, 'system', 'info');
    }

    private executePlayerActionPhase() {
        gameLogSystem.addMessage(`Turn ${gameStateManager.turn}: Player Action Phase`, 'system', 'info');
        gameStateManager.pa = gameStateManager.maxAP;
    }

    private executeEcoAttackPhase() {
        gameLogSystem.addMessage(`Turn ${gameStateManager.turn}: Eco Attack Phase`, 'eco', 'info');
        ecoAI.takeTurn();
        setTimeout(() => {
            if (gameStateManager.phase === GamePhase.ECO_ATTACK) {
                gameStateManager.phase = GamePhase.MAINTENANCE;
                this.advancePhase();
            }
        }, 2000);
    }

    private executeMaintenancePhase() {
        gameLogSystem.addMessage(`Turn ${gameStateManager.turn}: Maintenance Phase`, 'system', 'info');
        deckManager.discard(gameStateManager.hand);
        gameStateManager.hand = [];
        hallucinationSystem.increase(1);
        this.drawPlayerHand(gameStateManager.maxHandSize);
        gameStateManager.turn++;
    }
}

export const turnManager = new TurnManager();