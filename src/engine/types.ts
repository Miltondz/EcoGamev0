// src/engine/types.ts

export type Suit = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'none';

export interface Card {
    id: string;
    suit: Suit;
    rank: string;
    value: number;
    imageFile: string;
}

export interface Event {
    id: string;
    event: string;
    effect: string;
    flavor: string;
    type: string;
}

export interface Reward {
    type: 'max_ap' | 'max_hand_size' | 'max_sanity' | 'critical_damage_boost';
    value: number;
}

export interface HallucinationCard extends Card {
    isHallucination: true;
    effect: 'discard_hand' | 'lose_sanity' | 'cannot_play_spades';
    description: string;
}

export interface Node {
    id: string;
    name: string;
    status: 'stable' | 'unstable' | 'corrupted';
    damage: number;
    maxDamage: number;
    isCollapsed: boolean;
    reward: Reward;
}

export enum MessageType {
    PLAYER_ACTION,
    ECO_ACTION,
    SYSTEM,
    NARRATIVE,
    WARNING,
}

export enum MessageSource {
    PLAYER,
    ECO,
    SYSTEM,
}

export interface LogMessage {
    id: number;
    turn: number;
    message: string;
    type: MessageType;
    source: MessageSource;
    timestamp: string;
}

export interface VFXEvent {
    type: 'card_played' | 'eco_attack' | 'node_damaged' | 'player_healed';
    card?: Card;
    targetId?: string;
}

// Nuevos tipos para el sistema dinámico de reglas
export interface GameRules {
  playerActions: PlayerActionRule[];
  ecoAttacks: EcoAttackRule[];
}

export interface PlayerActionRule {
  id?: string;
  comment?: string;
  condition: RuleCondition;
  cost: number;
  effects: RuleEffect[];
}

export interface EcoAttackRule {
  comment?: string;
  condition: RuleCondition;
  effects: RuleEffect[];
}

export interface RuleCondition {
  id?: string;       // ID específico de la carta (ej: "AS")
  suit?: string;     // Palo específico (lowercase para compatibilidad con JSON)
  color?: 'red' | 'black'; // Color de la carta
  rank?: string;     // Rango específico (ej: "A", "K", "Q")
}

export interface RuleEffect {
  type: RuleEffectType;
  target: RuleTarget;
  targetStat?: StatType;
  value: number | string;  // Puede ser número o fórmula como "CARD_VALUE"
  properties?: string[];   // Para propiedades adicionales como "PIERCING"
  status?: string;         // Para efectos de estado como "EXPOSED", "BLEEDING"
  duration?: number;       // Para efectos de estado (-1 = permanente)
  targetSource?: string;   // Para efectos como "CHOICE"
}

export type RuleEffectType = 
  | 'DEAL_DAMAGE'
  | 'HEAL_STAT'
  | 'DRAW_CARDS'
  | 'DISCARD_CARDS'
  | 'APPLY_STATUS'
  | 'REPAIR_NODE'
  | 'DAMAGE_NODE';

export type RuleTarget = 
  | 'PLAYER'
  | 'ECO'
  | 'RANDOM'
  | 'CHOICE';

export type StatType = 
  | 'HP'   // Eco health
  | 'PV'   // Player health
  | 'COR'  // Player sanity
  | 'PA';  // Player action points

// Eventos dinámicos con nuevo formato
export interface DynamicEvent {
  id: string;
  event: string;    // Nombre del evento
  flavor: string;   // Texto narrativo
  effects: RuleEffect[]; // Efectos usando el mismo sistema
}
