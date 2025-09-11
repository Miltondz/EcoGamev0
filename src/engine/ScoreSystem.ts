// src/engine/ScoreSystem.ts

export interface ScoreEvent {
  type: 'damage_dealt' | 'eco_killed' | 'node_repaired' | 'card_played' | 'turn_survived' | 
        'perfect_turn' | 'combo_played' | 'status_applied' | 'heal_received' | 'node_protected' |
        'event_overcome' | 'critical_hit' | 'resource_saved' | 'time_bonus' | 'difficulty_bonus';
  points: number;
  multiplier?: number;
  description: string;
  timestamp: number;
  context?: any;
}

export interface ScoreMultiplier {
  name: string;
  value: number;
  source: string;
  duration?: number;
  timestamp?: number;
}

export interface ComboTracker {
  type: string;
  count: number;
  maxCombo: number;
  lastActionTime: number;
  comboWindow: number;
}

class ScoreSystem {
  private totalScore: number = 0;
  private scoreEvents: ScoreEvent[] = [];
  private multipliers: ScoreMultiplier[] = [];
  private combos: { [type: string]: ComboTracker } = {};
  private listeners: ((event: ScoreEvent, totalScore: number) => void)[] = [];

  // Score constants
  private readonly SCORE_VALUES = {
    damage_dealt: 10,
    eco_killed: 500,
    critical_hit: 50,
    turn_survived: 20,
    perfect_turn: 100,
    node_repaired: 100,
    node_protected: 150,
    card_played: 15,
    combo_played: 25,
    heal_received: 5,
    resource_saved: 30,
    event_overcome: 40,
    status_applied: 30,
    time_bonus: 200,
    difficulty_bonus: 100
  };

  private readonly COMBO_TYPES = {
    same_suit: { window: 10000, bonus: 1.2 },
    escalating_damage: { window: 8000, bonus: 1.3 },
    perfect_defense: { window: 15000, bonus: 1.5 },
    resource_efficiency: { window: 12000, bonus: 1.1 },
    node_master: { window: 20000, bonus: 1.4 }
  };

  constructor() {
    this.resetScore();
  }

  addScore(type: ScoreEvent['type'], amount?: number, context?: any): number {
    const basePoints = amount || this.SCORE_VALUES[type] || 0;
    let finalPoints = basePoints;
    
    // Apply multipliers
    const activeMultipliers = this.getActiveMultipliers();
    const totalMultiplier = activeMultipliers.reduce((acc, mult) => acc * mult.value, 1.0);
    finalPoints = Math.round(basePoints * totalMultiplier);

    // Check for combos
    const comboMultiplier = this.checkAndUpdateCombos(type, context);
    finalPoints = Math.round(finalPoints * comboMultiplier);

    // Create score event
    const scoreEvent: ScoreEvent = {
      type,
      points: finalPoints,
      multiplier: totalMultiplier * comboMultiplier,
      description: this.getScoreDescription(type, finalPoints, context),
      timestamp: Date.now(),
      context
    };

    // Add to tracking
    this.scoreEvents.push(scoreEvent);
    this.totalScore += finalPoints;

    // Notify listeners
    this.notifyListeners(scoreEvent, this.totalScore);

    return finalPoints;
  }

  // Specific scoring methods
  scoreEcoDamage(damage: number, isCritical: boolean = false): number {
    let totalPoints = 0;
    totalPoints += this.addScore('damage_dealt', damage * this.SCORE_VALUES.damage_dealt, { damage });
    if (isCritical) {
      totalPoints += this.addScore('critical_hit', undefined, { damage });
    }
    return totalPoints;
  }

  scoreEcoDefeat(): number {
    return this.addScore('eco_killed');
  }

  scoreTurnSurvival(turnNumber: number, damageThisTurn: number): number {
    let totalPoints = 0;
    totalPoints += this.addScore('turn_survived', this.SCORE_VALUES.turn_survived, { turn: turnNumber });
    if (damageThisTurn === 0) {
      totalPoints += this.addScore('perfect_turn');
    }
    return totalPoints;
  }

  scoreNodeAction(action: 'repaired' | 'protected', nodeId?: string): number {
    return this.addScore(action === 'repaired' ? 'node_repaired' : 'node_protected', undefined, { nodeId });
  }

  scoreCardPlay(card: any, wasEfficient: boolean = false): number {
    let totalPoints = 0;
    totalPoints += this.addScore('card_played', undefined, { card });
    if (wasEfficient) {
      totalPoints += this.addScore('resource_saved');
    }
    return totalPoints;
  }

  scoreEventHandling(eventType: string, outcome: 'success' | 'failure'): number {
    if (outcome === 'success') {
      return this.addScore('event_overcome', undefined, { eventType });
    }
    return 0;
  }

  scoreTimeBonus(gameTimeMs: number, parTimeMs: number): number {
    if (gameTimeMs <= parTimeMs) {
      const bonusMultiplier = Math.max(1, parTimeMs / gameTimeMs);
      return this.addScore('time_bonus', Math.round(this.SCORE_VALUES.time_bonus * bonusMultiplier), 
        { gameTime: gameTimeMs, parTime: parTimeMs });
    }
    return 0;
  }

  scoreDifficultyBonus(difficulty: 'normal' | 'hard' | 'nightmare'): number {
    const multipliers = { normal: 0, hard: 1, nightmare: 2 };
    return this.addScore('difficulty_bonus', this.SCORE_VALUES.difficulty_bonus * multipliers[difficulty], 
      { difficulty });
  }

  // Multiplier management
  addMultiplier(multiplier: ScoreMultiplier): void {
    this.multipliers = this.multipliers.filter(m => m.name !== multiplier.name);
    this.multipliers.push({
      ...multiplier,
      timestamp: Date.now(),
      duration: multiplier.duration || -1
    });
  }

  removeMultiplier(name: string): void {
    this.multipliers = this.multipliers.filter(m => m.name !== name);
  }

  private getActiveMultipliers(): ScoreMultiplier[] {
    const now = Date.now();
    this.multipliers = this.multipliers.filter(mult => {
      if (mult.duration === -1) return true;
      return (now - (mult.timestamp || 0)) < (mult.duration || 0);
    });
    return this.multipliers;
  }

  // Combo system
  private checkAndUpdateCombos(actionType: ScoreEvent['type'], context?: any): number {
    let comboMultiplier = 1.0;
    const now = Date.now();

    // Same suit combo
    if (actionType === 'card_played' && context?.card?.suit) {
      const combo = this.getOrCreateCombo('same_suit');
      if (now - combo.lastActionTime <= combo.comboWindow) {
        if (!context.lastCardSuit || context.card.suit === context.lastCardSuit) {
          combo.count++;
          combo.maxCombo = Math.max(combo.maxCombo, combo.count);
          comboMultiplier *= Math.pow(this.COMBO_TYPES.same_suit.bonus, combo.count - 1);
        } else {
          combo.count = 1;
        }
      } else {
        combo.count = 1;
      }
      combo.lastActionTime = now;
    }

    // Perfect defense combo
    if (actionType === 'perfect_turn') {
      const combo = this.getOrCreateCombo('perfect_defense');
      if (now - combo.lastActionTime <= combo.comboWindow) {
        combo.count++;
        combo.maxCombo = Math.max(combo.maxCombo, combo.count);
        comboMultiplier *= Math.pow(this.COMBO_TYPES.perfect_defense.bonus, combo.count - 1);
      } else {
        combo.count = 1;
      }
      combo.lastActionTime = now;
    }

    // Node master combo
    if (actionType === 'node_repaired') {
      const combo = this.getOrCreateCombo('node_master');
      if (now - combo.lastActionTime <= combo.comboWindow) {
        combo.count++;
        combo.maxCombo = Math.max(combo.maxCombo, combo.count);
        comboMultiplier *= Math.pow(this.COMBO_TYPES.node_master.bonus, combo.count - 1);
      } else {
        combo.count = 1;
      }
      combo.lastActionTime = now;
    }

    if (comboMultiplier > 1.1) {
      this.addScore('combo_played', Math.round(this.SCORE_VALUES.combo_played * comboMultiplier), 
        { combo: comboMultiplier });
    }

    return comboMultiplier;
  }

  private getOrCreateCombo(type: string): ComboTracker {
    if (!this.combos[type]) {
      this.combos[type] = {
        type,
        count: 0,
        maxCombo: 0,
        lastActionTime: 0,
        comboWindow: this.COMBO_TYPES[type as keyof typeof this.COMBO_TYPES]?.window || 10000
      };
    }
    return this.combos[type];
  }

  // Score description generation
  private getScoreDescription(type: ScoreEvent['type'], points: number, context?: any): string {
    switch (type) {
      case 'damage_dealt':
        return `Daño al Eco: ${context?.damage || 0} (+${points})`;
      case 'eco_killed':
        return `¡Eco Derrotado! (+${points})`;
      case 'critical_hit':
        return `¡Golpe Crítico! (+${points})`;
      case 'turn_survived':
        return `Turno ${context?.turn || 0} Sobrevivido (+${points})`;
      case 'perfect_turn':
        return `¡Turno Perfecto! (+${points})`;
      case 'node_repaired':
        return `Nodo Reparado: ${context?.nodeId || 'Desconocido'} (+${points})`;
      case 'node_protected':
        return `¡Nodo Protegido! (+${points})`;
      case 'card_played':
        return `Carta Jugada: ${context?.card?.rank || '?'} (+${points})`;
      case 'combo_played':
        return `¡Combo x${Math.round((context?.combo || 1) * 10) / 10}! (+${points})`;
      case 'heal_received':
        return `Curación: ${context?.amount || 0} (+${points})`;
      case 'event_overcome':
        return `Evento Superado: ${context?.eventType || 'Desconocido'} (+${points})`;
      case 'time_bonus':
        return `¡Bonus de Velocidad! (+${points})`;
      case 'difficulty_bonus':
        return `Bonus de Dificultad: ${context?.difficulty || 'Normal'} (+${points})`;
      case 'resource_saved':
        return `¡Uso Eficiente! (+${points})`;
      default:
        return `Puntos: +${points}`;
    }
  }

  // Analytics and reporting
  getScoreBreakdown(): { [category: string]: number } {
    const breakdown: { [category: string]: number } = {};
    
    for (const event of this.scoreEvents) {
      const category = this.getCategoryForScoreType(event.type);
      if (!breakdown[category]) breakdown[category] = 0;
      breakdown[category] += event.points;
    }
    
    return breakdown;
  }

  private getCategoryForScoreType(type: ScoreEvent['type']): string {
    const categories = {
      'Combate': ['damage_dealt', 'eco_killed', 'critical_hit'],
      'Supervivencia': ['turn_survived', 'perfect_turn', 'heal_received'],
      'Defensa': ['node_repaired', 'node_protected'],
      'Estrategia': ['card_played', 'combo_played', 'resource_saved'],
      'Eventos': ['event_overcome', 'status_applied'],
      'Bonificaciones': ['time_bonus', 'difficulty_bonus']
    };

    for (const [category, types] of Object.entries(categories)) {
      if (types.includes(type)) return category;
    }
    
    return 'Otros';
  }

  getMaxCombos(): { [type: string]: number } {
    const maxCombos: { [type: string]: number } = {};
    for (const [type, combo] of Object.entries(this.combos)) {
      maxCombos[type] = combo.maxCombo;
    }
    return maxCombos;
  }

  getScoreHistory(): ScoreEvent[] {
    return [...this.scoreEvents];
  }

  // Performance metrics
  getPerformanceMetrics(): {
    averageScorePerTurn: number;
    averageScorePerMinute: number;
    bestComboMultiplier: number;
    totalCombos: number;
    efficiencyRating: 'Poor' | 'Good' | 'Excellent' | 'Legendary';
  } {
    const totalTime = this.scoreEvents.length > 0 ? 
      this.scoreEvents[this.scoreEvents.length - 1].timestamp - this.scoreEvents[0].timestamp : 0;
    
    const turns = this.scoreEvents.filter(e => e.type === 'turn_survived').length;
    const combos = this.scoreEvents.filter(e => e.type === 'combo_played').length;
    const maxMultiplier = Math.max(...this.scoreEvents.map(e => e.multiplier || 1));
    
    const averageScorePerTurn = turns > 0 ? this.totalScore / turns : 0;
    const averageScorePerMinute = totalTime > 0 ? (this.totalScore / totalTime) * 60000 : 0;
    
    let efficiencyRating: 'Poor' | 'Good' | 'Excellent' | 'Legendary';
    if (averageScorePerTurn < 100) efficiencyRating = 'Poor';
    else if (averageScorePerTurn < 300) efficiencyRating = 'Good';
    else if (averageScorePerTurn < 500) efficiencyRating = 'Excellent';
    else efficiencyRating = 'Legendary';

    return {
      averageScorePerTurn,
      averageScorePerMinute,
      bestComboMultiplier: maxMultiplier,
      totalCombos: combos,
      efficiencyRating
    };
  }

  // State management
  resetScore(): void {
    this.totalScore = 0;
    this.scoreEvents = [];
    this.multipliers = [];
    this.combos = {};
  }

  getTotalScore(): number {
    return this.totalScore;
  }

  // Event system
  subscribe(listener: (event: ScoreEvent, totalScore: number) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(event: ScoreEvent, totalScore: number): void {
    this.listeners.forEach(listener => {
      try {
        listener(event, totalScore);
      } catch (error) {
        console.error('Error in score system listener:', error);
      }
    });
  }

  // Export/Import for persistence
  exportScoreData(): any {
    return {
      totalScore: this.totalScore,
      scoreEvents: this.scoreEvents,
      combos: this.combos,
      timestamp: Date.now()
    };
  }

  importScoreData(data: any): boolean {
    try {
      this.totalScore = data.totalScore || 0;
      this.scoreEvents = data.scoreEvents || [];
      this.combos = data.combos || {};
      return true;
    } catch (error) {
      console.error('Error importing score data:', error);
      return false;
    }
  }
}

export const scoreSystem = new ScoreSystem();
