#Estructura de Carpetas para Escenarios

scenarios/
└── [nombre_del_escenario]/
    ├── config.json
    ├── nodes.json
    ├── eco.json
    ├── events.json
    ├── flavor.json
    ├── art/
    │   ├── backgrounds/
    │   │   └── [nombre_fondo].jpg/png
    │   ├── cards/
    │   │   └── [suit]/
    │   │       ├── [rank].png
    │   │       └── ...
    │   ├── ui/
    │   │   ├── hud_theme.png
    │   │   └── card_back.png
    │   └── eco/
    │       ├── vigilante.png
    │       ├── predador.png
    │       └── devastador.png
    └── audio/
        ├── ambient/
        │   └── [sonido_ambiental].ogg
        └── music/
            └── [tema_musical].ogg


Guía de Interpretación de Archivos de Escenario para IA
=======================================================

Propósito de este Documento
---------------------------

Esta guía explica cómo el motor del juego debe interpretar y utilizar los archivos de configuración de escenarios en "Eco del Vacío". Los archivos JSON permiten la creación de experiencias de juego únicas para diferentes escenarios sin modificar el código base.

Archivos de Configuración y su Uso
----------------------------------

### 1\. config.json

Propósito: Define los parámetros básicos del escenario.

Estructura:

json

{
  "id": "chile",
  "name": "Caleta Hualaihué",
  "description": "Descripción narrativa del escenario",
  "initialPlayerStats": {
    "PV": 20,
    "COR": 20,
    "PA": 2,
    "handSize": 5
  },
  "initialEcoHP": 50,
  "difficultySettings": {
    "normal": { "ecoHP": 50 },
    "hard": { "ecoHP": 70 },
    "nightmare": { "ecoHP": 100 }
  },
  "art": {
    "background": "art/backgrounds/caleta_hualaique.jpg",
    "cardBack": "art/cards/back_chile.png",
    "hudTheme": "art/ui/hud_wood.png"
  },
  "audio": {
    "ambientSound": "audio/ambient/chile_waves_fog.ogg",
    "music": "audio/music/chile_theme.ogg"
  }
}

Interpretación para la IA:

-   Cargar estos valores al inicializar el escenario

-   Aplicar configuraciones de dificultad según la selección del jugador

-   Cargar recursos de arte y audio desde las rutas especificadas

### 2\. nodes.json

Propósito: Define los nodos disponibles en el escenario y sus propiedades.

Estructura:

json

[
  {
    "id": "faro",
    "name": "Faro de la Península",
    "description": "Descripción del nodo",
    "maxDamage": 3,
    "repairThreshold": 7,
    "reward": {
      "type": "PA",
      "amount": 1
    }
  }
]

Interpretación para la IA:

-   Crear instancias de nodos con estas propiedades

-   Utilizar `repairThreshold` para determinar la dificultad de reparación

-   Aplicar recompensas cuando los nodos sean reparados completamente

### 3\. eco.json

Propósito: Define el comportamiento y características del Eco para este escenario.

Estructura:

json

{
  "id": "eco_chile",
  "name": "El Susurro del Mar",
  "description": "Descripción narrativa del Eco",
  "phases": {
    "vigilante": {
      "threshold": 60,
      "description": "Comportamiento en esta fase",
      "effects": ["basic_attack"]
    },
    "predador": {
      "threshold": 25,
      "description": "Comportamiento en esta fase",
      "effects": ["basic_attack", "spawn_manifestation", "insert_hallucination"]
    },
    "devastador": {
      "threshold": 0,
      "description": "Comportamiento en esta fase",
      "effects": ["enhanced_attack", "corrupt", "insert_hallucination"]
    }
  }
}

Interpretación para la IA:

-   Cambiar el comportamiento del Eco según su HP actual y los umbrales definidos

-   Aplicar efectos específicos para cada fase

-   Actualizar la descripción y apariencia según la fase actual

### 4\. events.json

Propósito: Define los eventos asociados a cada carta del mazo.

Estructura:

json

[
  {
    "id": "2S",
    "suit": "spades",
    "rank": "2",
    "event": "Red de Pesca Rota",
    "effect": "Descarta 1 carta al azar.",
    "flavor": "Texto narrativo del evento"
  }
]

Interpretación para la IA:

-   Asociar cada carta con su evento correspondiente durante la fase de evento

-   Resolver efectos mecánicos basados en la propiedad "effect"

-   Mostrar texto de flavor para inmersión narrativa

### 5\. flavor.json

Propósito: Proporciona texto narrativo para varios momentos del juego.

Estructura:

json

{
  "intro": "Texto de introducción al escenario",
  "victory": "Texto al ganar el juego",
  "defeat": "Texto al perder el juego",
  "hallucinations": [
    "Texto de alucinación 1",
    "Texto de alucinación 2"
  ]
}

Interpretación para la IA:

-   Mostrar el texto de introducción al cargar el escenario

-   Usar textos de victoria/derrota apropiados al final del juego

-   Seleccionar aleatoriamente textos de alucinación durante eventos de corrupción

Flujo de Carga e Interpretación
-------------------------------

### 1\. Inicialización del Escenario

-   Cargar `config.json` para obtener configuración base

-   Cargar `nodes.json` y crear instancias de nodos

-   Cargar `eco.json` y configurar el comportamiento del Eco

-   Cargar `events.json` para mapear cartas a eventos

-   Cargar `flavor.json` para texto narrativo

### 2\. Durante el Juego

-   Consultar `events.json` durante la fase de evento para resolver efectos

-   Verificar `eco.json` para determinar el comportamiento del Eco según su HP

-   Usar `flavor.json` para contenido narrativo en momentos específicos

### 3\. Gestión de Recursos

-   Cargar assets de arte desde las rutas especificadas en `config.json`

-   Cargar y reproducir audio según la configuración

Mecanismos de Resolución
------------------------

### Eventos de Cartas

-   Al robar una carta en la fase de evento, buscar su ID en `events.json`

-   Interpretar la propiedad "effect" y aplicar el efecto correspondiente:

    -   "Descarta X carta(s)" → descartar cartas de la mano

    -   "Inflige X daño" → reducir PV del Eco

    -   "Recupera X COR" → aumentar cordura del jugador

    -   "Repara X nodo" → reducir daño de un nodo

### Comportamiento del Eco

-   Monitorear el HP del Eco continuamente

-   Cambiar de fase cuando el HP cruce los umbrales definidos en `eco.json`

-   Ejecutar efectos asociados a la fase actual

### Sistema de Nodos

-   Monitorear el daño de cada nodo

-   Aplicar recompensas cuando un nodo alcanza 0 de daño

-   Verificar condiciones de derrota si todos los nodos alcanzan daño máximo

Consideraciones de Implementación
---------------------------------

### Manejo de Errores

-   Verificar la existencia de todos los archivos requeridos

-   Validar la estructura de cada archivo JSON

-   Proporcionar valores por defecto para propiedades faltantes

### Optimización

-   Precargar assets al iniciar el escenario

-   Cachear archivos JSON para acceso rápido

-   Liberar recursos al cambiar de escenario

### Extensibilidad

-   Diseñar el sistema para permitir fácil adición de nuevos escenarios

-   Mantener una estructura consistente en todos los archivos JSON

-   Documentar formatos para creadores de contenido