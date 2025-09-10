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
  | 'repositionHand'; // Reposition existing cards

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