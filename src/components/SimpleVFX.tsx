// src/components/SimpleVFX.tsx

import React, { useEffect, useRef, useState } from 'react';
import * as PIXI from 'pixi.js';
import { gameStateManager } from '../engine/GameStateManager';

export const SimpleVFX: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pixiApp, setPixiApp] = useState<PIXI.Application | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Create PIXI Application
      const app = new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0.1,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      containerRef.current.appendChild(app.view as HTMLCanvasElement);
      setPixiApp(app);

      // Test: Create a simple card placeholder
      const cardGraphics = new PIXI.Graphics();
      cardGraphics.beginFill(0x4a5568); // Gray background
      cardGraphics.lineStyle(2, 0xffffff); // White border
      cardGraphics.drawRoundedRect(0, 0, 100, 140, 8);
      cardGraphics.endFill();

      // Add text
      const cardText = new PIXI.Text('TEST\nCARD', {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff,
        align: 'center'
      });
      cardText.anchor.set(0.5);
      cardText.x = 50;
      cardText.y = 70;
      
      cardGraphics.addChild(cardText);
      cardGraphics.x = window.innerWidth / 2 - 50;
      cardGraphics.y = window.innerHeight - 200;
      
      app.stage.addChild(cardGraphics);

      console.log('SimpleVFX: PIXI Application created successfully');

    } catch (err) {
      console.error('SimpleVFX: Error creating PIXI Application:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }

    return () => {
      if (pixiApp) {
        pixiApp.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  // Update cards when hand changes
  useEffect(() => {
    if (!pixiApp || gameStateManager.hand.length === 0) return;

    // Clear existing cards
    pixiApp.stage.children.forEach(child => {
      if (child.name === 'card') {
        pixiApp.stage.removeChild(child);
      }
    });

    // Create simple card representations
    gameStateManager.hand.forEach((card, index) => {
      const cardGraphics = new PIXI.Graphics();
      cardGraphics.beginFill(0x2d3748);
      cardGraphics.lineStyle(2, 0x4299e1);
      cardGraphics.drawRoundedRect(0, 0, 80, 112, 6);
      cardGraphics.endFill();

      const cardText = new PIXI.Text(`${card.rank}\n${card.suit[0]}`, {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0xffffff,
        align: 'center'
      });
      cardText.anchor.set(0.5);
      cardText.x = 40;
      cardText.y = 56;
      
      cardGraphics.addChild(cardText);
      cardGraphics.x = window.innerWidth / 2 - 200 + index * 90;
      cardGraphics.y = window.innerHeight - 150;
      cardGraphics.name = 'card';
      
      pixiApp.stage.addChild(cardGraphics);
    });

  }, [pixiApp, gameStateManager.hand]);

  if (error) {
    return (
      <div className="fixed bottom-4 left-4 bg-red-600 text-white p-4 rounded border-2 border-red-400 z-50">
        <div>PIXI Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 pointer-events-none" />
      <div className="fixed bottom-4 right-4 bg-green-600 text-white p-2 rounded text-xs z-50">
        PIXI: {pixiApp ? 'OK' : 'Loading...'}
      </div>
    </>
  );
};
