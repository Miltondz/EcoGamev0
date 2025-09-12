// src/engine/ScenarioRulesEngine.ts

import type { Card, GameRules, RuleEffect, RuleCondition, Node } from './types';
import { gameStateManager } from './GameStateManager';
import { deckManager } from './DeckManager';
import { gameLogSystem } from './GameLogSystem';
import { nodeSystem } from './NodeSystem';

class ScenarioRulesEngine {
    private currentRules: GameRules | null = null;

    /**
     * Carga las reglas desde un archivo JSON del escenario
     */
    loadRules(rules: GameRules) {
        this.currentRules = rules;
        console.log('🎲 ScenarioRulesEngine: Reglas cargadas', rules);
    }

    /**
     * Aplica el efecto de una carta jugada por el jugador
     */
    applyPlayerCardEffect(card: Card): boolean {
        if (!this.currentRules) {
            console.warn('⚠️ ScenarioRulesEngine: No hay reglas cargadas, usando sistema hardcoded');
            return false;
        }

        // Buscar la primera regla que coincida (más específicas primero)
        const matchingRule = this.currentRules.playerActions.find(rule => 
            this.matchesCondition(card, rule.condition)
        );

        if (!matchingRule) {
            console.warn(`⚠️ ScenarioRulesEngine: No se encontró regla para carta ${card.rank} ${card.suit}`);
            return false;
        }

        // Verificar costo de PA
        if (gameStateManager.pa < matchingRule.cost) {
            gameLogSystem.addMessage("No hay suficientes Puntos de Acción.", 'system', 'info');
            return false;
        }

        // Gastar PA
        const apSpent = gameStateManager.spendActionPoints(matchingRule.cost);
        if (!apSpent) {
            gameLogSystem.addMessage("No se pueden gastar los Puntos de Acción.", 'system', 'info');
            return false;
        }

        console.log(`🎲 ScenarioRulesEngine: Aplicando regla ${matchingRule.id || 'sin ID'} para ${card.rank} ${card.suit}`);

        // Aplicar todos los efectos de la regla
        matchingRule.effects.forEach(effect => {
            this.applyEffect(effect, card);
        });

        return true;
    }

    /**
     * Aplica el efecto de una carta usada por el Eco en ataque
     */
    applyEcoAttackEffect(card: Card) {
        if (!this.currentRules) {
            console.warn('⚠️ ScenarioRulesEngine: No hay reglas cargadas para ataque del Eco');
            return;
        }

        // Buscar la primera regla que coincida
        const matchingRule = this.currentRules.ecoAttacks.find(rule => 
            this.matchesCondition(card, rule.condition)
        );

        if (!matchingRule) {
            console.warn(`⚠️ ScenarioRulesEngine: No se encontró regla de ataque para carta ${card.rank} ${card.suit}`);
            return;
        }

        console.log(`🎲 ScenarioRulesEngine: Eco ataca con ${card.rank} ${card.suit}`);

        // Aplicar todos los efectos del ataque
        matchingRule.effects.forEach(effect => {
            this.applyEffect(effect, card);
        });
    }

    /**
     * Verifica si una carta coincide con una condición de regla
     */
    private matchesCondition(card: Card, condition: RuleCondition): boolean {
        // Coincidencia por ID específico (más prioritario)
        if (condition.id && condition.id === card.id) {
            return true;
        }

        // Coincidencia por palo (normalizado)
        if (condition.suit && condition.suit.toLowerCase() === card.suit.toLowerCase()) {
            return true;
        }

        // Coincidencia por color
        if (condition.color) {
            const cardColor = (card.suit === 'Hearts' || card.suit === 'Diamonds') ? 'red' : 'black';
            if (condition.color === cardColor) {
                return true;
            }
        }

        // Coincidencia por rango
        if (condition.rank && condition.rank === card.rank) {
            return true;
        }

        return false;
    }

    /**
     * Aplica un efecto individual
     */
    private applyEffect(effect: RuleEffect, card: Card) {
        const resolvedValue = this.resolveValue(effect.value, card);
        
        switch (effect.type) {
            case 'DEAL_DAMAGE':
                this.applyDamageEffect(effect, resolvedValue);
                break;
            
            case 'HEAL_STAT':
                this.applyHealEffect(effect, resolvedValue);
                break;
            
            case 'DRAW_CARDS':
                this.applyDrawCardsEffect(effect, resolvedValue);
                break;
            
            case 'DISCARD_CARDS':
                this.applyDiscardCardsEffect(effect, resolvedValue);
                break;
            
            case 'APPLY_STATUS':
                this.applyStatusEffect(effect);
                break;
            
            case 'REPAIR_NODE':
                this.applyRepairNodeEffect(effect, resolvedValue);
                break;
            
            case 'DAMAGE_NODE':
                this.applyDamageNodeEffect(effect, resolvedValue);
                break;
            
            default:
                console.warn(`⚠️ ScenarioRulesEngine: Tipo de efecto desconocido: ${effect.type}`);
        }
    }

    /**
     * Resuelve un valor que puede ser número, fórmula o undefined
     * Implementa logging completo para debug de fórmulas
     */
    private resolveValue(value: number | string | undefined, card: Card): number {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const logPrefix = `[${timestamp}] 🧮 ScenarioRulesEngine.resolveValue`;
        
        console.log(`${logPrefix}: Processing value`, { value, cardValue: card.value, cardId: card.id });
        
        // Manejar valores undefined o null
        if (value === undefined || value === null) {
            console.warn(`${logPrefix}: ⚠️ Value is undefined/null, defaulting to 0`);
            return 0;
        }
        
        // Valores numéricos directos
        if (typeof value === 'number') {
            console.log(`${logPrefix}: Direct numeric value: ${value}`);
            return value;
        }
        
        // Validar que es string antes de usar replace
        if (typeof value !== 'string') {
            console.warn(`${logPrefix}: ⚠️ Value is not string or number:`, typeof value, 'defaulting to 0');
            return 0;
        }

        console.log(`${logPrefix}: Processing formula: "${value}"`);
        
        // Reemplazar variables en fórmulas
        let formula = value.replace(/CARD_VALUE/g, card.value.toString());
        console.log(`${logPrefix}: Formula after variable replacement: "${formula}"`);

        // Evaluar fórmulas matemáticas básicas de forma más segura
        try {
            const result = this.evaluateMathExpression(formula);
            console.log(`${logPrefix}: ✅ Formula evaluated successfully: ${result}`);
            return result;
        } catch (error) {
            console.error(`${logPrefix}: ❌ Error evaluating formula "${value}":`, error);
            return 0;
        }
    }

    /**
     * Evalúa expresiones matemáticas básicas de forma más segura
     */
    private evaluateMathExpression(expression: string): number {
        // Manejar floor() específicamente
        const floorMatch = expression.match(/floor\(([^)]+)\)/);
        if (floorMatch) {
            const innerExpr = floorMatch[1];
            const innerValue = this.evaluateSimpleMath(innerExpr);
            return Math.floor(innerValue);
        }
        
        return this.evaluateSimpleMath(expression);
    }

    /**
     * Evalúa operaciones matemáticas básicas
     */
    private evaluateSimpleMath(expression: string): number {
        // Remover espacios y validar que solo contenga números y operadores básicos
        const clean = expression.replace(/\s/g, '');
        if (!/^[0-9+\-*/().]+$/.test(clean)) {
            throw new Error(`Expresión matemática no válida: ${expression}`);
        }
        
        // Solo para casos simples, usar Function constructor (más seguro que eval)
        return new Function('return ' + clean)();
    }

    /**
     * Aplica efectos de daño
     */
    private applyDamageEffect(effect: RuleEffect, value: number) {
        switch (effect.target) {
            case 'PLAYER':
                if (effect.targetStat === 'PV') {
                    gameStateManager.dealDamageToPlayer(value);
                    gameLogSystem.addMessage(`Pierdes ${value} PV.`, 'system', 'info');
                } else if (effect.targetStat === 'COR') {
                    gameStateManager.dealSanityDamage(value);
                    gameLogSystem.addMessage(`Pierdes ${value} COR.`, 'system', 'info');
                }
                break;
            
            case 'ECO':
                if (effect.targetStat === 'HP') {
                    let damage = value;
                    // Aplicar modificadores como exposed
                    if (gameStateManager.isEcoExposed) {
                        damage *= 2;
                        gameLogSystem.addMessage("¡El Eco está expuesto! Daño duplicado.", 'system', 'info');
                        gameStateManager.isEcoExposed = false;
                    }
                    gameStateManager.dealDamageToEco(damage);
                    gameLogSystem.addMessage(`Infliges ${damage} de daño al Eco.`, 'player', 'attack');
                }
                break;
        }
    }

    /**
     * Aplica efectos de curación
     */
    private applyHealEffect(effect: RuleEffect, value: number) {
        if (effect.target === 'PLAYER') {
            if (effect.targetStat === 'PV') {
                const oldPV = gameStateManager.pv;
                gameStateManager.pv = Math.min(20, oldPV + value); // Asumiendo máximo 20
                gameLogSystem.addMessage(`Recuperas ${gameStateManager.pv - oldPV} PV.`, 'player', 'heal');
            } else if (effect.targetStat === 'COR') {
                gameStateManager.recoverSanity(value);
                gameLogSystem.addMessage(`Recuperas ${value} COR.`, 'player', 'heal');
            }
        }
    }

    /**
     * Aplica efectos de robar cartas
     */
    private applyDrawCardsEffect(effect: RuleEffect, value: number) {
        if (effect.target === 'PLAYER') {
            const drawnCards = deckManager.drawCards(value);
            if (drawnCards.length > 0) {
                gameStateManager.addCardsToHand(drawnCards);
                gameLogSystem.addMessage(`Robas ${drawnCards.length} carta(s).`, 'player', 'search');
            } else {
                gameLogSystem.addMessage("No quedan cartas que robar.", 'system', 'info');
            }
        }
    }

    /**
     * Aplica efectos de descartar cartas
     */
    private applyDiscardCardsEffect(effect: RuleEffect, value: number) {
        if (effect.target === 'PLAYER') {
            const hand = gameStateManager.hand;
            const toDiscard = Math.min(value, hand.length);
            
            if (toDiscard > 0) {
                // Descartar cartas al azar
                const discarded = [];
                for (let i = 0; i < toDiscard; i++) {
                    const randomIndex = Math.floor(Math.random() * hand.length);
                    const card = hand.splice(randomIndex, 1)[0];
                    discarded.push(card);
                }
                
                deckManager.discard(discarded);
                gameStateManager.hand = hand;
                gameLogSystem.addMessage(`Descartas ${discarded.length} carta(s).`, 'system', 'info');
            }
        }
    }

    /**
     * Aplica efectos de estado
     */
    private applyStatusEffect(effect: RuleEffect) {
        if (effect.target === 'ECO' && effect.status === 'EXPOSED') {
            gameStateManager.isEcoExposed = true;
            gameLogSystem.addMessage("El Eco queda expuesto. El próximo ataque causará daño doble.", 'system', 'info');
        }
    }

    /**
     * Aplica efectos de reparar nodos
     */
    private applyRepairNodeEffect(_effect: RuleEffect, value: number) {
        // Por ahora, reparar nodo al azar si es RANDOM o CHOICE
        // En el futuro se podría implementar selección del jugador
        const nodes = nodeSystem.allNodes.filter((node: Node) => node.damage > 0);
        if (nodes.length > 0) {
            const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
            const actualRepair = Math.min(value, randomNode.damage);
            nodeSystem.repairNode(randomNode.id, actualRepair);
            gameLogSystem.addMessage(`Reparas ${actualRepair} puntos de daño en ${randomNode.name}.`, 'player', 'info');
        }
    }

    /**
     * Aplica efectos de dañar nodos
     */
    private applyDamageNodeEffect(effect: RuleEffect, value: number) {
        if (effect.target === 'RANDOM') {
            const nodes = nodeSystem.allNodes.filter((node: Node) => !node.isCollapsed);
            if (nodes.length > 0) {
                const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
                nodeSystem.dealDamage(randomNode.id, value);
                gameLogSystem.addMessage(`${randomNode.name} sufre ${value} puntos de daño.`, 'system', 'info');
            }
        }
    }

    /**
     * Método público para aplicar efectos (usado por ScenarioEventsEngine)
     */
    public applyRuleEffect(effect: RuleEffect, card: Card) {
        this.applyEffect(effect, card);
    }

    /**
     * Getter para verificar si hay reglas cargadas
     */
    get hasRules(): boolean {
        return this.currentRules !== null;
    }
}

export const scenarioRulesEngine = new ScenarioRulesEngine();
