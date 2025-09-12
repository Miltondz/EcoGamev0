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
import '../styles/vhs-effects.css';
import { useGameModalContext } from '../context/GameModalContext';

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
    const [scenarioPreviewImages, setScenarioPreviewImages] = useState<Record<string, string>>({});
    
    // Sistema de ventanas modales
    const { showMessage, showConfirm } = useGameModalContext();

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
                
                // Test if WebP is available
                const webpImg = new Image();
                webpImg.onload = () => {
                    setBackgroundVideo(webpPath);
                    setBackgroundImage(''); // Clear static image
                };
                
                webpImg.onerror = () => {
                    // Load static fallback
                    const staticImg = new Image();
                    staticImg.onload = () => {
                        setBackgroundImage(staticFallback);
                        setBackgroundVideo('');
                    };
                    staticImg.onerror = () => {
                        setBackgroundImage('linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)');
                        setBackgroundVideo('');
                    };
                    staticImg.src = staticFallback;
                };
                
                webpImg.src = webpPath;
                
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
            console.log(`🎮 MainMenu: Iniciando capítulo '${chapter.name}' DESDE CERO`);
            
            // IMPORTANTE: Para nueva partida, limpiar todo el estado previo
            console.log(`🧽 MainMenu: Limpiando estado previo para nueva partida`);
            
            // Select chapter and load assets
            const success = await chapterManager.selectChapter(chapter.id);
            if (!success) {
                showMessage(
                    'Error al cargar el capítulo. Por favor, inténtalo de nuevo.',
                    { 
                        title: 'Error de Carga', 
                        type: 'error',
                        buttonText: 'Entendido'
                    }
                );
                setLoading(false);
                return;
            }
            
            // Set asset manager scenario
            const scenario = chapterManager.currentScenarioConfig;
            if (scenario) {
                assetManager.setScenario(scenario.id);
            }
            
            // Start the game with the chapter configuration (sin repartir cartas)
            const gameConfig = chapterManager.getGameConfiguration();
            if (gameConfig) {
                await turnManager.startGame(gameConfig.id);
                chapterManager.startChapter();
                
                // Pasar información al App para que maneje la narrativa y luego complete el inicio
                onStartGame();
            } else {
                throw new Error('No se pudo obtener la configuración del juego');
            }
        } catch (error) {
            console.error('Error starting chapter:', error);
            showMessage(
                'Error al iniciar el capítulo. Por favor, inténtalo de nuevo.',
                { 
                    title: 'Error de Inicio', 
                    type: 'error',
                    buttonText: 'Entendido'
                }
            );
        } finally {
            setLoading(false);
        }
    };
    
    const handleBackToMain = () => {
        setCurrentView('main');
        setSelectedChapter(null);
    };
    
    // Estilo estandarizado para todas las ventanas modales
    const createModalStyle = (width: string, height: string, opacity = 0.7, allowScroll = false) => ({
        textAlign: 'center' as const,
        color: colors.muted,
        padding: '20px',
        maxWidth: width,
        maxHeight: height,
        background: `rgba(15, 23, 42, ${opacity})`,
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        border: `1px solid ${colors.stone.border}`,
        boxShadow: '0 15px 35px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)',
        position: 'relative' as const,
        overflow: allowScroll ? 'auto' as const : 'hidden' as const,
        zIndex: 15
    });
    
    // Overlay de glassmorphism para todas las ventanas
    const GlassmorphismOverlay = () => (
        <>
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
        </>
    );
    
    // Título estandarizado para todas las ventanas
    const ModalTitle = ({ children }: { children: React.ReactNode }) => (
        <h2 style={{
            ...textStyles.sectionTitle,
            fontSize: '22px',
            marginBottom: '20px',
            textShadow: '0 4px 12px rgba(0,0,0,0.8), 0 0 20px rgba(182,149,82,0.3)'
        }}>
            {children}
        </h2>
    );
    
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
        <div style={createModalStyle('800px', '420px')}>
            <GlassmorphismOverlay />
            <ModalTitle>Nueva Partida</ModalTitle>
            
            {/* Escenario seleccionado - más compacto */}
            <div style={{
                background: 'rgba(51, 65, 85, 0.6)',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: `1px solid ${colors.stone.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <div style={{ ...textStyles.label, fontSize: '11px', color: colors.gold, marginBottom: '2px' }}>ESCENARIO:</div>
                    <div style={{ ...textStyles.bodySmall, fontSize: '13px' }}>Libro I: Los Susurros de Hualaihué</div>
                </div>
                <div style={{ ...textStyles.label, fontSize: '10px', color: colors.muted, opacity: 0.7 }}>Default</div>
            </div>
            
            {/* Lista de capítulos compacta */}
            <div 
                className="modal-scroll"
                style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    paddingRight: '6px',
                    marginBottom: '16px'
                }}
            >
                {availableChapters.map((chapter) => {
                    const progress = playerProfile.chaptersProgress[chapter.id];
                    const isCompleted = progress?.completed || false;
                    const bestScore = progress?.bestScore || 0;
                    const attempts = progress?.attempts || 0;
                    
                    return (
                        <div
                            key={chapter.id}
                            style={{
                                background: 'rgba(51, 65, 85, 0.6)',
                                padding: '12px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: `1px solid ${colors.stone.border}`,
                                marginBottom: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.gold;
                                e.currentTarget.style.background = 'rgba(51, 65, 85, 0.8)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.stone.border;
                                e.currentTarget.style.background = 'rgba(51, 65, 85, 0.6)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                            onClick={() => handleStartChapter(chapter)}
                        >
                            {/* Contenido principal del capítulo */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                    <h3 style={{
                                        ...textStyles.subsectionTitle,
                                        margin: 0,
                                        fontSize: '16px'
                                    }}>{chapter.name}</h3>
                                    {isCompleted && (
                                        <span style={{
                                            background: '#22c55e',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '10px',
                                            fontWeight: 'bold'
                                        }}>✓</span>
                                    )}
                                </div>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    gap: '16px', 
                                    alignItems: 'center',
                                    ...textStyles.bodySmall,
                                    fontSize: '12px',
                                    color: colors.muted
                                }}>
                                    <span>Dif: <strong style={{ color: getDifficultyColor(chapter.difficulty) }}>
                                        {chapter.difficulty.charAt(0).toUpperCase() + chapter.difficulty.slice(1)}
                                    </strong></span>
                                    <span>x{chapter.scoreMultiplier}</span>
                                    {progress && (
                                        <span>Mejor: <strong style={{ color: '#22c55e' }}>{bestScore}</strong></span>
                                    )}
                                    {progress && (
                                        <span>Intentos: <strong>{attempts}</strong></span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Botón de acción compacto */}
                            <div style={{ 
                                alignSelf: 'center',
                                padding: '6px 12px',
                                background: 'rgba(182, 149, 82, 0.2)',
                                borderRadius: '6px',
                                border: `1px solid ${colors.gold}`,
                                fontSize: '12px',
                                color: colors.gold,
                                fontWeight: 'bold'
                            }}>
                                JUGAR
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
                <button 
                    style={{
                        ...createStoneButtonStyle(),
                        width: '200px',
                        fontSize: '14px',
                        padding: '10px 20px'
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
    
    const renderProfileView = () => (
        <div style={createModalStyle('950px', '520px')}>
            <GlassmorphismOverlay />
            <ModalTitle>Perfil del Jugador</ModalTitle>
            
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
                        showConfirm(
                            '¿Estás seguro de que quieres resetear todo el progreso? Esta acción no se puede deshacer.',
                            () => {
                                chapterManager.resetProgress();
                                showMessage(
                                    'El progreso ha sido reseteado completamente. Todos los datos de capítulos y puntuaciones han sido eliminados.',
                                    {
                                        title: 'Progreso Reseteado',
                                        type: 'success',
                                        buttonText: 'Entendido'
                                    }
                                );
                            },
                            {
                                title: 'Confirmar Reset de Progreso',
                                type: 'danger',
                                confirmText: 'Sí, Resetear',
                                cancelText: 'Cancelar'
                            }
                        );
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
        <div style={createModalStyle('900px', '500px')}>
            <GlassmorphismOverlay />
            <ModalTitle>Escenarios</ModalTitle>
            
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
                                background: 'rgba(51, 65, 85, 0.7)' // Consistente con el estilo general
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
                    background: 'rgba(51, 65, 85, 0.5)', // Menos opaco para el contenido "próximamente"
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
        <div style={createModalStyle('750px', '450px')}>
            <GlassmorphismOverlay />
            <ModalTitle>Configuración</ModalTitle>
            
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Panel único compacto con todas las configuraciones */}
                <div style={{
                    ...panelStyles.primary,
                    padding: '16px',
                    textAlign: 'left',
                    background: 'rgba(51, 65, 85, 0.7)' // Consistente con el estilo general
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
                        onError={() => {
                            // Fallback a imagen estática si el video falla al renderizar
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
            
            {/* Efectos VHS/Retro atmosféricos */}
            {backgroundVideo && (
                <div className="vhs-container">
                    {/* Scanlines VHS */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.025) 2px, rgba(255,255,255,0.025) 4px)',
                        pointerEvents: 'none',
                        zIndex: 3
                    }} />
                    
                    {/* Film grain con flicker sutil */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `
                            radial-gradient(circle at 25% 25%, rgba(255,255,255,0.01) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, rgba(255,255,255,0.008) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.006) 0%, transparent 70%)
                        `,
                        backgroundSize: '4px 4px, 6px 6px, 8px 8px',
                        opacity: 0.7,
                        pointerEvents: 'none',
                        zIndex: 4,
                        animation: 'vhsFlicker 3s infinite ease-in-out'
                    }} />
                    
                    {/* Estática muy sutil ocasional */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.008) 1px, rgba(255,255,255,0.008) 2px)',
                        pointerEvents: 'none',
                        zIndex: 5,
                        animation: 'vhsStatic 6s infinite ease-in-out'
                    }} />
                    
                    {/* Glitch ocasional muy sutil */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, rgba(255,0,100,0.015) 0%, transparent 5%, transparent 95%, rgba(0,255,255,0.015) 100%)',
                        pointerEvents: 'none',
                        zIndex: 6,
                        animation: 'vhsGlitch 12s infinite ease-in-out'
                    }} />
                    
                    {/* Atmospheric noise overlay */}
                    <div className="vhs-noise" style={{ zIndex: 7 }} />
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
