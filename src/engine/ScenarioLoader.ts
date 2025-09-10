// src/engine/ScenarioLoader.ts

import type { Event, GameRules, DynamicEvent } from './types';
import { scenarioRulesEngine } from './ScenarioRulesEngine';
import { scenarioEventsEngine } from './ScenarioEventsEngine';

// Define types for the scenario files
interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  initialPlayerStats: {
    PV: number;
    COR: number;
    PA: number;
    handSize: number;
  };
  initialEcoHP: number;
}

interface ScenarioNode {
  id: string;
  name: string;
  description: string;
  maxDamage: number;
  repairThreshold: number;
  reward: {
    type: string;
    amount: number;
  };
}

interface EcoConfig {
    id: string;
    name: string;
    description: string;
    phases: Record<string, {
        threshold: number;
        description: string;
        effects: string[];
    }>;
}

interface FlavorText {
    intro: string;
    victory: string;
    defeat: string;
    hallucinations: string[];
}


class ScenarioLoader {
    public config!: ScenarioConfig;
    public nodes!: ScenarioNode[];
    public eco!: EcoConfig;
    public events!: Event[];
    public flavor!: FlavorText;
    public rules?: GameRules;
    public dynamicEvents?: DynamicEvent[];

    async load(scenarioId: string) {
        try {
            this.config = (await import(`../scenarios/${scenarioId}/config.json`)).default;
            this.nodes = (await import(`../scenarios/${scenarioId}/nodes.json`)).default;
            this.eco = (await import(`../scenarios/${scenarioId}/eco.json`)).default;
            this.events = (await import(`../scenarios/${scenarioId}/events.json`)).default;
            this.flavor = (await import(`../scenarios/${scenarioId}/flavor.json`)).default;
            
            // Cargar reglas dinámicas si existen
            try {
                this.rules = (await import(`../scenarios/${scenarioId}/rules.json`)).default;
                if (this.rules) {
                    scenarioRulesEngine.loadRules(this.rules);
                }
                console.log(`📏 Reglas dinámicas cargadas para ${scenarioId}`);
            } catch (rulesError) {
                console.warn(`⚠️ No se encontraron reglas dinámicas para ${scenarioId}, usando sistema hardcoded`);
                this.rules = undefined;
            }
            
            // Los events.json ya están cargados arriba, pero ahora también los cargamos como eventos dinámicos
            // si tienen el formato correcto
            try {
                const dynamicEvents = this.events as unknown as DynamicEvent[];
                // Verificar si tiene el formato de eventos dinámicos
                if (dynamicEvents && dynamicEvents.length > 0 && 'flavor' in dynamicEvents[0]) {
                    this.dynamicEvents = dynamicEvents;
                    scenarioEventsEngine.loadEvents(dynamicEvents);
                    console.log(`📅 Eventos dinámicos cargados para ${scenarioId}`);
                }
            } catch (eventsError) {
                console.warn(`⚠️ Los eventos no tienen formato dinámico, usando sistema original`);
            }
            
            console.log(`Scenario ${scenarioId} loaded successfully.`);
        } catch (error) {
            console.error(`Failed to load scenario: ${scenarioId}`, error);
            throw new Error(`Could not load scenario ${scenarioId}.`);
        }
    }
}

export const scenarioLoader = new ScenarioLoader();
