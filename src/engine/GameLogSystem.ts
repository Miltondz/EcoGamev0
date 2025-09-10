// src/engine/GameLogSystem.ts

export type MessageSource = 'player' | 'eco' | 'system' | 'event';
export type MessageType = 'attack' | 'defend' | 'search' | 'research' | 'focus' | 'draw' | 'discard' | 'damage' | 'heal' | 'special' | 'node_damage' | 'node_repair' | 'hallucination' | 'info';

export interface LogMessage {
    id: number;
    message: string;
    source: MessageSource;
    type: MessageType;
}

class GameLogSystem {
    private messages: LogMessage[] = [];
    private nextId = 0;
    private listeners: ((messages: LogMessage[]) => void)[] = [];
    
    constructor() {
        // Mensaje de bienvenida para verificar que el log funciona
        this.addMessage('🎮 Sistema de juego inicializado. ¡Bienvenido a Eco del Vacío!', 'system', 'info');
    }

    subscribe(listener: (messages: LogMessage[]) => void) {
        this.listeners.push(listener);
        listener(this.messages); // Immediately send current messages
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify() {
        this.listeners.forEach(listener => listener([...this.messages]));
    }

    addMessage(message: string, source: MessageSource = 'system', type: MessageType = 'info') {
        const newMessage: LogMessage = {
            id: this.nextId++,
            message,
            source,
            type,
        };
        this.messages.push(newMessage);
        
        if (this.messages.length > 30) { // Increased log limit
            this.messages.shift();
        }
        this.notify();
    }

    get allMessages(): LogMessage[] {
        return [...this.messages];
    }
}

export const gameLogSystem = new GameLogSystem();
