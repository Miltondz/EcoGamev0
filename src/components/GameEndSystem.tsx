/**
 * Sistema de Finalización de Partida
 * 
 * Maneja todos los aspectos del final de partida:
 * - Resultados detallados (victoria/derrota)
 * - Puntuaciones y estadísticas
 * - Transiciones entre capítulos
 * - Efectos visuales y narrativos
 * - Integración con ChapterManager
 */

import React, { useState, useEffect } from 'react';
import { gameStateManager } from '../engine/GameStateManager';
import { chapterManager } from '../engine/ChapterManager';
import { scoreSystem } from '../engine/ScoreSystem';
import { ecoStateSystem } from '../engine/EcoStateSystem';
import { heroStateSystem } from '../engine/HeroStateSystem';
import { colors, textStyles, panelStyles, createStoneButtonStyle, handleStoneButtonHover } from '../utils/styles';

interface GameEndSystemProps {
  isVisible: boolean;
  onReturnToMenu: () => void;
  onPlayAgain: () => void;
  onContinueToNext?: () => void;
  onTriggerEndNarrative?: () => void; // Nueva prop para disparar narrativa de final
}

interface GameResult {
  victory: boolean;
  finalScore: number;
  survivalTime: number;
  chapter: string;
  cause: 'eco_defeated' | 'player_died' | 'sanity_lost' | 'deck_empty';
  finalStats: {
    pv: number;
    sanity: number;
    ecoHp: number;
    turn: number;
  };
}

export const GameEndSystem: React.FC<GameEndSystemProps> = ({
  isVisible,
  onReturnToMenu,
  onPlayAgain,
  onContinueToNext,
  onTriggerEndNarrative
}) => {
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessingEnd, setIsProcessingEnd] = useState(false);
  const [narrativeShown, setNarrativeShown] = useState(false);

  useEffect(() => {
    if (isVisible && gameStateManager.isGameOver) {
      processGameEnd();
    }
  }, [isVisible, gameStateManager.isGameOver]);
  
  // Disparar narrativa de final cuando se procese la victoria
  useEffect(() => {
    if (gameResult && gameResult.victory && onTriggerEndNarrative && !narrativeShown) {
      console.log('🎬 GameEndSystem: Disparando narrativa de final de capítulo');
      setNarrativeShown(true);
      // Pequeño delay para que se renderice el modal primero
      setTimeout(() => {
        onTriggerEndNarrative();
      }, 800);
    } else if (!isVisible) {
      // Resetear cuando se oculte
      setNarrativeShown(false);
    }
  }, [gameResult, onTriggerEndNarrative, narrativeShown, isVisible]);

  const processGameEnd = async () => {
    if (isProcessingEnd) return;
    
    setIsProcessingEnd(true);
    console.log('🏁 GameEndSystem: Processing game end...');

    try {
      // Determinar causa del final
      const cause = determineCauseOfEnd();
      
      // Calcular resultado final
      const finalScore = scoreSystem.getTotalScore();
      
      // Crear resultado
      const result: GameResult = {
        victory: gameStateManager.victory === true,
        finalScore,
        survivalTime: gameStateManager.turn,
        chapter: chapterManager.currentChapterConfig?.name || 'Unknown',
        cause,
        finalStats: {
          pv: gameStateManager.pv,
          sanity: gameStateManager.sanity,
          ecoHp: gameStateManager.ecoHp,
          turn: gameStateManager.turn
        }
      };

      // Procesar resultado en ChapterManager si es victoria
      if (result.victory) {
        chapterManager.completeChapter(
          true, // victory
          finalScore, // finalScore
          {
            pv: gameStateManager.pv,
            sanity: gameStateManager.sanity,
            turn: gameStateManager.turn,
            nodes: [] // TODO: get actual nodes state if available
          }
        );
      }

      setGameResult(result);
      console.log('🏁 GameEndSystem: Game result processed:', result);
      
    } catch (error) {
      console.error('🚨 GameEndSystem: Error processing game end:', error);
    } finally {
      setIsProcessingEnd(false);
    }
  };

  const determineCauseOfEnd = (): GameResult['cause'] => {
    if (gameStateManager.ecoHp <= 0) return 'eco_defeated';
    if (gameStateManager.pv <= 0) return 'player_died';
    if (gameStateManager.sanity <= 0) return 'sanity_lost';
    return 'deck_empty';
  };

  const getCauseDescription = (cause: GameResult['cause']): string => {
    switch (cause) {
      case 'eco_defeated': return 'Has derrotado al ECO y salvado la estación';
      case 'player_died': return 'Tus heridas fueron demasiado graves';
      case 'sanity_lost': return 'La locura se apoderó de tu mente';
      case 'deck_empty': return 'Te quedaste sin recursos';
      default: return 'Final inesperado';
    }
  };

  const getCauseIcon = (cause: GameResult['cause']): string => {
    switch (cause) {
      case 'eco_defeated': return '🏆';
      case 'player_died': return '💔';
      case 'sanity_lost': return '🌀';
      case 'deck_empty': return '📦';
      default: return '❓';
    }
  };

  const getScoreRank = (score: number): { rank: string; color: string; description: string } => {
    if (score >= 1000) return { rank: 'LEGENDARIO', color: '#f59e0b', description: 'Actuación excepcional' };
    if (score >= 750) return { rank: 'HEROICO', color: '#10b981', description: 'Excelente desempeño' };
    if (score >= 500) return { rank: 'VETERANO', color: '#3b82f6', description: 'Buen trabajo' };
    if (score >= 250) return { rank: 'COMPETENTE', color: '#8b5cf6', description: 'Rendimiento aceptable' };
    return { rank: 'NOVATO', color: '#6b7280', description: 'Hay margen de mejora' };
  };

  if (!isVisible || !gameResult) {
    return null;
  }

  const scoreRank = getScoreRank(gameResult.finalScore);
  const hasNextChapter = chapterManager.hasNextChapter();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{
        ...panelStyles.primary,
        padding: '40px',
        minWidth: '600px',
        maxWidth: '800px',
        background: gameResult.victory 
          ? 'rgba(5, 46, 22, 0.95)' // Verde oscuro para victoria
          : 'rgba(69, 10, 10, 0.95)', // Rojo oscuro para derrota
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: `2px solid ${gameResult.victory ? '#22c55e' : '#ef4444'}`,
        boxShadow: '0 25px 50px rgba(0,0,0,0.9), inset 0 1px 2px rgba(255,255,255,0.1)',
        textAlign: 'center',
        position: 'relative',
        animation: 'modalSlideIn 0.6s ease-out'
      }}>
        {/* Glassmorphism overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          pointerEvents: 'none'
        }} />

        {/* Título principal */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {getCauseIcon(gameResult.cause)}
          </div>
          <h1 style={{
            ...textStyles.bookTitle,
            fontSize: '48px',
            color: gameResult.victory ? '#86efac' : '#fca5a5',
            marginBottom: '12px',
            textShadow: '0 4px 12px rgba(0,0,0,0.8)'
          }}>
            {gameResult.victory ? '¡VICTORIA!' : 'DERROTA'}
          </h1>
          <p style={{
            ...textStyles.body,
            fontSize: '18px',
            color: gameResult.victory ? '#bbf7d0' : '#fecaca',
            marginBottom: '8px'
          }}>
            {getCauseDescription(gameResult.cause)}
          </p>
          <p style={{
            ...textStyles.bodySmall,
            color: colors.muted,
            fontSize: '14px'
          }}>
            Capítulo: {gameResult.chapter}
          </p>
        </div>

        {/* Estadísticas principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'rgba(51, 65, 85, 0.6)',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${colors.stone.border}`
          }}>
            <div style={{ ...textStyles.label, color: colors.gold, fontSize: '12px' }}>PUNTUACIÓN</div>
            <div style={{ ...textStyles.sectionTitle, fontSize: '24px', color: scoreRank.color }}>
              {gameResult.finalScore}
            </div>
            <div style={{ ...textStyles.bodySmall, fontSize: '10px', color: colors.muted }}>
              {scoreRank.rank}
            </div>
          </div>

          <div style={{
            background: 'rgba(51, 65, 85, 0.6)',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${colors.stone.border}`
          }}>
            <div style={{ ...textStyles.label, color: colors.gold, fontSize: '12px' }}>SUPERVIVENCIA</div>
            <div style={{ ...textStyles.sectionTitle, fontSize: '24px' }}>
              {gameResult.survivalTime}
            </div>
            <div style={{ ...textStyles.bodySmall, fontSize: '10px', color: colors.muted }}>
              turnos
            </div>
          </div>

          <div style={{
            background: 'rgba(51, 65, 85, 0.6)',
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${colors.stone.border}`
          }}>
            <div style={{ ...textStyles.label, color: colors.gold, fontSize: '12px' }}>ESTADO FINAL</div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-around',
              fontSize: '14px',
              marginTop: '4px'
            }}>
              <span>PV: {gameResult.finalStats.pv}</span>
              <span>COR: {gameResult.finalStats.sanity}</span>
            </div>
            <div style={{ ...textStyles.bodySmall, fontSize: '10px', color: colors.muted, marginTop: '4px' }}>
              ECO HP: {gameResult.finalStats.ecoHp}
            </div>
          </div>
        </div>

        {/* Botón para mostrar detalles */}
        <div style={{ marginBottom: '24px' }}>
          <button
            style={{
              ...createStoneButtonStyle(),
              width: '200px',
              fontSize: '14px',
              padding: '8px 16px'
            }}
            onMouseEnter={(e) => handleStoneButtonHover(e, true)}
            onMouseLeave={(e) => handleStoneButtonHover(e, false)}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Ocultar Detalles' : 'Ver Detalles'}
          </button>
        </div>

        {/* Detalles expandibles */}
        {showDetails && (
          <div style={{
            background: 'rgba(30, 41, 59, 0.8)',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ ...textStyles.subsectionTitle, marginBottom: '12px' }}>Resumen Detallado</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ ...textStyles.bodySmall, marginBottom: '8px' }}>
                  <strong>Estado del ECO:</strong> {ecoStateSystem.getCurrentState()}
                </div>
                <div style={{ ...textStyles.bodySmall, marginBottom: '8px' }}>
                  <strong>Estado del Héroe:</strong> {heroStateSystem.getCurrentState()}
                </div>
                <div style={{ ...textStyles.bodySmall }}>
                  <strong>Rango de Puntuación:</strong> {scoreRank.description}
                </div>
              </div>
              <div>
                <div style={{ ...textStyles.bodySmall, marginBottom: '8px' }}>
                  <strong>HP ECO Final:</strong> {gameResult.finalStats.ecoHp}
                </div>
                <div style={{ ...textStyles.bodySmall, marginBottom: '8px' }}>
                  <strong>Turnos Jugados:</strong> {gameResult.finalStats.turn}
                </div>
                <div style={{ ...textStyles.bodySmall }}>
                  <strong>Capítulo:</strong> {gameResult.chapter}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Continuar al siguiente capítulo (solo si es victoria y hay siguiente) */}
          {gameResult.victory && hasNextChapter && onContinueToNext && (
            <button
              style={{
                ...createStoneButtonStyle(),
                width: '200px',
                fontSize: '16px',
                color: '#22c55e',
                borderColor: 'rgba(34, 197, 94, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.color = '#16a34a';
                e.currentTarget.style.borderColor = 'rgba(22, 163, 74, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.color = '#22c55e';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
              }}
              onClick={onContinueToNext}
            >
              Siguiente Capítulo
            </button>
          )}

          {/* Jugar de nuevo */}
          <button
            style={{
              ...createStoneButtonStyle(),
              width: '150px',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => handleStoneButtonHover(e, true)}
            onMouseLeave={(e) => handleStoneButtonHover(e, false)}
            onClick={onPlayAgain}
          >
            Jugar de Nuevo
          </button>

          {/* Volver al menú */}
          <button
            style={{
              ...createStoneButtonStyle(),
              width: '150px',
              fontSize: '16px',
              color: '#94a3b8'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.color = '#94a3b8';
            }}
            onClick={onReturnToMenu}
          >
            Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
};
