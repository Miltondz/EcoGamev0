# 🃏 Instrucciones de Interacción de Usuario con Cartas

Este documento define cómo la IA debe manejar las **interacciones del
usuario con las cartas**, desde que aparecen en la mano hasta que son
jugadas y descartadas.\
Se incluyen ejemplos prácticos en **PixiJS + GSAP**, y técnicas
avanzadas para aprovechar al máximo la librería gráfica.

------------------------------------------------------------------------

## 1. Reparto de Cartas (entrada inicial o al robar)

Cuando una carta llega a la mano: - Aparece desde el mazo con una
**traslación animada**. - Se rota ligeramente para dar naturalidad. - Se
puede usar un *stagger* (cascada) para varias cartas.

**Ejemplo (GSAP):**

``` ts
gsap.fromTo(card, 
  { x: 400, y: -200, rotation: -1 },
  { x: handX, y: handY, rotation: 0, duration: 0.8, ease: "back.out(1.7)" }
);
```

------------------------------------------------------------------------

## 2. Hover (mouse encima / toque en móvil)

Feedback al usuario de que puede interactuar: - **Escala suave** (1 →
1.1). - **GlowFilter** sutil. - Elevar la carta unos pixeles
(`y -= 20`).

**Ejemplo:**

``` ts
card.interactive = true;
card.on("pointerover", () => {
  gsap.to(card.scale, { x: 1.1, y: 1.1, duration: 0.2 });
  gsap.to(card, { y: card.y - 20, duration: 0.2 });
});
card.on("pointerout", () => {
  gsap.to(card.scale, { x: 1, y: 1, duration: 0.2 });
  gsap.to(card, { y: card.y + 20, duration: 0.2 });
});
```

------------------------------------------------------------------------

## 3. Selección (click o tap)

Cuando el jugador selecciona la carta: - Se resalta con un **glow más
fuerte**. - Puede moverse ligeramente hacia adelante (simulación de
"pick up"). - En móvil: vibración leve (haptic feedback).

**Ejemplo:**

``` ts
card.on("pointerdown", () => {
  gsap.to(card.scale, { x: 1.15, y: 1.15, duration: 0.2 });
  card.filters = [new GlowFilter({ distance: 15, outerStrength: 2, color: 0x00ffcc })];
});
```

------------------------------------------------------------------------

## 4. Drag & Drop (jugada de la carta)

La carta sigue al puntero mientras se arrastra.

**Ejemplo:**

``` ts
card.on("pointerdown", (e) => {
  card.dragging = true;
});
card.on("pointermove", (e) => {
  if (card.dragging) {
    const pos = e.data.global;
    card.x = pos.x;
    card.y = pos.y;
  }
});
card.on("pointerup", () => {
  card.dragging = false;
  // aquí decides si se jugó o regresa a la mano
});
```

Animación de retorno a la mano si no se juega:

``` ts
gsap.to(card, { x: handX, y: handY, duration: 0.5, ease: "elastic.out(1, 0.4)" });
```

------------------------------------------------------------------------

## 5. Animación de Jugada

Según el palo de la carta: - **♠ Ataque** → proyectil hacia el Eco. -
**♥ Defensa** → onda expansiva hacia el jugador. - **♣ Investigación** →
partículas hacia un nodo dañado. - **♦ Recursos** → partículas doradas
hacia el mazo.

**Ejemplo (ataque con proyectil):**

``` ts
const projectile = new Sprite(Texture.from("assets/effect_projectile.png"));
projectile.x = card.x;
projectile.y = card.y;

gsap.to(projectile, { 
  x: eco.x, y: eco.y, duration: 0.6, ease: "power2.in", 
  onComplete: () => {
    app.stage.removeChild(projectile);
    // aplicar daño al Eco
  }
});
```

------------------------------------------------------------------------

## 6. Salida de la Carta (descarte)

Después de jugarla: - La carta se desvanece (`alpha: 0`) o se "quema"
con partículas. - Luego se elimina del `stage`.

**Ejemplo:**

``` ts
gsap.to(card, { alpha: 0, duration: 0.4, onComplete: () => {
  app.stage.removeChild(card);
}});
```

------------------------------------------------------------------------

## 7. Aprovechando al Máximo PixiJS

Para enriquecer aún más las interacciones con cartas:

### Shaders y Filtros Personalizados

-   **DisplacementFilter** para simular distorsión (ej. al jugar cartas
    de COR).\
-   **GlitchFilter** para alucinaciones o corrupción.\
-   **NoiseFilter** para transiciones más atmosféricas.

**Ejemplo (distorsión al jugar una carta especial):**

``` ts
const displacementSprite = Sprite.from("assets/displacement.png");
const displacementFilter = new DisplacementFilter(displacementSprite);
card.filters = [displacementFilter];
gsap.to(displacementFilter.scale, { x: 50, y: 50, duration: 0.5, yoyo: true, repeat: 1 });
```

### Partículas Optimizadas

-   Usar `ParticleContainer` para efectos masivos (chispas, fuego,
    magia).\
-   Ejemplo: al atacar con ♠, emitir partículas de energía.

``` ts
import { ParticleContainer } from "pixi.js";

const particles = new ParticleContainer(1000, { scale: true, position: true });
app.stage.addChild(particles);
```

### Graphics para Overlays

-   Dibujar en tiempo real contornos brillantes o áreas de efecto.\
-   Útil para resaltar cartas seleccionadas.

``` ts
const graphics = new Graphics();
graphics.lineStyle(4, 0x00ffcc, 1);
graphics.drawRoundedRect(card.x, card.y, card.width, card.height, 10);
app.stage.addChild(graphics);
```

------------------------------------------------------------------------

# 🚀 Resumen del Ciclo Visual

1.  **Reparto** → animación de entrada desde mazo.\
2.  **Hover** → escala + elevación.\
3.  **Selección** → resplandor + escala extra.\
4.  **Drag & Drop** → movimiento fluido con easing/inercia.\
5.  **Jugada** → efecto especial según palo.\
6.  **Salida** → fade out o partículas.\
7.  **Optimización** → uso de shaders, partículas y gráficos para
    aprovechar al máximo PixiJS.

------------------------------------------------------------------------

Este documento sirve como **guía para la IA** para implementar
interacciones visuales y animadas con las cartas en el juego,
aprovechando todas las capacidades de PixiJS.
