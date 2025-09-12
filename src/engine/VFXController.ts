// src/engine/VFXController.ts

/**
 * Sistema de control global para VFX
 * 
 * Permite que otros componentes controlen aspectos específicos del VFX
 * como limpiar el zoom de cartas desde el menú contextual
 * 
 * Características:
 * - Interfaz singleton para control centralizado
 * - Logging completo para debug
 * - Callbacks registrables para diferentes acciones VFX
 * - Sistema de cleanup coordinado entre componentes
 */

type VFXCleanupFunction = () => void;

/**
 * Controlador global para operaciones VFX
 */
class VFXController {
  private zoomCleanupCallback: VFXCleanupFunction | null = null;

  /**
   * Logger especializado para el controlador VFX
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `[${timestamp}] 🎮 VFXController`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix}: ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`${prefix}: ⚠️ ${message}`, data || '');
        break;
      case 'error':
        console.error(`${prefix}: ❌ ${message}`, data || '');
        break;
    }
  }

  /**
   * Registra la función de limpieza de zoom desde VFX
   */
  registerZoomCleanup(cleanupFn: VFXCleanupFunction) {
    this.zoomCleanupCallback = cleanupFn;
    this.log('info', 'Zoom cleanup callback registered');
  }

  /**
   * Desregistra la función de limpieza
   */
  unregisterZoomCleanup() {
    this.zoomCleanupCallback = null;
    this.log('info', 'Zoom cleanup callback unregistered');
  }

  /**
   * Limpia todos los zooms activos
   * Llamado desde componentes externos como Hand cuando se toma una acción
   */
  cleanupActiveZooms() {
    this.log('info', 'Cleanup requested for active zooms');
    
    if (this.zoomCleanupCallback) {
      this.log('info', 'Executing registered zoom cleanup callback');
      this.zoomCleanupCallback();
    } else {
      this.log('warn', 'No zoom cleanup callback registered - cleanup skipped');
    }
  }

  /**
   * Verifica si hay zooms activos que requieren limpieza
   */
  hasActiveZooms(): boolean {
    // Esta implementación básica asume que si hay callback registrado,
    // potencialmente hay zooms activos
    return this.zoomCleanupCallback !== null;
  }

  /**
   * Limpia todos los estados y callbacks
   */
  reset() {
    this.log('info', 'Resetting VFX controller state');
    this.zoomCleanupCallback = null;
  }
}

// Instancia singleton
export const vfxController = new VFXController();
