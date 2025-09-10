// src/engine/ScenarioEventsEngine.ts

import type { Card, DynamicEvent, RuleEffect } from './types';
import { scenarioRulesEngine } from './ScenarioRulesEngine';

class ScenarioEventsEngine {
    private currentEvents: DynamicEvent[] = [];

    /**
     * Carga los eventos desde el archivo JSON del escenario
     */
    loadEvents(events: DynamicEvent[]) {
        this.currentEvents = events;
        console.log('📅 ScenarioEventsEngine: Eventos cargados', events.length, 'eventos');
    }

    /**
     * Procesa un evento basado en una carta revelada
     */
    processEvent(card: Card): { event?: DynamicEvent; processed: boolean } {
        if (this.currentEvents.length === 0) {
            console.warn('⚠️ ScenarioEventsEngine: No hay eventos cargados');
            return { processed: false };
        }

        // Buscar el evento que corresponde a esta carta
        const event = this.currentEvents.find(e => e.id === card.id);
        
        if (!event) {
            console.warn(`⚠️ ScenarioEventsEngine: No se encontró evento para carta ${card.id}`);
            return { processed: false };
        }

        console.log(`📅 ScenarioEventsEngine: Procesando evento "${event.event}" para carta ${card.id}`);

        // Aplicar todos los efectos del evento
        event.effects.forEach(effect => {
            this.applyEventEffect(effect, card);
        });

        return { event, processed: true };
    }

    /**
     * Aplica un efecto de evento usando el motor de reglas
     */
    private applyEventEffect(effect: RuleEffect, card: Card) {
        // Delegar al motor de reglas para aplicar el efecto
        // Como los eventos usan el mismo sistema de efectos que las reglas
        scenarioRulesEngine.applyRuleEffect(effect, card);
    }

    /**
     * Obtiene un evento específico por ID de carta
     */
    getEventByCardId(cardId: string): DynamicEvent | undefined {
        return this.currentEvents.find(e => e.id === cardId);
    }

    /**
     * Verifica si hay eventos cargados
     */
    get hasEvents(): boolean {
        return this.currentEvents.length > 0;
    }

    /**
     * Obtiene todos los eventos cargados
     */
    get events(): DynamicEvent[] {
        return [...this.currentEvents];
    }
}

export const scenarioEventsEngine = new ScenarioEventsEngine();
