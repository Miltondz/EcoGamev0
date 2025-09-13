// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { MainMenu } from './components/MainMenu';
import { GameLayout } from './components/GameLayout';
import { Hand } from './components/Hand';
import { turnManager } from './engine/TurnManager';
import { gameStateManager, GamePhase } from './engine/GameStateManager';
// nodeSystem import removed - not used in component
import type { Card as CardType } from './engine/types';
import { cardEffectEngine } from './engine/CardEffectEngine';
import { RepairButton, FocusButton, EndTurnButton, StyledButton } from './components/StyledButton';
import { FaWrench, FaEye, FaArrowRight, FaCrosshairs, FaSearch } from 'react-icons/fa';
import { PlayerPortrait, EcoPortrait } from './components/CharacterPortraits';
import { VFX } from './components/VFX';
import { GameLog } from './components/GameLog';
import EventVisualSystem from './components/EventVisualSystem';
import { GameEndSystem } from './components/GameEndSystem';
import { textStyles, colors, panelStyles } from './utils/styles';
import { GameModalProvider, useGameModalContext, setGlobalModalContext } from './context/GameModalContext';
import { chapterManager } from './engine/ChapterManager';
import { NarrativeModal } from './components/NarrativeModal';
import { chapterNarrativeSystem } from './engine/ChapterNarrativeSystem';
import type { NarrativeElement, ChapterNarrativeConfig } from './engine/ChapterNarrativeSystem';
import { GameLayer, useLayer } from './engine/LayerManager';
import { deckManager } from './engine/DeckManager';
import { assetManager } from './config/assets';
import { audioManager } from './engine/AudioManager';
import AudioControls from './components/AudioControls';
// import { CSSCards } from './components/CSSCards'; // Commented out - using only PixiJS VFX

// Import debug tools in development
if (import.meta.env.DEV) {
  import('./debug/audioTest');
}

const AppContent: React.FC = () => {
    const modalContext = useGameModalContext();
    
    // LayerManager hooks para diferentes elementos
    const exitButtonLayer = useLayer(GameLayer.UI_BUTTONS);
    const hudLayer = useLayer(GameLayer.UI_BACKGROUND); // Cambiar a capa más baja
    const ecoCardsLayer = useLayer(GameLayer.GAME_BACKGROUND); // Cartas ECO en el fondo (z=10), detrás de zona de juego (z=200)
    const leftPanelLayer = useLayer(GameLayer.UI_PANELS);
    const rightPanelLayer = useLayer(GameLayer.UI_PANELS);
    const boardLayer = useLayer(GameLayer.GAME_BOARD);
    const handLayer = useLayer(GameLayer.CARDS_IDLE);
    const controlButtonsLayer = useLayer(GameLayer.INTERACTIVE_UI, true); // Traer al frente automáticamente
    const gameLogLayer = useLayer(GameLayer.UI_BACKGROUND); // Capa baja para GameLog
    const eventModalLayer = useLayer(GameLayer.EVENT_MODAL);
    const turnOverlayLayer = useLayer(GameLayer.MODAL_BACKDROP);
    
    // Establecer contexto global para uso fuera de React
    useEffect(() => {
        setGlobalModalContext(modalContext);
    }, [modalContext]);
    
    const [inGame, setInGame] = useState<boolean>(false);
    const [eventMessage, setEventMessage] = useState<string | null>(null);
    const [isRepairMode, setRepairMode] = useState<boolean>(false);
    const [cardsForRepair, setCardsForRepair] = useState<CardType[]>([]);
    const [cardPlayMode, setCardPlayMode] = useState<'attack' | 'search'>('attack'); // Modo de juego de cartas
    const [turnOverlay, setTurnOverlay] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
    const [eventVisual, setEventVisual] = useState<{ visible: boolean; card: CardType | null; event: any | null }>({ visible: false, card: null, event: null });
    const [narrativeModal, setNarrativeModal] = useState<{ visible: boolean; element: NarrativeElement | null; config: ChapterNarrativeConfig | null }>({ visible: false, element: null, config: null });
    const [showConfigModal, setShowConfigModal] = useState(false);
    // audioConfig removed - not used in component
    const [, setTick] = useState(0); // Used to force re-renders

    useEffect(() => {
        const unsubscribe = gameStateManager.subscribe(() => {
            setTick(tick => tick + 1);
            if (gameStateManager.phase === GamePhase.EVENT && turnManager.currentEvent) {
                setEventMessage(turnManager.currentEvent.event);
                // Reproducir efecto de evento peligroso
                setTimeout(() => {
                    audioManager.playEffect('event-danger', 0.6);
                }, 200);
            }
            // Turn overlay when phase enters PLAYER_ACTION or ECO_ATTACK
            if (gameStateManager.phase === GamePhase.PLAYER_ACTION) {
                // Sonido suave para inicio de turno del jugador
                audioManager.playEffect('event-morning', 0.5);
                setTurnOverlay({ visible: true, text: `Turno ${gameStateManager.turn} - Tu turno` });
                setTimeout(() => setTurnOverlay({ visible: false, text: '' }), 800);
            } else if (gameStateManager.phase === GamePhase.ECO_ATTACK) {
                setTurnOverlay({ visible: true, text: `Turno ${gameStateManager.turn} - ECO` });
                setTimeout(() => setTurnOverlay({ visible: false, text: '' }), 800);
            }
            // Forzar re-render cuando cambien stats importantes
            console.log('🔄 App: GameState changed - PV:', gameStateManager.pv, 'EcoHP:', gameStateManager.ecoHp, 'AP:', gameStateManager.pa);
        });
        
        // Configurar listener para narrativa
        const unsubscribeNarrative = chapterNarrativeSystem.subscribe((element, config) => {
            console.log('📖 App: Mostrando elemento narrativo:', element.id);
            setNarrativeModal({ visible: true, element, config });
        });
        
        // Audio manager subscription removed - not using audioConfig state
        
        return () => {
            unsubscribe();
            unsubscribeNarrative();
        };
    }, []);
    
    // Manejar tecla espaciadora para fin de turno
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Solo procesar si es turno del jugador y la tecla es espaciadora
            if (event.code === 'Space' && gameStateManager.phase === GamePhase.PLAYER_ACTION && inGame) {
                event.preventDefault(); // Evitar scroll de página
                
                // Implementar confirmación si aún tiene AP
                if (gameStateManager.pa > 0) {
                    modalContext.showConfirm(
                        `Aún tienes ${gameStateManager.pa} AP disponibles. ¿Estás seguro de que quieres terminar tu turno? (Espaciadora)`,
                        () => {
                            audioManager.playEffect('menu-select', 0.8);
                            console.log('🎯 App: End Turn confirmed via SPACEBAR with remaining AP');
                            turnManager.endPlayerTurn();
                        },
                        {
                            title: 'Confirmar Fin de Turno',
                            type: 'warning',
                            confirmText: 'Sí, Terminar',
                            cancelText: 'Continuar'
                        }
                    );
                } else {
                    audioManager.playEffect('menu-select', 0.8);
                    console.log('🎯 App: End Turn via SPACEBAR');
                    turnManager.endPlayerTurn();
                }
            }
        };
        
        // Agregar listener solo cuando esté en juego
        if (inGame) {
            document.addEventListener('keydown', handleKeyDown);
            console.log('⌨️ App: Spacebar listener activated for end turn');
        }
        
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleStartGame = async () => {
        setInGame(true);
        setEventMessage(null);
        setRepairMode(false);
        setCardsForRepair([]);
        
        // Inicializar audio del escenario actual
        const currentScenario = chapterManager.currentScenarioConfig;
        if (currentScenario) {
            console.log('🎵 App: Configurando audio para escenario:', currentScenario.id);
            
            try {
                await audioManager.setScenario(currentScenario.id);
                console.log('✅ App: Escenario de audio configurado');
                
                // Intentar reproducir música ambiental con reintentos
                const tryPlayMusic = (attempt = 1) => {
                    console.log(`🎵 App: Intento ${attempt} de reproducir música ambient`);
                    
                    audioManager.playMusic('ambient', true).then(() => {
                        console.log('✅ App: Música ambient iniciada correctamente');
                    }).catch(error => {
                        console.error(`❌ App: Error en intento ${attempt}:`, error);
                        
                        if (attempt < 3) {
                            setTimeout(() => tryPlayMusic(attempt + 1), 1000);
                        } else {
                            console.warn('⚠️ App: No se pudo iniciar la música después de 3 intentos');
                        }
                    });
                };
                
                // Primer intento después de un breve delay
                setTimeout(() => tryPlayMusic(), 300);
                
            } catch (error) {
                console.error('❌ App: Error configurando escenario de audio:', error);
            }
        } else {
            console.warn('⚠️ App: No hay escenario configurado para audio');
        }
        
        // Configurar callback para eventos visuales
        turnManager.onEventShow = (eventCard, event) => {
            console.log('🎭 App: Mostrando evento visual', event.event);
            setEventVisual({ visible: true, card: eventCard, event });
        };
        
        // Show start overlay
        setTurnOverlay({ visible: true, text: 'Comienza la partida' });
        setTimeout(() => setTurnOverlay({ visible: false, text: '' }), 1200);
        
        // NUEVO FLUJO: Mostrar narrativa inicial ANTES de repartir cartas
        setTimeout(async () => {
            try {
                console.log('📚 App: Iniciando narrativa inicial del capítulo');
                await chapterManager.playChapterNarrative('beginning');
                console.log('✅ App: Narrativa inicial mostrada, el handler se encargará del resto');
            } catch (error) {
                console.warn('⚠️ App: No se pudo mostrar narrativa inicial, completando inicio sin ella:', error);
                // Si no hay narrativa, completar inicio directamente
                turnManager.completeGameStart();
            }
        }, 1500); // Esperar a que termine la animación inicial
    };

    const handleContinue = () => {
        audioManager.playEffect('menu-select', 0.7);
        setEventMessage(null);
        turnManager.advancePhase();
    };

    const handleNodeClick = (nodeId: string) => {
        audioManager.playEffect('menu-select', 0.6); // Sonido al hacer click en nodo
        
        if (isRepairMode && cardsForRepair.length > 0) {
            // Validate that all cards are Clubs before repairing
            const allClubs = cardsForRepair.every(card => card.suit === 'Clubs');
            if (allClubs) {
                // Secuencia de sonidos para reparación exitosa
                audioManager.playEffect('treasure-2', 0.8); // Sonido de reparación exitosa
                setTimeout(() => {
                    audioManager.playEffect('event-morning', 0.6); // Sonido de éxito/mejora
                }, 300);
                cardEffectEngine.repairNode(nodeId, cardsForRepair);
                setCardsForRepair([]);
                setRepairMode(false);
            } else {
                // Sonido de error si las cartas no son clubs
                audioManager.playEffect('menu-select', 0.4);
            }
        }
    };

    

    const toggleRepairMode = () => {
        audioManager.playEffect('menu-select', 0.7);
        setRepairMode(!isRepairMode);
        setCardsForRepair([]);
    };

    // getNodeDisplay function removed - not used in component

    // Handlers para el modal de narrativa
    const handleNarrativeComplete = () => {
        console.log('📚 App: Narrativa completada');
        setNarrativeModal({ visible: false, element: null, config: null });
        
        // Si es narrativa inicial (comienza con 'ch' y contiene 'begin'), completar el inicio del juego
        if (narrativeModal.element?.id && narrativeModal.element.id.includes('begin')) {
            console.log('🎴 App: Completando inicio del juego tras narrativa inicial');
            setTimeout(() => turnManager.completeGameStart(), 200);
        }
    };

    const handleNarrativeSkip = () => {
        console.log('⏩ App: Narrativa saltada');
        setNarrativeModal({ visible: false, element: null, config: null });
        
        // Si es narrativa inicial (comienza con 'ch' y contiene 'begin'), completar el inicio del juego
        if (narrativeModal.element?.id && narrativeModal.element.id.includes('begin')) {
            console.log('🎴 App: Completando inicio del juego tras saltar narrativa inicial');
            setTimeout(() => turnManager.completeGameStart(), 200);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000000', // Fondo negro sólido
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden' // Evitar scroll bars
        }}>
            { !inGame ? (
                <div style={{ 
                    width: '1280px', 
                    height: '720px',
                    position: 'relative',
                    boxShadow: '0 0 50px rgba(0,0,0,0.8)', // Sombra sutil alrededor del canvas
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <MainMenu onStartGame={handleStartGame} />
                </div>
            ) : (
                <div style={{ 
                    width: '1280px', 
                    height: '720px',
                    position: 'relative',
                    boxShadow: '0 0 50px rgba(0,0,0,0.8)', // Sombra sutil alrededor del canvas
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <GameLayout>
                    {/* Botones de control superior */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: exitButtonLayer.zIndex,
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center'
                    }}>
                        {/* Botón de Configuración */}
                        <button
                            style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: 'rgba(51, 65, 85, 0.8)',
                                border: `1px solid rgba(146, 64, 14, 0.5)`,
                                color: colors.gold,
                                fontSize: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease',
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(182, 149, 82, 0.2)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(51, 65, 85, 0.8)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            onClick={() => setShowConfigModal(true)}
                            title="Configuración de audio"
                        >
                            ⚙️
                        </button>
                        
                        {/* Botón de Salida */}
                        <StyledButton
                            onClick={() => {
                                modalContext.showConfirm(
                                    '¿Estás seguro de que quieres volver al menú principal? Se perderá el progreso no guardado.',
                                    () => setInGame(false),
                                    {
                                        title: 'Volver al Menú',
                                        type: 'warning',
                                        confirmText: 'Sí, Volver',
                                        cancelText: 'Continuar Jugando'
                                    }
                                );
                            }}
                            size="sm"
                            variant="danger"
                            style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                background: 'rgba(0, 0, 0, 0.7)',
                                border: '1px solid rgba(220, 38, 38, 0.5)'
                            }}
                        >
                            ← Menú
                        </StyledButton>
                    </div>
                    
                    {/* HUD Superior - Stats del jugador y Eco */}
                    <div style={{ 
                           position: 'absolute',
                           top: '10px', // Subido más arriba
                           left: '40px', 
                           width: '1200px', 
                           height: '50px',
                           zIndex: hudLayer.zIndex,
                           display: 'flex',
                           justifyContent: 'space-between',
                           alignItems: 'center'
                         }}>
                        {/* Stats Jugador - Izquierda */}
                        <div style={{
                          ...panelStyles.hud,
                          padding: '10px 18px',
                          border: '1px solid rgba(217, 119, 6, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ ...textStyles.label, color: colors.gold, fontSize: '12px' }}>SOBREVIVIENTE</span>
                                <span style={{ ...textStyles.bodySmall, color: colors.muted }}>HP: {gameStateManager.pv}/{gameStateManager.maxPV}</span>
                                <span style={{ ...textStyles.bodySmall, color: colors.muted }}>Cor: {gameStateManager.sanity}</span>
                                <span style={{ ...textStyles.bodySmall, color: colors.muted }}>AP: {gameStateManager.pa}/{gameStateManager.maxAP}</span>
                            </div>
                        </div>
                        
                        {/* Turno - Centro */}
                        <div style={{
                          ...panelStyles.hud,
                          padding: '10px 28px',
                          border: '1px solid rgba(71, 85, 105, 0.5)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ ...textStyles.smallTitle, fontSize: '16px', margin: 0 }}>TURNO {gameStateManager.turn}</div>
                                <div style={{ ...textStyles.label, fontSize: '10px', color: colors.mutedAlpha }}>FASE: {gameStateManager.phase === GamePhase.PLAYER_ACTION ? "JUGADOR" : "ECO"}</div>
                            </div>
                        </div>
                        
                        {/* Stats Eco - Derecha */}
                        <div style={{
                          ...panelStyles.hud,
                          padding: '10px 18px',
                          border: '1px solid rgba(220, 38, 38, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ ...textStyles.bodySmall, color: '#fecaca' }}>HP: {gameStateManager.ecoHp}/{gameStateManager.maxEcoHp}</span>
                                <span style={{ ...textStyles.bodySmall, color: '#fecaca' }}>Vigilante</span>
                                <span style={{ ...textStyles.label, color: '#fee2e2', fontSize: '12px' }}>ECO</span>
                            </div>
                        </div>
                        
                    </div>
                    
                    {/* Cartas del Eco - Zona debajo del HUD */}
                    <div style={{ 
                           position: 'absolute',
                           top: '110px', // Bajado 40px desde 70px
                           left: '0px',
                           width: '1280px', 
                           height: '120px',
                           zIndex: ecoCardsLayer.zIndex,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '12px'
                         }}>
                        {/* Mostrar máximo 5 cartas superpuestas para representar el mazo */}
                        {Array.from({ length: Math.min(5, Math.max(1, deckManager.getEcoDeckCount())) }, (_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '120px',
                                    height: '168px',
                                    borderRadius: '10px',
                                    border: '2px solid rgba(185, 28, 28, 0.8)',
                                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
                                    backgroundImage: `url("${assetManager.getCardBackPath()}")`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: '#1e293b',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    transform: `translateX(${i * -4}px) translateY(${i * -2}px)`,
                                    position: 'relative',
                                    zIndex: 10 - i
                                }}
                            >
                                {/* 
                                    Texto "ECO X cartas" removido para evitar superposición 
                                    con zona de juego y menús contextuales de cartas 
                                */}
                            </div>
                        ))}
                    </div>
                    
                    {/* Imagen del Jugador - Solo retrato sin panel */}
                    <div style={{ 
                           position: 'absolute',
                           left: '55px', // Movido 35px a la derecha desde 20px
                           top: '70px', // Alineado con las cartas del ECO
                           width: '120px',
                           height: '150px',
                           zIndex: leftPanelLayer.zIndex,
                           display: 'flex',
                           flexDirection: 'column',
                           alignItems: 'center',
                           gap: '8px'
                         }}>
                        <PlayerPortrait />
                        <div style={{ 
                            ...textStyles.label, 
                            color: colors.gold, 
                            fontSize: '11px',
                            textAlign: 'center',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>SOBREVIVIENTE</div>
                        
                        {/* Botón de Fin de Turno bajo el sobreviviente */}
                        {gameStateManager.phase === GamePhase.PLAYER_ACTION && (
                            <StyledButton 
                                onClick={() => {
                                    // Implementar confirmación si aún tiene AP
                                    if (gameStateManager.pa > 0) {
                                        modalContext.showConfirm(
                                            `Aún tienes ${gameStateManager.pa} AP disponibles. ¿Estás seguro de que quieres terminar tu turno?`,
                                            () => {
                                                audioManager.playEffect('menu-select', 0.8);
                                                console.log('🎯 App: End Turn confirmed with remaining AP');
                                                turnManager.endPlayerTurn();
                                            },
                                            {
                                                title: 'Confirmar Fin de Turno',
                                                type: 'warning',
                                                confirmText: 'Sí, Terminar',
                                                cancelText: 'Continuar'
                                            }
                                        );
                                    } else {
                                        audioManager.playEffect('menu-select', 0.8);
                                        console.log('🎯 App: End Turn button clicked');
                                        turnManager.endPlayerTurn();
                                    }
                                }}
                                size="sm"
                                variant={gameStateManager.pa === 0 ? 'urgent' : 'danger'}
                                style={{
                                    marginTop: '8px',
                                    fontSize: '10px',
                                    padding: '6px 12px',
                                    width: '110px'
                                }}
                            >
                                {gameStateManager.pa === 0 ? 'FIN TURNO' : `FIN (${gameStateManager.pa} AP)`}
                            </StyledButton>
                        )}
                    </div>
                    
                    {/* Imagen del ECO - Solo retrato sin panel */}
                    <div style={{ 
                           position: 'absolute',
                           right: '20px', 
                           top: '33px', // Subido 37px desde 70px
                           width: '120px',
                           height: '150px',
                           zIndex: rightPanelLayer.zIndex,
                           display: 'flex',
                           flexDirection: 'column',
                           alignItems: 'center',
                           gap: '8px'
                         }}>
                        <EcoPortrait />
                        <div style={{ 
                            ...textStyles.label, 
                            color: '#fecaca', 
                            fontSize: '11px',
                            textAlign: 'center',
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>ECO - VIGILANTE</div>
                    </div>
                    
                    {/* Game Log - Alineado al borde inferior derecho */}
                    <div style={{ 
                           position: 'absolute',
                           right: '0px', // Pegado al borde derecho
                           bottom: '0px', // Alineado al borde inferior
                           width: '300px',
                           height: '120px', // Altura reducida
                           zIndex: gameLogLayer.zIndex, // Usar LayerManager para z-index correcto
                           backgroundColor: 'rgba(0, 0, 0, 0.8)',
                           backdropFilter: 'blur(8px)',
                           borderRadius: '8px 0px 0px 0px', // Solo esquina superior izquierda redondeada
                           border: '1px solid rgba(220, 38, 38, 0.3)',
                           borderRight: 'none', // Sin borde derecho
                           borderBottom: 'none', // Sin borde inferior
                           padding: '12px',
                           overflowY: 'auto'
                         }}>
                        <div style={{ 
                            ...textStyles.label, 
                            color: '#fecaca', 
                            fontSize: '10px',
                            marginBottom: '8px',
                            textAlign: 'center'
                        }}>REGISTRO DE EVENTOS</div>
                        <GameLog />
                    </div>
                    
                    {/* Debug indicator - APP.TSX IS RUNNING */}
                    <div className="debug-app-indicator" style={{ display: 'none' }}>
                        APP.TSX ACTIVE
                    </div>
                    
                    {/* Test Card Images Component - Comentado para producción */}
                    {/* <TestCardImages /> */}
                    
                    {/* Turn overlay */}
                    {turnOverlay.visible && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: turnOverlayLayer.zIndex, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                            <div style={{ 
                                ...panelStyles.hud, 
                                padding: '20px 40px', 
                                border: '2px solid rgba(217,119,6,0.6)', 
                                background: 'rgba(0,0,0,0.9)' 
                            }}>
                                <div style={{ ...textStyles.subsectionTitle, fontSize: '20px', color: colors.gold, margin: 0 }}>
                                    {turnOverlay.text}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PixiJS VFX Layer */}
                    <VFX />
                    
                    {/* CSS Cards Layer (fallback/additional) */}
                    {/* <CSSCards /> */}
                    
                    {/* Temporary Stats Display - Comentado para producción */}
                    {/* <TempStats /> */}

                    {/* Central game area content - Board principal */}
                    <div style={{ 
                           position: 'absolute',
                           left: '40px', // Expandido desde la izquierda
                           top: '100px', 
                           width: '1200px', // Expandido para usar todo el ancho disponible
                           height: '350px',
                           zIndex: boardLayer.zIndex
                         }}>
                        <Board 
                            onNodeClick={handleNodeClick} 
                            isRepairMode={isRepairMode}
                        />
                    </div>

                    {/* Hand area */}
                    <div style={{ 
                           position: 'absolute',
                           left: '140px', // Centrado mejor
                           top: '520px', // Más abajo para dar espacio
                           width: '1000px', // Centrado
                           height: '120px',
                           zIndex: handLayer.zIndex
                         }}>
                        <Hand />
                    </div>

                    {/* Game Log - now integrated in right panel */}

                    {/* Styled Control Buttons */}
                    <div style={{ 
                           position: 'absolute',
                           left: '440px', // Centrado en el nuevo layout
                           top: '650px', // Subido un poco
                           width: '350px', // Reducido
                           height: '40px', // Reducido
                           zIndex: controlButtonsLayer.zIndex, // CRÍTICO: Debe estar encima de todo
                           backgroundColor: 'rgba(0, 0, 0, 0.5)',
                           backdropFilter: 'blur(4px)',
                           borderRadius: '8px', // Reducido
                           border: '1px solid rgba(146, 64, 14, 0.3)',
                           padding: '8px 16px', // Reducido
                           gap: '12px', // Reducido
                           display: 'none', // OCULTAR COMPLETAMENTE
                           justifyContent: 'center',
                           alignItems: 'center'
                         }}>
                        <RepairButton 
                            onClick={toggleRepairMode}
                            icon={<FaWrench />}
                            size="md"
                        >
                            {isRepairMode ? 'Cancel Repair' : 'Repair Mode'}
                        </RepairButton>
                        
                        <FocusButton
                            onClick={() => {
                                audioManager.playEffect('menu-select', 0.7);
                                console.log('Focus action');
                            }}
                            icon={<FaEye />}
                            size="md"
                        >
                            Focus (1 PA)
                        </FocusButton>
                        
                        <RepairButton 
                            onClick={() => {
                                audioManager.playEffect('menu-select', 0.7);
                                setCardPlayMode(cardPlayMode === 'attack' ? 'search' : 'attack');
                            }}
                            icon={cardPlayMode === 'attack' ? <FaCrosshairs /> : <FaSearch />}
                            size="md"
                        >
                            {cardPlayMode === 'attack' ? 'Modo: Ataque' : 'Modo: Búsqueda'}
                        </RepairButton>
                        
                        {gameStateManager.phase === GamePhase.PLAYER_ACTION && (
                            <StyledButton 
                                onClick={() => {
                                    audioManager.playEffect('menu-select', 0.8); // Sonido más fuerte para acción importante
                                    console.log('🎯 App: End Turn button clicked');
                                    turnManager.endPlayerTurn();
                                }}
                                icon={<FaArrowRight />}
                                size="md"
                                variant={gameStateManager.pa === 0 ? 'urgent' : 'danger'}
                            >
                                {gameStateManager.pa === 0 ? 'Fin de Turno (Sin AP)' : 'Fin de Turno'}
                            </StyledButton>
                        )}
                        
                        {/* Debug info */}
                        {import.meta.env.DEV && (
                            <div className="absolute top-full left-0 mt-2 text-xs text-white bg-black/70 p-2 rounded">
                                Phase: {gameStateManager.phase} | AP: {gameStateManager.pa}
                            </div>
                        )}
                    </div>

                    {/* Event Modal with standard translucent styling */}
                    {eventMessage && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: eventModalLayer.zIndex,
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <div style={{
                                ...panelStyles.primary,
                                padding: '32px',
                                minWidth: '400px',
                                maxWidth: '600px',
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '12px',
                                border: `2px solid ${colors.stone.border}`,
                                boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
                                textAlign: 'center' as const,
                                position: 'relative' as const
                            }}>
                                {/* Glassmorphism overlay effects */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                    pointerEvents: 'none' as const
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    width: '2px',
                                    background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
                                    pointerEvents: 'none' as const
                                }} />

                                {/* Icono del evento */}
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '16px',
                                    opacity: 0.9
                                }}>
                                    🎭
                                </div>

                                {/* Título */}
                                <h3 style={{
                                    ...textStyles.sectionTitle,
                                    fontSize: '24px',
                                    marginBottom: '20px',
                                    color: colors.gold,
                                    textShadow: '0 4px 12px rgba(0,0,0,0.8)'
                                }}>
                                    Evento
                                </h3>

                                {/* Mensaje */}
                                <p style={{
                                    ...textStyles.body,
                                    fontSize: '16px',
                                    lineHeight: '1.6',
                                    marginBottom: '32px',
                                    textAlign: 'center' as const,
                                    color: colors.muted
                                }}>
                                    {eventMessage}
                                </p>

                                {/* Botón */}
                                <EndTurnButton onClick={handleContinue} size="lg">
                                    Continuar
                                </EndTurnButton>
                            </div>
                        </div>
                    )}
                    
                    {/* Sistema de Final de Partida Mejorado */}
                    <GameEndSystem
                        isVisible={gameStateManager.isGameOver}
                        onReturnToMenu={() => setInGame(false)}
                        onPlayAgain={() => {
                            turnManager.startGame();
                            handleStartGame();
                        }}
                        onContinueToNext={async () => {
                            const success = await chapterManager.goToNextChapter();
                            if (success) {
                                turnManager.startGame();
                                handleStartGame();
                            } else {
                                console.warn('⚠️ App: No se pudo avanzar al siguiente capítulo');
                                setInGame(false); // Volver al menú si no hay siguiente
                            }
                        }}
                        onTriggerEndNarrative={async () => {
                            try {
                                await chapterManager.playChapterNarrative('end');
                            } catch (error) {
                                console.warn('⚠️ App: No se pudo mostrar narrativa de final:', error);
                            }
                        }}
                    />
                    
                    {/* Event Visual System */}
                    <EventVisualSystem
                        isVisible={eventVisual.visible}
                        eventCard={eventVisual.card}
                        event={eventVisual.event}
                        onClose={() => {
                            console.log('🎭 App: Cerrando evento visual');
                            setEventVisual({ visible: false, card: null, event: null });
                            // Descartar la carta del evento cuando se cierre el modal
                            if (turnManager.currentEventCard) {
                                // deckManager.discard([turnManager.currentEventCard]); // Se maneja en TurnManager
                                turnManager.currentEventCard = null;
                                turnManager.currentDynamicEvent = null;
                            }
                        }}
                    />
                    
                    {/* Narrative Modal */}
                    {narrativeModal.visible && narrativeModal.element && narrativeModal.config && (
                        <NarrativeModal
                            element={narrativeModal.element}
                            config={narrativeModal.config}
                            onComplete={handleNarrativeComplete}
                            onSkip={handleNarrativeSkip}
                        />
                    )}
                    
                    {/* Modal de Configuración de Audio */}
                    {showConfigModal && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.7)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999
                        }}>
                            <div style={{
                                width: '500px',
                                height: '250px',
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '12px',
                                border: `1px solid ${colors.stone.border}`,
                                boxShadow: '0 15px 35px rgba(0,0,0,0.8)',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <h3 style={{
                                    ...textStyles.sectionTitle,
                                    fontSize: '16px',
                                    marginBottom: '12px',
                                    textAlign: 'center',
                                    color: colors.gold
                                }}>
                                    Configuración de Audio
                                </h3>
                                
                                <div style={{ flex: 1 }}>
                                    <AudioControls />
                                </div>
                                
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                    <StyledButton
                                        onClick={() => setShowConfigModal(false)}
                                        size="sm"
                                        style={{
                                            padding: '8px 24px',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Cerrar
                                    </StyledButton>
                                </div>
                            </div>
                        </div>
                    )}
                    </GameLayout>
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <GameModalProvider>
            <AppContent />
        </GameModalProvider>
    );
};

export default App;
