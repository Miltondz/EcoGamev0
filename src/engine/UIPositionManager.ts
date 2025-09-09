// src/engine/UIPositionManager.ts

type UIElement = 'deck' | 'discardPile' | 'playerHand' | 'eco' | 'playArea';

class UIPositionManager {
    private positions: Map<UIElement, { x: number; y: number; width?: number; height?: number }> = new Map();

    register(element: UIElement, position: { x: number; y: number; width?: number; height?: number }) {
        this.positions.set(element, position);
    }

    get(element: UIElement): { x: number; y: number; width?: number; height?: number } {
        return this.positions.get(element) || { x: 0, y: 0 };
    }
}

export const uiPositionManager = new UIPositionManager();
