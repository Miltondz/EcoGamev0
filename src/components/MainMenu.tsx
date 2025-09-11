import React, { useState, useEffect } from 'react';
import { turnManager } from '../engine/TurnManager';
import { chapterManager } from '../engine/ChapterManager';
import type { ChapterConfig, ScenarioConfig } from '../engine/ChapterManager';
import { assetManager } from '../engine/AssetManager';
import { 
    colors, 
    textStyles, 
    panelStyles,
    createStoneButtonStyle,
    createCompactStoneButtonStyle,
    handleStoneButtonHover 
} from '../utils/styles';

interface MainMenuProps {
    onStartGame: () => void;
}

type MenuView = 'main' | 'chapters' | 'scenarios' | 'settings' | 'profile' | 'config';

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame }) => {
    const [hasSave, setHasSave] = useState(false);
    const [currentView, setCurrentView] = useState<MenuView>('main');
    const [, setSelectedChapter] = useState<ChapterConfig | null>(null);
    const [availableChapters, setAvailableChapters] = useState<ChapterConfig[]>([]);
    const [availableScenarios, setAvailableScenarios] = useState<ScenarioConfig[]>([]);
    const [playerProfile, setPlayerProfile] = useState(chapterManager.profile);
    const [loading, setLoading] = useState(false);
    const [backgroundImage, setBackgroundImage] = useState<string>('');
    const [scenarioPreviewImages, setScenarioPreviewImages] = useState<Record<string, string>>({});

    useEffect(() => {
        const savedGame = localStorage.getItem('ecoGameState');
        setHasSave(!!savedGame);
        
        // Initialize AssetManager with default scenario
        assetManager.setScenario('default');
        
        // Load background image
        const loadBackground = async () => {
            try {
                const assets = assetManager.getCurrentAssetPaths();
                console.log('🎨 MainMenu: Loading background...', assets.scenario.backgrounds.menu);
                
                // Try to load menu background first
                let result = await assetManager.loadImage(
                    assets.scenario.backgrounds.menu,
                    assets.scenario.backgrounds.main // fallback to main background
                );
                
                if (result.loaded) {
                    // Get the actual loaded image from cache
                    const cachedImage = assetManager.getCachedImage(assets.scenario.backgrounds.menu) ||
                                     assetManager.getCachedImage(assets.scenario.backgrounds.main);
                    
                    if (cachedImage) {
                        setBackgroundImage(cachedImage.src);
                        console.log('✅ MainMenu: Background loaded successfully');
                        return;
                    }
                }
                
                console.warn('⚠️ MainMenu: Background failed to load, using gradient fallback');
                setBackgroundImage('linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)');
                
            } catch (error) {
                console.error('❌ MainMenu: Error loading background:', error);
                setBackgroundImage('linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)');
            }
        };
        
        loadBackground();
        
        // Subscribe to chapter manager updates
        const unsubscribe = chapterManager.subscribe(() => {
            setPlayerProfile(chapterManager.profile);
            setAvailableChapters(chapterManager.availableChapters);
            setAvailableScenarios(chapterManager.availableScenarios);
        });
        
        // Initial load
        setAvailableChapters(chapterManager.availableChapters);
        setAvailableScenarios(chapterManager.availableScenarios);
        
        // Load scenario preview images
        const loadScenarioPreviews = async () => {
            const scenarios = chapterManager.availableScenarios;
            const previewPromises = scenarios.map(async (scenario) => {
                const previewPath = await assetManager.getScenarioPreviewPath(scenario.id);
                return { id: scenario.id, path: previewPath };
            });
            
            try {
                const results = await Promise.all(previewPromises);
                const previewMap: Record<string, string> = {};
                results.forEach(result => {
                    previewMap[result.id] = result.path;
                });
                setScenarioPreviewImages(previewMap);
                console.log('✅ MainMenu: Scenario previews loaded:', Object.keys(previewMap));
            } catch (error) {
                console.error('❌ MainMenu: Error loading scenario previews:', error);
            }
        };
        
        loadScenarioPreviews();
        
        return unsubscribe;
    }, []);

    const handleNewGame = () => {
        console.log('🎮 MainMenu: Iniciando nuevo juego');
        setCurrentView('chapters');
    };
    
    const handleContinueGame = () => {
        console.log('🎮 MainMenu: Continuando juego guardado');
        // Load the last played chapter if available
        if (playerProfile.currentChapter) {
            const chapter = chapterManager.availableChapters.find(c => c.id === playerProfile.currentChapter);
            if (chapter) {
                handleStartChapter(chapter);
                return;
            }
        }
        onStartGame();
    };
    
    const handleStartChapter = async (chapter: ChapterConfig) => {
        setLoading(true);
        try {
            console.log(`🎮 MainMenu: Iniciando capítulo '${chapter.name}'`);
            
            // Select chapter and load assets
            const success = await chapterManager.selectChapter(chapter.id);
            if (!success) {
                alert('Error al cargar el capítulo. Por favor, inténtalo de nuevo.');
                setLoading(false);
                return;
            }
            
            // Set asset manager scenario
            const scenario = chapterManager.currentScenarioConfig;
            if (scenario) {
                assetManager.setScenario(scenario.id);
            }
            
            // Start the game with the chapter configuration
            const gameConfig = chapterManager.getGameConfiguration();
            if (gameConfig) {
                await turnManager.startGame(gameConfig.id);
                chapterManager.startChapter();
                onStartGame();
            } else {
                throw new Error('No se pudo obtener la configuración del juego');
            }
        } catch (error) {
            console.error('Error starting chapter:', error);
            alert('Error al iniciar el capítulo. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleBackToMain = () => {
        setCurrentView('main');
        setSelectedChapter(null);
    };
    
    // Using shared style utilities from utils/styles.ts

    const renderMainMenu = () => (
        <div style={{
            textAlign: 'center',
            color: '#f1f5f9',
            padding: '40px'
        }}>
                {/* Saga Title */}
                <div style={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 900,
                    fontSize: '64px',
                    letterSpacing: '6px',
                    color: '#b69552', // --gold
                    textTransform: 'uppercase',
                    margin: 0,
                    lineHeight: 1,
                    textShadow: '0 6px 18px rgba(0,0,0,0.8)',
                    marginBottom: '18px'
                }}>
                    Crónicas del Abismo
                    <span style={{
                        display: 'block',
                        fontSize: '14px',
                        letterSpacing: '3px',
                        color: 'rgba(255,255,255,0.06)',
                        marginTop: '6px'
                    }}>Saga Principal</span>
                </div>
                
                {/* Main Title / Book Subtitle */}
                <h1 style={{
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 900,
                    fontSize: '48px',
                    margin: '0 0 6px 0',
                    color: '#b69552', // --gold
                    textShadow: '0 10px 30px rgba(0,0,0,0.85)'
                }}>Libro I, Los Susurros de Hualaihué</h1>
                
                {/* Tagline */}
                <div style={{
                    fontFamily: '"Roboto Condensed", sans-serif',
                    fontSize: '13px',
                    letterSpacing: '2px',
                    color: 'rgba(207,198,179,0.9)',
                    marginBottom: '28px'
                }}>"Las crónicas comienzan… y el abismo responde."</div>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    alignItems: 'flex-start',
                    marginTop: '48px',
                    marginLeft: '80px'
                }}>
                    {hasSave && (
                        <button 
                            style={createStoneButtonStyle()}
                            onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                            onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                            onClick={handleContinueGame}
                        >
                            Continuar Partida
                        </button>
                    )}
                    
                    <button 
                        style={createStoneButtonStyle()}
                        onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                        onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                        onClick={handleNewGame}
                    >
                        Nueva Partida
                    </button>
                    
                    <button 
                        style={createStoneButtonStyle()}
                        onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                        onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                        onClick={() => setCurrentView('profile')}
                    >
                        Perfil y Progreso
                    </button>
                    
                    <button 
                        style={createStoneButtonStyle()}
                        onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                        onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                        onClick={() => setCurrentView('scenarios')}
                    >
                        Escenarios
                    </button>
                    
                    <button 
                        style={createStoneButtonStyle()}
                        onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                        onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                        onClick={() => setCurrentView('config')}
                    >
                        Configuración
                    </button>
                </div>
        </div>
    );
    
    const renderChapterSelection = () => (
        <div style={{
            textAlign: 'center',
            color: colors.muted,
            padding: '40px',
            maxWidth: '1200px',
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: `2px solid ${colors.stone.border}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Efecto glassmorphism overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '2px',
                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
                pointerEvents: 'none'
            }} />
            
            <h2 style={{
                ...textStyles.sectionTitle,
                marginBottom: '32px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
            }}>Seleccionar Capítulo</h2>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px',
                marginBottom: '40px'
            }}>
                {availableChapters.map((chapter) => {
                    const progress = playerProfile.chaptersProgress[chapter.id];
                    const isCompleted = progress?.completed || false;
                    const bestScore = progress?.bestScore || 0;
                    const attempts = progress?.attempts || 0;
                    
                    return (
                        <div
                            key={chapter.id}
                            style={{
                                ...panelStyles.primary,
                                padding: '24px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                border: `2px solid ${colors.stone.border}`
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.gold;
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.8)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.stone.border;
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.6)';
                            }}
                            onClick={() => handleStartChapter(chapter)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{
                                    ...textStyles.subsectionTitle,
                                    margin: 0
                                }}>{chapter.name}</h3>
                                {isCompleted && (
                                    <span style={{
                                        ...textStyles.label,
                                        background: '#22c55e',
                                        color: 'white',
                                        padding: '6px 12px',
                                        borderRadius: '16px',
                                        fontSize: '12px'
                                    }}>✓ Completado</span>
                                )}
                            </div>
                            
                            <p style={{
                                ...textStyles.body,
                                marginBottom: '16px',
                                textAlign: 'left'
                            }}>{chapter.description}</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', ...textStyles.bodySmall }}>
                                <span>Dificultad: <strong style={{ color: getDifficultyColor(chapter.difficulty) }}>
                                    {chapter.difficulty.toUpperCase()}
                                </strong></span>
                                <span>Multiplicador: <strong style={{ color: colors.gold }}>x{chapter.scoreMultiplier}</strong></span>
                            </div>
                            
                            {progress && (
                                <div style={{ 
                                    ...panelStyles.secondary, 
                                    marginTop: '16px', 
                                    padding: '12px' 
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        ...textStyles.bodySmall 
                                    }}>
                                        <span>Mejor Puntuación: <strong style={{ color: '#22c55e' }}>{bestScore}</strong></span>
                                        <span>Intentos: <strong>{attempts}</strong></span>
                                    </div>
                                </div>
                            )}
                            
                            <div style={{ 
                                marginTop: '12px', 
                                ...textStyles.bodySmall
                            }}>
                                <div style={{ ...textStyles.label, fontSize: '12px', color: colors.gold, marginBottom: '6px' }}>Condiciones de Victoria:</div>
                                <ul style={{ margin: '8px 0', paddingLeft: '20px', textAlign: 'left' }}>
                                    {chapter.victoryConditions.map((condition, idx) => (
                                        <li key={idx} style={{ marginBottom: '4px' }}>{condition.description}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <button 
                style={createStoneButtonStyle()}
                onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                onClick={handleBackToMain}
            >
                ← Volver al Menú Principal
            </button>
        </div>
    );
    
    const renderProfileView = () => (
        <div style={{
            textAlign: 'center',
            color: colors.muted,
            padding: '40px',
            maxWidth: '1000px',
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: `2px solid ${colors.stone.border}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Efecto glassmorphism overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '2px',
                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
                pointerEvents: 'none'
            }} />
            
            <h2 style={{
                ...textStyles.sectionTitle,
                marginBottom: '32px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
            }}>Perfil del Jugador</h2>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <div style={{
                    ...panelStyles.primary,
                    padding: '24px'
                }}>
                    <h3 style={{ ...textStyles.subsectionTitle, marginBottom: '16px' }}>Estadísticas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        <div style={textStyles.body}>Puntuación Total: <strong style={{ color: '#22c55e' }}>{playerProfile.totalScore}</strong></div>
                        <div style={textStyles.body}>Capítulos Completados: <strong style={{ color: '#3b82f6' }}>
                            {Object.values(playerProfile.chaptersProgress).filter(p => p.completed).length}
                        </strong></div>
                        <div style={textStyles.body}>Intentos Totales: <strong style={{ color: '#f59e0b' }}>
                            {Object.values(playerProfile.chaptersProgress).reduce((sum, p) => sum + p.attempts, 0)}
                        </strong></div>
                    </div>
                </div>
                
                <div style={{
                    ...panelStyles.primary,
                    padding: '24px'
                }}>
                    <h3 style={{ ...textStyles.subsectionTitle, marginBottom: '16px' }}>Mejoras Permanentes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                        {Object.keys(playerProfile.permanentBoosts).length > 0 ? 
                            Object.entries(playerProfile.permanentBoosts).map(([stat, boost]) => (
                                <div key={stat} style={textStyles.body}>{stat}: <strong style={{ color: '#22c55e' }}>+{boost}</strong></div>
                            )) :
                            <div style={{ ...textStyles.bodySmall, fontStyle: 'italic' }}>No hay mejoras permanentes aún</div>
                        }
                    </div>
                </div>
            </div>
            
            <div style={{
                display: 'flex',
                gap: '24px',
                justifyContent: 'center',
                marginTop: '24px'
            }}>
                <button 
                    style={{
                        ...createStoneButtonStyle(),
                        width: '280px',
                        fontSize: '16px',
                        color: '#e5b880' // Slightly orange tint for warning
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.7), inset 0 -6px 12px rgba(0,0,0,0.5)';
                        e.currentTarget.style.color = '#d97706'; // Orange warning color
                        e.currentTarget.style.borderColor = 'rgba(217,119,6,0.18)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.6), inset 0 -6px 12px rgba(0,0,0,0.55)';
                        e.currentTarget.style.color = '#e5b880';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                    }}
                    onClick={() => {
                        if (confirm('¿Estás seguro de que quieres resetear todo el progreso? Esta acción no se puede deshacer.')) {
                            chapterManager.resetProgress();
                        }
                    }}
                >
                    Resetear Progreso
                </button>
                
                <button 
                    style={{
                        ...createStoneButtonStyle(),
                        width: '280px',
                        fontSize: '16px'
                    }}
                    onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                    onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                    onClick={handleBackToMain}
                >
                    ← Volver
                </button>
            </div>
        </div>
    );
    
    const renderScenariosView = () => (
        <div style={{
            textAlign: 'center',
            color: colors.muted,
            padding: '40px',
            maxWidth: '1000px',
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: `2px solid ${colors.stone.border}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Efecto glassmorphism overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '2px',
                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
                pointerEvents: 'none'
            }} />
            
            <h2 style={{
                ...textStyles.sectionTitle,
                marginBottom: '32px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
            }}>Escenarios Disponibles</h2>
            
            <div style={{
                display: 'grid',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {availableScenarios.map((scenario) => {
                    const scenarioImageUrl = scenarioPreviewImages[scenario.id] || 
                                            `/images/scenarios/${scenario.id}/preview.png`;
                    
                    return (
                        <div
                            key={scenario.id}
                            style={{
                                ...panelStyles.primary,
                                padding: '24px',
                                textAlign: 'left',
                                display: 'flex',
                                gap: '20px',
                                alignItems: 'flex-start'
                            }}
                        >
                            {/* Preview imagen del escenario */}
                            <div style={{
                                width: '300px',
                                height: '200px',
                                borderRadius: '12px',
                                backgroundImage: `url(${scenarioImageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: `3px solid ${colors.stone.border}`,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                flexShrink: 0
                            }} />
                            
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    ...textStyles.subsectionTitle,
                                    marginBottom: '12px'
                                }}>{scenario.name}</h3>
                                
                                <p style={{
                                    ...textStyles.body,
                                    marginBottom: '16px'
                                }}>{scenario.description}</p>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px',
                                    ...textStyles.bodySmall
                                }}>
                                    <div>
                                        <strong style={{ color: colors.gold }}>Estadísticas Iniciales:</strong>
                                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                            <li>Puntos de Vida: {scenario.initialPlayerStats.PV}</li>
                                            <li>Cordura: {scenario.initialPlayerStats.COR}</li>
                                            <li>Puntos de Acción: {scenario.initialPlayerStats.PA}</li>
                                            <li>Tamaño de Mano: {scenario.initialPlayerStats.handSize}</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <strong style={{ color: colors.gold }}>Configuración de Dificultad:</strong>
                                        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                                            <li>Normal: {scenario.difficultySettings.normal.ecoHP} Puntos de Vida Eco</li>
                                            <li>Difícil: {scenario.difficultySettings.hard.ecoHP} Puntos de Vida Eco</li>
                                            <li>Pesadilla: {scenario.difficultySettings.nightmare.ecoHP} Puntos de Vida Eco</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <button 
                style={createStoneButtonStyle()}
                onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                onClick={handleBackToMain}
            >
                ← Volver al Menú Principal
            </button>
        </div>
    );
    
    const renderConfigView = () => (
        <div style={{
            textAlign: 'center',
            color: colors.muted,
            padding: '40px',
            maxWidth: '800px',
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: `2px solid ${colors.stone.border}`,
            boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Efecto glassmorphism overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                width: '2px',
                background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)',
                pointerEvents: 'none'
            }} />
            
            <h2 style={{
                ...textStyles.sectionTitle,
                marginBottom: '32px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
            }}>Configuración del Juego</h2>
            
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <div style={{
                    ...panelStyles.primary,
                    padding: '24px',
                    textAlign: 'left'
                }}>
                    <h3 style={{ ...textStyles.subsectionTitle, marginBottom: '16px' }}>Configuración Visual</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Efectos de Partículas:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Activado</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Animaciones de Cartas:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Activado</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Calidad de Efectos:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Alta</button>
                        </div>
                    </div>
                </div>
                
                <div style={{
                    ...panelStyles.primary,
                    padding: '24px',
                    textAlign: 'left'
                }}>
                    <h3 style={{ ...textStyles.subsectionTitle, marginBottom: '16px' }}>Configuración de Audio</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Música de Fondo:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Activada</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Efectos de Sonido:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Activados</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Volumen General:</span>
                            <div style={{ width: '100px', height: '10px', background: colors.stone.dark, borderRadius: '5px', position: 'relative' }}>
                                <div style={{ width: '70%', height: '100%', background: colors.gold, borderRadius: '5px' }} />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style={{
                    ...panelStyles.primary,
                    padding: '24px',
                    textAlign: 'left'
                }}>
                    <h3 style={{ ...textStyles.subsectionTitle, marginBottom: '16px' }}>Configuración de Juego</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Guardado Automático:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Activado</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Confirmación de Acciones:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Activada</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={textStyles.body}>Velocidad de Animaciones:</span>
                            <button style={{
                                ...createCompactStoneButtonStyle({ width: '80px' })
                            }}>Normal</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <button 
                style={{
                    ...createStoneButtonStyle(),
                    width: '280px',
                    fontSize: '16px'
                }}
                onMouseEnter={(e) => handleStoneButtonHover(e, true)}
                onMouseLeave={(e) => handleStoneButtonHover(e, false)}
                onClick={handleBackToMain}
            >
                ← Volver al Menú Principal
            </button>
        </div>
    );
    
    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'normal': return '#22c55e';
            case 'hard': return '#f59e0b';
            case 'nightmare': return '#ef4444';
            default: return '#94a3b8';
        }
    };
    
    const renderCurrentView = () => {
        switch (currentView) {
            case 'chapters':
                return renderChapterSelection();
            case 'profile':
                return renderProfileView();
            case 'scenarios':
                return renderScenariosView();
            case 'config':
                return renderConfigView();
            default:
                return renderMainMenu();
        }
    };
    
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1280px',
            height: '720px',
            background: backgroundImage.startsWith('linear-gradient') ? 
                backgroundImage : 
                `url(${backgroundImage}) center/cover, linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto'
        }}>
            {loading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        color: '#f1f5f9',
                        fontSize: '1.5rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '16px' }}>🎮</div>
                        <div>Loading Chapter...</div>
                    </div>
                </div>
            )}
            
            {currentView === 'main' && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    color: '#94a3b8',
                    fontSize: '0.875rem'
                }}>
                    <div>ECO DEL VACÍO v1.0</div>
                    <div>Total Score: {playerProfile.totalScore}</div>
                </div>
            )}
            
            {renderCurrentView()}
        </div>
    );
};

export default MainMenu;
