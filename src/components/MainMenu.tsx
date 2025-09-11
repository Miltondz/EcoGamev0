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
    const [backgroundVideo, setBackgroundVideo] = useState<string>('');
    const [isVideoBackground, setIsVideoBackground] = useState<boolean>(false); // Para saber si es video MP4 o imagen
    const [scenarioPreviewImages, setScenarioPreviewImages] = useState<Record<string, string>>({});

    useEffect(() => {
        const savedGame = localStorage.getItem('ecoGameState');
        setHasSave(!!savedGame);
        
        // Initialize AssetManager with default scenario
        assetManager.setScenario('default');
        
        // Load background image and video
        const loadBackground = async () => {
            try {
                // Try to load WebP background animation first
                const webpPath = '/images/scenarios/default/backgrounds/menu-bg.webp';
                const staticFallback = '/images/scenarios/default/backgrounds/main-bg.png';
                
                console.log('🎨 MainMenu: Loading animated background...', webpPath);
                
                // Test if WebP is available
                const webpImg = new Image();
                webpImg.onload = () => {
                    console.log('✅ MainMenu: WebP background loaded successfully');
                    console.log('💹 MainMenu: Setting backgroundVideo to:', webpPath);
                    setBackgroundVideo(webpPath);
                    setBackgroundImage(''); // Clear static image
                    console.log('🎨 MainMenu: Background state - video:', webpPath, 'image:', '');
                };
                
                webpImg.onerror = () => {
                    console.warn('⚠️ MainMenu: WebP failed, loading static fallback...');
                    // Load static fallback
                    const staticImg = new Image();
                    staticImg.onload = () => {
                        console.log('✅ MainMenu: Static background loaded as fallback');
                        setBackgroundImage(staticFallback);
                        setBackgroundVideo('');
                    };
                    staticImg.onerror = () => {
                        console.warn('⚠️ MainMenu: All backgrounds failed, using gradient');
                        setBackgroundImage('linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)');
                        setBackgroundVideo('');
                    };
                    staticImg.src = staticFallback;
                };
                
                webpImg.src = webpPath;
                testVideo.src = videoPath;
                testVideo.load();
                
            } catch (error) {
                console.error('❌ MainMenu: Error loading background:', error);
                setBackgroundImage('linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)');
                setBackgroundVideo('');
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
            padding: '40px',
            position: 'relative',
            zIndex: 20 // Asegurar que esté por encima del video y overlay
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
                    marginLeft: '50px' // Movido más hacia la izquierda
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
            padding: '24px',
            maxWidth: '700px', // Más compacto
            maxHeight: '500px', // Límite de altura
            background: 'rgba(15, 23, 42, 0.85)', // Más transparente
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: `1px solid ${colors.stone.border}`,
            boxShadow: '0 15px 35px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'auto',
            zIndex: 15 // Asegurar que esté por encima del video
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
                fontSize: '20px',
                marginBottom: '12px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
            }}>Nueva Partida</h2>
            
            {/* Mostrar escenario seleccionado */}
            <div style={{
                background: 'rgba(51, 65, 85, 0.4)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: `1px solid ${colors.stone.border}`
            }}>
                <div style={{ ...textStyles.label, fontSize: '12px', color: colors.gold, marginBottom: '4px' }}>ESCENARIO SELECCIONADO:</div>
                <div style={{ ...textStyles.body, fontSize: '14px' }}>Libro I: Los Susurros de Hualaihué (Default)</div>
            </div>
            
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
            overflow: 'hidden',
            zIndex: 15 // Asegurar que esté por encima del video
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
            padding: '24px',
            maxWidth: '800px', // Más compacto
            maxHeight: '550px', // Límite de altura
            background: 'rgba(15, 23, 42, 0.85)', // Más transparente
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: `1px solid ${colors.stone.border}`,
            boxShadow: '0 15px 35px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'auto',
            zIndex: 15 // Asegurar que esté por encima del video
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
                fontSize: '20px',
                marginBottom: '16px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
            }}>Escenarios</h2>
            
            <div style={{
                display: 'grid',
                gap: '16px', // Más compacto
                marginBottom: '20px'
            }}>
                {availableScenarios.map((scenario) => {
                    const scenarioImageUrl = scenarioPreviewImages[scenario.id] || 
                                            `/images/scenarios/${scenario.id}/preview.png`;
                    
                    return (
                        <div
                            key={scenario.id}
                            style={{
                                ...panelStyles.primary,
                                padding: '16px', // Más compacto
                                textAlign: 'left',
                                display: 'flex',
                                gap: '16px', // Más compacto
                                alignItems: 'flex-start',
                                background: 'rgba(51, 65, 85, 0.4)' // Más transparente
                            }}
                        >
                            {/* Preview imagen del escenario - más pequeña */}
                            <div style={{
                                width: '180px', // Más pequeña
                                height: '120px', // Más pequeña
                                borderRadius: '8px',
                                backgroundImage: `url(${scenarioImageUrl})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                border: `2px solid ${colors.stone.border}`,
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                flexShrink: 0
                            }} />
                            
                            <div style={{ flex: 1 }}>
                                <h3 style={{
                                    ...textStyles.subsectionTitle,
                                    fontSize: '16px', // Más pequeño
                                    marginBottom: '8px'
                                }}>{scenario.name}</h3>
                                
                                <p style={{
                                    ...textStyles.bodySmall, // Más pequeño
                                    marginBottom: '12px'
                                }}>{scenario.description}</p>
                                
                                <div style={{
                                    display: 'flex',
                                    gap: '20px',
                                    fontSize: '12px'
                                }}>
                                    <div>
                                        <strong style={{ color: colors.gold }}>Inicial:</strong> PV:{scenario.initialPlayerStats.PV} COR:{scenario.initialPlayerStats.COR}
                                    </div>
                                    <div>
                                        <strong style={{ color: colors.gold }}>Eco HP:</strong> {scenario.difficultySettings.normal.ecoHP}/{scenario.difficultySettings.hard.ecoHP}/{scenario.difficultySettings.nightmare.ecoHP}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                
                {/* Escenario Próximamente */}
                <div style={{
                    ...panelStyles.primary,
                    padding: '16px',
                    textAlign: 'left',
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'center',
                    background: 'rgba(51, 65, 85, 0.2)', // Más transparente
                    border: '2px dashed rgba(182, 149, 82, 0.3)', // Borde punteado
                    opacity: 0.7
                }}>
                    <div style={{
                        width: '180px',
                        height: '120px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, rgba(182, 149, 82, 0.1) 0%, rgba(51, 65, 85, 0.2) 100%)',
                        border: `1px solid ${colors.stone.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        flexShrink: 0
                    }}>
                        🕒
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            ...textStyles.subsectionTitle,
                            fontSize: '16px',
                            marginBottom: '8px',
                            color: colors.gold
                        }}>Libro II: Próximamente</h3>
                        
                        <p style={{
                            ...textStyles.bodySmall,
                            fontStyle: 'italic',
                            color: colors.muted
                        }}>Nuevas locaciones, mecánicas y desafíos están en desarrollo. Mantente atento a futuras actualizaciones de Crónicas del Abismo.</p>
                    </div>
                </div>
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
            padding: '24px',
            maxWidth: '600px', // Más compacto
            maxHeight: '500px', // Límite de altura
            background: 'rgba(15, 23, 42, 0.85)', // Más transparente
            backdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: `1px solid ${colors.stone.border}`,
            boxShadow: '0 15px 35px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'auto' // Scroll si es necesario
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
                fontSize: '20px', // Más pequeño
                marginBottom: '16px',
                textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
            }}>Configuración</h2>
            
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px', // Más compacto
                marginBottom: '20px'
            }}>
                {/* Panel único compacto con todas las configuraciones */}
                <div style={{
                    ...panelStyles.primary,
                    padding: '16px',
                    textAlign: 'left',
                    background: 'rgba(51, 65, 85, 0.4)' // Más transparente
                }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Columna Izquierda - Visual y Audio */}
                        <div>
                            <h4 style={{ ...textStyles.label, color: colors.gold, marginBottom: '8px', fontSize: '14px' }}>Visual & Audio</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Efectos PixiJS:</span>
                                    <button style={{ ...createCompactStoneButtonStyle({ width: '60px', fontSize: '11px' }) }}>ON</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Animaciones:</span>
                                    <button style={{ ...createCompactStoneButtonStyle({ width: '60px', fontSize: '11px' }) }}>ON</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Música:</span>
                                    <button style={{ ...createCompactStoneButtonStyle({ width: '60px', fontSize: '11px' }) }}>ON</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Volumen:</span>
                                    <div style={{ width: '60px', height: '6px', background: colors.stone.dark, borderRadius: '3px' }}>
                                        <div style={{ width: '70%', height: '100%', background: colors.gold, borderRadius: '3px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Columna Derecha - Gameplay */}
                        <div>
                            <h4 style={{ ...textStyles.label, color: colors.gold, marginBottom: '8px', fontSize: '14px' }}>Gameplay</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Auto-Save:</span>
                                    <button style={{ ...createCompactStoneButtonStyle({ width: '60px', fontSize: '11px' }) }}>ON</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Confirmaciones:</span>
                                    <button style={{ ...createCompactStoneButtonStyle({ width: '60px', fontSize: '11px' }) }}>ON</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Velocidad:</span>
                                    <button style={{ ...createCompactStoneButtonStyle({ width: '60px', fontSize: '11px' }) }}>1x</button>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>Dificultad:</span>
                                    <button style={{ ...createCompactStoneButtonStyle({ width: '60px', fontSize: '11px' }) }}>Normal</button>
                                </div>
                            </div>
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
            background: backgroundVideo ? 
                'transparent' : // Si hay video, no usar background estático
                backgroundImage.startsWith('linear-gradient') ? 
                    backgroundImage : 
                    backgroundImage ? `url(${backgroundImage}) center/cover, linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)` :
                    'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'auto'
        }}>
            {/* Background WebP animado */}
            {backgroundVideo && (
                <>
                    {/* Intentar con img primero */}
                    <img 
                        src={backgroundVideo}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            zIndex: 1,
                            opacity: 0.8 // Un poco más visible
                        }}
                        alt="Animated Background"
                        onLoad={() => console.log('✅ MainMenu: WebP image rendered successfully')}
                        onError={(e) => {
                            console.error('❌ MainMenu: WebP image failed to render:', e);
                            // Intentar cargar la imagen estática como backup
                            setBackgroundVideo('');
                            setBackgroundImage('/images/scenarios/default/backgrounds/main-bg.png');
                        }}
                    />
                    {/* Overlay sutil para mejorar legibilidad */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)',
                        zIndex: 2
                    }} />
                </>
            )}
            
            {/* Debug info */}
            {import.meta.env.DEV && (
                <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '20px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    fontSize: '12px',
                    zIndex: 50
                }}>
                    <div>backgroundVideo: {backgroundVideo || 'none'}</div>
                    <div>backgroundImage: {backgroundImage || 'none'}</div>
                </div>
            )}
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
                    fontSize: '0.875rem',
                    zIndex: 10 // Asegurar que esté por encima del video
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
