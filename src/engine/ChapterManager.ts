// src/engine/ChapterManager.ts

export interface ScenarioAssets {
  cards: { [cardId: string]: string }; // cardId -> image path
  events: { [cardId: string]: string }; // cardId -> event image path
  backgrounds?: { [key: string]: string };
  audio?: { [key: string]: string };
  ui?: { [key: string]: string };
}

export interface ScenarioConfig {
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
  difficultySettings: {
    normal: { ecoHP: number };
    hard: { ecoHP: number };
    nightmare: { ecoHP: number };
  };
  art: {
    background?: string;
    cardBack?: string;
    hudTheme?: string;
  };
  audio: {
    ambientSound?: string;
    music?: string;
  };
  assetsPath: string; // Base path for scenario assets
}

export interface ChapterConfig {
  id: string;
  name: string;
  description: string;
  scenarioId: string; // Reference to scenario
  difficulty: 'normal' | 'hard' | 'nightmare';
  victoryConditions: VictoryCondition[];
  difficultyModifiers: {
    ecoAIDifficulty: number;
    eventFrequency: number;
    resourceScarcity: number;
    startingBonus?: { [stat: string]: number };
  };
  unlockRequirements?: {
    previousChapter?: string;
    minimumScore?: number;
  };
  narrative: {
    intro: string;
    victory: string;
    defeat: string;
  };
  specialRules?: string[];
  rewards?: ChapterReward[];
  scoreMultiplier: number;
}

export interface VictoryCondition {
  type: 'defeat_eco' | 'survive_turns' | 'protect_nodes' | 'score_threshold';
  target?: number;
  description: string;
}

export interface ChapterReward {
  type: 'unlock_chapter' | 'permanent_stat_boost' | 'new_cards' | 'unlock_scenario';
  value?: any;
  description: string;
}

export interface ChapterProgress {
  chapterId: string;
  completed: boolean;
  bestScore: number;
  attempts: number;
  bestTime?: number;
  unlockedRewards: string[];
  completionData?: {
    finalStats: { pv: number; cor: number; turn: number };
    nodesProtected: number;
    perfectRun: boolean; // No damage taken
  };
}

export interface PlayerProfile {
  totalScore: number;
  chaptersProgress: { [chapterId: string]: ChapterProgress };
  permanentBoosts: { [stat: string]: number };
  unlockedContent: string[];
  achievements: string[];
  currentChapter?: string;
  preferences: {
    difficulty: 'normal' | 'hard' | 'nightmare';
    autoSave: boolean;
    showTutorials: boolean;
  };
}

class ChapterManager {
  private chapters: { [id: string]: ChapterConfig } = {};
  private scenarios: { [id: string]: ScenarioConfig } = {};
  private currentChapter: ChapterConfig | null = null;
  private currentScenario: ScenarioConfig | null = null;
  private playerProfile!: PlayerProfile; // Will be initialized in constructor
  private listeners: (() => void)[] = [];
  private gameStartTime: number = 0;
  private currentScore: number = 0;
  private loadedAssets: { [scenarioId: string]: ScenarioAssets } = {};

  constructor() {
    this.loadPlayerProfile();
    this.initializeScenarios();
    this.initializeChapters();
  }

  private loadPlayerProfile() {
    const saved = localStorage.getItem('eco_game_profile');
    if (saved) {
      try {
        this.playerProfile = JSON.parse(saved);
        // Ensure all required fields exist (migration/compatibility)
        if (!this.playerProfile.preferences) {
          this.playerProfile.preferences = {
            difficulty: 'normal',
            autoSave: true,
            showTutorials: true
          };
        }
      } catch (error) {
        console.error('Error loading player profile:', error);
        this.resetPlayerProfile();
      }
    } else {
      this.resetPlayerProfile();
    }
  }

  private savePlayerProfile() {
    try {
      localStorage.setItem('eco_game_profile', JSON.stringify(this.playerProfile));
      if (this.playerProfile.preferences.autoSave) {
        // Also save to session storage for backup
        sessionStorage.setItem('eco_game_profile_backup', JSON.stringify(this.playerProfile));
      }
    } catch (error) {
      console.error('Error saving player profile:', error);
    }
  }

  private resetPlayerProfile() {
    this.playerProfile = {
      totalScore: 0,
      chaptersProgress: {},
      permanentBoosts: {},
      unlockedContent: ['chapter_1_easy'], // First chapter always unlocked
      achievements: [],
      preferences: {
        difficulty: 'normal',
        autoSave: true,
        showTutorials: true
      }
    };
    this.savePlayerProfile();
  }

  private initializeScenarios() {
    // Default scenario configuration
    this.scenarios['default'] = {
      id: 'default',
      name: 'Caleta Abandonada',
      description: 'Una estación pesquera abandonada en la costa chilena, donde los ecos del pasado resuenan con fuerza.',
      initialPlayerStats: {
        PV: 20,
        COR: 20,
        PA: 2,
        handSize: 5
      },
      initialEcoHP: 50,
      difficultySettings: {
        normal: { ecoHP: 50 },
        hard: { ecoHP: 70 },
        nightmare: { ecoHP: 100 }
      },
      art: {
        background: '/images/scenarios/default/backgrounds/caleta.jpg',
        cardBack: '/images/scenarios/default/cards/card-back.jpg',
        hudTheme: 'coastal'
      },
      audio: {
        ambientSound: '/audio/scenarios/default/ocean_wind.ogg',
        music: '/audio/scenarios/default/melancholy_shore.ogg'
      },
      assetsPath: '/images/scenarios/default'
    };

    // Future scenarios can be added here
    this.scenarios['urban'] = {
      id: 'urban',
      name: 'Ciudad Fragmentada',
      description: 'Los restos de una metrópolis donde la realidad se quiebra en cada esquina.',
      initialPlayerStats: {
        PV: 18,
        COR: 22,
        PA: 2,
        handSize: 5
      },
      initialEcoHP: 60,
      difficultySettings: {
        normal: { ecoHP: 60 },
        hard: { ecoHP: 85 },
        nightmare: { ecoHP: 120 }
      },
      art: {
        background: '/images/scenarios/urban/backgrounds/cityscape.jpg',
        cardBack: '/images/scenarios/urban/cards/card-back.jpg',
        hudTheme: 'cyberpunk'
      },
      audio: {
        ambientSound: '/audio/scenarios/urban/city_hum.ogg',
        music: '/audio/scenarios/urban/neon_dreams.ogg'
      },
      assetsPath: '/images/scenarios/urban'
    };
  }

  private initializeChapters() {
    // Chapter 1: Tutorial/Easy
    this.chapters['chapter_1_easy'] = {
      id: 'chapter_1_easy',
      name: 'Despertar',
      description: 'Tu primera confrontación con la entidad Eco. Aprende las mecánicas básicas en la caleta abandonada.',
      scenarioId: 'default',
      difficulty: 'normal',
      victoryConditions: [
        {
          type: 'defeat_eco',
          description: 'Derrota a la entidad Eco reduciendo su HP a 0'
        }
      ],
      difficultyModifiers: {
        ecoAIDifficulty: 0.7,
        eventFrequency: 0.6,
        resourceScarcity: 0.8,
        startingBonus: { PV: 5, COR: 5 } // Extra life and sanity for tutorial
      },
      narrative: {
        intro: 'Despiertas en los restos de una antigua caleta pesquera. Los ecos del pasado susurran en el viento salado, pero algo más siniestro se agita en las sombras. Es momento de enfrentar tus primeros miedos.',
        victory: '¡Has superado tu primer encuentro! El eco se desvanece momentáneamente, pero sientes que esto es solo el comienzo. Algo más profundo y oscuro te espera en las profundidades...',
        defeat: 'La presencia del eco te abruma por ahora. Cada derrota enseña una lección. Los pescadores de antaño también lucharon contra estas fuerzas. ¡Inténtalo de nuevo!'
      },
      rewards: [
        {
          type: 'unlock_chapter',
          value: 'chapter_1_medium',
          description: 'Desbloquea: Despertar - Dificultad Media'
        }
      ],
      scoreMultiplier: 1.0
    };

    this.chapters['chapter_1_medium'] = {
      id: 'chapter_1_medium',
      name: 'Despertar - Prueba',
      description: 'Enfrenta la misma situación con mayor dificultad. El eco aprende de tus movimientos.',
      scenarioId: 'default',
      difficulty: 'hard',
      victoryConditions: [
        {
          type: 'defeat_eco',
          description: 'Derrota a la entidad Eco'
        },
        {
          type: 'protect_nodes',
          target: 2,
          description: 'Mantén al menos 2 nodos activos'
        }
      ],
      difficultyModifiers: {
        ecoAIDifficulty: 1.0,
        eventFrequency: 1.0,
        resourceScarcity: 1.0
      },
      unlockRequirements: {
        previousChapter: 'chapter_1_easy'
      },
      narrative: {
        intro: 'Regresas a la caleta, pero el eco ha aprendido de tu victoria anterior. Los nodos vitales están más vulnerables y la presencia se siente más intensa.',
        victory: 'Demuestras verdadero dominio sobre las fuerzas básicas del eco. Tu comprensión se profundiza.',
        defeat: 'El eco se adapta rápidamente. Necesitas una estrategia más refinada.'
      },
      rewards: [
        {
          type: 'unlock_chapter',
          value: 'chapter_2_descent',
          description: 'Desbloquea: Capítulo 2 - Descenso'
        }
      ],
      scoreMultiplier: 1.3
    };

    // Chapter 2: Medium complexity
    this.chapters['chapter_2_descent'] = {
      id: 'chapter_2_descent',
      name: 'Descenso',
      description: 'Adentrándote más en la caleta, descubres niveles más profundos donde el eco es más fuerte.',
      scenarioId: 'default',
      difficulty: 'hard',
      victoryConditions: [
        {
          type: 'defeat_eco',
          description: 'Derrota a la entidad Eco'
        },
        {
          type: 'survive_turns',
          target: 12,
          description: 'Sobrevive al menos 12 turnos'
        },
        {
          type: 'protect_nodes',
          target: 3,
          description: 'Mantén al menos 3 nodos activos'
        }
      ],
      difficultyModifiers: {
        ecoAIDifficulty: 1.2,
        eventFrequency: 1.2,
        resourceScarcity: 1.1
      },
      unlockRequirements: {
        previousChapter: 'chapter_1_medium'
      },
      narrative: {
        intro: 'Los niveles inferiores de la caleta revelan secretos más oscuros. Las máquinas oxidadas cobran una vida siniestra y los ecos del pasado se vuelven gritos desesperados.',
        victory: 'Has demostrado resistencia excepcional. Los niveles profundos revelan sus secretos, pero aún queda lo peor por delante.',
        defeat: 'Las profundidades reclaman a muchos visitantes. La presión aumenta exponencialmente en cada nivel.'
      },
      specialRules: [
        'node_cascade_damage', // Los nodos dañados pueden afectar a otros
        'enhanced_events' // Eventos más complejos
      ],
      rewards: [
        {
          type: 'unlock_chapter',
          value: 'chapter_2_nightmare',
          description: 'Desbloquea: Descenso - Modo Pesadilla'
        },
        {
          type: 'permanent_stat_boost',
          value: { type: 'maxHandSize', amount: 1 },
          description: 'Aumenta permanentemente el tamaño máximo de mano'
        }
      ],
      scoreMultiplier: 1.5
    };

    this.chapters['chapter_2_nightmare'] = {
      id: 'chapter_2_nightmare',
      name: 'Descenso - Pesadilla',
      description: 'El verdadero infierno de los niveles profundos, donde solo los maestros sobreviven.',
      scenarioId: 'default',
      difficulty: 'nightmare',
      victoryConditions: [
        {
          type: 'defeat_eco',
          description: 'Derrota a la entidad Eco'
        },
        {
          type: 'survive_turns',
          target: 15,
          description: 'Sobrevive al menos 15 turnos'
        },
        {
          type: 'protect_nodes',
          target: 4,
          description: 'Mantén todos los nodos activos'
        },
        {
          type: 'score_threshold',
          target: 800,
          description: 'Alcanza 800 puntos mínimos'
        }
      ],
      difficultyModifiers: {
        ecoAIDifficulty: 1.5,
        eventFrequency: 1.4,
        resourceScarcity: 1.3,
        startingBonus: { PV: -2, COR: -2 } // Penalty for nightmare mode
      },
      unlockRequirements: {
        previousChapter: 'chapter_2_descent'
      },
      narrative: {
        intro: 'El corazón oscuro de la caleta se revela. Aquí, el eco no solo ataca tu mente: reescribe la realidad misma. Solo los verdaderos maestros pueden sobrevivir.',
        victory: '¡MAESTRÍA ABSOLUTA! Has conquistado las profundidades más oscuras. Tu nombre será recordado entre los que desafiaron el eco y prevalecieron.',
        defeat: 'Incluso los más fuertes pueden caer en la pesadilla. Cada intento te acerca más a la verdadera maestría.'
      },
      specialRules: [
        'eco_rage_mode',
        'critical_events',
        'node_instability',
        'reality_distortion'
      ],
      rewards: [
        {
          type: 'unlock_chapter',
          value: 'chapter_3_abyss',
          description: 'Desbloquea: Capítulo 3 - Abismo Final'
        },
        {
          type: 'permanent_stat_boost',
          value: { type: 'maxPV', amount: 3 },
          description: 'Aumenta permanentemente la vida máxima'
        },
        {
          type: 'unlock_scenario',
          value: 'urban',
          description: 'Desbloquea el escenario: Ciudad Fragmentada'
        }
      ],
      scoreMultiplier: 2.0
    };

    // Chapter 3: Final challenge
    this.chapters['chapter_3_abyss'] = {
      id: 'chapter_3_abyss',
      name: 'Abismo Final',
      description: 'El enfrentamiento definitivo en las profundidades de la caleta, donde el eco despliega toda su furia.',
      scenarioId: 'default',
      difficulty: 'nightmare',
      victoryConditions: [
        {
          type: 'defeat_eco',
          description: 'Derrota a la entidad Eco'
        },
        {
          type: 'survive_turns',
          target: 20,
          description: 'Sobrevive al menos 20 turnos'
        },
        {
          type: 'score_threshold',
          target: 1200,
          description: 'Alcanza una puntuación épica de 1200'
        }
      ],
      difficultyModifiers: {
        ecoAIDifficulty: 1.8,
        eventFrequency: 1.5,
        resourceScarcity: 1.4,
        startingBonus: { handSize: -1 } // Start with fewer cards
      },
      unlockRequirements: {
        previousChapter: 'chapter_2_nightmare',
        minimumScore: 500
      },
      narrative: {
        intro: 'Has llegado al núcleo primordial del eco, donde la realidad se disuelve y solo queda la voluntad pura. Esta es la prueba definitiva de tu dominio sobre las fuerzas del caos.',
        victory: '¡VICTORIA LEGENDARIA! Has conquistado el abismo mismo y emergido como un verdadero domador de ecos. Tu hazaña será contada por generaciones.',
        defeat: 'El abismo es implacable, pero tu valor al llegar aquí es inquebrantable. Cada intento forja tu alma más fuerte.'
      },
      specialRules: [
        'eco_evolution',
        'reality_breakdown',
        'legendary_events',
        'final_gambit'
      ],
      rewards: [
        {
          type: 'permanent_stat_boost',
          value: { type: 'maxPV', amount: 5 },
          description: 'Maestría Vital: +5 PV permanente'
        },
        {
          type: 'permanent_stat_boost',
          value: { type: 'maxCOR', amount: 5 },
          description: 'Maestría Mental: +5 COR permanente'
        },
        {
          type: 'permanent_stat_boost',
          value: { type: 'maxPA', amount: 1 },
          description: 'Maestría Táctica: +1 PA permanente'
        }
      ],
      scoreMultiplier: 3.0
    };
  }

  // Asset loading and management
  async loadScenarioAssets(scenarioId: string): Promise<ScenarioAssets> {
    if (this.loadedAssets[scenarioId]) {
      return this.loadedAssets[scenarioId];
    }

    const scenario = this.scenarios[scenarioId];
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const assets: ScenarioAssets = {
      cards: {},
      events: {},
      backgrounds: {},
      audio: {},
      ui: {}
    };

    try {
      // Load card assets
      const cardSuits = ['corazones', 'diamantes', 'espadas', 'treboles'];
      const cardRanks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];

      for (const suit of cardSuits) {
        for (const rank of cardRanks) {
          const cardId = `${rank}-${suit}`;
          assets.cards[cardId] = `${scenario.assetsPath}/cards/${cardId}.png`;
          assets.events[cardId] = `${scenario.assetsPath}/events/${cardId}.png`;
        }
      }

      // Load special assets
      assets.cards['card-back'] = `${scenario.assetsPath}/cards/card-back.jpg`;
      assets.cards['missing-card'] = `${scenario.assetsPath}/cards/missing-card.jpg`;

      // Load backgrounds and UI
      if (scenario.art.background) {
        assets.backgrounds!['main'] = scenario.art.background;
      }

      // Load audio assets (when available)
      if (scenario.audio.music) {
        assets.audio!['music'] = scenario.audio.music;
      }
      if (scenario.audio.ambientSound) {
        assets.audio!['ambient'] = scenario.audio.ambientSound;
      }

      this.loadedAssets[scenarioId] = assets;
      console.log(`✅ Loaded assets for scenario: ${scenarioId}`);
      
      return assets;
    } catch (error) {
      console.error(`Error loading assets for scenario ${scenarioId}:`, error);
      throw error;
    }
  }

  // Preload assets for a scenario
  async preloadScenarioAssets(scenarioId: string): Promise<void> {
    const assets = await this.loadScenarioAssets(scenarioId);
    
    // Preload critical images
    const preloadPromises: Promise<void>[] = [];
    
    // Preload card backs and common UI elements first
    const criticalAssets = [
      assets.cards['card-back'],
      assets.cards['missing-card']
    ].filter(Boolean);

    for (const assetPath of criticalAssets) {
      preloadPromises.push(
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load ${assetPath}`));
          img.src = assetPath;
        })
      );
    }

    try {
      await Promise.all(preloadPromises);
      console.log(`✅ Preloaded critical assets for scenario: ${scenarioId}`);
    } catch (error) {
      console.warn(`⚠️ Some assets failed to preload for scenario ${scenarioId}:`, error);
      // Don't throw - the game can continue with missing assets
    }
  }

  // Chapter management
  async selectChapter(chapterId: string): Promise<boolean> {
    const chapter = this.chapters[chapterId];
    if (!chapter) {
      console.error(`Chapter ${chapterId} not found`);
      return false;
    }

    if (!this.isChapterUnlocked(chapterId)) {
      console.error(`Chapter ${chapterId} is locked`);
      return false;
    }

    const scenario = this.scenarios[chapter.scenarioId];
    if (!scenario) {
      console.error(`Scenario ${chapter.scenarioId} not found for chapter ${chapterId}`);
      return false;
    }

    try {
      // Import AssetManager dynamically to avoid circular dependencies
      const { assetManager } = await import('./AssetManager');
      
      // Set scenario in asset manager
      assetManager.setScenario(scenario.id);
      
      // Preload scenario assets using PIXI.Assets
      await assetManager.preloadScenarioAssets(scenario.id);
      
      this.currentChapter = chapter;
      this.currentScenario = scenario;
      this.gameStartTime = Date.now();
      this.currentScore = 0;
      this.playerProfile.currentChapter = chapterId;
      this.savePlayerProfile();
      this.notify();
      
      console.log(`\u2705 Selected chapter: ${chapter.name} (${scenario.name})`);
      console.log(`\ud83c\udfa8 Assets loaded for scenario: ${scenario.id}`);
      return true;
    } catch (error) {
      console.error(`Failed to select chapter ${chapterId}:`, error);
      return false;
    }
  }

  isChapterUnlocked(chapterId: string): boolean {
    return this.playerProfile.unlockedContent.includes(chapterId);
  }

  // Game state integration
  getGameConfiguration(): any {
    if (!this.currentChapter || !this.currentScenario) {
      return null;
    }

    const baseConfig = { ...this.currentScenario };
    const chapter = this.currentChapter;
    
    // Apply chapter difficulty settings
    const difficultyConfig = baseConfig.difficultySettings[chapter.difficulty];
    baseConfig.initialEcoHP = difficultyConfig.ecoHP;

    // Apply chapter modifiers
    if (chapter.difficultyModifiers.startingBonus) {
      const bonus = chapter.difficultyModifiers.startingBonus;
      if (bonus.PV) baseConfig.initialPlayerStats.PV += bonus.PV;
      if (bonus.COR) baseConfig.initialPlayerStats.COR += bonus.COR;
      if (bonus.PA) baseConfig.initialPlayerStats.PA += bonus.PA;
      if (bonus.handSize) baseConfig.initialPlayerStats.handSize += bonus.handSize;
    }

    // Apply permanent boosts
    Object.entries(this.playerProfile.permanentBoosts).forEach(([stat, boost]) => {
      switch (stat) {
        case 'maxPV':
          baseConfig.initialPlayerStats.PV += boost;
          break;
        case 'maxCOR':
          baseConfig.initialPlayerStats.COR += boost;
          break;
        case 'maxPA':
          baseConfig.initialPlayerStats.PA += boost;
          break;
        case 'maxHandSize':
          baseConfig.initialPlayerStats.handSize += boost;
          break;
      }
    });

    return {
      ...baseConfig,
      chapter,
      difficultyModifiers: chapter.difficultyModifiers,
      assets: this.loadedAssets[chapter.scenarioId]
    };
  }

  // Progress tracking
  startChapter(): ChapterConfig | null {
    if (!this.currentChapter) return null;

    if (!this.playerProfile.chaptersProgress[this.currentChapter.id]) {
      this.playerProfile.chaptersProgress[this.currentChapter.id] = {
        chapterId: this.currentChapter.id,
        completed: false,
        bestScore: 0,
        attempts: 0,
        unlockedRewards: []
      };
    }

    this.playerProfile.chaptersProgress[this.currentChapter.id].attempts++;
    this.gameStartTime = Date.now();
    this.currentScore = 0;
    this.savePlayerProfile();
    
    return this.currentChapter;
  }

  updateScore(points: number) {
    const multiplier = this.currentChapter?.scoreMultiplier || 1.0;
    this.currentScore += Math.round(points * multiplier);
    this.notify();
  }

  getCurrentScore(): number {
    return this.currentScore;
  }

  checkVictoryConditions(gameState: any): { met: boolean; unmet: VictoryCondition[] } {
    if (!this.currentChapter) return { met: false, unmet: [] };

    const unmetConditions: VictoryCondition[] = [];

    for (const condition of this.currentChapter.victoryConditions) {
      if (!this.isConditionMet(condition, gameState)) {
        unmetConditions.push(condition);
      }
    }

    return {
      met: unmetConditions.length === 0,
      unmet: unmetConditions
    };
  }

  private isConditionMet(condition: VictoryCondition, gameState: any): boolean {
    switch (condition.type) {
      case 'defeat_eco':
        return gameState.ecoHp <= 0;
      case 'survive_turns':
        return gameState.turn >= (condition.target || 0);
      case 'protect_nodes':
        const activeNodes = gameState.nodes ? 
          gameState.nodes.filter((n: any) => n.status === 'active').length : 0;
        return activeNodes >= (condition.target || 0);
      case 'score_threshold':
        return this.currentScore >= (condition.target || 0);
      default:
        return false;
    }
  }

  completeChapter(victory: boolean, finalScore: number, gameState?: any): boolean {
    if (!this.currentChapter) return false;

    const chapterId = this.currentChapter.id;
    const progress = this.playerProfile.chaptersProgress[chapterId];
    const gameTime = Date.now() - this.gameStartTime;

    if (victory) {
      progress.completed = true;
      progress.bestScore = Math.max(progress.bestScore, finalScore);
      
      if (!progress.bestTime || gameTime < progress.bestTime) {
        progress.bestTime = gameTime;
      }

      // Store completion data
      if (gameState) {
        progress.completionData = {
          finalStats: { 
            pv: gameState.pv || 0, 
            cor: gameState.sanity || 0, 
            turn: gameState.turn || 0 
          },
          nodesProtected: gameState.nodes ? 
            gameState.nodes.filter((n: any) => n.status === 'active').length : 0,
          perfectRun: (gameState.pv || 0) === (this.currentScenario?.initialPlayerStats.PV || 20)
        };
      }

      this.playerProfile.totalScore += finalScore;

      // Grant rewards
      if (this.currentChapter.rewards) {
        this.currentChapter.rewards.forEach(reward => {
          this.grantReward(reward, chapterId);
        });
      }

      // Check for achievements
      this.checkAchievements(gameState);
    }

    this.savePlayerProfile();
    this.notify();
    return true;
  }

  private grantReward(reward: ChapterReward, chapterId: string) {
    const progress = this.playerProfile.chaptersProgress[chapterId];
    
    if (progress.unlockedRewards.includes(reward.type + (reward.value || ''))) return;

    switch (reward.type) {
      case 'unlock_chapter':
        if (reward.value && !this.playerProfile.unlockedContent.includes(reward.value)) {
          this.playerProfile.unlockedContent.push(reward.value);
        }
        break;
      
      case 'unlock_scenario':
        if (reward.value && !this.playerProfile.unlockedContent.includes(reward.value)) {
          this.playerProfile.unlockedContent.push(reward.value);
        }
        break;
      
      case 'permanent_stat_boost':
        if (reward.value) {
          const boost = reward.value;
          if (!this.playerProfile.permanentBoosts[boost.type]) {
            this.playerProfile.permanentBoosts[boost.type] = 0;
          }
          this.playerProfile.permanentBoosts[boost.type] += boost.amount;
        }
        break;
    }

    progress.unlockedRewards.push(reward.type + (reward.value || ''));
  }

  private checkAchievements(gameState?: any) {
    // Implement achievement logic
    // Examples: Perfect run, Speed run, Pacifist run, etc.
    if (gameState) {
      console.log('🏆 Checking achievements for completed chapter...');
      // TODO: Implement specific achievement checks
    }
  }

  // Public getters
  get currentChapterConfig(): ChapterConfig | null { return this.currentChapter; }
  get currentScenarioConfig(): ScenarioConfig | null { return this.currentScenario; }
  get profile(): PlayerProfile { return { ...this.playerProfile }; }
  
  get availableChapters(): ChapterConfig[] {
    return Object.values(this.chapters).filter(chapter => 
      this.playerProfile.unlockedContent.includes(chapter.id)
    );
  }

  get availableScenarios(): ScenarioConfig[] {
    return Object.values(this.scenarios).filter(scenario =>
      this.playerProfile.unlockedContent.includes(scenario.id) ||
      scenario.id === 'default' // Default always available
    );
  }

  getScenarioAssets(scenarioId: string): ScenarioAssets | null {
    return this.loadedAssets[scenarioId] || null;
  }

  // Event system
  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // Utilities
  resetProgress() {
    if (confirm('¿Estás seguro de que quieres reiniciar todo tu progreso? Esta acción no se puede deshacer.')) {
      this.resetPlayerProfile();
      this.notify();
    }
  }

  exportProgress(): string {
    return JSON.stringify(this.playerProfile, null, 2);
  }

  importProgress(data: string): boolean {
    try {
      const imported = JSON.parse(data);
      this.playerProfile = imported;
      this.savePlayerProfile();
      this.notify();
      return true;
    } catch (error) {
      console.error('Error importing progress:', error);
      return false;
    }
  }
}

export const chapterManager = new ChapterManager();
