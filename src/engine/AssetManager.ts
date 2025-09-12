// src/engine/AssetManager.ts

import * as PIXI from 'pixi.js';

export interface AssetPaths {
  // UI Global
  ui: {
    frameBorder: string;
    cardZoomBg: string;
    cardActions: {
      play: string;
      sacrifice: string;
      research: string;
      discard: string;
      cancel: string;
    };
  };
  
  // Effects Global
  effects: {
    glow: string;
    projectile: string;
    particles: string;
  };
  
  // Scenario-specific assets
  scenario: {
    backgrounds: {
      main: string;
      menu: string;
    };
    characters: {
      playerPortrait: string;
    };
    eco: {
      vigilante: string;
      predator: string;
      devastator: string;
    };
    ui: {
      hudBackground: string;
      nodeIcons: string;
    };
    cards: {
      cardBack: string;
      [cardId: string]: string; // Dynamic card paths
    };
    events: {
      [cardId: string]: string; // Dynamic event paths
    };
  };
}

export interface AssetLoadResult {
  path: string;
  loaded: boolean;
  fallbackUsed: boolean;
  error?: string;
}

class AssetManager {
  private loadedImages: { [path: string]: HTMLImageElement } = {};
  private loadedTextures: { [path: string]: PIXI.Texture } = {};
  private failedImages: Set<string> = new Set();
  private currentScenario: string = 'default';
  // private pixiAssetsLoaded: boolean = false; // Reserved for future use
  
  // Fallback assets - these should always exist
  private readonly FALLBACK_ASSETS = {
    ui: {
      frameBorder: '/images/ui/frame-border-fallback.png',
      cardZoomBg: '/images/ui/card-zoom-bg-fallback.png',
      cardActions: {
        play: '/images/ui/card-actions/play-fallback.png',
        sacrifice: '/images/ui/card-actions/sacrifice-fallback.png',
        research: '/images/ui/card-actions/research-fallback.png',
        discard: '/images/ui/card-actions/discard-fallback.png',
        cancel: '/images/ui/card-actions/cancel-fallback.png',
      }
    },
    effects: {
      glow: '/images/effects/glow-effect-fallback.png',
      projectile: '/images/effects/projectile-fallback.png',
      particles: '/images/effects/particles-fallback.png'
    },
    scenario: {
      backgrounds: {
        main: '/images/scenarios/default/backgrounds/main-bg.png',
        menu: '/images/scenarios/default/backgrounds/menu-bg.png'
      },
      characters: {
        playerPortrait: '/images/scenarios/default/characters/player-portrait-fallback.png'
      },
      eco: {
        vigilante: '/images/scenarios/default/eco/eco-vigilante-fallback.png',
        predator: '/images/scenarios/default/eco/eco-predator-fallback.png',
        devastator: '/images/scenarios/default/eco/eco-devastator-fallback.png'
      },
      ui: {
        hudBackground: '/images/scenarios/default/ui/hud-background-fallback.png',
        nodeIcons: '/images/scenarios/default/ui/node-icons-fallback.png'
      },
      cards: {
        cardBack: '/images/scenarios/default/cards/card-back-fallback.png',
        missingCard: '/images/scenarios/default/cards/missing-card-fallback.png'
      },
      events: {
        missingEvent: '/images/scenarios/default/events/missing-event-fallback.png'
      }
    }
  };

  // Generate card paths for all 52 cards
  private generateCardPaths(scenarioId: string): { [cardId: string]: string } & { cardBack: string } {
    const suits = ['corazones', 'diamantes', 'espadas', 'treboles'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
    const cardPaths: { [cardId: string]: string } = {};
    
    // Add card back and special cards
    cardPaths['card-back'] = `/images/scenarios/${scenarioId}/cards/card-back.png`;
    cardPaths['missing-card'] = `/images/scenarios/${scenarioId}/cards/missing-card.png`;
    
    // Generate all 52 card combinations
    for (const suit of suits) {
      for (const rank of ranks) {
        const cardId = `${rank}-${suit}`;
        cardPaths[cardId] = `/images/scenarios/${scenarioId}/cards/${cardId}.png`;
      }
    }
    
    return { ...cardPaths, cardBack: cardPaths['card-back'] } as { [cardId: string]: string } & { cardBack: string };
  }

  // Generate event paths for all 52 events
  private generateEventPaths(scenarioId: string): { [cardId: string]: string } {
    const suits = ['S', 'H', 'C', 'D']; // Spades, Hearts, Clubs, Diamonds
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const eventPaths: { [cardId: string]: string } = {};
    
    // Add missing event fallback
    eventPaths['missing-event'] = `/images/scenarios/${scenarioId}/events/missing-event.png`;
    
    // Generate all 52 event combinations
    for (const suit of suits) {
      for (const rank of ranks) {
        const eventId = `${rank}${suit}`;
        eventPaths[eventId] = `/images/scenarios/${scenarioId}/events/${eventId}.png`;
      }
    }
    
    return eventPaths;
  }

  // Get current asset paths for the active scenario
  getCurrentAssetPaths(): AssetPaths {
    return {
      ui: {
        frameBorder: '/images/ui/frame-border.png',
        cardZoomBg: '/images/ui/card-zoom-bg.png',
        cardActions: {
          play: '/images/ui/card-actions/play.png',
          sacrifice: '/images/ui/card-actions/sacrifice.png',
          research: '/images/ui/card-actions/research.png',
          discard: '/images/ui/card-actions/discard.png',
          cancel: '/images/ui/card-actions/cancel.png',
        }
      },
      effects: {
        glow: '/images/effects/glow-effect.png',
        projectile: '/images/effects/projectile.png',
        particles: '/images/effects/particles.png'
      },
      scenario: {
        backgrounds: {
          main: `/images/scenarios/${this.currentScenario}/backgrounds/main-bg.png`,
          menu: `/images/scenarios/${this.currentScenario}/backgrounds/menu-bg.png`
        },
        characters: {
          playerPortrait: `/images/scenarios/${this.currentScenario}/characters/player-portrait.png`
        },
        eco: {
          vigilante: `/images/scenarios/${this.currentScenario}/eco/eco-vigilante.png`,
          predator: `/images/scenarios/${this.currentScenario}/eco/eco-predator.png`,
          devastator: `/images/scenarios/${this.currentScenario}/eco/eco-devastator.png`
        },
        ui: {
          hudBackground: `/images/scenarios/${this.currentScenario}/ui/hud-background.png`,
          nodeIcons: `/images/scenarios/${this.currentScenario}/ui/node-icons.png`
        },
        cards: this.generateCardPaths(this.currentScenario),
        events: this.generateEventPaths(this.currentScenario)
      }
    };
  }

  // Set the current scenario
  setScenario(scenarioId: string): void {
    if (this.currentScenario !== scenarioId) {
      this.currentScenario = scenarioId;
      console.log(`🎨 AssetManager: Changed scenario to '${scenarioId}'`);
    }
  }

  // Load an image with fallback support
  async loadImage(path: string, fallbackPath?: string): Promise<AssetLoadResult> {
    // Return cached image if already loaded
    if (this.loadedImages[path]) {
      return {
        path,
        loaded: true,
        fallbackUsed: false
      };
    }

    // Skip if already known to be failed and no fallback
    if (this.failedImages.has(path) && !fallbackPath) {
      return {
        path,
        loaded: false,
        fallbackUsed: false,
        error: 'Previously failed to load'
      };
    }

    try {
      const img = await this.loadImageFromPath(path);
      this.loadedImages[path] = img;
      return {
        path,
        loaded: true,
        fallbackUsed: false
      };
    } catch (error) {
      console.warn(`⚠️ Failed to load image: ${path}`);
      this.failedImages.add(path);

      // Try fallback if available
      if (fallbackPath) {
        try {
          const fallbackImg = await this.loadImageFromPath(fallbackPath);
          this.loadedImages[path] = fallbackImg; // Cache under original path
          console.log(`✅ Used fallback for ${path}: ${fallbackPath}`);
          return {
            path: fallbackPath,
            loaded: true,
            fallbackUsed: true
          };
        } catch (fallbackError) {
          console.error(`❌ Fallback also failed for ${path}: ${fallbackPath}`, fallbackError);
          return {
            path,
            loaded: false,
            fallbackUsed: false,
            error: `Both original and fallback failed: ${error}`
          };
        }
      }

      return {
        path,
        loaded: false,
        fallbackUsed: false,
        error: error as string
      };
    }
  }

  // Helper to load image from path
  private loadImageFromPath(path: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
      img.src = path;
    });
  }

  // Load texture using PIXI.Assets
  async loadPixiTexture(path: string, fallbackPath?: string): Promise<PIXI.Texture | null> {
    // Return cached texture if already loaded
    if (this.loadedTextures[path]) {
      return this.loadedTextures[path];
    }

    try {
      console.log(`🎨 AssetManager: Loading PIXI texture: ${path}`);
      const texture = await PIXI.Assets.load(path);
      this.loadedTextures[path] = texture;
      return texture;
    } catch (error) {
      console.warn(`⚠️ Failed to load PIXI texture: ${path}`);
      this.failedImages.add(path);

      // Try fallback if available
      if (fallbackPath && fallbackPath !== path) {
        try {
          console.log(`🔄 AssetManager: Trying fallback texture: ${fallbackPath}`);
          const fallbackTexture = await PIXI.Assets.load(fallbackPath);
          this.loadedTextures[path] = fallbackTexture; // Cache under original path
          return fallbackTexture;
        } catch (fallbackError) {
          console.error(`❌ Fallback texture also failed: ${fallbackPath}`, fallbackError);
        }
      }

      return null;
    }
  }

  // Get specific asset paths with fallbacks
  async getCardImagePath(cardId: string): Promise<string> {
    const primaryPath = `/images/scenarios/${this.currentScenario}/cards/${cardId}.png`;
    const svgFallback = `/images/scenarios/${this.currentScenario}/cards/missing-card.svg`;
    const pngFallback = this.FALLBACK_ASSETS.scenario.cards.missingCard;
    
    const result = await this.loadImage(primaryPath, svgFallback);
    if (result.loaded) {
      return result.fallbackUsed ? result.path : primaryPath;
    }
    
    // Try PNG fallback if SVG also failed
    const pngResult = await this.loadImage(pngFallback);
    return pngResult.loaded ? pngFallback : this.createFallbackAsset('card', 70, 98, '#1a472a');
  }

  async getEventImagePath(eventId: string): Promise<string> {
    const primaryPath = `/images/scenarios/${this.currentScenario}/events/${eventId}.png`;
    const svgFallback = `/images/scenarios/${this.currentScenario}/events/missing-event.svg`;
    const pngFallback = this.FALLBACK_ASSETS.scenario.events.missingEvent;
    
    const result = await this.loadImage(primaryPath, svgFallback);
    if (result.loaded) {
      return result.fallbackUsed ? result.path : primaryPath;
    }
    
    // Try PNG fallback if SVG also failed
    const pngResult = await this.loadImage(pngFallback);
    return pngResult.loaded ? pngFallback : this.createFallbackAsset('event', 280, 392, '#0f172a');
  }

  async getBackgroundPath(): Promise<string> {
    const primaryPath = `/images/scenarios/${this.currentScenario}/backgrounds/main-bg.png`;
    const svgFallback = `/images/scenarios/${this.currentScenario}/backgrounds/main-bg.svg`;
    const fallbackPath = this.FALLBACK_ASSETS.scenario.backgrounds.main;
    
    // Try PNG first
    let result = await this.loadImage(primaryPath);
    if (result.loaded) return primaryPath;
    
    // Try SVG fallback
    result = await this.loadImage(svgFallback);
    if (result.loaded) return svgFallback;
    
    // Final PNG fallback or generate emergency
    result = await this.loadImage(fallbackPath);
    return result.loaded ? fallbackPath : this.createFallbackAsset('background', 1280, 800, '#1e293b');
  }

  async getScenarioPreviewPath(scenarioId: string): Promise<string> {
    const primaryPath = `/images/scenarios/${scenarioId}/preview.png`;
    const jpgFallback = `/images/scenarios/${scenarioId}/preview.jpg`;
    const svgFallback = `/images/scenarios/${scenarioId}/preview.svg`;
    
    // Try PNG first
    let result = await this.loadImage(primaryPath);
    if (result.loaded) return primaryPath;
    
    // Try JPG fallback
    result = await this.loadImage(jpgFallback);
    if (result.loaded) return jpgFallback;
    
    // Try SVG fallback
    result = await this.loadImage(svgFallback);
    if (result.loaded) return svgFallback;
    
    // Generate fallback preview
    return this.createFallbackAsset('background', 120, 80, '#1e293b');
  }

  async getPlayerPortraitPath(): Promise<string> {
    const primaryPath = `/images/scenarios/${this.currentScenario}/characters/player-portrait.png`;
    const svgFallback = `/images/scenarios/${this.currentScenario}/characters/player-portrait.svg`;
    // const fallbackPath = this.FALLBACK_ASSETS.scenario.characters.playerPortrait;
    
    const result = await this.loadImage(primaryPath, svgFallback);
    if (result.loaded) {
      return result.fallbackUsed ? result.path : primaryPath;
    }
    
    return this.createFallbackAsset('portrait', 180, 350, '#4a5568');
  }

  async getEcoImagePath(phase: 'vigilante' | 'predator' | 'devastator'): Promise<string> {
    const primaryPath = `/images/scenarios/${this.currentScenario}/eco/eco-${phase}.png`;
    const svgFallback = `/images/scenarios/${this.currentScenario}/eco/eco-${phase}.svg`;
    // const fallbackPath = this.FALLBACK_ASSETS.scenario.eco[phase];
    
    const result = await this.loadImage(primaryPath, svgFallback);
    if (result.loaded) {
      return result.fallbackUsed ? result.path : primaryPath;
    }
    
    const colors = {
      vigilante: '#22c55e',
      predator: '#f59e0b', 
      devastator: '#ef4444'
    };
    
    return this.createFallbackAsset('portrait', 180, 350, colors[phase]);
  }

  async getUIAssetPath(asset: keyof AssetPaths['ui']): Promise<string> {
    if (asset === 'cardActions') {
      throw new Error('Use getCardActionPath for card actions');
    }
    
    const primaryPath = `/images/ui/${asset === 'frameBorder' ? 'frame-border' : 'card-zoom-bg'}.png`;
    const fallbackPath = this.FALLBACK_ASSETS.ui[asset];
    
    const result = await this.loadImage(primaryPath, fallbackPath);
    return result.loaded ? (result.fallbackUsed ? result.path : primaryPath) : fallbackPath;
  }

  async getCardActionPath(action: keyof AssetPaths['ui']['cardActions']): Promise<string> {
    const primaryPath = `/images/ui/card-actions/${action}.png`;
    const fallbackPath = this.FALLBACK_ASSETS.ui.cardActions[action];
    
    const result = await this.loadImage(primaryPath, fallbackPath);
    return result.loaded ? (result.fallbackUsed ? result.path : primaryPath) : fallbackPath;
  }

  async getEffectPath(effect: keyof AssetPaths['effects']): Promise<string> {
    const effectNames = {
      glow: 'glow-effect',
      projectile: 'projectile',
      particles: 'particles'
    };
    
    const primaryPath = `/images/effects/${effectNames[effect]}.png`;
    const fallbackPath = this.FALLBACK_ASSETS.effects[effect];
    
    const result = await this.loadImage(primaryPath, fallbackPath);
    return result.loaded ? (result.fallbackUsed ? result.path : primaryPath) : fallbackPath;
  }

  // Preload critical assets for a scenario using PIXI.Assets
  async preloadScenarioAssets(scenarioId: string): Promise<void> {
    console.log(`🎨 Preloading assets for scenario: ${scenarioId}`);
    
    // const previousScenario = this.currentScenario; // Reserved for future use
    this.setScenario(scenarioId);
    
    // Define asset bundles for PIXI.Assets
    const assetBundle = {
      name: `scenario-${scenarioId}`,
      assets: {
        // Backgrounds
        'bg-main': `/images/scenarios/${scenarioId}/backgrounds/main-bg.png`,
        'bg-main-fallback': `/images/scenarios/${scenarioId}/backgrounds/main-bg.jpg`,
        'bg-main-svg': `/images/scenarios/${scenarioId}/backgrounds/main-bg.svg`,
        
        // Characters
        'player-portrait': `/images/scenarios/${scenarioId}/characters/player-portrait.png`,
        'player-portrait-svg': `/images/scenarios/${scenarioId}/characters/player-portrait.svg`,
        
        // Eco phases
        'eco-vigilante': `/images/scenarios/${scenarioId}/eco/eco-vigilante.png`,
        'eco-vigilante-svg': `/images/scenarios/${scenarioId}/eco/eco-vigilante.svg`,
        'eco-predator': `/images/scenarios/${scenarioId}/eco/eco-predator.png`,
        'eco-predator-svg': `/images/scenarios/${scenarioId}/eco/eco-predator.svg`,
        'eco-devastator': `/images/scenarios/${scenarioId}/eco/eco-devastator.png`,
        'eco-devastator-svg': `/images/scenarios/${scenarioId}/eco/eco-devastator.svg`,
        
        // UI Elements
        'frame-border': '/images/ui/frame-border.png',
        'card-zoom-bg': '/images/ui/card-zoom-bg.svg',
        'card-back': `/images/scenarios/${scenarioId}/cards/card-back.png`,
        'missing-card': `/images/scenarios/${scenarioId}/cards/missing-card.svg`,
        'missing-event': `/images/scenarios/${scenarioId}/events/missing-event.svg`,
        
        // Card Actions
        'action-play': '/images/ui/card-actions/play.png',
        'action-sacrifice': '/images/ui/card-actions/sacrifice.png',
        'action-research': '/images/ui/card-actions/research.png',
        'action-discard': '/images/ui/card-actions/discard.png',
        'action-cancel': '/images/ui/card-actions/cancel.png',
        
        // Effects
        'effect-glow': '/images/effects/glow-effect.svg',
        'effect-projectile': '/images/effects/projectile.svg',
        'effect-particles': '/images/effects/particles.svg',
      }
    };

    try {
      // Add bundle to PIXI.Assets
      PIXI.Assets.addBundle(assetBundle.name, assetBundle.assets);
      
      // Load the bundle
      console.log(`🎨 Loading PIXI asset bundle: ${assetBundle.name}`);
      const loadedAssets = await PIXI.Assets.loadBundle(assetBundle.name);
      
      // Cache loaded textures
      Object.entries(loadedAssets).forEach(([key, texture]) => {
        if (texture instanceof PIXI.Texture) {
          const assetPath = assetBundle.assets[key as keyof typeof assetBundle.assets];
          this.loadedTextures[assetPath] = texture;
        }
      });
      
      console.log(`✅ Successfully preloaded PIXI assets for scenario: ${scenarioId}`);
      console.log(`📊 Loaded ${Object.keys(loadedAssets).length} textures`);
      
      // PIXI assets loaded successfully
      
    } catch (error) {
      console.warn(`⚠️ Some PIXI assets failed to preload for scenario: ${scenarioId}`, error);
      // Fallback to individual loading
      this.preloadIndividualAssets(scenarioId);
    }

    // Optionally preload common cards
    await this.preloadCommonCards();
  }
  
  // Fallback method for individual asset loading
  private async preloadIndividualAssets(scenarioId: string): Promise<void> {
    const criticalPaths = [
      `/images/scenarios/${scenarioId}/backgrounds/main-bg.png`,
      `/images/scenarios/${scenarioId}/characters/player-portrait.png`,
      `/images/scenarios/${scenarioId}/eco/eco-vigilante.png`,
      `/images/scenarios/${scenarioId}/cards/card-back.png`,
      '/images/ui/frame-border.png'
    ];

    const loadPromises = criticalPaths.map(path => 
      this.loadPixiTexture(path).catch(error => {
        console.warn(`Failed to load individual asset: ${path}`, error);
        return null;
      })
    );

    await Promise.all(loadPromises);
  }

  // Preload the most commonly seen cards using PIXI
  private async preloadCommonCards(): Promise<void> {
    const commonCards = [
      '2-espadas', '3-espadas', '4-espadas', // Common attack cards
      '2-corazones', '3-corazones', // Common heal cards
      '2-treboles', '3-treboles', // Common utility cards
      '2-diamantes', '3-diamantes' // Common resource cards
    ];

    const preloadPromises = commonCards.map(async (cardId) => {
      const cardPath = `/images/scenarios/${this.currentScenario}/cards/${cardId}.png`;
      const fallbackPath = `/images/scenarios/${this.currentScenario}/cards/missing-card.svg`;
      
      return this.loadPixiTexture(cardPath, fallbackPath).catch(error => {
        console.warn(`Failed to preload card: ${cardId}`, error);
        return null;
      });
    });
    
    try {
      const results = await Promise.all(preloadPromises);
      const successCount = results.filter(r => r !== null).length;
      console.log(`✅ Common cards preloaded: ${successCount}/${commonCards.length}`);
    } catch (error) {
      console.warn('⚠️ Some common cards failed to preload:', error);
    }
  }

  // Get cached image if available
  getCachedImage(path: string): HTMLImageElement | null {
    return this.loadedImages[path] || null;
  }
  
  // Get image asset path (used by NarrativeModal)
  getImageAsset(path: string): string | null {
    // Check if we have the image cached
    if (this.loadedImages[path]) {
      return path;
    }
    
    // Return the path as-is (the component will handle loading)
    return path;
  }
  
  // Get cached PIXI texture if available
  getCachedTexture(path: string): PIXI.Texture | null {
    return this.loadedTextures[path] || null;
  }
  
  // Get texture with fallback support
  async getTexture(path: string, fallbackPath?: string): Promise<PIXI.Texture> {
    // Try to get from cache first
    const cached = this.getCachedTexture(path);
    if (cached) {
      return cached;
    }
    
    // Try to load with PIXI.Assets
    const loaded = await this.loadPixiTexture(path, fallbackPath);
    if (loaded) {
      return loaded;
    }
    
    // Generate emergency fallback using PIXI.Graphics
    console.warn(`🆘 AssetManager: Generating emergency PIXI texture for: ${path}`);
    return this.generateEmergencyPixiTexture(path);
  }
  
  // Generate emergency PIXI texture
  private generateEmergencyPixiTexture(path: string): PIXI.Texture {
    // Determine size and type based on path
    let width = 100, height = 100, color = 0x333333;
    let placeholderText = 'MISSING';
    
    if (path.includes('card')) {
      width = 70; height = 98; color = 0x1a472a; placeholderText = 'CARD';
    } else if (path.includes('event')) {
      width = 280; height = 392; color = 0x0f172a; placeholderText = 'EVENT';
    } else if (path.includes('portrait') || path.includes('eco')) {
      width = 180; height = 350; color = 0x4a5568; placeholderText = 'PORTRAIT';
    } else if (path.includes('background')) {
      width = 1280; height = 800; color = 0x1e293b; placeholderText = 'BACKGROUND';
    }
    
    // Create texture from canvas (working approach)
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');
    
    // Fill background
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, width, height);
    
    // Add border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.min(width, height) / 8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(placeholderText, width / 2, height / 2);
    
    // Convert canvas to PIXI texture (this works!)
    return PIXI.Texture.from(canvas);
  }

  // Clear cache for a scenario (useful when switching scenarios)
  clearScenarioCache(scenarioId?: string): void {
    if (scenarioId) {
      const scenarioPrefix = `/images/scenarios/${scenarioId}/`;
      Object.keys(this.loadedImages).forEach(path => {
        if (path.startsWith(scenarioPrefix)) {
          delete this.loadedImages[path];
        }
      });
      console.log(`🗑️ Cleared cache for scenario: ${scenarioId}`);
    } else {
      this.loadedImages = {};
      this.failedImages.clear();
      console.log('🗑️ Cleared entire asset cache');
    }
  }

  // Get loading statistics
  getLoadingStats(): {
    totalLoaded: number;
    totalFailed: number;
    cacheSize: string;
    failedAssets: string[];
  } {
    const totalLoaded = Object.keys(this.loadedImages).length;
    const totalFailed = this.failedImages.size;
    const cacheSize = `${totalLoaded} images cached`;
    const failedAssets = Array.from(this.failedImages);

    return {
      totalLoaded,
      totalFailed,
      cacheSize,
      failedAssets
    };
  }

  // Create fallback assets (simple colored rectangles/circles as placeholders)
  createFallbackAsset(type: 'card' | 'event' | 'portrait' | 'background' | 'icon', 
                      width: number, height: number, color: string = '#333333'): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = width;
    canvas.height = height;
    
    // Fill with background color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add text label
    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.min(width, height) / 8}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let text = '';
    switch (type) {
      case 'card':
        text = 'CARD';
        break;
      case 'event':
        text = 'EVENT';
        break;
      case 'portrait':
        text = 'PLAYER';
        break;
      case 'background':
        text = 'BG';
        break;
      case 'icon':
        text = 'ICON';
        break;
    }
    
    ctx.fillText(text, width / 2, height / 2);
    
    // Add border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    
    return canvas.toDataURL();
  }

  // Emergency fallbacks for critical game assets
  generateEmergencyFallbacks(): void {
    console.log('🆘 Generating emergency fallback assets...');
    
    // Create emergency card back
    const cardBackUrl = this.createFallbackAsset('card', 70, 98, '#1a472a');
    const cardBackImg = new Image();
    cardBackImg.src = cardBackUrl;
    this.loadedImages['/images/scenarios/default/cards/card-back.png'] = cardBackImg;
    
    // Create emergency player portrait
    const portraitUrl = this.createFallbackAsset('portrait', 180, 350, '#4a5568');
    const portraitImg = new Image();
    portraitImg.src = portraitUrl;
    this.loadedImages['/images/scenarios/default/characters/player-portrait.png'] = portraitImg;
    
    // Create emergency eco image
    const ecoUrl = this.createFallbackAsset('portrait', 180, 350, '#742a2a');
    const ecoImg = new Image();
    ecoImg.src = ecoUrl;
    this.loadedImages['/images/scenarios/default/eco/eco-vigilante.png'] = ecoImg;
    
    console.log('✅ Emergency fallbacks generated');
  }
}

export const assetManager = new AssetManager();
