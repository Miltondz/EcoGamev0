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
import { scenarioEventsEngine } from './ScenarioEventsEngine';
// import { chapterManager } from './ChapterManager'; // Reserved for future use
import { scoreSystem } from './ScoreSystem';
import type { Card, Event, HallucinationCard, DynamicEvent } from './types';

class TurnManager {
    public currentEvent: Event | null = null;
    public currentEventCard: Card | null = null;
    public currentDynamicEvent: DynamicEvent | null = null;
    public onEventShow: ((eventCard: Card, event: DynamicEvent) => void) | null = null;
    private lastTurnPV: number = 20;
    private lastTurnSanity: number = 20;

    async startGame(scenarioId: string = 'default') {
        console.log(`🎮 TurnManager: Iniciando juego con escenario '${scenarioId}'`);
        try {
            await scenarioLoader.load(scenarioId);
            console.log(`✅ TurnManager: Escenario cargado exitosamente`);
            
            // IMPORTANTE: Resetear todo el estado del juego para nueva partida
            console.log(`🔄 TurnManager: Reseteando estado completo del juego`);
            deckManager.reset(); // Asegurar que los mazos estén limpios
            nodeSystem.initialize();
            gameStateManager.reset();
            
            // Repartir cartas al ECO
            const ecoHand = deckManager.drawFromEcoDeck(5);
            ecoAI.setHand(ecoHand);
            console.log(`🤖 TurnManager: ECO recibio ${ecoHand.length} cartas`);
            
            // NO REPARTIR CARTAS AQUÍ - se hará después de mostrar narrativa inicial
            console.log(`🎮 TurnManager: Inicialización completa, esperando repartir cartas después de narrativa`);
            
        } catch (error) {
            console.error('Error starting game:', error);
            gameLogSystem.addMessage('Error al iniciar el juego. Usando configuración por defecto.', 'system', 'info');
            // Continue with game initialization even if scenario loading fails
            nodeSystem.initialize();
            gameStateManager.reset();
        }
    }
    
    // Nueva función para completar el inicio del juego después de la narrativa
    completeGameStart() {
        console.log(`🎴 TurnManager: Completando inicio del juego`);
        console.log(`🎴 TurnManager: Jugador actual tiene ${gameStateManager.hand.length} cartas`);
        console.log(`🎴 TurnManager: Debe tener ${gameStateManager.maxHandSize} cartas`);
        
        // Solo repartir cartas si el jugador no las tiene ya
        if (gameStateManager.hand.length === 0) {
            console.log(`🎴 TurnManager: Repartiendo ${gameStateManager.maxHandSize} cartas al jugador`);
            this.drawPlayerHand(gameStateManager.maxHandSize);
        } else {
            console.log(`🎴 TurnManager: Jugador ya tiene ${gameStateManager.hand.length} cartas, no repartiendo más`);
        }
        
        console.log(`🔄 TurnManager: Avanzando a la primera fase`);
        this.advancePhase();
    }

    advancePhase() {
        if (gameStateManager.isGameOver) {
            console.log(`🏁 TurnManager: Juego terminado, no avanzando fase`);
            return;
        }

        console.log(`🔄 TurnManager: Fase actual: ${gameStateManager.phase}`);
        
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
                console.warn(`⚠️ TurnManager: Fase desconocida: ${gameStateManager.phase}`);
                return;
        }
        console.log(`➡️ TurnManager: Avanzando a fase: ${nextPhase}`);
        gameStateManager.phase = nextPhase;
        setTimeout(() => this.advancePhase(), 50);
    }

    endPlayerTurn() {
        if (gameStateManager.phase === GamePhase.PLAYER_ACTION) {
            // Score for turn completion
            const damageThisTurn = this.calculateDamageThisTurn();
            scoreSystem.scoreTurnSurvival(gameStateManager.turn, damageThisTurn);
            
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

        // Calcular posiciones reales para efectos VFX
        const startPosition = uiPositionManager.get('playerHand') || { 
            x: window.innerWidth / 2, 
            y: window.innerHeight - 120 
        };
        
        // Posición del ECO (lado derecho superior)
        const endPosition = uiPositionManager.get('eco') || { 
            x: window.innerWidth - 200, 
            y: 150 
        };
        
        console.log(`🎯 TurnManager: Triggering VFX from`, startPosition, 'to', endPosition, 'for suit', card.suit);
        vfxSystem.triggerSuitEffect(card.suit, startPosition, endPosition);

        gameStateManager.hand = gameStateManager.hand.filter(c => c.id !== card.id);
        
        // Score for card play with efficiency check
        const wasEfficient = gameStateManager.pa === 1; // Spending last AP
        scoreSystem.scoreCardPlay(card, wasEfficient);
        
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
        
        // Score for resource management
        scoreSystem.addScore('resource_saved', undefined, { action: 'focus', card: cardToDiscard });
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
        
        // Score for strategic card draw
        scoreSystem.addScore('resource_saved', undefined, { action: 'draw' });
    }

    private drawPlayerHand(count: number) {
        const startPosition = uiPositionManager.get('deck') || { x: window.innerWidth / 2, y: 0 };
        
        // Use screen-centered temporary positions that will be corrected by updateHand
        const tempEndPosition = {
            x: window.innerWidth / 2,
            y: window.innerHeight - 120
        };
        
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
                    endPosition: { x: tempEndPosition.x + (i - count/2) * 50, y: tempEndPosition.y },
                    delay: i * 0.2,
                });
            }
        }
    }

    private executeEventPhase() {
        gameLogSystem.addMessage(`Turno ${gameStateManager.turn}: Fase de Evento`, 'system', 'info');
        
        // Los eventos solo se activan después del turno 3
        if (gameStateManager.turn <= 3) {
            console.log(`🛡️ TurnManager: Eventos desactivados - Turno ${gameStateManager.turn} (eventos activos desde turno 4)`);
            gameLogSystem.addMessage(`Turno ${gameStateManager.turn}: Los eventos se activan a partir del turno 4.`, 'system', 'info');
            return;
        }
        
        // Revelar carta superior del mazo para el evento
        const eventCard = deckManager.drawCards(1)[0];
        if (!eventCard) {
            gameLogSystem.addMessage("No quedan cartas para eventos.", 'system', 'info');
            return;
        }
        
        console.log(`📅 TurnManager: Procesando evento para carta ${eventCard.id}`);
        
        // Guardar carta del evento actual para referencia
        this.currentEventCard = eventCard;
        
        // Intentar usar el sistema de eventos dinámicos
        if (scenarioEventsEngine.hasEvents) {
            const result = scenarioEventsEngine.processEvent(eventCard);
            if (result.processed && result.event) {
                this.currentDynamicEvent = result.event;
                
                // Mostrar evento visual si hay callback registrado
                if (this.onEventShow) {
                    console.log(`🎭 TurnManager: Mostrando evento visual: ${result.event.event}`);
                    this.onEventShow(eventCard, result.event);
                } else {
                    // Fallback al log si no hay sistema visual
                    gameLogSystem.addMessage(`🎭 ${result.event.event}`, 'system', 'info');
                    gameLogSystem.addMessage(result.event.flavor, 'system', 'info');
                }
                
                // Score for handling events
                scoreSystem.scoreEventHandling(result.event.event, 'success');
                
                console.log(`📅 TurnManager: Evento dinámico procesado: ${result.event.event}`);
            } else {
                gameLogSystem.addMessage(`Evento desconocido para carta ${eventCard.rank} de ${eventCard.suit}`, 'system', 'info');
                this.currentDynamicEvent = null;
                // Descartar inmediatamente si no hay evento
                deckManager.discard([eventCard]);
            }
        } else {
            // Fallback: usar sistema de eventos original si existe
            gameLogSystem.addMessage(`Evento no procesado para carta ${eventCard.rank} de ${eventCard.suit}`, 'system', 'info');
            this.currentDynamicEvent = null;
            // Descartar inmediatamente si no hay sistema de eventos
            deckManager.discard([eventCard]);
        }
        
        // No descartar la carta inmediatamente si hay sistema visual - se descarta cuando se cierra el modal
        // La carta se descartará cuando se cierre el modal del evento
    }
    
    private calculateDamageThisTurn(): number {
        const currentPV = gameStateManager.pv;
        const currentSanity = gameStateManager.sanity;
        
        const pvDamage = Math.max(0, this.lastTurnPV - currentPV);
        const sanityDamage = Math.max(0, this.lastTurnSanity - currentSanity);
        
        const totalDamage = pvDamage + sanityDamage;
        
        // Update for next turn
        this.lastTurnPV = currentPV;
        this.lastTurnSanity = currentSanity;
        
        return totalDamage;
    }
    
    // private updateTurnTracking() {
    //     this.lastTurnPV = gameStateManager.pv;
    //     this.lastTurnSanity = gameStateManager.sanity;
    // }

    private executePlayerActionPhase() {
        console.log(`💪 TurnManager: Ejecutando fase de acción del jugador`);
        gameLogSystem.addMessage(`Turno ${gameStateManager.turn}: Es tu turno. Tienes ${gameStateManager.maxAP} PA.`, 'player', 'info');
        gameStateManager.pa = gameStateManager.maxAP;
        console.log(`💪 TurnManager: PA del jugador restablecidos a: ${gameStateManager.pa}`);
    }

    private executeEcoAttackPhase() {
        console.log(`🔴 TurnManager: Ejecutando fase de ataque del Eco`);
        gameLogSystem.addMessage(`Turno ${gameStateManager.turn}: Fase de Ataque del Eco`, 'eco', 'info');
        
        console.log(`🧪 TurnManager: Llamando a ecoAI.takeTurn()`);
        ecoAI.takeTurn();
        
        setTimeout(() => {
            console.log(`⏱️ TurnManager: Timeout completado, verificando fase actual`);
            if (gameStateManager.phase === GamePhase.ECO_ATTACK) {
                console.log(`➡️ TurnManager: Avanzando de ECO_ATTACK a MAINTENANCE`);
                gameStateManager.phase = GamePhase.MAINTENANCE;
                this.advancePhase();
            } else {
                console.log(`⚠️ TurnManager: Fase cambió durante timeout: ${gameStateManager.phase}`);
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