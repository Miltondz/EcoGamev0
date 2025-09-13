// src/engine/VFXSystem.ts

import type { Card, Suit } from './types';

// 1. Definir tipos de eventos de VFX
export type VFXEventType = 
  | 'dealCard'
  | 'playCard'
  | 'hoverCard'
  | 'selectCard'
  | 'discardCard'
  | 'cardAttack'
  | 'cardDefend'
  | 'cardResearch'
  | 'cardResource'
  | 'updateHand' // New event type
  | 'repositionHand' // Reposition existing cards
  | 'ecoPlayCard' // ECO plays a card with full animation
  | 'ecoDiscardCard' // ECO discards card with fire effect
  | 'dealEcoCard' // Deal card to ECO hand
  | 'nodeRepaired' // Node gets repaired
  | 'nodeDamaged' // Node gets damaged
  | 'cardClick'; // Card clicked for action menu

// 2. Interfaces para los datos de cada evento
export interface VFXEventData {
  dealCard: {
    card: Card;
    startPosition: { x: number; y: number };
    endPosition: { x: number; y: number };
    delay: number;
  };
  playCard: {
    card: Card;
    startPosition: { x: number; y: number };
  };
  hoverCard: {
    cardId: string;
    isHovering: boolean;
    position: { x: number; y: number };
  };
  selectCard: {
    cardId: string;
    isSelected: boolean;
    position: { x: number; y: number };
  };
  discardCard: {
    card: Card;
    startPosition: { x: number; y: number };
  };
  cardAttack: {
    startPosition: { x: number; y: number };
    endPosition: { x: number; y: number };
  };
  cardDefend: {
    position: { x: number; y: number };
  };
  cardResearch: {
    startPosition: { x: number; y: number };
    endPosition: { x: number; y: number };
  };
  cardResource: {
    startPosition: { x: number; y: number };
    endPosition: { x: number; y: number };
  };
  updateHand: { // New data interface for updating the entire hand
    cards: {
      card: Card;
      position: { x: number; y: number };
      rotation: number;
      delay: number;
    }[];
  };
  repositionHand: { // Reposition existing cards without creating new ones
    cards: {
      card: Card;
      position: { x: number; y: number };
      rotation: number;
      delay: number;
    }[];
  };
  ecoPlayCard: { // ECO plays a card with full drag, flip, zoom, consume animation
    card: Card;
    startPosition: { x: number; y: number };
    centerPosition: { x: number; y: number };
  };
  ecoDiscardCard: { // ECO discards card with fire effect
    card: Card;
    position: { x: number; y: number };
  };
  dealEcoCard: { // Deal a card to ECO's hand
    card: Card;
    startPosition: { x: number; y: number };
    endPosition: { x: number; y: number };
    delay: number;
  };
  nodeRepaired: { // Node gets repaired
    nodeId: string;
    repairAmount: number;
    position: { x: number; y: number };
  };
  nodeDamaged: { // Node gets damaged
    nodeId: string;
    damageAmount: number;
    position: { x: number; y: number };
  };
  cardClick: { // Card clicked for enlargement and actions
    card: Card;
    position: { x: number; y: number };
  };
}

// 3. Evento genérico que usa un mapeo de tipos
export interface VFXEvent<T extends VFXEventType> {
  type: T;
  data: VFXEventData[T];
}

// 4. Sobrecargas para el método dispatch
class VFXSystem {
  private listeners: ((event: VFXEvent<any>) => void)[] = [];

  subscribe(listener: (event: VFXEvent<any>) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  dispatch<T extends VFXEventType>(type: T, data: VFXEventData[T]): void {
    console.log(`🎯 VFXSystem: Dispatching event '${type}'`, data);
    const event: VFXEvent<T> = { type, data };
    this.listeners.forEach(listener => {
      console.log(`📡 VFXSystem: Notifying listener for '${type}'`);
      listener(event);
    });
  }

  // Métodos de ayuda para despachar eventos específicos
  dealCard = (data: VFXEventData['dealCard']) => this.dispatch('dealCard', data);
  playCard = (data: VFXEventData['playCard']) => this.dispatch('playCard', data);
  hoverCard = (data: VFXEventData['hoverCard']) => this.dispatch('hoverCard', data);
  selectCard = (data: VFXEventData['selectCard']) => this.dispatch('selectCard', data);
  discardCard = (data: VFXEventData['discardCard']) => this.dispatch('discardCard', data);
  updateHand = (data: VFXEventData['updateHand']) => this.dispatch('updateHand', data); // New helper method
  repositionHand = (data: VFXEventData['updateHand']) => this.dispatch('repositionHand', data); // Reposition existing cards
  ecoPlayCard = (data: VFXEventData['ecoPlayCard']) => this.dispatch('ecoPlayCard', data); // ECO card play animation
  ecoDiscardCard = (data: VFXEventData['ecoDiscardCard']) => this.dispatch('ecoDiscardCard', data); // ECO discard with fire
  dealEcoCard = (data: VFXEventData['dealEcoCard']) => this.dispatch('dealEcoCard', data); // Deal to ECO
  cardClick = (data: VFXEventData['cardClick']) => this.dispatch('cardClick', data); // Card clicked for actions
  
  triggerSuitEffect(suit: Suit, startPosition: { x: number; y: number }, endPosition: { x: number; y: number }) {
    switch (suit) {
      case 'Spades':
        this.dispatch('cardAttack', { startPosition, endPosition });
        break;
      case 'Hearts':
        this.dispatch('cardDefend', { position: startPosition });
        break;
      case 'Clubs':
        this.dispatch('cardResearch', { startPosition, endPosition });
        break;
      case 'Diamonds':
        this.dispatch('cardResource', { startPosition, endPosition });
        break;
    }
  }
}

export const vfxSystem = new VFXSystem();