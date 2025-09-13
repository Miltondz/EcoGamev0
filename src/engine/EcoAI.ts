// src/engine/EcoAI.ts

import { gameStateManager } from './GameStateManager';
import { nodeSystem } from './NodeSystem';
import { ecoStateSystem } from './EcoStateSystem';
import { deckManager } from './DeckManager';
import { gameLogSystem } from './GameLogSystem';
import { hallucinationSystem } from './HallucinationSystem';
import { scenarioRulesEngine } from './ScenarioRulesEngine';
import { vfxSystem } from './VFXSystem';
import { chapterManager } from './ChapterManager';
import { scoreSystem } from './ScoreSystem';
import { audioManager } from './AudioManager';
import type { Card } from './types';

export class EcoAI {
    public hand: Card[] = [];
    public currentPhase: string = 'vigilante';
    private difficultyMultiplier: number = 1.0;

    setHand(hand: Card[]) {
        this.hand = hand;
    }

    takeTurn() {
        console.log(`🧪 EcoAI: Iniciando turno del Eco`);
        this.updateDifficultyMultiplier();
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
            
            // Discard the used card to ECO discard pile
            deckManager.discardToEcoPile([card]);
            
            // Trigger fire discard effect after attack
            setTimeout(() => {
                console.log(`🔥 EcoAI: Triggering fire discard effect for used card`);
                vfxSystem.ecoDiscardCard({
                    card,
                    position: centerPos
                });
            }, 500);

            // Phase-specific special actions with difficulty scaling
            const doubleAttackChance = this.getPhaseSpecialChance('predador', 0.2);
            if (this.currentPhase === 'predador' && Math.random() < doubleAttackChance) {
                // Sonido especial para doble ataque
                audioManager.playEffect('attack-special', 0.9);
                gameLogSystem.addMessage("Eco performs a frenzied double attack!", 'eco', 'special');
                this.performDoubleAttack();
            } else {
                // Clear revealed card after a single attack
                gameStateManager.ecoRevealedCard = null;
            }

            if (this.currentPhase === 'predador') {
                const hallucinationChance = this.getPhaseSpecialChance('predador', 0.7);
                if (Math.random() < hallucinationChance) {
                    hallucinationSystem.addHallucinationToDeck();
                    gameLogSystem.addMessage("A hallucination seeps into your deck.", 'eco', 'hallucination');
                }
            }
    
            if (this.currentPhase === 'devastador') {
                this.performDevastatorActions();
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
                
                // Discard second card and trigger fire effect
                deckManager.discardToEcoPile([secondCard]);
                setTimeout(() => {
                    vfxSystem.ecoDiscardCard({
                        card: secondCard,
                        position: { x: 640, y: 300 }
                    });
                }, 500);
                
                // Clear revealed card after the second attack
                gameStateManager.ecoRevealedCard = null;
            }, 1500);
        } else {
            // If no second card available, just clear the first card
            gameStateManager.ecoRevealedCard = null;
        }
    }

    private updateDifficultyMultiplier() {
        const chapter = chapterManager.currentChapterConfig;
        if (chapter) {
            this.difficultyMultiplier = chapter.difficultyModifiers.ecoAIDifficulty;
            console.log(`🎯 EcoAI: Difficulty multiplier set to ${this.difficultyMultiplier}`);
        } else {
            this.difficultyMultiplier = 1.0;
        }
    }
    
    private getPhaseSpecialChance(phase: string, baseChance: number): number {
        if (this.currentPhase !== phase) return 0;
        return Math.min(1.0, baseChance * this.difficultyMultiplier);
    }
    
    // private applyDifficultyToDoubleAttack(): boolean {
    //     // In higher difficulties, eco is more likely to perform special actions
    //     const enhancedChance = this.difficultyMultiplier >= 1.5;
    //     return enhancedChance && Math.random() < 0.3;
    // }

    private performDevastatorActions() {
        // Sonido devastador para daño a nodos
        audioManager.playEffect('event-danger', 0.9);
        
        const allNodes = nodeSystem.allNodes.filter(n => n.damage < n.maxDamage);
        if (allNodes.length > 0) {
            const randomNode = allNodes[Math.floor(Math.random() * allNodes.length)];
            const nodeDamage = Math.ceil(2 * this.difficultyMultiplier);
            nodeSystem.dealDamage(randomNode.id, nodeDamage);
            gameLogSystem.addMessage(`The Eco lashes out, damaging node ${randomNode.name} for ${nodeDamage} damage.`, 'eco', 'node_damage');
        }

        // Scale hallucination count with difficulty
        const hallucinationCount = Math.ceil(2 * Math.min(this.difficultyMultiplier, 2.0));
        for (let i = 0; i < hallucinationCount; i++) {
            hallucinationSystem.addHallucinationToDeck();
        }
        gameLogSystem.addMessage(`${hallucinationCount} hallucinations corrupt your deck.`, 'eco', 'hallucination');
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
                const amplification = 1.5 * this.difficultyMultiplier;
                gameLogSystem.addMessage(`Fase Devastador: ¡Daño amplificado! (x${amplification.toFixed(1)})`, 'eco', 'special');
                // Los modificadores se pueden aplicar en las reglas dinámicas
            }
            return;
        }

        // Fallback al sistema hardcoded original
        console.log(`🔴 EcoAI: Usando sistema hardcoded para ataque con ${card.rank} ${card.suit}`);
        
        let damage = card.value;
        const damageType: 'PV' | 'COR' = ['spades', 'clubs'].includes(card.suit.toLowerCase()) ? 'PV' : 'COR';

        // Apply difficulty multiplier to base damage
        damage = Math.ceil(damage * this.difficultyMultiplier);

        if (this.currentPhase === 'devastador') {
            damage = Math.ceil(damage * 1.5);
            gameLogSystem.addMessage(`Devastator phase: Damage amplified! (x${(1.5 * this.difficultyMultiplier).toFixed(1)})`, 'eco', 'special');
        } else if (this.difficultyMultiplier > 1.0) {
            gameLogSystem.addMessage(`Difficulty scaling: Damage increased! (x${this.difficultyMultiplier})`, 'eco', 'special');
        }

        if (damageType === 'PV') {
            // Efecto de sonido para daño físico - sonidos de ataque pesado
            audioManager.playEffect('attack-shot', 0.8);
            gameStateManager.dealDamageToPlayer(damage);
            gameLogSystem.addMessage(`Eco attacks with ${card.rank} of ${card.suit}, dealing ${damage} PV.`, 'eco', 'attack');
        } else {
            // Efecto de sonido para daño psicológico - sonido extraño/perturbador
            audioManager.playEffect('event-strange', 0.7);
            gameStateManager.dealSanityDamage(damage);
            gameLogSystem.addMessage(`Eco attacks with ${card.rank} of ${card.suit}, dealing ${damage} COR.`, 'eco', 'damage');
        }
        
        // Add score for surviving eco attack
        scoreSystem.addScore('turn_survived', undefined, { ecoAttack: true, damage });
    }

    private updatePhase() {
        try {
            // const _oldPhase = this.currentPhase; // Keep for potential future use
            const newState = ecoStateSystem.getCurrentState();
            const config = ecoStateSystem.getCurrentConfig();

            if (newState && newState !== this.currentPhase) {
                this.currentPhase = newState;
                
                if (config) {
                    gameLogSystem.addMessage(`${config.flavorText}`, 'eco', 'special');
                    console.log(`🎭 EcoAI: Phase changed to ${config.name} (${newState})`);
                }
            }
        } catch (error) {
            console.error('Error updating Eco phase:', error);
            // Fallback to vigilante phase if there's an error
            this.currentPhase = 'vigilante';
        }
    }
}

export const ecoAI = new EcoAI();