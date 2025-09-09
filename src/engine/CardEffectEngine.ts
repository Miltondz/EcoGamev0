// src/engine/CardEffectEngine.ts

import type { Card } from './types';
import { gameStateManager } from './GameStateManager';
import { deckManager } from './DeckManager';
import { gameLogSystem } from './GameLogSystem';
import { nodeSystem } from './NodeSystem';

class CardEffectEngine {
    applyEffect(card: Card) {
        if (gameStateManager.pa < 1) {
            gameLogSystem.addMessage("No action points left.", 'system', 'info');
            return;
        }

        if (card.suit === 'Spades' && gameStateManager.playerStatusEffects.includes('cannotPlaySpades')) {
            gameLogSystem.addMessage("Cannot play Spades this turn due to a hallucination effect.", 'player', 'info');
            return;
        }
        
        const apSpent = gameStateManager.spendActionPoints(1);
        if (!apSpent) {
            gameLogSystem.addMessage("Cannot play card: insufficient action points.", 'system', 'info');
            return;
        }

        switch (card.suit) {
            case 'Spades': { // ♠ Ataque
                let damage = card.value + gameStateManager.criticalDamageBoost;
                if (gameStateManager.isEcoExposed) {
                    damage *= 2;
                    gameLogSystem.addMessage("Eco is exposed! Damage doubled.", 'system', 'info');
                    gameStateManager.isEcoExposed = false;
                }
                gameStateManager.dealDamageToEco(damage);
                gameLogSystem.addMessage(`Dealt ${damage} damage to the Eco.`, 'player', 'attack');
                break;
            }
            case 'Hearts': // ♥ Recuperar COR
                gameStateManager.recoverSanity(card.value);
                gameLogSystem.addMessage(`Recovered ${card.value} COR.`, 'player', 'heal');
                break;
            case 'Clubs': // ♣ Investigar/Reparar
                // This action now has a dual purpose. The UI will decide which one to call.
                // For now, playing it directly will "expose" the Eco.
                gameStateManager.isEcoExposed = true;
                gameLogSystem.addMessage("Eco is now exposed. Next attack deals double damage.", 'player', 'research');
                break;
            case 'Diamonds': { // ♦ Buscar
                const drawnCards = deckManager.drawCards(card.value);
                if (drawnCards.length > 0) {
                    gameStateManager.addCardsToHand(drawnCards);
                    gameLogSystem.addMessage(`Drew ${drawnCards.length} cards.`, 'player', 'search');
                } else {
                    gameLogSystem.addMessage("No cards left to draw.", 'player', 'search');
                }
                break;
            }
            default:
                gameLogSystem.addMessage(`Unknown card suit: ${card.suit}`, 'system', 'info');
                break;
        }

        // Discard the played card
        deckManager.discard([card]);
    }

    repairNode(nodeId: string, cards: Card[]) {
        // Validate that all cards are Clubs
        const nonClubCards = cards.filter(card => card.suit !== 'Clubs');
        if (nonClubCards.length > 0) {
            gameLogSystem.addMessage('Only Club cards can be used for repairs.', 'system', 'info');
            return;
        }

        if (cards.length === 0) {
            gameLogSystem.addMessage('No cards selected for repair.', 'system', 'info');
            return;
        }

        const totalValue = cards.reduce((sum, card) => sum + card.value, 0);
        const node = nodeSystem.getNode(nodeId);

        if (!node) {
            gameLogSystem.addMessage('Invalid node selected.', 'system', 'info');
            return;
        }

        if (node.damage === 0) {
            gameLogSystem.addMessage('Selected node does not need repairs.', 'system', 'info');
            return;
        }
        
        if (gameStateManager.pa < cards.length) {
            gameLogSystem.addMessage('Not enough action points to repair.', 'system', 'info');
            return;
        }

        const repairAmount = Math.floor(totalValue / 5); // Repair formula: total value / 5
        if (repairAmount > 0) {
            nodeSystem.repairNode(nodeId, repairAmount);
            const apSpent = gameStateManager.spendActionPoints(cards.length);
            if (apSpent) {
                deckManager.discard(cards);
                gameLogSystem.addMessage(`Used ${cards.length} card(s) to repair ${repairAmount} damage on node ${node.name}.`, 'player', 'node_repair');
                
                // Remove cards from hand
                cards.forEach(card => {
                    gameStateManager.hand = gameStateManager.hand.filter(c => c.id !== card.id);
                });
            } else {
                gameLogSystem.addMessage("Failed to spend action points for repair.", 'system', 'info');
            }
        } else {
            gameLogSystem.addMessage("Cards' total value is not high enough to repair the node (minimum 5 total value needed).", 'player', 'info');
        }
    }
}

export const cardEffectEngine = new CardEffectEngine();