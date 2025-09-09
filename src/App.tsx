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
import { RepairButton, FocusButton, EndTurnButton } from './components/StyledButton';
import { FaWrench, FaEye, FaArrowRight } from 'react-icons/fa';

import { GameLog } from './components/GameLog';
import { VFX } from './components/VFX';
import { CSSCards } from './components/CSSCards';
import { TestCardImages } from './components/TestCardImages';

const App: React.FC = () => {
    const [inGame, setInGame] = useState<boolean>(false);
    const [eventMessage, setEventMessage] = useState<string | null>(null);
    const [isRepairMode, setRepairMode] = useState<boolean>(false);
    const [cardsForRepair, setCardsForRepair] = useState<CardType[]>([]);
    const [, setTick] = useState(0); // Used to force re-renders

    useEffect(() => {
        const unsubscribe = gameStateManager.subscribe(() => {
            setTick(tick => tick + 1);
            if (gameStateManager.phase === GamePhase.EVENT && turnManager.currentEvent) {
                setEventMessage(turnManager.currentEvent.event);
            }
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
                    {/* Debug indicator - APP.TSX IS RUNNING */}
                    <div className="debug-app-indicator">
                        APP.TSX ACTIVE
                    </div>
                    
                    {/* Test Card Images Component */}
                    <TestCardImages />
                    
                    {/* PixiJS VFX Layer */}
                    <VFX />
                    
                    {/* CSS Cards Layer (fallback/additional) */}
                    <CSSCards />
                    
                    {/* Temporary Stats Display */}
                    <TempStats />

                    {/* Central game area content */}
                    <div className="absolute inset-0 z-10">
                        <Board 
                            onNodeClick={handleNodeClick} 
                            isRepairMode={isRepairMode}
                        />
                    </div>

                    {/* Hand area */}
                    <div className="absolute bottom-16 left-0 right-0 z-15 h-40">
                        <Hand />
                    </div>

                    {/* Game Log */}
                    <div className="absolute bottom-8 right-8 z-30 max-w-xs">
                        <GameLog />
                    </div>

                    {/* Styled Control Buttons */}
                    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 flex space-x-6 z-30 bg-black/50 px-6 py-3 rounded-xl backdrop-blur-sm border border-amber-800/30">
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
                        
                        {gameStateManager.phase === GamePhase.PLAYER_ACTION && (
                            <EndTurnButton 
                                onClick={() => turnManager.endPlayerTurn()}
                                icon={<FaArrowRight />}
                                size="md"
                            >
                                End Turn
                            </EndTurnButton>
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