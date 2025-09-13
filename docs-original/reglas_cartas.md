
## Guía de Implementación: Motor de Reglas Dirigido por Datos para "Eco del Vacío"

### 1. Propósito y Filosofía

Este documento detalla la arquitectura de un sistema de reglas dinámico y dirigido por datos. El objetivo es desacoplar la lógica de las mecánicas de juego del código del motor, permitiendo que cada **escenario** defina no solo su narrativa y arte, sino también sus propias reglas de juego.

Esto permite a los diseñadores:
*   Crear experiencias de juego únicas para cada escenario.
*   Modificar el balance y las mecánicas sin necesidad de reprogramar el motor.
*   Añadir nuevas cartas o efectos de forma modular.

El sistema se basa en tres archivos JSON clave que cada escenario debe contener: `cards.json`, `rules.json` y `events.json`.

---

### 2. Archivos JSON y Formatos

*   **Interpretación del Motor:** El `DeckManager` usa este archivo para generar el mazo inicial al comenzar una partida. El `CardEffectEngine` consulta el `value` de una carta al resolver efectos dinámicos.



###  `rules.json`: Añadiendo Profundidad y Casos Específicos

El `rules.json` que te di es la regla "por defecto". La verdadera potencia del sistema radica en la **prioridad y especificidad**. El motor debe buscar la regla más específica primero.

**Principio de Interpretación:** El motor debe leer las reglas en orden y aplicar la **primera que coincida**. Por lo tanto, las reglas más específicas (para una carta individual, como el "AS") deben ir **antes** que las reglas generales (para un palo entero, como "spades").

Veamos un `rules.json` mucho más interesante y robusto.

#### `rules.json` (Versión Avanzada)

```json
{
  "playerActions": [
    // --- REGLAS ESPECÍFICAS (Se comprueban primero) ---
    {
      "id": "rule_ace_of_spades",
      "comment": "El As de Picas es un ataque devastador que ignora defensas y causa sangrado, pero te daña la cordura.",
      "condition": { "id": "AS" },
      "cost": 1,
      "effects": [
        { "type": "DEAL_DAMAGE", "target": "ECO", "targetStat": "HP", "value": 15, "properties": ["PIERCING"] },
        { "type": "APPLY_STATUS", "target": "ECO", "status": "BLEEDING", "duration": 3 },
        { "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 3 }
      ]
    },
    {
      "id": "rule_king_of_hearts",
      "comment": "El Rey de Corazones es una curación masiva de COR, pero requiere descartar otra carta.",
      "condition": { "id": "KH" },
      "cost": 1,
      "effects": [
        { "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 15 },
        { "type": "DISCARD_CARDS", "target": "PLAYER", "value": 1, "targetSource": "CHOICE" }
      ]
    },

    // --- REGLAS GENERALES POR PALO (Se comprueban si no hay regla específica) ---
    {
      "id": "rule_default_spades",
      "condition": { "suit": "spades" },
      "cost": 1,
      "effects": [
        { "type": "DEAL_DAMAGE", "target": "ECO", "targetStat": "HP", "value": "CARD_VALUE" }
      ]
    },
    {
      "id": "rule_default_hearts",
      "condition": { "suit": "hearts" },
      "cost": 1,
      "effects": [
        { "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": "CARD_VALUE" }
      ]
    },
    {
      "id": "rule_default_diamonds",
      "condition": { "suit": "diamonds" },
      "cost": 1,
      "effects": [
        { "type": "DRAW_CARDS", "target": "PLAYER", "value": 2 }
      ]
    },
    {
      "id": "rule_default_clubs",
      "condition": { "suit": "clubs" },
      "cost": 1,
      "effects": [
        { "type": "APPLY_STATUS", "target": "ECO", "status": "EXPOSED", "duration": -1 },
        { "type": "REPAIR_NODE", "target": "CHOICE", "value": "floor(CARD_VALUE / 7)" }
      ]
    }
  ],
  // La sección ecoAttacks puede seguir siendo simple o también tener casos específicos.
  "ecoAttacks": [
     {
      "comment": "Si el Eco roba un As, el ataque es imparable y daña ambas estadísticas.",
      "condition": { "rank": "A" },
      "effects": [
        { "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "PV", "value": "floor(CARD_VALUE / 2)" },
        { "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": "floor(CARD_VALUE / 2)" }
      ]
    },
    { "condition": { "color": "black" }, "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "PV", "value": "CARD_VALUE" }] },
    { "condition": { "color": "red" }, "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": "CARD_VALUE" }] }
  ]
}
```

**Cómo lo interpreta el motor ahora:**

1.  El jugador juega el **As de Picas (AS)**.
2.  El motor revisa `playerActions`:
3.  ¿La condición `{ "id": "AS" }` coincide? **Sí.**
4.  Aplica la regla `rule_ace_of_spades` y **deja de buscar**. No llega a la regla general de picas.
5.  El jugador juega el **10 de Picas (10S)**.
6.  El motor revisa `playerActions`:
7.  ¿La condición `{ "id": "AS" }` coincide? No.
8.  ¿La condición `{ "id": "KH" }` coincide? No.
9.  ¿La condición `{ "suit": "spades" }` coincide? **Sí.**
10. Aplica la regla `rule_default_spades`.

Este modelo te da un control total, permitiendo que la mayoría de las cartas sigan una regla simple mientras que las cartas "clave" tienen efectos únicos y memorables.

#### 2.2. `rules.json` - El Cerebro de las Mecánicas

*   **Propósito:** Define **qué hacen las cartas** cuando son jugadas por el jugador o por el Eco. Este archivo reemplaza toda la lógica de juego "hard-codeada".
*   **Formato:** Un objeto con dos arrays principales: `playerActions` y `ecoAttacks`.

##### Estructura de una Regla (Objeto dentro de los arrays):

| Clave | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | String | (Opcional) Un identificador para la regla, útil para depuración. |
| `comment` | String | (Opcional) Una descripción legible para entender el propósito de la regla. |
| `condition`| Object | **Clave.** Define qué carta activa esta regla. Puede ser por `suit`, `color` (`red`/`black`), o `id`. |
| `cost` | Number | (Solo en `playerActions`) Cuántos Puntos de Acción (PA) cuesta jugar la carta. |
| `effects` | Array | **Clave.** Una lista de uno o más efectos que se aplican cuando la regla se activa. |

##### Estructura de un Efecto (Objeto dentro del array `effects`):

| Clave | Tipo | Descripción |
| :--- | :--- | :--- |
| `type` | String | El tipo de acción a ejecutar. El motor debe tener una función para cada tipo. |
| `target` | String | A quién afecta. Valores: `PLAYER`, `ECO`, `CHOICE` (el jugador elige). |
| `targetStat`| String | (Opcional) Qué estadística se modifica. Valores: `HP`, `PV`, `COR`, etc. |
| `value` | Mixto | La magnitud del efecto. Puede ser un `Number`, `"CARD_VALUE"`, o una fórmula `String`. |

##### Tipos de Efectos (`type`) y sus Parámetros:

| `type` | Parámetros Requeridos | Descripción |
| :--- | :--- | :--- |
| `DEAL_DAMAGE` | `target`, `targetStat`, `value` | Inflige daño a una estadística. |
| `HEAL_STAT` | `target`, `targetStat`, `value` | Recupera puntos de una estadística. |
| `DRAW_CARDS` | `target`, `value` | El objetivo roba un número de cartas. |
| `APPLY_STATUS` | `target`, `status`, `duration` | Aplica un estado (ej. "EXPOSED"). `duration` en turnos, `-1` para permanente. |
| `REPAIR_NODE` | `target`, `value` | Repara un nodo. `target` suele ser `CHOICE`. |
| `DISCARD_CARDS`| `target`, `value` | El objetivo descarta un número de cartas al azar. |

*   **Interpretación del Motor:**
    1.  Cuando se juega una carta (por el jugador o el Eco), el motor recorre el array correspondiente (`playerActions` o `ecoAttacks`).
    2.  Busca la **primera regla** cuya `condition` coincida con la carta jugada.
    3.  Una vez encontrada, itera sobre su array `effects`.
    4.  Para cada efecto, el `CardEffectEngine` llama a una función interna basada en el `type`, pasándole los parámetros `target` y `value` (previamente resuelto si es `"CARD_VALUE"`).

#### 2.3. `events.json` - La Capa Narrativa y de Eventos

*   **Propósito:** Asocia cada una de las 52 cartas a un evento único que ocurre al inicio de cada turno (Fase de Evento).
*   **Formato:** Un array de 52 objetos, uno por cada carta.

| Clave | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `id` | String | El ID de la carta a la que se asocia el evento. | `"2S"` |
| `event` | String | El nombre del evento, para mostrar en la UI. | `"Fallo del sistema"` |
| `flavor`| String | Texto narrativo que describe el evento. | `"Un chispazo quema..."` |
| `effects`| Array | **Importante.** Un array de efectos, usando la **misma estructura** que en `rules.json`. | `[{ "type": "DISCARD_CARDS", ... }]` |

*   **Interpretación del Motor:**
    1.  Al inicio del turno, el `TurnManager` revela la carta superior del mazo.
    2.  Busca en el array de `events.json` el objeto cuyo `id` coincida con la carta revelada.
    3.  Muestra la información `event` y `flavor` en la UI.
    4.  Ejecuta los `effects` definidos en el evento usando el mismo `CardEffectEngine`. Esto unifica toda la resolución de efectos en un solo sistema.

---

### 3. Archivos JSON Listos para Implementar
 

#### `rules.json`
```json
{
  "playerActions": [
    {
      "comment": "Las Picas infligen daño directo al Eco.",
      "condition": { "suit": "spades" },
      "cost": 1,
      "effects": [
        {
          "type": "DEAL_DAMAGE",
          "target": "ECO",
          "targetStat": "HP",
          "value": "CARD_VALUE"
        }
      ]
    },
    {
      "comment": "Los Corazones recuperan la Cordura del jugador.",
      "condition": { "suit": "hearts" },
      "cost": 1,
      "effects": [
        {
          "type": "HEAL_STAT",
          "target": "PLAYER",
          "targetStat": "COR",
          "value": "CARD_VALUE"
        }
      ]
    },
    {
      "comment": "Los Diamantes permiten robar 2 cartas.",
      "condition": { "suit": "diamonds" },
      "cost": 1,
      "effects": [
        {
          "type": "DRAW_CARDS",
          "target": "PLAYER",
          "value": 2
        }
      ]
    },
    {
      "comment": "Los Tréboles pueden exponer al Eco O reparar nodos. La UI debe preguntar al jugador.",
      "condition": { "suit": "clubs" },
      "cost": 1,
      "effects": [
        {
          "type": "APPLY_STATUS",
          "target": "ECO",
          "status": "EXPOSED",
          "duration": -1
        },
        {
          "type": "REPAIR_NODE",
          "target": "CHOICE",
          "value": "floor(CARD_VALUE / 7)"
        }
      ]
    }
  ],
  "ecoAttacks": [
    {
      "comment": "Palos negros atacan los PV del jugador.",
      "condition": { "color": "black" },
      "effects": [
        {
          "type": "DEAL_DAMAGE",
          "target": "PLAYER",
          "targetStat": "PV",
          "value": "CARD_VALUE"
        }
      ]
    },
    {
      "comment": "Palos rojos atacan la COR del jugador.",
      "condition": { "color": "red" },
      "effects": [
        {
          "type": "DEAL_DAMAGE",
          "target": "PLAYER",
          "targetStat": "COR",
          "value": "CARD_VALUE"
        }
      ]
    }
  ]
}
```

#### `events.json`
```json
[
  { "id": "2S", "event": "Fallo del Sistema", "flavor": "Un chispazo quema los circuitos. Una de tus herramientas queda inservible.", "effects": [{ "type": "DISCARD_CARDS", "target": "PLAYER", "value": 1 }] },
  { "id": "3S", "event": "Ruido Blanco", "flavor": "La estática ahoga todos los sonidos, poniéndote en alerta.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 1 }] },
  { "id": "4S", "event": "Sombra Fugaz", "flavor": "Ves algo moverse por el rabillo del ojo, pero al girarte no hay nada.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 2 }] },
  { "id": "5S", "event": "Golpe Metálico", "flavor": "Un fuerte golpe resuena en la distancia, como si algo pesado hubiera caído.", "effects": [] },
  { "id": "6S", "event": "Herramienta Rota", "flavor": "Una pieza clave de tu equipo se rompe. Tendrás que improvisar.", "effects": [{ "type": "DISCARD_CARDS", "target": "PLAYER", "value": 1 }] },
  { "id": "7S", "event": "Corte de Energía", "flavor": "Las luces parpadean y se apagan. Te quedas a oscuras por un instante.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "PV", "value": 2 }] },
  { "id": "8S", "event": "Corrosión Acelerada", "flavor": "El metal a tu alrededor gotea y se deforma, corroyéndose a una velocidad imposible.", "effects": [] },
  { "id": "9S", "event": "Sistema Comprometido", "flavor": "Una alerta roja parpadea en una consola. Uno de los sistemas vitales ha sido dañado.", "effects": [{ "type": "DAMAGE_NODE", "target": "RANDOM", "value": 1 }] },
  { "id": "10S", "event": "El Vacío Llama", "flavor": "Por un momento, sientes un impulso irrefrenable de abandonar toda esperanza.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 4 }] },
  { "id": "JS", "event": "Aparición", "flavor": "Una figura distorsionada se materializa frente a ti antes de desvanecerse.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "PV", "value": 4 }] },
  { "id": "QS", "event": "Brecha en el Casco", "flavor": "El sonido del aire escapando te hiela la sangre. Debes sellarlo rápido.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "PV", "value": 5 }] },
  { "id": "KS", "event": "Sobrecarga del Núcleo", "flavor": "El corazón del sistema ruge, amenazando con colapsar y llevárselo todo.", "effects": [{ "type": "DAMAGE_NODE", "target": "RANDOM", "value": 2 }] },
  { "id": "AS", "event": "Presencia Directa", "flavor": "Sientes su conciencia rozando la tuya. Es una malicia fría y calculadora.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 6 }] },
  { "id": "2H", "event": "Recuerdo Agridulce", "flavor": "Un recuerdo de un tiempo más feliz te asalta, dándote un respiro.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 1 }] },
  { "id": "3H", "event": "Voluntad Férrea", "flavor": "Te concentras, apartando las dudas y el miedo. Aún no has terminado.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 2 }] },
  { "id": "4H", "event": "Pequeño Hallazgo", "flavor": "Encuentras un recurso que habías pasado por alto. Todo ayuda.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 1 }] },
  { "id": "5H", "event": "Un Momento de Calma", "flavor": "El silencio no es amenazante, sino pacífico. Aprovechas para respirar.", "effects": [] },
  { "id": "6H", "event": "Determinación", "flavor": "Recuerdas por qué luchas. El objetivo es claro y tu resolución se fortalece.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 3 }] },
  { "id": "7H", "event": "Suministros Médicos", "flavor": "Encuentras un botiquín de primeros auxilios intacto.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "PV", "value": 3 }] },
  { "id": "8H", "event": "Plan de Contingencia", "flavor": "Una idea brillante acude a tu mente. Sabes exactamente qué hacer a continuación.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 1 }] },
  { "id": "9H", "event": "Adrenalina", "flavor": "Un subidón de adrenalina despeja tu mente y agudiza tus sentidos.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 4 }] },
  { "id": "10H", "event": "Esperanza", "flavor": "Contra todo pronóstico, una pequeña llama de esperanza se enciende en tu interior.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 5 }] },
  { "id": "JH", "event": "Instinto de Supervivencia", "flavor": "Tu cuerpo reacciona antes que tu mente, esquivando un peligro que no viste.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "PV", "value": 5 }] },
  { "id": "QH", "event": "Lucidez Absoluta", "flavor": "El velo de la confusión se desvanece. Ves al Eco por lo que realmente es.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 6 }] },
  { "id": "KH", "event": "Epifanía", "flavor": "Comprendes una debilidad fundamental del Eco. Una nueva estrategia toma forma.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 2 }] },
  { "id": "AH", "event": "Momento Heroico", "flavor": "Superas el miedo y te enfrentas a la oscuridad con una fuerza que no sabías que tenías.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 8 }] },
  { "id": "2C", "event": "Dato Corrupto", "flavor": "Intentas acceder a un terminal, pero solo muestra símbolos sin sentido.", "effects": [] },
  { "id": "3C", "event": "Pista Falsa", "flavor": "Sigues una pista que resulta ser un callejón sin salida, perdiendo un tiempo valioso.", "effects": [{ "type": "DISCARD_CARDS", "target": "PLAYER", "value": 1 }] },
  { "id": "4C", "event": "Circuito Quemado", "flavor": "Huele a ozono. Un panel de control crucial está completamente frito.", "effects": [{ "type": "DAMAGE_NODE", "target": "RANDOM", "value": 1 }] },
  { "id": "5C", "event": "Registro de Datos", "flavor": "Encuentras un registro de la tripulación anterior. Sus últimas entradas son... inquietantes.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 2 }] },
  { "id": "6C", "event": "Patrón Anómalo", "flavor": "Detectas un patrón en el comportamiento del Eco. Podrías usarlo a tu favor.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 1 }] },
  { "id": "7C", "event": "Diagrama Útil", "flavor": "Encuentras un diagrama técnico que revela cómo estabilizar uno de los sistemas.", "effects": [{ "type": "REPAIR_NODE", "target": "CHOICE", "value": 1 }] },
  { "id": "8C", "event": "Frecuencia Extraña", "flavor": "Una extraña frecuencia interfiere con tus pensamientos.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 3 }] },
  { "id": "9C", "event": "Mensaje Oculto", "flavor": "Descifras un mensaje oculto en el ruido blanco. Es una advertencia.", "effects": [] },
  { "id": "10C", "event": "Fallo en Cascada", "flavor": "Un pequeño error provoca un fallo en cascada que daña varios sistemas.", "effects": [{ "type": "DAMAGE_NODE", "target": "RANDOM", "value": 2 }] },
  { "id": "JC", "event": "Conocimiento Prohibido", "flavor": "Accedes a información que no deberías saber. El conocimiento tiene un precio.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 5 }] },
  { "id": "QC", "event": "Análisis Exitoso", "flavor": "Tu análisis revela una vulnerabilidad crítica en la manifestación del Eco.", "effects": [{ "type": "APPLY_STATUS", "target": "ECO", "status": "EXPOSED", "duration": -1 }] },
  { "id": "KC", "event": "La Verdad", "flavor": "Finalmente entiendes la naturaleza del Eco, y la verdad es más aterradora que cualquier mentira.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 7 }] },
  { "id": "AC", "event": "Control Manual", "flavor": "Bypasseas los sistemas automáticos y tomas el control directo. Arriesgado, pero poderoso.", "effects": [{ "type": "REPAIR_NODE", "target": "CHOICE", "value": 2 }] },
  { "id": "2D", "event": "Recursos Contaminados", "flavor": "Lo que encuentras está cubierto de una extraña sustancia. Es inútil.", "effects": [] },
  { "id": "3D", "event": "Almacén Vacío", "flavor": "Llegas a un almacén de suministros solo para encontrarlo completamente saqueado.", "effects": [] },
  { "id": "4D", "event": "Raciones de Emergencia", "flavor": "Encuentras una caja olvidada de raciones. No es mucho, pero te reanima.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "PV", "value": 2 }] },
  { "id": "5D", "event": "Componentes Útiles", "flavor": "Encuentras algunas piezas de repuesto que podrían serte útiles más adelante.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 1 }] },
  { "id": "6D", "event": "Dilema", "flavor": "Encuentras dos objetos útiles, pero solo puedes llevar uno. La elección te desgasta.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "COR", "value": 2 }, { "type": "DRAW_CARDS", "target": "PLAYER", "value": 2 }] },
  { "id": "7D", "event": "Escondite Secreto", "flavor": "Descubres un compartimento secreto con valiosos suministros.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 2 }] },
  { "id": "8D", "event": "Trampa", "flavor": "Lo que parecía un recurso útil resulta ser una trampa dejada por el Eco.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "PV", "value": 3 }] },
  { "id": "9D", "event": "Reciclaje", "flavor": "Consigues reconvertir equipo dañado en algo funcional.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 2 }] },
  { "id": "10D", "event": "Suministros Abundantes", "flavor": "Das con un cargamento intacto. Por un momento, la escasez no es un problema.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 3 }] },
  { "id": "JD", "event": "Decisión Arriesgada", "flavor": "Te arriesgas para conseguir un recurso valioso, y sales magullado pero victorioso.", "effects": [{ "type": "DEAL_DAMAGE", "target": "PLAYER", "targetStat": "PV", "value": 3 }, { "type": "DRAW_CARDS", "target": "PLAYER", "value": 3 }] },
  { "id": "QD", "event": "Hallazgo Inesperado", "flavor": "Encuentras algo que no debería estar aquí, algo que cambia tus prioridades.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 3 }] },
  { "id": "KD", "event": "El Arsenal", "flavor": "Abres una taquilla y encuentras un arsenal de herramientas y equipo de primera.", "effects": [{ "type": "DRAW_CARDS", "target": "PLAYER", "value": 4 }] },
  { "id": "AD", "event": "La Reserva del Capitán", "flavor": "Encuentras la reserva personal del capitán. Contiene todo lo que podrías necesitar.", "effects": [{ "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "PV", "value": 5 }, { "type": "HEAL_STAT", "target": "PLAYER", "targetStat": "COR", "value": 5 }] }
]
```
 


---

### 2. `events.json`: Cómo Funciona Realmente

Tienes razón, es crucial entender la diferencia de propósito entre `rules.json` y `events.json`.

Piensa en ello de esta manera:
*   **`rules.json`**: Define las **acciones estratégicas y voluntarias** que el jugador toma durante su fase de acción. Es el "libro de reglas" del juego.
*   **`events.json`**: Define los **eventos narrativos e involuntarios** que suceden al principio de cada turno. Es el "sabor" del mundo, la historia que avanza y los obstáculos inesperados que el entorno te lanza.

#### Flujo de un Turno para Entenderlo Mejor:

**TURNO 3 COMIENZA**

**1. FASE DE EVENTO (Aquí se usa `events.json`)**
   *   El motor revela la carta superior del mazo. Digamos que es el **2 de Picas (2S)**.
   *   **Esta carta NO va a tu mano. Es consumida por el evento.**
   *   El motor busca en `events.json` la entrada con `"id": "2S"`.
   *   Encuentra: `event: "Fallo del Sistema"`, `flavor: "Un chispazo..."`, `effects: [{ "type": "DISCARD_CARDS", ... }]`.
   *   **El efecto es automático e inmediato.** La UI muestra el texto del evento, y el jugador es forzado a descartar una carta al azar de su mano. El jugador no tiene elección.
   *   La carta **2S** se va al descarte. La Fase de Evento ha terminado.

**2. FASE DE ACCIÓN DEL JUGADOR (Aquí se usa `rules.json`)**
   *   Ahora, el jugador mira las cartas que tiene en su mano (las que le quedaron después del evento).
   *   Decide jugar una carta, por ejemplo, el **Rey de Corazones (KH)**.
   *   El motor busca en `rules.json` la regla para el **KH**.
   *   Encuentra la regla `rule_king_of_hearts` y aplica sus efectos (curar 15 COR, pedir al jugador que descarte una carta).
   *   El jugador gasta sus Puntos de Acción y puede seguir jugando cartas si le quedan.

**3. FASE DE ATAQUE DEL ECO (Aquí se usa `rules.json` - `ecoAttacks`)**
   *   El Eco roba una carta. Digamos, el **As de Tréboles (AC)**.
   *   El motor busca en la sección `ecoAttacks` de `rules.json` una regla para el **AC**.
   *   Encuentra la regla específica `condition: { rank: "A" }`.
   *   El Eco te daña 7 PV y 7 COR.

**4. FASE DE MANTENIMIENTO**
   *   El jugador roba cartas hasta volver a tener su mano completa.

#### En Resumen: la Diferencia Clave

| Característica | `rules.json` | `events.json` |
| :--- | :--- | :--- |
| **Cuándo se usa** | Durante la **Fase de Acción** del Jugador y la **Fase de Ataque** del Eco. | Solo al inicio del turno, en la **Fase de Evento**. |
| **Agencia del Jugador**| **Total.** El jugador elige qué carta jugar de su mano. | **Ninguna.** El evento es aleatorio y su efecto es obligatorio. |
| **Propósito Principal** | Definir las **mecánicas** y la estrategia del juego. | Definir la **narrativa**, la atmósfera y los giros inesperados. |
| **Fuente de la Carta** | La **mano del jugador** o la que **roba el Eco** para atacar. | La carta **superior del mazo**, que se consume en el proceso. |

Espero que esta explicación detallada, junto con el `rules.json` avanzado, aclare tus dudas. Este sistema dual es muy potente porque separa claramente la estrategia del jugador de la aleatoriedad del entorno, ambos elementos clave en un juego de horror y supervivencia.