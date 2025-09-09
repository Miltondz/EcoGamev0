# 🎨 Debug Colors Guide

## Layout Regions Color Coding

### **🔵 BLUE - HUD Zone (Top)**
- **Location**: Top 20% of screen
- **Color**: Blue background with blue border
- **Label**: "HUD ZONE"
- **Purpose**: Statistics and game info area

### **🟢 GREEN - Central Game Area**
- **Location**: Middle section, full width
- **Color**: Green background with green border  
- **Contains**: Player area, Play zone, Eco area
- **Purpose**: Main game interaction zone

### **🟡 YELLOW - Player Area (Left)**
- **Location**: Left side of central zone
- **Color**: Yellow background with yellow border
- **Label**: "SURVIVOR" 
- **Purpose**: Player character representation

### **🟣 PURPLE - Play Area (Center)**
- **Location**: Center of central zone
- **Color**: Purple background with purple border
- **Label**: "PLAY ZONE" with sword icon
- **Purpose**: Card interaction area

### **🔴 RED - Eco Area (Right)**
- **Location**: Right side of central zone  
- **Color**: Red background with red border
- **Label**: "ECO - VIGILANTE"
- **Purpose**: Enemy/Eco representation

### **🟠 ORANGE - Hand & Controls Zone (Bottom)**
- **Location**: Bottom 30% of screen
- **Color**: Orange background with orange border
- **Label**: "HAND & CONTROLS ZONE"
- **Purpose**: Player cards and action buttons

## Debug Elements

### **🟡 PINK - TempStats (Top Left)**
- **Location**: Fixed position top-left
- **Color**: Pink background with pink border
- **Label**: "DEBUG STATS"
- **Purpose**: Real-time game state information

### **🔷 CYAN - App Active Indicator (Top Right)**
- **Location**: Fixed position top-right  
- **Color**: Cyan background with cyan border
- **Label**: "APP.TSX ACTIVE"
- **Purpose**: Confirm React app is running

## What You Should See

If everything is working correctly, you should see:

1. **Blue bar** at the top with "HUD ZONE"
2. **Green background** for the main game area
3. **Yellow box** on the left with "SURVIVOR"
4. **Purple box** in the center with "PLAY ZONE ⚔️"
5. **Red box** on the right with "ECO - VIGILANTE"
6. **Orange bar** at the bottom with "HAND & CONTROLS ZONE"
7. **Pink debug box** top-left with stats
8. **Cyan indicator** top-right confirming app is active

## Troubleshooting

- **Missing colors**: CSS/Tailwind not loading
- **No layout**: GameLayout component not rendering
- **Only some zones**: Specific component issues
- **No debug boxes**: Components not mounting

---

*Remove this file and color coding once layout is confirmed working*
