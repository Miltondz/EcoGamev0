// src/debug/audioTest.ts

import { audioManager } from '../engine/AudioManager';

/**
 * Script de prueba para verificar el sistema de audio
 * Ejecutar en la consola del navegador: testAudioSystem()
 */

export async function testAudioSystem() {
  console.log('🎵 Testing Audio System...');
  
  // Test 1: Verificar configuración inicial
  console.log('\n📊 Test 1: Initial Configuration');
  const config = audioManager.currentConfig;
  console.log('Master Volume:', config.masterVolume);
  console.log('Music Enabled:', config.musicEnabled);
  console.log('Effects Enabled:', config.effectsEnabled);
  console.log('Current Scenario:', config.currentScenario);
  
  // Test 2: Configurar escenario default
  console.log('\n🎭 Test 2: Setting Default Scenario');
  try {
    await audioManager.setScenario('default');
    console.log('✅ Default scenario set successfully');
  } catch (error) {
    console.error('❌ Failed to set default scenario:', error);
  }
  
  // Test 3: Probar efectos de sonido
  console.log('\n🔊 Test 3: Testing Sound Effects');
  const effects = ['menu-select', 'attack-hit', 'treasure', 'event-danger'];
  
  for (const effect of effects) {
    try {
      console.log(`Playing effect: ${effect}`);
      await audioManager.playEffect(effect as any, 0.7);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between effects
    } catch (error) {
      console.error(`❌ Failed to play effect ${effect}:`, error);
    }
  }
  
  // Test 4: Probar música de fondo
  console.log('\n🎵 Test 4: Testing Background Music');
  try {
    console.log('Playing ambient music...');
    await audioManager.playMusic('ambient', true);
    console.log('✅ Ambient music playing');
    
    // Wait 3 seconds then change to tension
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('Changing to tension music...');
    await audioManager.playMusic('tension', true);
    console.log('✅ Tension music playing');
    
  } catch (error) {
    console.error('❌ Failed to play background music:', error);
  }
  
  // Test 5: Configurar escenario submarine-lab
  console.log('\n🤖 Test 5: Testing Submarine Lab Scenario');
  try {
    await audioManager.setScenario('submarine-lab');
    console.log('✅ Submarine lab scenario set successfully');
    
    // Wait 2 seconds then play submarine ambient
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Playing submarine lab ambient music...');
    await audioManager.playMusic('ambient', true);
    console.log('✅ Submarine lab ambient music playing');
    
  } catch (error) {
    console.error('❌ Failed to test submarine lab scenario:', error);
  }
  
  // Test 6: Controles de volumen
  console.log('\n🎚️ Test 6: Volume Controls');
  console.log('Original master volume:', audioManager.currentConfig.masterVolume);
  
  audioManager.setMasterVolume(0.3);
  console.log('Set master volume to 30%');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  audioManager.setMasterVolume(0.7);
  console.log('Reset master volume to 70%');
  
  // Test 7: Toggle controls
  console.log('\n🔛 Test 7: Toggle Controls');
  console.log('Music enabled:', audioManager.currentConfig.musicEnabled);
  
  audioManager.toggleMusic();
  console.log('Music toggled to:', audioManager.currentConfig.musicEnabled);
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  audioManager.toggleMusic();
  console.log('Music toggled back to:', audioManager.currentConfig.musicEnabled);
  
  console.log('\n✅ Audio System Test Complete!');
  console.log('Check console logs above for any errors.');
  console.log('You should have heard various sound effects and music changes.');
  
  return {
    config: audioManager.currentConfig,
    isInitialized: audioManager.isInitialized,
    testPassed: true
  };
}

// Auto-ejecutar en desarrollo y hacer disponible globalmente
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).testAudioSystem = testAudioSystem;
  console.log('🎵 Audio test available: call testAudioSystem() in console');
}
