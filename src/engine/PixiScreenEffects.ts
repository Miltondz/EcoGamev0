// src/engine/PixiScreenEffects.ts

import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export type ScreenEffectType = 
  | 'none' 
  | 'lightning' 
  | 'fire' 
  | 'glitch' 
  | 'shake' 
  | 'static' 
  | 'fog' 
  | 'sparks' 
  | 'darkness' 
  | 'glow' 
  | 'corruption' 
  | 'energy';

export interface ScreenEffect {
  type: ScreenEffectType;
  intensity: 'low' | 'medium' | 'high';
  duration: number;
}

export class PixiScreenEffects {
  private app: PIXI.Application | null = null;
  private effectsContainer: PIXI.Container;
  private activeEffects: Map<string, PIXI.Container> = new Map();

  constructor() {
    this.effectsContainer = new PIXI.Container();
    this.effectsContainer.name = 'screen-effects';
    this.effectsContainer.zIndex = 1000; // Muy alto para estar encima de todo
  }

  initialize(app: PIXI.Application) {
    this.app = app;
    
    // Agregar el contenedor de efectos como la capa superior
    app.stage.addChild(this.effectsContainer);
    app.stage.sortableChildren = true;
    
    console.log('🎆 PixiScreenEffects: Sistema inicializado');
  }

  async playEffect(effect: ScreenEffect): Promise<void> {
    if (!this.app) {
      console.warn('⚠️ PixiScreenEffects: App no inicializada');
      return;
    }

    console.log(`🎆 PixiScreenEffects: Ejecutando efecto ${effect.type} (${effect.intensity})`);

    // Limpiar efectos anteriores del mismo tipo
    this.clearEffect(effect.type);

    // Crear el efecto según el tipo
    switch (effect.type) {
      case 'lightning':
        await this.createLightningEffect(effect.intensity, effect.duration);
        break;
      case 'shake':
        await this.createShakeEffect(effect.intensity, effect.duration);
        break;
      case 'glitch':
        await this.createGlitchEffect(effect.intensity, effect.duration);
        break;
      case 'static':
        await this.createStaticEffect(effect.intensity, effect.duration);
        break;
      case 'sparks':
        await this.createSparksEffect(effect.intensity, effect.duration);
        break;
      case 'darkness':
        await this.createDarknessEffect(effect.intensity, effect.duration);
        break;
      case 'glow':
        await this.createGlowEffect(effect.intensity, effect.duration);
        break;
      case 'corruption':
        await this.createCorruptionEffect(effect.intensity, effect.duration);
        break;
      case 'energy':
        await this.createEnergyEffect(effect.intensity, effect.duration);
        break;
      case 'fog':
        await this.createFogEffect(effect.intensity, effect.duration);
        break;
      case 'fire':
        await this.createFireEffect(effect.intensity, effect.duration);
        break;
      case 'none':
      default:
        break;
    }
  }

  private async createLightningEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'lightning-effect';
    
    // Crear flash de lightning
    const lightning = new PIXI.Graphics()
      .rect(0, 0, this.app!.screen.width, this.app!.screen.height)
      .fill(0xffffff);
    
    lightning.alpha = 0;
    container.addChild(lightning);
    this.effectsContainer.addChild(container);
    this.activeEffects.set('lightning', container);

    // Animación de lightning intermitente
    const maxAlpha = intensity === 'high' ? 0.9 : intensity === 'medium' ? 0.6 : 0.4;
    const flashCount = intensity === 'high' ? 8 : intensity === 'medium' ? 5 : 3;
    
    for (let i = 0; i < flashCount; i++) {
      gsap.to(lightning, {
        alpha: maxAlpha,
        duration: 0.05,
        yoyo: true,
        repeat: 1,
        delay: i * 0.3
      });
    }

    // Limpiar después del duration
    setTimeout(() => {
      this.clearEffect('lightning');
    }, duration);
  }

  private async createShakeEffect(intensity: string, duration: number): Promise<void> {
    if (!this.app) return;

    const power = intensity === 'high' ? 15 : intensity === 'medium' ? 8 : 4;
    const originalX = this.app.stage.x;
    const originalY = this.app.stage.y;

    // Crear timeline de shake
    const timeline = gsap.timeline({ repeat: -1 });
    timeline.to(this.app.stage, {
      x: originalX + power,
      y: originalY + power * 0.5,
      duration: 0.02
    })
    .to(this.app.stage, {
      x: originalX - power,
      y: originalY - power * 0.5,
      duration: 0.02
    })
    .to(this.app.stage, {
      x: originalX + power * 0.5,
      y: originalY - power,
      duration: 0.02
    })
    .to(this.app.stage, {
      x: originalX,
      y: originalY,
      duration: 0.02
    });

    // Detener shake después del duration
    setTimeout(() => {
      timeline.kill();
      gsap.set(this.app!.stage, { x: originalX, y: originalY });
    }, duration);
  }

  private async createGlitchEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'glitch-effect';
    
    // Crear múltiples capas de glitch con diferentes colores
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    const glitchLayers: PIXI.Graphics[] = [];
    
    colors.forEach((color) => {
      const glitchRect = new PIXI.Graphics()
        .rect(0, 0, this.app!.screen.width, this.app!.screen.height)
        .fill(color);
      
      glitchRect.alpha = 0;
      glitchRect.blendMode = 'multiply';
      container.addChild(glitchRect);
      glitchLayers.push(glitchRect);
    });

    this.effectsContainer.addChild(container);
    this.activeEffects.set('glitch', container);

    // Animación de glitch
    const maxAlpha = intensity === 'high' ? 0.5 : intensity === 'medium' ? 0.3 : 0.2;
    const glitchInterval = setInterval(() => {
      glitchLayers.forEach((layer) => {
        if (Math.random() < 0.3) {
          layer.alpha = maxAlpha * Math.random();
          layer.x = (Math.random() - 0.5) * 10;
          layer.y = (Math.random() - 0.5) * 5;
          
          setTimeout(() => {
            layer.alpha = 0;
            layer.x = 0;
            layer.y = 0;
          }, 50);
        }
      });
    }, 100);

    // Limpiar después del duration
    setTimeout(() => {
      clearInterval(glitchInterval);
      this.clearEffect('glitch');
    }, duration);
  }

  private async createStaticEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'static-effect';

    // Crear textura de ruido usando Graphics
    const noiseTexture = this.createNoiseTexture(128, 128);
    const staticSprite = new PIXI.TilingSprite(noiseTexture, this.app!.screen.width, this.app!.screen.height);
    
    const maxAlpha = intensity === 'high' ? 0.7 : intensity === 'medium' ? 0.4 : 0.2;
    staticSprite.alpha = maxAlpha;
    staticSprite.blendMode = 'overlay';
    
    container.addChild(staticSprite);
    this.effectsContainer.addChild(container);
    this.activeEffects.set('static', container);

    // Animar el static
    gsap.to(staticSprite, {
      rotation: Math.PI * 2,
      duration: duration / 1000,
      ease: 'none'
    });

    // Animar tiling offset para movimiento de static
    const animateStatic = () => {
      staticSprite.tilePosition.x += Math.random() * 4 - 2;
      staticSprite.tilePosition.y += Math.random() * 4 - 2;
    };
    
    const staticInterval = setInterval(animateStatic, 50);

    // Limpiar después del duration
    setTimeout(() => {
      clearInterval(staticInterval);
      this.clearEffect('static');
    }, duration);
  }

  private async createSparksEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'sparks-effect';
    
    const sparkCount = intensity === 'high' ? 100 : intensity === 'medium' ? 60 : 30;
    const sparks: PIXI.Graphics[] = [];

    // Crear chispas individuales
    for (let i = 0; i < sparkCount; i++) {
      const spark = new PIXI.Graphics()
        .circle(0, 0, Math.random() * 3 + 1)
        .fill(0xffeb3b);
      
      spark.x = Math.random() * this.app!.screen.width;
      spark.y = Math.random() * this.app!.screen.height;
      spark.alpha = 0;
      
      container.addChild(spark);
      sparks.push(spark);

      // Animar cada chispa individualmente
      gsap.to(spark, {
        alpha: 1,
        duration: 0.1,
        delay: Math.random() * 0.5,
        yoyo: true,
        repeat: 1
      });

      gsap.to(spark, {
        x: spark.x + (Math.random() - 0.5) * 100,
        y: spark.y + Math.random() * 50,
        duration: 0.8,
        delay: Math.random() * 0.2,
        ease: 'power2.out'
      });
    }

    this.effectsContainer.addChild(container);
    this.activeEffects.set('sparks', container);

    // Limpiar después del duration
    setTimeout(() => {
      this.clearEffect('sparks');
    }, duration);
  }

  private async createDarknessEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'darkness-effect';
    
    const darkness = new PIXI.Graphics()
      .rect(0, 0, this.app!.screen.width, this.app!.screen.height)
      .fill(0x000000);
    
    const maxAlpha = intensity === 'high' ? 0.95 : intensity === 'medium' ? 0.8 : 0.6;
    darkness.alpha = 0;
    
    container.addChild(darkness);
    this.effectsContainer.addChild(container);
    this.activeEffects.set('darkness', container);

    // Animación fade in y fade out
    gsap.to(darkness, {
      alpha: maxAlpha,
      duration: 0.3
    });

    setTimeout(() => {
      gsap.to(darkness, {
        alpha: 0,
        duration: 1,
        onComplete: () => this.clearEffect('darkness')
      });
    }, duration - 1000);
  }

  private async createGlowEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'glow-effect';
    
    // Crear gradiente radial para glow
    const glow = new PIXI.Graphics();
    const radius = intensity === 'high' ? 800 : intensity === 'medium' ? 600 : 400;
    
    glow.circle(this.app!.screen.width / 2, this.app!.screen.height / 2, radius)
        .fill({
          color: 0xffffff,
          alpha: intensity === 'high' ? 0.3 : intensity === 'medium' ? 0.2 : 0.1
        });
    
    glow.alpha = 0;
    glow.blendMode = 'screen';
    
    container.addChild(glow);
    this.effectsContainer.addChild(container);
    this.activeEffects.set('glow', container);

    // Animación de glow pulsante
    const timeline = gsap.timeline({ repeat: -1 });
    timeline.to(glow, {
      alpha: 1,
      scale: 1.1,
      duration: 1,
      ease: 'sine.inOut'
    })
    .to(glow, {
      alpha: 0.5,
      scale: 0.9,
      duration: 1,
      ease: 'sine.inOut'
    });

    // Limpiar después del duration
    setTimeout(() => {
      timeline.kill();
      this.clearEffect('glow');
    }, duration);
  }

  private async createCorruptionEffect(_intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'corruption-effect';
    
    // Crear efecto de corrupción con múltiples capas
    const corruptionLayers: PIXI.Graphics[] = [];
    const colors = [0x4a0080, 0x800040, 0x000000];
    
    colors.forEach((color, _index) => {
      const layer = new PIXI.Graphics()
        .rect(0, 0, this.app!.screen.width, this.app!.screen.height)
        .fill(color);
      
      // const maxAlpha = (intensity === 'high' ? 0.4 : intensity === 'medium' ? 0.3 : 0.2) / (index + 1);
      layer.alpha = 0;
      layer.blendMode = 'multiply';
      
      container.addChild(layer);
      corruptionLayers.push(layer);
    });

    this.effectsContainer.addChild(container);
    this.activeEffects.set('corruption', container);

    // Animación de corrupción que se extiende
    corruptionLayers.forEach((layer, index) => {
      gsap.to(layer, {
        alpha: layer.alpha,
        duration: 0.8,
        delay: index * 0.2,
        ease: 'power2.inOut'
      });

      // Efecto de ondas de corrupción
      gsap.to(layer, {
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });

    // Limpiar después del duration
    setTimeout(() => {
      this.clearEffect('corruption');
    }, duration);
  }

  private async createEnergyEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'energy-effect';
    
    // Crear efecto de energía con líneas eléctricas
    const energyLines: PIXI.Graphics[] = [];
    const lineCount = intensity === 'high' ? 20 : intensity === 'medium' ? 12 : 8;
    
    for (let i = 0; i < lineCount; i++) {
      const line = new PIXI.Graphics();
      const startX = Math.random() * this.app!.screen.width;
      const startY = Math.random() * this.app!.screen.height;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY + (Math.random() - 0.5) * 200;
      
      line.moveTo(startX, startY)
          .lineTo(endX, endY)
          .stroke({ width: Math.random() * 3 + 1, color: 0x00ffff, alpha: 0.8 });
      
      line.alpha = 0;
      container.addChild(line);
      energyLines.push(line);
    }

    // Crear gradiente de energía de fondo
    const energyBg = new PIXI.Graphics()
      .rect(0, 0, this.app!.screen.width, this.app!.screen.height)
      .fill({
        color: 0x0080ff,
        alpha: intensity === 'high' ? 0.3 : intensity === 'medium' ? 0.2 : 0.1
      });
    
    energyBg.alpha = 0;
    energyBg.blendMode = 'screen';
    container.addChild(energyBg);

    this.effectsContainer.addChild(container);
    this.activeEffects.set('energy', container);

    // Animación de líneas de energía
    energyLines.forEach((line, index) => {
      gsap.to(line, {
        alpha: 1,
        duration: 0.1,
        delay: index * 0.05,
        yoyo: true,
        repeat: 3
      });
    });

    // Animación del fondo de energía
    gsap.to(energyBg, {
      alpha: 1,
      duration: 0.5,
      yoyo: true,
      repeat: 1
    });

    // Limpiar después del duration
    setTimeout(() => {
      this.clearEffect('energy');
    }, duration);
  }

  private async createFogEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'fog-effect';
    
    // Crear múltiples capas de niebla
    const fogLayers: PIXI.Graphics[] = [];
    const layerCount = 3;
    
    for (let i = 0; i < layerCount; i++) {
      const fog = new PIXI.Graphics();
      const radius = 300 + i * 100;
      
      fog.circle(this.app!.screen.width / 2, this.app!.screen.height / 2, radius)
          .fill({
            color: 0xffffff,
            alpha: (intensity === 'high' ? 0.4 : intensity === 'medium' ? 0.3 : 0.2) / (i + 1)
          });
      
      fog.x = Math.random() * 100 - 50;
      fog.y = Math.random() * 100 - 50;
      fog.alpha = 0;
      
      container.addChild(fog);
      fogLayers.push(fog);
    }

    this.effectsContainer.addChild(container);
    this.activeEffects.set('fog', container);

    // Animación de niebla flotante
    fogLayers.forEach((fog, index) => {
      gsap.to(fog, {
        alpha: 1,
        duration: 1,
        delay: index * 0.3
      });

      gsap.to(fog, {
        x: fog.x + (Math.random() - 0.5) * 200,
        y: fog.y + (Math.random() - 0.5) * 100,
        duration: duration / 1000,
        ease: 'sine.inOut'
      });
    });

    // Limpiar después del duration
    setTimeout(() => {
      this.clearEffect('fog');
    }, duration);
  }

  private async createFireEffect(intensity: string, duration: number): Promise<void> {
    const container = new PIXI.Container();
    container.name = 'fire-effect';
    
    // Crear efecto de fuego desde abajo
    const fireGradient = new PIXI.Graphics();
    const height = intensity === 'high' ? this.app!.screen.height * 0.8 : 
                  intensity === 'medium' ? this.app!.screen.height * 0.5 : 
                  this.app!.screen.height * 0.3;
    
    fireGradient.rect(0, this.app!.screen.height - height, this.app!.screen.width, height)
               .fill({
                 color: 0xff4400,
                 alpha: intensity === 'high' ? 0.7 : intensity === 'medium' ? 0.5 : 0.3
               });
    
    fireGradient.alpha = 0;
    fireGradient.blendMode = 'screen';
    container.addChild(fireGradient);

    // Crear partículas de fuego
    const fireParticles: PIXI.Graphics[] = [];
    const particleCount = intensity === 'high' ? 50 : intensity === 'medium' ? 30 : 15;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics()
        .circle(0, 0, Math.random() * 8 + 2)
        .fill(Math.random() > 0.5 ? 0xff6600 : 0xff4400);
      
      particle.x = Math.random() * this.app!.screen.width;
      particle.y = this.app!.screen.height;
      particle.alpha = 0;
      
      container.addChild(particle);
      fireParticles.push(particle);

      // Animar partícula hacia arriba
      gsap.to(particle, {
        alpha: 1,
        y: particle.y - Math.random() * 300 - 100,
        x: particle.x + (Math.random() - 0.5) * 100,
        duration: 2 + Math.random() * 2,
        ease: 'power2.out'
      });
    }

    this.effectsContainer.addChild(container);
    this.activeEffects.set('fire', container);

    // Animación del gradiente de fuego
    gsap.to(fireGradient, {
      alpha: 1,
      duration: 0.5,
      yoyo: true,
      repeat: 1
    });

    // Limpiar después del duration
    setTimeout(() => {
      this.clearEffect('fire');
    }, duration);
  }

  private createNoiseTexture(width: number, height: number): PIXI.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 255;
      data[i] = noise;     // Red
      data[i + 1] = noise; // Green
      data[i + 2] = noise; // Blue
      data[i + 3] = 255;   // Alpha
    }
    
    ctx.putImageData(imageData, 0, 0);
    return PIXI.Texture.from(canvas);
  }

  private clearEffect(type: ScreenEffectType) {
    const effectContainer = this.activeEffects.get(type);
    if (effectContainer) {
      this.effectsContainer.removeChild(effectContainer);
      effectContainer.destroy({ children: true });
      this.activeEffects.delete(type);
      console.log(`🧹 PixiScreenEffects: Efecto ${type} limpiado`);
    }
  }

  clearAllEffects() {
    for (const [, container] of this.activeEffects) {
      this.effectsContainer.removeChild(container);
      container.destroy({ children: true });
    }
    this.activeEffects.clear();
    console.log('🧹 PixiScreenEffects: Todos los efectos limpiados');
  }

  destroy() {
    this.clearAllEffects();
    if (this.app && this.app.stage.children.includes(this.effectsContainer)) {
      this.app.stage.removeChild(this.effectsContainer);
    }
    this.effectsContainer.destroy({ children: true });
    console.log('🎆 PixiScreenEffects: Sistema destruido');
  }
}

export const pixiScreenEffects = new PixiScreenEffects();
