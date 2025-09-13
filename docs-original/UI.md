
Diseño de Interfaz de Usuario (UI/UX) - Eco del Vacío
=====================================================

Objetivos de Diseño
-------------------

-   Inmersión: La UI debe sumergir al jugador en la atmósfera de horror y tensión.

-   Claridad: La información crítica (PV, COR, PA, estado de nodos) debe ser siempre visible y fácil de entender.

-   Reactividad: Debe responder fluidamente a las acciones del jugador y los eventos del juego.

Pantallas y Componentes
-----------------------

### 1\. Pantalla de Inicio / Menú Principal

-   Elementos:

    -   Título del juego ("Eco del Vacío") con estilo tipográfico temático.

    -   Botón `Nueva Partida` (lleva a la selección de escenario/dificultad).

    -   Botón `Continuar` (habilita si hay una partida guardada).

    -   Botón `Opciones` (ajustes de audio, volumen).

    -   Botón `Salir`.

-   Estética: Fondos estáticos o con leve parallax que evoquen la temática (ej: una estación espacial abandonada o un paisaje rural nebuloso). Música ambiental tenue.

### 2\. Pantalla de Selección de Escenario y Dificultad

-   Elementos:

    -   Carousel o lista de escenarios disponibles (ej: "Nostromo IX", "Pueblo Costero de Chile", "Llanos de Venezuela"). Cada uno con una imagen de preview y descripción.

    -   Selector de Dificultad (Normal, Difícil, Pesadilla) con explicación de los cambios (ej: HP del Eco, severidad de eventos).

    -   Botón `Comenzar`.

-   Flujo: Al seleccionar un escenario, se carga su configuración (`scenarios/<id>/config.json`).

### 3\. Pantalla de Juego Principal (`GameBoard`)

-   Disposición:

    -   Zona Superior (~20% de altura): HUD de estado del jugador y el Eco.

    -   Zona Central (~50% de altura): Área visual para el Eco, nodos y cartas jugadas.

    -   Zona Inferior (~30% de altura): Mano del jugador.

-   Componentes del HUD Superior:

    -   Recursos del Jugador (Izquierda):

        -   Icono de Corazón + Número `PV: [20]`

        -   Icono de Cerebro + Número `COR: [20]`

        -   Icono de Rayo + Número `PA: [2]` (se resaltan los disponibles en el turno)

    -   Estado del Eco (Derecha):

        -   Barra de HP con numeración (ej: `ECO: 50/50`).

        -   Icono o texto indicando su `Fase Actual` (Vigilante, Predador, Devastador).

    -   Nodos (Centrado en la parte superior o laterales):

        -   4 iconos representando cada nodo (Reactor, Comms, Soporte Vital, Propulsión o sus equivalentes de escenario).

        -   Cada icono tiene una barra de 3 segmentos que se llenan de verde a rojo según el daño.

-   Zona Central:

    -   Visual del Eco: Una representación artística de la entidad, cuya opacidad o intensidad puede cambiar según su fase.

    -   Área de Juego: Donde se colocan físicamente las cartas jugadas por el jugador y el Eco durante sus fases. Las animaciones de ataque/efecto ocurren aquí.

    -   Botón de Fin de Turno: Claramente visible, solo interactuable en la fase correspondiente.

-   Mano del Jugador (Zona Inferior):

    -   Las cartas se muestran en abanico o en fila horizontal.

    -   Las cartas jugables se muestran con brillo o elevación, las no jugables (por coste o efecto) se atenúan.

    -   Al hacer hover sobre una carta, se slightly escala y muestra una tooltip con su efecto detallado.

    -   Se arrastran y sueltan sobre el área central para jugarlas, o se hace click con confirmación.

### 4\. Overlays y Modal

-   Modal de Evento: Cuando se roba una carta en la Fase de Evento, un modal semi-transparente ocupa el centro de la pantalla. Muestra la imagen de la carta (o una ilustración temática), el `flavor text` del evento y un botón "Continuar".

-   Log de Eventos: Una banda lateral o una zona plegable que muestra un historial de texto de las acciones más importantes ("Jugaste ♠A - infligiste 14 de daño", "El Eco te atacó - perdiste 8 COR").

-   Pantallas de Fin de Juego: Modal completo que oscurece el fondo. Muestra "Victoria" o "Derrota", un texto narrativo final (`flavor.json`) y botones para "Reintentar" o "Volver al Menú Principal".

### 5\. Efectos de Sonido (SFX) y Audio

-   SFX críticos: Sonidos distintivos para robar carta, jugar carta (diferente por palo), daño recibido, daño infligido al Eco, reparación de nodo, fin de turno.

-   Música: Capas de música ambiental que se intensifican o cambian según la fase del Eco.

-   Voces/Susurros: Efectos de audio espacializados para eventos de corrupción y alucinaciones.

### 6\. Feedback Visual

-   Daño/Curar: Las barras de PV/COR parpadean y se reducen/aumentan suavemente.

-   Cartas: Animaciones al robar (de la mesa a la mano), al jugar (de la mano al centro), y al descartar.

-   Eco: Efectos de distorsión visual o de partículas al cambiar de fase o al recibir daño masivo.

-   Alucinación: Efectos de post-procesado en pantalla (blur, cromaberration, double vision) cuando se roba una carta de alucinación o se está bajo corrupción.