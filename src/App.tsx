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

import { VFX } from './components/VFX';
import { GameLog } from './components/GameLog';
import EventVisualSystem from './components/EventVisualSystem';
// import { CSSCards } from './components/CSSCards'; // Commented out - using only PixiJS VFX

const App: React.FC = () => {
    const [inGame, setInGame] = useState<boolean>(false);
    const [eventMessage, setEventMessage] = useState<string | null>(null);
    const [isRepairMode, setRepairMode] = useState<boolean>(false);
    const [cardsForRepair, setCardsForRepair] = useState<CardType[]>([]);
    const [cardPlayMode, setCardPlayMode] = useState<'attack' | 'search'>('attack'); // Modo de juego de cartas
    const [turnOverlay, setTurnOverlay] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
    const [eventVisual, setEventVisual] = useState<{ visible: boolean; card: CardType | null; event: any | null }>({ visible: false, card: null, event: null });
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
        return unsubscribe;
    }, []);

    const handleStartGame = () => {
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

    return (
        <div className="fixed-game-container flex justify-center items-center min-h-screen bg-black">
            { !inGame ? (
                <div className="game-viewport relative" style={{ width: '1280px', height: '720px' }}>
                    <MainMenu onStartGame={handleStartGame} />
                </div>
            ) : (
                <div className="game-viewport relative overflow-hidden" style={{ width: '1280px', height: '720px' }}>
                    <GameLayout>
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
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          border: '1px solid rgba(217, 119, 6, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
                                <span style={{ color: '#fef3c7', fontWeight: 'bold' }}>JUGADOR</span>
                                <span style={{ color: '#fde68a' }}>HP: {gameStateManager.pv}/{gameStateManager.maxPV}</span>
                                <span style={{ color: '#fde68a' }}>Cor: {gameStateManager.sanity}</span>
                                <span style={{ color: '#fde68a' }}>AP: {gameStateManager.pa}/{gameStateManager.maxAP}</span>
                            </div>
                        </div>
                        
                        {/* Turno - Centro */}
                        <div style={{
                          backgroundColor: 'rgba(30, 41, 59, 0.8)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '8px',
                          padding: '8px 24px',
                          border: '1px solid rgba(71, 85, 105, 0.5)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>TURNO {gameStateManager.turn}</div>
                                <div style={{ color: '#cbd5e1', fontSize: '12px' }}>FASE: {gameStateManager.phase === GamePhase.PLAYER_ACTION ? "JUGADOR" : "ECO"}</div>
                            </div>
                        </div>
                        
                        {/* Stats Eco - Derecha */}
                        <div style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          backdropFilter: 'blur(4px)',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          border: '1px solid rgba(220, 38, 38, 0.3)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
                                <span style={{ color: '#fecaca' }}>HP: {gameStateManager.ecoHp}/{gameStateManager.maxEcoHp}</span>
                                <span style={{ color: '#fecaca' }}>Vigilante</span>
                                <span style={{ color: '#fee2e2', fontWeight: 'bold' }}>ECO</span>
                            </div>
                        </div>
                        
                    </div>
                    
                    {/* Cartas del Eco - Zona debajo del HUD */}
                    <div style={{ 
                           position: 'absolute',
                           top: '80px',  
                           left: '200px', 
                           width: '880px', 
                           height: '80px',
                           zIndex: 25,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '12px'
                         }}>
                        {Array.from({ length: 5 }, (_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '48px',
                                    height: '64px',
                                    borderRadius: '4px',
                                    border: '2px solid rgba(185, 28, 28, 0.8)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                    transition: 'transform 0.2s ease',
                                    backgroundImage: 'url("/images/decks/default/card-back.jpg")',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundColor: '#1e293b',
                                    filter: 'drop-shadow(0 2px 4px rgba(185, 28, 28, 0.3))'
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
                                <div style={{ 
                                  width: '64px', 
                                  height: '64px', 
                                  borderRadius: '50%', 
                                  backgroundColor: 'rgba(146, 64, 14, 0.5)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '1.5rem', 
                                  margin: '0 auto 8px auto' 
                                }}>👤</div>
                                <div style={{ color: '#fde68a', fontWeight: 'bold', fontSize: '12px' }}>SURVIVOR</div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                                <div>
                                    <div style={{ color: '#fde68a', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>Estado:</div>
                                    <div style={{ color: '#fcd34d', fontSize: '9px' }}>
                                        <div style={{ marginBottom: '2px' }}>• Normal</div>
                                        <div style={{ marginBottom: '2px' }}>• Sin efectos</div>
                                        <div style={{ marginBottom: '2px' }}>• Cartas: {gameStateManager.hand.length}</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div style={{ color: '#fde68a', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>Habilidades:</div>
                                    <div style={{ color: '#fcd34d', fontSize: '9px' }}>
                                        <div style={{ marginBottom: '2px' }}>• Reparación: Tréboles</div>
                                        <div style={{ marginBottom: '2px' }}>• Ataque: Picas</div>
                                        <div style={{ marginBottom: '2px' }}>• Búsqueda: Diamantes</div>
                                        <div style={{ marginBottom: '2px' }}>• Enfoque: Corazones</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ color: '#fde68a', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>Objetivos:</div>
                                    <div style={{ color: '#fcd34d', fontSize: '9px' }}>
                                        <div style={{ marginBottom: '2px' }}>• Reactivar sistemas críticos</div>
                                        <div style={{ marginBottom: '2px' }}>• Resistir ataques del Eco</div>
                                        <div style={{ marginBottom: '2px' }}>• Sobrevivir hasta el amanecer</div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ color: '#fde68a', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>Eventos Recientes:</div>
                                    <div style={{ color: '#fcd34d', fontSize: '9px' }}>
                                        <div style={{ marginBottom: '2px' }}>• Juego iniciado</div>
                                        <div style={{ marginBottom: '2px' }}>• Cartas repartidas</div>
                                        <div style={{ marginBottom: '2px' }}>• Esperando acción</div>
                                    </div>
                                </div>

                                {/* Nodos grandes en parte inferior izquierda */}
                                <div style={{ marginTop: 'auto' }}>
                                    <div style={{ color: '#fde68a', fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>NODOS</div>
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
                           top: '90px',
                           width: '200px', 
                           height: '580px',
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
                                <div style={{ 
                                  width: '64px', 
                                  height: '64px', 
                                  borderRadius: '50%', 
                                  backgroundColor: 'rgba(153, 27, 27, 0.5)', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '1.5rem', 
                                  margin: '0 auto 8px auto',
                                  animation: 'pulse 2s infinite'
                                }}>👹</div>
                                <div style={{ color: '#fecaca', fontWeight: 'bold', fontSize: '12px' }}>ECO - VIGILANTE</div>
                            </div>
                            
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
                                <div>
                                    <div style={{ color: '#fecaca', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>Estado:</div>
                                    <div style={{ color: '#f87171', fontSize: '9px' }}>
                                        <div style={{ marginBottom: '2px' }}>• Vigilante</div>
                                        <div style={{ marginBottom: '2px' }}>• Cartas: 5</div>
                                        <div style={{ marginBottom: '2px' }}>• Última acción: Esperando</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div style={{ color: '#fecaca', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>Amenaza:</div>
                                    <div style={{ color: '#f87171', fontSize: '9px' }}>
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
                            <div style={{ padding: '16px 32px', borderRadius: '8px', border: '1px solid rgba(217,119,6,0.5)', background: 'rgba(0,0,0,0.8)', color: '#fde68a', fontWeight: 'bold', fontSize: '18px' }}>
                                {turnOverlay.text}
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
                           zIndex: 20,
                           backgroundColor: 'rgba(0, 0, 0, 0.2)',
                           borderRadius: '8px',
                           border: '1px solid rgba(217, 119, 6, 0.2)'
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

                    {/* Event Modal with enhanced styling */}
                    {eventMessage && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                            <div className="bg-gradient-to-br from-amber-900/90 to-amber-800/90 p-8 rounded-lg border-2 border-amber-600/50 shadow-2xl max-w-md mx-4">
                                <h2 className="text-2xl font-bold text-amber-100 mb-4 text-center">Event</h2>
                                <p className="text-amber-200 mb-6 text-center leading-relaxed">{eventMessage}</p>
                                <div className="flex justify-center">
                                    <EndTurnButton onClick={handleContinue} size="lg">
                                        Continue
                                    </EndTurnButton>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Game Over Modal with enhanced styling */}
                    {gameStateManager.isGameOver && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                            <div className={`p-12 rounded-lg border-2 shadow-2xl max-w-lg mx-4 text-center ${
                                gameStateManager.victory 
                                    ? 'bg-gradient-to-br from-green-900/90 to-green-800/90 border-green-600/50'
                                    : 'bg-gradient-to-br from-red-900/90 to-red-800/90 border-red-600/50'
                            }`}>
                                <h1 className={`text-4xl font-bold mb-6 ${
                                    gameStateManager.victory ? 'text-green-100' : 'text-red-100'
                                }`}>
                                    {gameStateManager.victory ? 'Victory!' : 'Defeat'}
                                </h1>
                                <div className="flex justify-center">
                                    <EndTurnButton 
                                        onClick={() => {
                                            turnManager.startGame();
                                            handleStartGame();
                                        }}
                                        size="lg"
                                    >
                                        Play Again
                                    </EndTurnButton>
                                </div>
                            </div>
                        </div>
                    )}
                    
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
                    </GameLayout>
                </div>
            )}
        </div>
    );
};

export default App;