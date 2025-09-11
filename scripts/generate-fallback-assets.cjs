// scripts/generate-fallback-assets.js

const fs = require('fs');
const path = require('path');

// Canvas simulation using simple SVG generation (works without dependencies)
function generateSVGImage(width, height, content, backgroundColor = '#333333') {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="${backgroundColor}" stroke="#666666" stroke-width="2"/>
    ${content}
</svg>`;
}

function createDirectoryIfNotExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dirPath}`);
    }
}

function writeImageFile(filePath, svgContent) {
    try {
        fs.writeFileSync(filePath, svgContent);
        console.log(`✅ Generated: ${filePath}`);
    } catch (error) {
        console.error(`❌ Failed to generate: ${filePath}`, error.message);
    }
}

function generateCardZoomBg() {
    const content = `
        <rect x="10" y="10" width="${200-20}" height="${260-20}" 
              fill="rgba(30, 41, 59, 0.8)" stroke="#3b82f6" stroke-width="3" rx="12"/>
        <text x="100" y="140" text-anchor="middle" fill="#f1f5f9" font-family="Arial" font-size="14">
            CARD ZOOM
        </text>
    `;
    return generateSVGImage(200, 260, content, 'rgba(0,0,0,0.5)');
}

function generateGlowEffect() {
    const content = `
        <defs>
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.8"/>
                <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#d97706" stop-opacity="0.1"/>
            </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#glow)"/>
        <text x="32" y="36" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="8">
            GLOW
        </text>
    `;
    return generateSVGImage(64, 64, content, 'transparent');
}

function generateProjectile() {
    const content = `
        <defs>
            <linearGradient id="projectileGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ef4444"/>
                <stop offset="100%" stop-color="#dc2626"/>
            </linearGradient>
        </defs>
        <ellipse cx="16" cy="8" rx="14" ry="6" fill="url(#projectileGrad)"/>
        <polygon points="2,8 14,4 14,12" fill="#b91c1c"/>
    `;
    return generateSVGImage(32, 16, content, 'transparent');
}

function generateParticles() {
    const content = `
        <circle cx="8" cy="8" r="2" fill="#fbbf24"/>
        <circle cx="24" cy="12" r="1.5" fill="#f59e0b"/>
        <circle cx="16" cy="20" r="1" fill="#d97706"/>
        <circle cx="4" cy="24" r="1.5" fill="#fbbf24"/>
        <circle cx="28" cy="4" r="1" fill="#f59e0b"/>
        <circle cx="12" cy="28" r="2" fill="#d97706"/>
    `;
    return generateSVGImage(32, 32, content, 'transparent');
}

function generateMissingCard() {
    const content = `
        <rect x="5" y="5" width="${70-10}" height="${98-10}" 
              fill="#1e293b" stroke="#475569" stroke-width="2" rx="4"/>
        <text x="35" y="35" text-anchor="middle" fill="#cbd5e1" font-family="Arial" font-size="10">
            MISSING
        </text>
        <text x="35" y="50" text-anchor="middle" fill="#cbd5e1" font-family="Arial" font-size="10">
            CARD
        </text>
        <text x="35" y="70" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="8">
            ?
        </text>
    `;
    return generateSVGImage(70, 98, content, '#0f172a');
}

function generateMissingEvent() {
    const content = `
        <rect x="10" y="10" width="${280-20}" height="${392-20}" 
              fill="#1e293b" stroke="#475569" stroke-width="4" rx="8"/>
        <text x="140" y="140" text-anchor="middle" fill="#cbd5e1" font-family="Arial" font-size="24">
            MISSING EVENT
        </text>
        <text x="140" y="200" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="16">
            Event image not found
        </text>
        <circle cx="140" cy="280" r="30" fill="none" stroke="#475569" stroke-width="3"/>
        <text x="140" y="290" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="36">
            ?
        </text>
    `;
    return generateSVGImage(280, 392, content, '#0f172a');
}

function generateNodeIcons() {
    const content = `
        <!-- Reactor Node -->
        <g transform="translate(10,10)">
            <circle cx="22" cy="22" r="20" fill="#22c55e" stroke="#16a34a" stroke-width="2"/>
            <circle cx="22" cy="22" r="8" fill="#16a34a"/>
            <text x="22" y="28" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="6">⚛</text>
        </g>
        
        <!-- Communications Node -->
        <g transform="translate(55,10)">
            <circle cx="22" cy="22" r="20" fill="#3b82f6" stroke="#2563eb" stroke-width="2"/>
            <text x="22" y="28" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="10">📡</text>
        </g>
        
        <!-- Life Support Node -->
        <g transform="translate(10,55)">
            <circle cx="22" cy="22" r="20" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
            <text x="22" y="28" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="10">💓</text>
        </g>
        
        <!-- Propulsion Node -->
        <g transform="translate(55,55)">
            <circle cx="22" cy="22" r="20" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
            <text x="22" y="28" text-anchor="middle" fill="#ffffff" font-family="Arial" font-size="10">🚀</text>
        </g>
    `;
    return generateSVGImage(100, 100, content, '#1e293b');
}

function generateMainBg() {
    const content = `
        <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e293b"/>
                <stop offset="50%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#020617"/>
            </linearGradient>
        </defs>
        <rect width="1280" height="800" fill="url(#bgGrad)"/>
        
        <!-- Atmospheric elements -->
        <circle cx="200" cy="150" r="100" fill="rgba(59, 130, 246, 0.1)"/>
        <circle cx="1000" cy="600" r="150" fill="rgba(168, 85, 247, 0.1)"/>
        <circle cx="600" cy="300" r="80" fill="rgba(34, 197, 94, 0.1)"/>
        
        <!-- Grid overlay -->
        <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(148, 163, 184, 0.1)" stroke-width="1"/>
            </pattern>
        </defs>
        <rect width="1280" height="800" fill="url(#grid)"/>
        
        <text x="640" y="400" text-anchor="middle" fill="rgba(241, 245, 249, 0.1)" font-family="Arial" font-size="48">
            ECO DEL VACÍO
        </text>
    `;
    return generateSVGImage(1280, 800, content);
}

function generatePlayerPortrait() {
    const content = `
        <defs>
            <linearGradient id="portraitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4a5568"/>
                <stop offset="100%" stop-color="#2d3748"/>
            </linearGradient>
        </defs>
        <rect width="180" height="350" fill="url(#portraitGrad)"/>
        
        <!-- Silhouette -->
        <ellipse cx="90" cy="100" rx="40" ry="50" fill="#1a202c"/>
        <rect x="50" y="140" width="80" height="120" fill="#1a202c" rx="10"/>
        
        <!-- Details -->
        <text x="90" y="280" text-anchor="middle" fill="#cbd5e1" font-family="Arial" font-size="16">
            PLAYER
        </text>
        <text x="90" y="320" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="12">
            Portrait
        </text>
    `;
    return generateSVGImage(180, 350, content);
}

function generateEcoPortrait(type) {
    const colors = {
        vigilante: { primary: '#22c55e', secondary: '#16a34a', name: 'VIGILANTE' },
        predator: { primary: '#f59e0b', secondary: '#d97706', name: 'PREDATOR' },
        devastator: { primary: '#ef4444', secondary: '#dc2626', name: 'DEVASTATOR' }
    };
    
    const color = colors[type];
    const content = `
        <defs>
            <radialGradient id="ecoGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="${color.primary}"/>
                <stop offset="100%" stop-color="${color.secondary}"/>
            </radialGradient>
        </defs>
        <rect width="180" height="350" fill="#0f172a"/>
        
        <!-- Eco Entity -->
        <ellipse cx="90" cy="175" rx="60" ry="80" fill="url(#ecoGrad)" opacity="0.8"/>
        <circle cx="90" cy="140" r="25" fill="${color.primary}" opacity="0.9"/>
        
        <!-- Energy effects -->
        <circle cx="70" cy="120" r="8" fill="${color.primary}" opacity="0.6"/>
        <circle cx="110" cy="160" r="6" fill="${color.primary}" opacity="0.7"/>
        <circle cx="90" cy="200" r="10" fill="${color.secondary}" opacity="0.5"/>
        
        <text x="90" y="300" text-anchor="middle" fill="#f1f5f9" font-family="Arial" font-size="14">
            ECO
        </text>
        <text x="90" y="320" text-anchor="middle" fill="${color.primary}" font-family="Arial" font-size="12">
            ${color.name}
        </text>
    `;
    return generateSVGImage(180, 350, content);
}

function generateHudBackground() {
    const content = `
        <defs>
            <linearGradient id="hudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="rgba(30, 41, 59, 0.8)"/>
                <stop offset="100%" stop-color="rgba(15, 23, 42, 0.9)"/>
            </linearGradient>
        </defs>
        <rect width="200" height="150" fill="url(#hudGrad)" stroke="rgba(59, 130, 246, 0.3)" stroke-width="2" rx="8"/>
        
        <text x="100" y="80" text-anchor="middle" fill="#cbd5e1" font-family="Arial" font-size="14">
            HUD
        </text>
        <text x="100" y="100" text-anchor="middle" fill="#64748b" font-family="Arial" font-size="10">
            Background
        </text>
    `;
    return generateSVGImage(200, 150, content);
}

// Main generation function
function generateAllAssets() {
    console.log('🎨 Generating fallback assets...\n');
    
    // Create directories
    const directories = [
        'public/images/ui',
        'public/images/effects', 
        'public/images/scenarios/default/backgrounds',
        'public/images/scenarios/default/characters',
        'public/images/scenarios/default/eco',
        'public/images/scenarios/default/ui',
        'public/images/scenarios/default/cards',
        'public/images/scenarios/default/events'
    ];
    
    directories.forEach(createDirectoryIfNotExists);
    
    // Generate UI assets
    if (!fs.existsSync('public/images/ui/card-zoom-bg.svg')) {
        writeImageFile('public/images/ui/card-zoom-bg.svg', generateCardZoomBg());
    }
    
    // Generate effects
    if (!fs.existsSync('public/images/effects/glow-effect.svg')) {
        writeImageFile('public/images/effects/glow-effect.svg', generateGlowEffect());
    }
    if (!fs.existsSync('public/images/effects/projectile.svg')) {
        writeImageFile('public/images/effects/projectile.svg', generateProjectile());
    }
    if (!fs.existsSync('public/images/effects/particles.svg')) {
        writeImageFile('public/images/effects/particles.svg', generateParticles());
    }
    
    // Generate scenario assets
    if (!fs.existsSync('public/images/scenarios/default/backgrounds/main-bg.svg')) {
        writeImageFile('public/images/scenarios/default/backgrounds/main-bg.svg', generateMainBg());
    }
    
    if (!fs.existsSync('public/images/scenarios/default/characters/player-portrait.svg')) {
        writeImageFile('public/images/scenarios/default/characters/player-portrait.svg', generatePlayerPortrait());
    }
    
    // Generate Eco portraits
    ['vigilante', 'predator', 'devastator'].forEach(type => {
        const filename = `public/images/scenarios/default/eco/eco-${type}.svg`;
        if (!fs.existsSync(filename)) {
            writeImageFile(filename, generateEcoPortrait(type));
        }
    });
    
    if (!fs.existsSync('public/images/scenarios/default/ui/node-icons.svg')) {
        writeImageFile('public/images/scenarios/default/ui/node-icons.svg', generateNodeIcons());
    }
    
    if (!fs.existsSync('public/images/scenarios/default/ui/hud-background.svg')) {
        writeImageFile('public/images/scenarios/default/ui/hud-background.svg', generateHudBackground());
    }
    
    // Generate missing card and event placeholders
    if (!fs.existsSync('public/images/scenarios/default/cards/missing-card.svg')) {
        writeImageFile('public/images/scenarios/default/cards/missing-card.svg', generateMissingCard());
    }
    
    if (!fs.existsSync('public/images/scenarios/default/events/missing-event.svg')) {
        writeImageFile('public/images/scenarios/default/events/missing-event.svg', generateMissingEvent());
    }
    
    console.log('\n✅ Fallback asset generation complete!');
    console.log('💡 Note: SVG assets generated. For production, consider converting to PNG for better browser compatibility.');
}

// Run if called directly
if (require.main === module) {
    generateAllAssets();
}

module.exports = { generateAllAssets };
