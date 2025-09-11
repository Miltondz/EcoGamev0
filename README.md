# 🌊 Crónicas del Abismo
## Libro I: Los Susurros de Hualaihué
*Un juego de cartas de horror roguelike desarrollado con tecnologías web de vanguardia*

![Game Screenshot](public/images/scenarios/default/backgrounds/main-bg.png)

---

## 📖 **Acerca del Proyecto**

**Crónicas del Abismo** es una serie épica de juegos de cartas de horror psicológico que combina mecánicas roguelike con narrativa inmersiva. Esta primera entrega, **"Los Susurros de Hualaihué"**, transporta a los jugadores a las costas chilenas donde deben sobrevivir contra una entidad ancestral conocida como "El Eco" mientras gestionan recursos críticos, reparan sistemas dañados y mantienen su cordura en un ambiente marítimo claustrofóbico.

### 🎯 **Concepto Central**
Utilizando una baraja estándar de 52 cartas, cada palo representa una habilidad diferente del superviviente:
- **♠ Picas**: Tecnología naval y combate directo
- **♥ Corazones**: Voluntad marinera y resistencia psicológica  
- **♣ Tréboles**: Ingeniería marítima e investigación
- **♦ Diamantes**: Recursos náuticos y exploración costera

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
