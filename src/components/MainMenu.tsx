import React, { useState, useEffect } from 'react';
import { turnManager } from '../engine/TurnManager';

interface MainMenuProps {
    onStartGame: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
    const [hasSave, setHasSave] = useState(false);

    useEffect(() => {
        const savedGame = localStorage.getItem('ecoGameState');
        setHasSave(!!savedGame);
    }, []);

    const handleNewGame = () => {
        console.log('🎮 MainMenu: Iniciando nuevo juego');
        turnManager.startGame();
        onStartGame();
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1280px',
            height: '800px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                textAlign: 'center',
                color: '#f1f5f9',
                padding: '40px'
            }}>
                <h1 style={{
                    fontSize: '4rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 4px 8px rgba(0,0,0,0.3)'
                }}>ECO DEL VACÍO</h1>
                
                <p style={{
                    fontSize: '1.5rem',
                    color: '#cbd5e1',
                    marginBottom: '48px',
                    fontStyle: 'italic'
                }}>Un juego de estrategia y supervivencia</p>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    alignItems: 'center'
                }}>
                    {hasSave && (
                        <button 
                            style={{
                                padding: '12px 32px',
                                fontSize: '1.2rem',
                                fontWeight: 'bold',
                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                color: '#22c55e',
                                border: '2px solid #22c55e',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(4px)',
                                minWidth: '200px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            onClick={onStartGame}
                        >
                            ▶️ Continue
                        </button>
                    )}
                    
                    <button 
                        style={{
                            padding: '12px 32px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            border: '2px solid #3b82f6',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(4px)',
                            minWidth: '200px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={handleNewGame}
                    >
                        🎮 New Game
                    </button>
                    
                    <button 
                        style={{
                            padding: '12px 32px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(168, 85, 247, 0.2)',
                            color: '#a855f7',
                            border: '2px solid #a855f7',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(4px)',
                            minWidth: '200px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => alert('Instructions coming soon!')}
                    >
                        📖 Instructions
                    </button>
                    
                    <button 
                        style={{
                            padding: '12px 32px',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            backgroundColor: 'rgba(107, 114, 128, 0.2)',
                            color: '#6b7280',
                            border: '2px solid #6b7280',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(4px)',
                            minWidth: '200px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => alert('Settings coming soon!')}
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
