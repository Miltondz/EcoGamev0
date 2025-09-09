// src/engine/ScenarioLoader.ts

import type { Event } from './types';

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

    async load(scenarioId: string) {
        try {
            this.config = (await import(`../scenarios/${scenarioId}/config.json`)).default;
            this.nodes = (await import(`../scenarios/${scenarioId}/nodes.json`)).default;
            this.eco = (await import(`../scenarios/${scenarioId}/eco.json`)).default;
            this.events = (await import(`../scenarios/${scenarioId}/events.json`)).default;
            this.flavor = (await import(`../scenarios/${scenarioId}/flavor.json`)).default;
            console.log(`Scenario ${scenarioId} loaded successfully.`);
        } catch (error) {
            console.error(`Failed to load scenario: ${scenarioId}`, error);
            throw new Error(`Could not load scenario ${scenarioId}.`);
        }
    }
}

export const scenarioLoader = new ScenarioLoader();
