# Times Table Blaster - Game Specification

## Overview

Times Table Blaster is an arcade-style educational game designed to help players practice multiplication facts in an engaging, fast-paced environment. Players must solve falling multiplication problems by typing answers and launching missiles to destroy them before they reach the bottom of the screen.

---

## Game Concept

**Genre:** Educational Arcade / Typing Shooter  
**Target Audience:** Students learning multiplication (ages 6-12), or anyone wanting to sharpen mental math skills  
**Platform:** Web browser (React-based)  
**Single Session Duration:** 3-10 minutes depending on skill level

---

## Core Gameplay Loop

1. Multiplication problems fall from the top of the screen
2. Player types the answer to any visible problem
3. Player presses Enter (or clicks Fire) to launch a missile
4. If the answer matches a problem, the missile tracks toward it and destroys it
5. If the answer doesn't match any problem, a "wrong answer" effect triggers
6. Problems that reach the bottom cost the player a life
7. Game ends when all lives are lost

---

## Game States

| State | Description |
|-------|-------------|
| **Menu** | Configuration screen where players select times tables and start the game |
| **Playing** | Active gameplay with falling problems and player input |
| **Game Over** | End screen displaying final score, level reached, and options to replay or return to menu |

---

## Configuration Options

### Times Table Selection
- Players can select any combination of times tables from 0 through 12
- Selection is made via toggle buttons on the menu screen
- At least one table must be selected to start the game
- Selected tables are visually highlighted (green) vs unselected (gray)

### Default Configuration
- Tables 2, 3, 4, 5 selected by default
- Provides a balanced starting difficulty for new players

---

## Difficulty Progression

The game increases in difficulty as the player's score increases. Every 100 points advances the player one level.

### Level-Based Scaling

| Parameter | Formula | Level 1 | Level 5 | Level 10 |
|-----------|---------|---------|---------|----------|
| Fall Speed | 0.3 + (level × 0.15) | 0.45 px/frame | 1.05 px/frame | 1.80 px/frame |
| Spawn Rate | max(2000 - (level × 150), 800) | 1850ms | 1250ms | 800ms |
| Max Multiplier | min(5 + floor(level / 2), 12) | 5 | 7 | 10 |

### Difficulty Mechanics
- **Fall Speed:** Problems descend faster at higher levels
- **Spawn Rate:** New problems appear more frequently (minimum 800ms between spawns)
- **Max Multiplier:** Higher levels introduce larger multipliers (up to 12)

---

## Scoring System

| Action | Points |
|--------|--------|
| Destroy a problem | 10 × current level |
| Problem reaches bottom | 0 points (lose 1 life) |
| Wrong answer | 0 points (no life penalty) |

### High Score
- Highest score achieved in the session is tracked
- Displayed on menu and game over screens
- New high scores are celebrated with animation

---

## Lives System

- Player starts with **3 lives**
- Lose 1 life each time a problem reaches the bottom of the screen
- Lives displayed as heart icons (❤️) in the HUD
- Game ends immediately when lives reach 0

---

## Problem Generation

### Algorithm
1. Randomly select a times table from the player's selected tables
2. Generate a random multiplier between 0 and the current max multiplier
3. Randomly decide the order (e.g., "3 × 5" vs "5 × 3")
4. Calculate the answer
5. Assign a random horizontal position within the game area

### Problem Properties
| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `a` | First operand |
| `b` | Second operand |
| `answer` | Product (a × b) |
| `x` | Horizontal position (50 to GAME_WIDTH - 50) |
| `y` | Vertical position (starts at -40, increases over time) |

---

## Missile System

### Firing Mechanics
1. Player types a number and presses Enter
2. System checks if any visible problem has that answer
3. If match found: missile is created with velocity toward that problem
4. If no match: wrong answer effect triggers

### Missile Properties
| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `x`, `y` | Current position |
| `vx`, `vy` | Velocity components (direction × speed) |
| `targetAnswer` | The answer this missile is seeking |

### Missile Behavior
- Speed: 12 pixels per frame
- Travels in a straight line toward the target's position at time of firing
- Rotates visually to point in direction of travel
- Removed when it exits the game area or hits a matching problem

### Collision Detection
- Hit box: 60px horizontal, 35px vertical centered on problem
- Missile must have matching `targetAnswer` to destroy a problem
- On collision: both missile and problem are removed, explosion spawns

---

## Visual Effects

### Explosions
- Triggered when a missile successfully destroys a problem
- Emoji-based (💥)
- Grows in size over 20 frames
- Fades out as it grows

### Wrong Answer Effect
- Screen shake animation (500ms duration)
- 5 random emoji symbols spawn across the screen
- Symbols: 💥, ❌, 🙈, 😱, 🤯
- Each symbol floats upward and rotates while fading out (30 frames)

### Background
- Space theme gradient (dark blue/purple to black)
- 50 twinkling star particles
- Stars have randomized twinkle animation (1-3 second cycle)

---

## User Interface

### HUD (During Gameplay)
- **Top Left:** Lives remaining (heart emojis)
- **Top Center:** Current level
- **Top Right:** Current score

### Input Area
- Text input field for typing answers
- Fire button for touch/mouse users
- Instructional text: "Type the answer and press Enter to fire!"
- Back to Menu button

### Menu Screen
- Game title with emoji decoration
- Times table selection grid (0-12)
- High score display (if applicable)
- Start Game button
- How to Play instructions

### Game Over Screen
- "GAME OVER" header
- Final score display
- Level reached
- New high score celebration (if applicable)
- Play Again button
- Menu button

---

## Technical Specifications

### Game Area Dimensions
- Width: 600 pixels
- Height: 500 pixels

### Frame Rate
- Game loop runs at ~60 FPS (16ms interval)

### Technology Stack
- React (functional components with hooks)
- Tailwind CSS for styling
- No external game libraries

### State Management
- React useState for game state
- React useRef for mutable values (IDs, current state snapshots)
- useEffect for game loop and spawning intervals

---

## Audio (Future Enhancement)

*Currently not implemented. Suggested additions:*
- Background music (retro arcade style)
- Missile launch sound
- Explosion sound
- Wrong answer buzzer
- Level up fanfare
- Game over sound

---

## Accessibility Considerations

- High contrast colors for problems against background
- Large, readable text on falling problems
- Keyboard-only gameplay supported (no mouse required)
- Clear visual feedback for all actions

---

## Future Enhancement Ideas

1. **Power-ups:** Slow time, multi-shot, shield
2. **Boss battles:** Large problems requiring multiple hits
3. **Combo system:** Bonus points for consecutive correct answers
4. **Practice mode:** No lives, just practice selected tables
5. **Statistics:** Track accuracy, most missed problems, time played
6. **Leaderboard:** Global or local high score tracking
7. **Themes:** Different visual themes (underwater, jungle, etc.)
8. **Division mode:** Inverse problems (? × 3 = 12)
9. **Mobile optimization:** Touch-friendly controls, responsive sizing

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Initial | Core gameplay, table selection, progressive difficulty |
| 1.1 | Update | Fixed 0× problems, improved missile collision detection |
