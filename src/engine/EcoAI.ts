// src/engine/EcoAI.ts

import { gameStateManager } from './GameStateManager';
import { nodeSystem } from './NodeSystem';
import { scenarioLoader } from './ScenarioLoader';
import { deckManager } from './DeckManager';
import { gameLogSystem } from './GameLogSystem';
import { hallucinationSystem } from './HallucinationSystem';
import { scenarioRulesEngine } from './ScenarioRulesEngine';
import { vfxSystem } from './VFXSystem';
import type { Card } from './types';

export class EcoAI {
    public hand: Card[] = [];
    public currentPhase: string = 'vigilante';

    setHand(hand: Card[]) {
        this.hand = hand;
    }

    takeTurn() {
        console.log(`🧪 EcoAI: Iniciando turno del Eco`);
        this.updatePhase();
        console.log(`🧪 EcoAI: Fase actual del Eco: ${this.currentPhase}`);
        gameLogSystem.addMessage(`El Eco entra en fase ${this.currentPhase}.`, 'eco', 'info');
        
        const card = deckManager.drawFromEcoDeck(1)[0];
        if (!card) {
            console.log(`⚠️ EcoAI: No hay cartas para el Eco`);
            gameLogSystem.addMessage("El Eco no tiene cartas para jugar.", 'eco', 'info');
            return;
        }

        console.log(`🌃 EcoAI: Eco roba carta: ${card.rank} de ${card.suit}`);
        
        // Reveal the card to the UI
        gameStateManager.ecoRevealedCard = card;
        console.log(`👁️ EcoAI: Carta revelada al jugador`);

        // Trigger advanced VFX animation for ECO playing card
        const ecoHandPos = { x: 540, y: 80 }; // ECO hand area
        const centerPos = { x: 640, y: 300 }; // Center of play area
        
        console.log(`🎭 EcoAI: Triggering advanced ECO card play animation`);
        vfxSystem.ecoPlayCard({
            card,
            startPosition: ecoHandPos,
            centerPosition: centerPos
        });

        // Wait for animations, then execute the attack
        setTimeout(() => {
            console.log(`⚔️ EcoAI: Ejecutando ataque con carta revelada`);
            this.executeAttack(card);

            // Phase-specific special actions
            if (this.currentPhase === 'predador' && Math.random() < 0.2) {
                gameLogSystem.addMessage("Eco performs a frenzied double attack!", 'eco', 'special');
                this.performDoubleAttack();
            } else {
                // Clear revealed card after a single attack
                gameStateManager.ecoRevealedCard = null;
            }

            if (this.currentPhase === 'predador') {
                hallucinationSystem.addHallucinationToDeck();
                gameLogSystem.addMessage("A hallucination seeps into your deck.", 'eco', 'hallucination');
            }
    
            if (this.currentPhase === 'devastador') {
                this.performDevastatiorActions();
            }

        }, 1500); // 1.5 second delay for the player to see the card
    }

    private performDoubleAttack() {
        const secondCard = deckManager.drawFromEcoDeck(1)[0];
        if (secondCard) {
            // Reveal second card briefly
            gameStateManager.ecoRevealedCard = secondCard;
            setTimeout(() => {
                this.executeAttack(secondCard);
                // Clear revealed card after the second attack
                gameStateManager.ecoRevealedCard = null;
            }, 1500);
        } else {
            // If no second card available, just clear the first card
            gameStateManager.ecoRevealedCard = null;
        }
    }

    private performDevastatiorActions() {
        const allNodes = nodeSystem.allNodes.filter(n => n.damage < n.maxDamage);
        if (allNodes.length > 0) {
            const randomNode = allNodes[Math.floor(Math.random() * allNodes.length)];
            nodeSystem.dealDamage(randomNode.id, 2);
            gameLogSystem.addMessage(`The Eco lashes out, damaging node ${randomNode.name}.`, 'eco', 'node_damage');
        }

        hallucinationSystem.addHallucinationToDeck();
        hallucinationSystem.addHallucinationToDeck();
        gameLogSystem.addMessage("Two hallucinations corrupt your deck.", 'eco', 'hallucination');
    }

    private executeAttack(card: Card) {
        if (!card) {
            gameLogSystem.addMessage("Eco attempted to attack but had no card.", 'eco', 'info');
            return;
        }

        // Intentar usar las reglas dinámicas para ataques del Eco
        if (scenarioRulesEngine.hasRules) {
            console.log(`🔴 EcoAI: Usando reglas dinámicas para ataque con ${card.rank} ${card.suit}`);
            scenarioRulesEngine.applyEcoAttackEffect(card);
            
            // Aplicar modificadores de fase si es devastador
            if (this.currentPhase === 'devastador') {
                gameLogSystem.addMessage("Fase Devastador: ¡Daño amplificado!", 'eco', 'special');
                // El modificador se puede aplicar en las reglas dinámicas o aquí
            }
            return;
        }

        // Fallback al sistema hardcoded original
        console.log(`🔴 EcoAI: Usando sistema hardcoded para ataque con ${card.rank} ${card.suit}`);
        
        let damage = card.value;
        const damageType: 'PV' | 'COR' = ['spades', 'clubs'].includes(card.suit.toLowerCase()) ? 'PV' : 'COR';

        if (this.currentPhase === 'devastador') {
            damage = Math.ceil(damage * 1.5);
            gameLogSystem.addMessage("Devastator phase: Damage amplified!", 'eco', 'special');
        }

        if (damageType === 'PV') {
            gameStateManager.dealDamageToPlayer(damage);
            gameLogSystem.addMessage(`Eco attacks with ${card.rank} of ${card.suit}, dealing ${damage} PV.`, 'eco', 'attack');
        } else {
            gameStateManager.dealSanityDamage(damage);
            gameLogSystem.addMessage(`Eco attacks with ${card.rank} of ${card.suit}, dealing ${damage} COR.`, 'eco', 'damage');
        }
    }

    private updatePhase() {
        try {
            const ecoHpPercent = (gameStateManager.ecoHp / gameStateManager.maxEcoHp) * 100;
            const { phases } = scenarioLoader.eco;
            const oldPhase = this.currentPhase;

            if (ecoHpPercent <= phases.devastador.threshold) {
                this.currentPhase = 'devastador';
            } else if (ecoHpPercent <= phases.predador.threshold) {
                this.currentPhase = 'predador';
            } else {
                this.currentPhase = 'vigilante';
            }

            if (this.currentPhase !== oldPhase) {
                gameLogSystem.addMessage(`Eco has transformed into the ${this.currentPhase}!`, 'eco', 'special');
            }
        } catch (error) {
            console.error('Error updating Eco phase:', error);
            // Fallback to vigilante phase if there's an error
            this.currentPhase = 'vigilante';
        }
    }
}

export const ecoAI = new EcoAI();