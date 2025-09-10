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
        <div className="screen active">
            <div className="screen-content">
                <h1 className="game-title">ECO DEL VACÍO</h1>
                <p className="game-subtitle">Un juego de estrategia y supervivencia</p>
                <div className="menu-buttons">
                    {hasSave && (
                        <button className="menu-button" onClick={onStartGame}>▶️ Continue</button>
                    )}
                    <button className="menu-button" onClick={handleNewGame}>🎮 New Game</button>
                    <button className="menu-button">📖 Instructions</button>
                    <button className="menu-button">⚙️ Settings</button>
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
