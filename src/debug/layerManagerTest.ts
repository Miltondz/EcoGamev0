// src/debug/layerManagerTest.ts

/**
 * Script de test para verificar LayerManager
 * Ejecutar en la consola del navegador para diagnóstico
 */

import { layerSystem, GameLayer } from '../engine/LayerManager';

export function testLayerManager() {
  console.log('🔧 Testing LayerManager functionality...');
  
  // Test 1: Verificar valores de z-index base
  console.log('\n📊 Test 1: Base Z-Index Values');
  const layers = [
    GameLayer.BACKGROUND,
    GameLayer.GAME_BOARD,
    GameLayer.CARDS_IDLE,
    GameLayer.UI_BUTTONS,
    GameLayer.CONTEXT_MENU,
    GameLayer.MODAL_BACKDROP
  ];
  
  layers.forEach(layer => {
    const zIndex = layerSystem.get(layer);
    const layerName = GameLayer[layer];
    console.log(`  ${layerName}: ${zIndex}`);
  });
  
  // Test 2: Verificar bring to front
  console.log('\n⬆️ Test 2: Bring to Front');
  const originalContextMenu = layerSystem.get(GameLayer.CONTEXT_MENU);
  const newContextMenu = layerSystem.bringToFront(GameLayer.CONTEXT_MENU);
  
  console.log(`  CONTEXT_MENU original: ${originalContextMenu}`);
  console.log(`  CONTEXT_MENU after bringToFront: ${newContextMenu}`);
  console.log(`  ✅ Increment working: ${newContextMenu > originalContextMenu}`);
  
  // Test 3: Verificar reset
  console.log('\n🔄 Test 3: Reset Layer');
  const resetValue = layerSystem.reset(GameLayer.CONTEXT_MENU);
  console.log(`  CONTEXT_MENU after reset: ${resetValue}`);
  console.log(`  ✅ Reset working: ${resetValue === GameLayer.CONTEXT_MENU}`);
  
  // Test 4: Verificar resolución de conflictos
  console.log('\n🚨 Test 4: Conflict Resolution');
  const beforeResolve = layerSystem.get(GameLayer.CONTEXT_MENU);
  layerSystem.resolve('context_menu');
  const afterResolve = layerSystem.get(GameLayer.CONTEXT_MENU);
  
  console.log(`  Before resolve: ${beforeResolve}`);
  console.log(`  After resolve: ${afterResolve}`);
  console.log(`  ✅ Conflict resolution working: ${afterResolve > beforeResolve}`);
  
  // Test 5: Debug info
  console.log('\n🐛 Test 5: Debug Information');
  const debugInfo = layerSystem.debug();
  console.table(debugInfo);
  
  console.log('\n✅ LayerManager tests completed!');
  
  return {
    baseValues: layers.map(layer => ({ 
      layer: GameLayer[layer], 
      zIndex: layerSystem.get(layer) 
    })),
    debugInfo
  };
}

// Auto-ejecutar en desarrollo
if (import.meta.env.DEV && typeof window !== 'undefined') {
  // Hacer disponible globalmente en consola
  (window as any).testLayerManager = testLayerManager;
  console.log('🔧 LayerManager test available: call testLayerManager() in console');
}
