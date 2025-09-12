// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { MainMenu } from './components/MainMenu';
import { GameLayout } from './components/GameLayout';
import { Hand } from './components/Hand';
import { turnManager } from './engine/TurnManager';
import { gameStateManager, GamePhase } from './engine/GameStateManager';
import { nodeSystem } from './engine/NodeSystem';
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
// import { CSSCards } from './components/CSSCards'; // Commented out - using only PixiJS VFX

const AppContent: React.FC = () => {
    const modalContext = useGameModalContext();
    
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
    const [, setTick] = useState(0); // Used to force re-renders

    useEffect(() => {
        const unsubscribe = gameStateManager.subscribe(() => {
            setTick(tick => tick + 1);
            if (gameStateManager.phase === GamePhase.EVENT && turnManager.currentEvent) {
                setEventMessage(turnManager.currentEvent.event);
            }
            // Turn overlay when phase enters PLAYER_ACTION or ECO_ATTACK
            if (gameStateManager.phase === GamePhase.PLAYER_ACTION) {
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
        
        return () => {
            unsubscribe();
            unsubscribeNarrative();
        };
    }, []);

    const handleStartGame = async () => {
        setInGame(true);
        setEventMessage(null);
        setRepairMode(false);
        setCardsForRepair([]);
        
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
        setEventMessage(null);
        turnManager.advancePhase();
    };

    const handleNodeClick = (nodeId: string) => {
        if (isRepairMode && cardsForRepair.length > 0) {
            // Validate that all cards are Clubs before repairing
            const allClubs = cardsForRepair.every(card => card.suit === 'Clubs');
            if (allClubs) {
                cardEffectEngine.repairNode(nodeId, cardsForRepair);
                setCardsForRepair([]);
                setRepairMode(false);
            }
        }
    };

    

    const toggleRepairMode = () => {
        setRepairMode(!isRepairMode);
        setCardsForRepair([]);
    };

    // Helper function to get node display properties
    const getNodeDisplay = (nodeId: string) => {
        const node = nodeSystem.getNode(nodeId);
        if (!node) return { icon: '❓', color: '#666666', status: 'N/A' };
        
        const repairLevel = Math.max(0, node.maxDamage - node.damage);
        const repairPercent = Math.round((repairLevel / node.maxDamage) * 100);
        
        let color, icon;
        
        switch (node.status) {
            case 'stable':
                color = repairLevel === node.maxDamage ? '#22c55e' : '#eab308'; // green if fully repaired, yellow if partially
                break;
            case 'unstable':
                color = '#f97316'; // orange
                break;
            case 'corrupted':
                color = '#ef4444'; // red
                break;
            default:
                color = '#6b7280'; // gray
        }
        
        // Get appropriate icon based on node type
        switch (nodeId) {
            case 'communications': 
                icon = node.status === 'corrupted' ? '📵' : (repairLevel === node.maxDamage ? '📶' : '📳');
                break;
            case 'power':
            case 'energy':
                icon = node.status === 'corrupted' ? '🔋' : (repairLevel === node.maxDamage ? '⚡' : '🔅');
                break;
            case 'defense':
            case 'shields':
                icon = node.status === 'corrupted' ? '🛑' : (repairLevel === node.maxDamage ? '🛡️' : '⚠️');
                break;
            case 'supplies':
            case 'life_support':
                icon = node.status === 'corrupted' ? '💀' : (repairLevel === node.maxDamage ? '📦' : '📋');
                break;
            default:
                icon = node.status === 'corrupted' ? '💥' : (repairLevel === node.maxDamage ? '✅' : '🔧');
        }
        
        return { 
            icon, 
            color, 
            status: `${repairPercent}%`,
            repairLevel,
            maxDamage: node.maxDamage,
            damage: node.damage
        };
    };

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
                    {/* Botón de Salida */}
                    <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        zIndex: 100
                    }}>
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
                           top: '20px', 
                           left: '40px', 
                           width: '1200px', 
                           height: '50px',
                           zIndex: 20,
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
                           top: '220px', // Movido hacia abajo para mejor alineación con panel ECO
                           left: '150px',
                           width: '980px', 
                           height: '120px',
                           zIndex: 25,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '16px'
                         }}>
                        {Array.from({ length: 5 }, (_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '108px',
                                    height: '150px',
                                    borderRadius: '6px',
                                    border: '2px solid rgba(185, 28, 28, 0.8)',
                                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                    transition: 'transform 0.2s ease',
                                    backgroundImage: 'url("/images/scenarios/default/cards/card-back.png")',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: '#1e293b',
                                    filter: 'drop-shadow(0 3px 6px rgba(185, 28, 28, 0.4))'
                                }}
                            />
                        ))}
                    </div>
                    
                    {/* Panel Izquierdo UNIFICADO - Jugador */}
                    <div style={{ 
                           position: 'absolute',
                           left: '0px', 
                           top: '90px',
                           width: '200px', 
                           height: '580px',
                           zIndex: 30,
                           backgroundColor: 'rgba(0, 0, 0, 0.4)',
                           backdropFilter: 'blur(4px)',
                           borderRadius: '8px',
                           border: '1px solid rgba(217, 119, 6, 0.3)',
                           padding: '16px',
                           overflowY: 'auto'
                         }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ margin: '0 auto 8px auto' }}>
                                    <PlayerPortrait />
                                </div>
                                <div style={{ ...textStyles.label, color: colors.gold, fontSize: '11px' }}>SOBREVIVIENTE</div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                                <div>
                                    <div style={{ ...textStyles.label, fontSize: '10px', color: colors.gold, marginBottom: '4px' }}>Estado:</div>
                                    <div style={{ ...textStyles.bodySmall, fontSize: '9px', color: colors.muted }}>
                                        <div style={{ marginBottom: '2px' }}>• Normal</div>
                                        <div style={{ marginBottom: '2px' }}>• Sin efectos</div>
                                        <div style={{ marginBottom: '2px' }}>• Cartas: {gameStateManager.hand.length}</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div style={{ ...textStyles.label, fontSize: '10px', color: colors.gold, marginBottom: '4px' }}>Habilidades:</div>
                                    <div style={{ ...textStyles.bodySmall, fontSize: '9px', color: colors.muted }}>
                                        <div style={{ marginBottom: '2px' }}>• Reparación: Tréboles</div>
                                        <div style={{ marginBottom: '2px' }}>• Ataque: Picas</div>
                                        <div style={{ marginBottom: '2px' }}>• Búsqueda: Diamantes</div>
                                        <div style={{ marginBottom: '2px' }}>• Enfoque: Corazones</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ ...textStyles.label, fontSize: '10px', color: colors.gold, marginBottom: '4px' }}>Objetivos:</div>
                                    <div style={{ ...textStyles.bodySmall, fontSize: '9px', color: colors.muted }}>
                                        <div style={{ marginBottom: '2px' }}>• Reactivar sistemas críticos</div>
                                        <div style={{ marginBottom: '2px' }}>• Resistir ataques del Eco</div>
                                        <div style={{ marginBottom: '2px' }}>• Sobrevivir hasta el amanecer</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ ...textStyles.label, fontSize: '10px', color: colors.gold, marginBottom: '4px' }}>Eventos Recientes:</div>
                                    <div style={{ ...textStyles.bodySmall, fontSize: '9px', color: colors.muted }}>
                                        <div style={{ marginBottom: '2px' }}>• Juego iniciado</div>
                                        <div style={{ marginBottom: '2px' }}>• Cartas repartidas</div>
                                        <div style={{ marginBottom: '2px' }}>• Esperando acción</div>
                                    </div>
                                </div>

                                {/* Nodos grandes en parte inferior izquierda */}
                                <div style={{ marginTop: 'auto' }}>
                                    <div style={{ ...textStyles.label, fontSize: '10px', color: colors.gold, marginBottom: '6px' }}>NODOS</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {['communications','energy','defense','supplies'].map((id) => {
                                            const nd = getNodeDisplay(id);
                                            return (
                                                <div key={id} style={{ textAlign: 'center', padding: '8px', backgroundColor: 'rgba(217, 119, 6, 0.08)', borderRadius: '4px', border: '1px solid rgba(217, 119, 6, 0.25)' }}>
                                                    <div style={{ fontSize: '24px', marginBottom: '4px', color: nd.color }}>{nd.icon}</div>
                                                    <div style={{ fontSize: '8px', color: nd.color }}>{nd.status}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    
                    {/* Panel Derecho UNIFICADO - Eco */}
                    <div style={{ 
                           position: 'absolute',
                           left: '1080px', 
                           top: '150px', // Movido hacia abajo desde 90px para mejor alineación
                           width: '200px', 
                           height: '520px', // Reducido proporcionalmente
                           zIndex: 30,
                           backgroundColor: 'rgba(0, 0, 0, 0.4)',
                           backdropFilter: 'blur(4px)',
                           borderRadius: '8px',
                           border: '1px solid rgba(220, 38, 38, 0.3)',
                           padding: '16px',
                           overflowY: 'auto'
                         }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ margin: '0 auto 8px auto' }}>
                                    <EcoPortrait />
                                </div>
                                <div style={{ ...textStyles.label, color: '#fecaca', fontSize: '11px' }}>ECO - VIGILANTE</div>
                            </div>
                            
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                                <div>
                                    <div style={{ ...textStyles.label, fontSize: '10px', color: '#fecaca', marginBottom: '4px' }}>Estado:</div>
                                    <div style={{ ...textStyles.bodySmall, fontSize: '9px', color: '#f87171' }}>
                                        <div style={{ marginBottom: '2px' }}>• Vigilante</div>
                                        <div style={{ marginBottom: '2px' }}>• Cartas: 5</div>
                                        <div style={{ marginBottom: '2px' }}>• Última acción: Esperando</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div style={{ ...textStyles.label, fontSize: '10px', color: '#fecaca', marginBottom: '4px' }}>Amenaza:</div>
                                    <div style={{ ...textStyles.bodySmall, fontSize: '9px', color: '#f87171' }}>
                                        <div style={{ marginBottom: '2px' }}>• Nivel: Moderado</div>
                                        <div style={{ marginBottom: '2px' }}>• Preparando ataque</div>
                                    </div>
                                </div>
                                
                                
                                {/* GameLog en la parte inferior */}
                                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                    <GameLog />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Debug indicator - APP.TSX IS RUNNING */}
                    <div className="debug-app-indicator" style={{ display: 'none' }}>
                        APP.TSX ACTIVE
                    </div>
                    
                    {/* Test Card Images Component - Comentado para producción */}
                    {/* <TestCardImages /> */}
                    
                    {/* Turn overlay */}
                    {turnOverlay.visible && (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
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
                           left: '200px', 
                           top: '120px', 
                           width: '880px', 
                           height: '350px',
                           zIndex: 20
                         }}>
                        <Board 
                            onNodeClick={handleNodeClick} 
                            isRepairMode={isRepairMode}
                        />
                    </div>

                    {/* Hand area */}
                    <div style={{ 
                           position: 'absolute',
                           left: '200px', 
                           top: '500px',
                           width: '880px', 
                           height: '120px',
                           zIndex: 25
                         }}>
                        <Hand />
                    </div>

                    {/* Game Log - now integrated in right panel */}

                    {/* Styled Control Buttons */}
                    <div style={{ 
                           position: 'absolute',
                           left: '440px', 
                           top: '670px',
                           width: '400px', 
                           height: '50px',
                           zIndex: 50,
                           backgroundColor: 'rgba(0, 0, 0, 0.5)',
                           backdropFilter: 'blur(4px)',
                           borderRadius: '12px',
                           border: '1px solid rgba(146, 64, 14, 0.3)',
                           padding: '12px 24px',
                           gap: '16px',
                           display: 'flex',
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
                            onClick={() => console.log('Focus action')}
                            icon={<FaEye />}
                            size="md"
                        >
                            Focus (1 PA)
                        </FocusButton>
                        
                        <RepairButton 
                            onClick={() => setCardPlayMode(cardPlayMode === 'attack' ? 'search' : 'attack')}
                            icon={cardPlayMode === 'attack' ? <FaCrosshairs /> : <FaSearch />}
                            size="md"
                        >
                            {cardPlayMode === 'attack' ? 'Modo: Ataque' : 'Modo: Búsqueda'}
                        </RepairButton>
                        
                        {gameStateManager.phase === GamePhase.PLAYER_ACTION && (
                            <StyledButton 
                                onClick={() => {
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
                            zIndex: 1000,
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
