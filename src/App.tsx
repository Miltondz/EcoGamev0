// src/App.tsx

import React, { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { MainMenu } from './components/MainMenu';
import { TempStats } from './components/TempStats';
import { GameLayout } from './components/GameLayout';
import { Hand } from './components/Hand';
import { turnManager } from './engine/TurnManager';
import { gameStateManager, GamePhase } from './engine/GameStateManager';
import type { Card as CardType } from './engine/types';
import { cardEffectEngine } from './engine/CardEffectEngine';
import { RepairButton, FocusButton, EndTurnButton, StyledButton } from './components/StyledButton';
import { FaWrench, FaEye, FaArrowRight, FaCrosshairs, FaSearch } from 'react-icons/fa';

import { GameLog } from './components/GameLog';
import { VFX } from './components/VFX';
// import { CSSCards } from './components/CSSCards'; // Commented out - using only PixiJS VFX
import { TestCardImages } from './components/TestCardImages';

const App: React.FC = () => {
    const [inGame, setInGame] = useState<boolean>(false);
    const [eventMessage, setEventMessage] = useState<string | null>(null);
    const [isRepairMode, setRepairMode] = useState<boolean>(false);
    const [cardsForRepair, setCardsForRepair] = useState<CardType[]>([]);
    const [cardPlayMode, setCardPlayMode] = useState<'attack' | 'search'>('attack'); // Modo de juego de cartas
    const [, setTick] = useState(0); // Used to force re-renders

    useEffect(() => {
        const unsubscribe = gameStateManager.subscribe(() => {
            setTick(tick => tick + 1);
            if (gameStateManager.phase === GamePhase.EVENT && turnManager.currentEvent) {
                setEventMessage(turnManager.currentEvent.event);
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

    return (
        <div className="main-container">
            { !inGame ? (
                <MainMenu onStartGame={handleStartGame} />
            ) : (
                <GameLayout>
                    {/* HUD Superior - Stats del jugador y Eco */}
                    <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
                        {/* Stats Jugador - Izquierda */}
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-600/30">
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="text-amber-100 font-bold">JUGADOR</span>
                                <span className="text-amber-200">HP: {gameStateManager.pv}/{gameStateManager.maxPV}</span>
                                <span className="text-amber-200">Cor: {gameStateManager.sanity}</span>
                                <span className="text-amber-200">AP: {gameStateManager.pa}/{gameStateManager.maxAP}</span>
                            </div>
                        </div>
                        
                        {/* Turno - Centro */}
                        <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-6 py-2 border border-slate-600/50">
                            <div className="text-center">
                                <div className="text-slate-200 font-bold">TURNO {gameStateManager.turn}</div>
                                <div className="text-slate-300 text-xs">FASE: {gameStateManager.phase === GamePhase.PLAYER_ACTION ? "JUGADOR" : "ECO"}</div>
                            </div>
                        </div>
                        
                        {/* Stats Eco - Derecha */}
                        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-red-600/30">
                            <div className="flex items-center space-x-4 text-sm">
                                <span className="text-red-200">Cartas: 5</span>
                                <span className="text-red-200">HP: {gameStateManager.ecoHp}/{gameStateManager.maxEcoHp}</span>
                                <span className="text-red-200">Vigilante</span>
                                <span className="text-red-100 font-bold">ECO</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Cartas del Eco - Zona Superior */}
                    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-15">
                        <div className="flex items-center space-x-2">
                            <span className="text-red-400 text-sm font-bold mr-4">MANO DEL ECO:</span>
                            {Array.from({ length: 5 }, (_, i) => (
                                <div
                                    key={i}
                                    className="w-12 h-16 rounded border border-red-700/50 shadow-lg transition-transform bg-cover bg-center"
                                    style={{
                                        backgroundImage: 'url("/images/decks/default/card-back.jpg")',
                                        backgroundSize: 'cover'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                    
                    {/* Panel Izquierdo - Jugador */}
                    <div className="absolute left-8 top-44 bottom-64 w-80 z-30 bg-black/40 backdrop-blur-sm rounded-lg border border-amber-600/30 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-amber-800/50 flex items-center justify-center text-2xl mx-auto mb-2">👤</div>
                                <div className="text-amber-200 font-bold">SURVIVOR</div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <div className="text-amber-200 text-sm font-bold mb-2">Estado:</div>
                                    <div className="text-amber-300 text-xs space-y-1">
                                        <div>• Normal</div>
                                        <div>• Sin efectos</div>
                                        <div>• Cartas: {gameStateManager.hand.length}</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-amber-200 text-sm font-bold mb-2">Nodos del Sistema:</div>
                                    <div className="space-y-2 text-xs">
                                        <div className="bg-red-900/30 border border-red-700/50 rounded p-2">
                                            <div className="text-red-300 font-bold">Comunicaciones</div>
                                            <div className="text-red-400">0% - Desconectado</div>
                                        </div>
                                        <div className="bg-red-900/30 border border-red-700/50 rounded p-2">
                                            <div className="text-red-300 font-bold">Energía</div>
                                            <div className="text-red-400">0% - Sin energía</div>
                                        </div>
                                        <div className="bg-red-900/30 border border-red-700/50 rounded p-2">
                                            <div className="text-red-300 font-bold">Defensa</div>
                                            <div className="text-red-400">0% - Vulnerable</div>
                                        </div>
                                        <div className="bg-red-900/30 border border-red-700/50 rounded p-2">
                                            <div className="text-red-300 font-bold">Suministros</div>
                                            <div className="text-red-400">0% - Agotado</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Panel Central - Campo de Batalla */}
                    <div className="absolute left-96 right-96 top-44 bottom-64 z-30 bg-black/30 backdrop-blur-sm rounded-lg border border-amber-600/50 p-6 flex flex-col">
                        <div className="text-center mb-4">
                            <div className="text-amber-400 text-4xl mb-2">⚔️</div>
                            <div className="text-amber-300 text-xl font-bold mb-2">CAMPO DE BATALLA</div>
                            <div className="text-amber-500/80 text-sm">Haz clic en las cartas para jugarlas</div>
                        </div>
                        
                        <div className="flex-1 flex">
                            <div className="w-1/2 pr-4">
                                <div className="text-amber-200 text-sm font-bold mb-3">Objetivos:</div>
                                <div className="space-y-2 text-xs text-amber-300">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                        <span>Reactivar sistemas críticos</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                                        <span>Resistir ataques del Eco</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                        <span>Sobrevivir hasta el amanecer</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-1/2 pl-4">
                                <div className="text-amber-200 text-sm font-bold mb-3">Eventos Recientes:</div>
                                <div className="space-y-2 text-xs text-amber-300">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                        <span>Juego iniciado</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                        <span>Cartas repartidas</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                                        <span>Esperando acción</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Panel Derecho - Eco */}
                    <div className="absolute right-8 top-44 bottom-64 w-80 z-30 bg-black/40 backdrop-blur-sm rounded-lg border border-red-600/30 p-4 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-red-800/50 flex items-center justify-center text-2xl mx-auto mb-2 animate-pulse">👹</div>
                                <div className="text-red-200 font-bold">ECO - VIGILANTE</div>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <div className="text-red-200 text-sm font-bold mb-2">Estado:</div>
                                    <div className="text-red-300 text-xs space-y-1">
                                        <div>• Vigilante</div>
                                        <div>• Cartas: 5</div>
                                        <div>• Última acción: Esperando</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="text-red-200 text-sm font-bold mb-2">Amenaza:</div>
                                    <div className="text-red-300 text-xs space-y-1">
                                        <div>• Nivel: Moderado</div>
                                        <div>• Preparando ataque</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Debug indicator - APP.TSX IS RUNNING */}
                    <div className="debug-app-indicator" style={{ display: 'none' }}>
                        APP.TSX ACTIVE
                    </div>
                    
                    {/* Test Card Images Component */}
                    <TestCardImages />
                    
                    {/* PixiJS VFX Layer */}
                    <VFX />
                    
                    {/* CSS Cards Layer (fallback/additional) */}
                    {/* <CSSCards /> */}
                    
                    {/* Temporary Stats Display */}
                    <TempStats />

                    {/* Central game area content */}
                    <div className="absolute left-96 right-96 top-44 bottom-64 z-5">
                        <Board 
                            onNodeClick={handleNodeClick} 
                            isRepairMode={isRepairMode}
                        />
                    </div>

                    {/* Hand area */}
                    <div className="absolute bottom-16 left-0 right-0 z-15 h-40">
                        <Hand />
                    </div>

                    {/* Game Log - now self-positioning */}
                    <GameLog />

                    {/* Styled Control Buttons */}
                    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-4 z-50 bg-black/50 px-6 py-3 rounded-xl backdrop-blur-sm border border-amber-800/30">
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
                </GameLayout>
            )}
        </div>
    );
};

export default App;