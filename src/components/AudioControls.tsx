// src/components/AudioControls.tsx

import React, { useState, useEffect } from 'react';
import { audioManager } from '../engine/AudioManager';
import type { AudioConfig } from '../engine/AudioManager';
import { colors, createCompactStoneButtonStyle } from '../utils/styles';
import '../styles/volume-sliders.css';

export const AudioControls: React.FC = () => {
  const [config, setConfig] = useState<AudioConfig>(audioManager.currentConfig);

  useEffect(() => {
    const unsubscribe = audioManager.subscribe(() => {
      setConfig(audioManager.currentConfig);
    });

    return unsubscribe;
  }, []);

  const handleMasterVolumeChange = (value: number) => {
    console.log('🔊 Master volume changed to:', value);
    audioManager.setMasterVolume(value);
    // Play test effect
    audioManager.playEffect('menu-select', 0.5);
  };

  const handleMusicVolumeChange = (value: number) => {
    console.log('🎵 Music volume changed to:', value);
    audioManager.setMusicVolume(value);
  };

  const handleEffectsVolumeChange = (value: number) => {
    console.log('🔊 Effects volume changed to:', value);
    audioManager.setEffectsVolume(value);
    // Play test effect
    audioManager.playEffect('treasure', 0.8);
  };

  const handleToggleMusic = () => {
    audioManager.toggleMusic();
    if (!config.musicEnabled) {
      // Test music when enabling
      setTimeout(() => audioManager.playMusic('ambient'), 100);
    }
  };

  const handleToggleEffects = () => {
    audioManager.toggleEffects();
    if (!config.effectsEnabled) {
      // Test effect when enabling
      setTimeout(() => audioManager.playEffect('menu-select', 0.7), 100);
    }
  };

  const createVolumeSlider = (
    label: string,
    value: number,
    onChange: (value: number) => void
  ) => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '4px'
    }}>
      <span style={{ fontSize: '11px', minWidth: '50px' }}>{label}:</span>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
        flex: 1,
        marginLeft: '8px'
      }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="volume-slider"
        />
        <span style={{ 
          fontSize: '10px', 
          color: colors.muted,
          minWidth: '28px',
          textAlign: 'right'
        }}>
          {Math.round(value * 100)}%
        </span>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '8px',
      fontSize: '10px'
    }}>
      {/* Columna Izquierda - Volúmenes */}
      <div>
        <h4 style={{ 
          fontSize: '11px', 
          color: colors.gold, 
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          🔊 Volumen
        </h4>
        
        {createVolumeSlider('Master', config.masterVolume, handleMasterVolumeChange)}
        {createVolumeSlider('Música', config.musicVolume, handleMusicVolumeChange)}
        {createVolumeSlider('Efectos', config.effectsVolume, handleEffectsVolumeChange)}
      </div>
      
      {/* Columna Derecha - Controles */}
      <div>
        <h4 style={{ 
          fontSize: '11px', 
          color: colors.gold, 
          marginBottom: '4px',
          textAlign: 'center'
        }}>
          🎵 Audio
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '10px'
          }}>
            <span>Música:</span>
            <button 
              style={{ 
                ...createCompactStoneButtonStyle({ 
                  width: '45px', 
                  fontSize: '9px',
                  padding: '2px 6px',
                  backgroundColor: config.musicEnabled ? colors.gold : colors.stone.dark
                }) 
              }}
              onClick={handleToggleMusic}
            >
              {config.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '10px'
          }}>
            <span>Efectos:</span>
            <button 
              style={{ 
                ...createCompactStoneButtonStyle({ 
                  width: '45px', 
                  fontSize: '9px',
                  padding: '2px 6px',
                  backgroundColor: config.effectsEnabled ? colors.gold : colors.stone.dark
                }) 
              }}
              onClick={handleToggleEffects}
            >
              {config.effectsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          
          {/* Información del escenario actual */}
          <div style={{ 
            marginTop: '4px',
            padding: '3px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '3px',
            border: `1px solid ${colors.stone.border}`
          }}>
            <div style={{ 
              fontSize: '8px', 
              color: colors.muted,
              marginBottom: '1px'
            }}>
              Escenario:
            </div>
            <div style={{ 
              fontSize: '9px', 
              color: colors.text,
              fontWeight: 'bold'
            }}>
              {config.currentScenario === 'submarine-lab' 
                ? '🤖 Lab Submarino' 
                : '🌊 Caleta'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioControls;
