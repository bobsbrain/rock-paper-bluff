# 🎴 Schere, Stein, Bluff

A browser-based card game where you play **Rock, Paper, Scissors** with a strategic twist — against a computer opponent.

Built with vanilla HTML, CSS, and JavaScript. No dependencies, no build step.

## 🎮 Game Modes

### 🃏 Bluff Mode
A strategic Best-of-5 match with bluffing and mind games:

- **18 cards** (6× Rock, 6× Paper, 6× Scissors) are shuffled and dealt
- **Phase A – Supply:** Optionally swap 2 hand cards for new ones from the draw pile
- **Phase B – Placement:** Take turns placing cards face-up or face-down across 6 duel slots
- **Phase C – Secret Swap:** All cards go face-down — secretly swap 2 of your placed cards
- **Phase D – Reveal:** All cards flip face-up and duels are resolved

Win the majority of 6 duels to score a point. First to **3 points** wins the match.

### ⚔️ Classic Mode
A streamlined round-by-round showdown:

- Each player starts with **3 cards**, the remaining 12 form the draw pile
- Both players pick a card → placed face-down → revealed simultaneously
- Winner scores a point, cards are discarded, both draw a new card
- After **9 rounds**, the player with more points wins

## 🚀 Play

Open `index.html` in any modern browser — that's it!

Or play online via GitHub Pages (if enabled):
**https://bobsbrain.github.io/rock-paper-bluff/**

## 📁 Project Structure

```
├── index.html   → Game layout & structure
├── style.css    → Dark-themed responsive UI
├── game.js      → Complete game logic for both modes
└── README.md
```

## 📜 License

MIT
