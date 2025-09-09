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