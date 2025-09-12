import React, { createContext, useContext } from 'react';
import { useGameModal } from '../components/ui/GameModal';

interface GameModalContextType {
    showMessage: (
        message: string, 
        options?: {
            title?: string;
            type?: 'info' | 'warning' | 'error' | 'success';
            buttonText?: string;
        }
    ) => void;
    
    showConfirm: (
        message: string,
        onConfirm: () => void,
        options?: {
            title?: string;
            type?: 'warning' | 'danger' | 'info';
            confirmText?: string;
            cancelText?: string;
            onCancel?: () => void;
        }
    ) => void;
}

const GameModalContext = createContext<GameModalContextType | null>(null);

export const useGameModalContext = () => {
    const context = useContext(GameModalContext);
    if (!context) {
        throw new Error('useGameModalContext must be used within a GameModalProvider');
    }
    return context;
};

export const GameModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { showMessage, showConfirm, MessageBoxComponent, ConfirmDialogComponent } = useGameModal();

    return (
        <GameModalContext.Provider value={{ showMessage, showConfirm }}>
            {children}
            <MessageBoxComponent />
            <ConfirmDialogComponent />
        </GameModalContext.Provider>
    );
};

// Helper para usar el contexto desde código fuera de React (como managers)
let globalModalContext: GameModalContextType | null = null;

export const setGlobalModalContext = (context: GameModalContextType) => {
    globalModalContext = context;
};

export const getGlobalModalContext = () => {
    if (!globalModalContext) {
        // Fallback a sistemas nativos si no hay contexto disponible
        console.warn('Global modal context not available, falling back to native dialogs');
        return {
            showMessage: (message: string) => {
                alert(message);
            },
            showConfirm: (message: string, onConfirm: () => void) => {
                if (confirm(message)) {
                    onConfirm();
                }
            }
        };
    }
    return globalModalContext;
};
