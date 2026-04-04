# Blindfold Chess Trainer ♟️

A growing collection of blindfold chess training games. No board to look at — pure mental visualization.

**Play online → [garatc.github.io/blindfold-chess-trainer](https://garatc.github.io/blindfold-chess-trainer/)**

---

## Games

### 💣 Blindfold Minefield — Hard
Navigate your piece from its starting square to a target in the fewest moves — without stepping on any square controlled by enemy pieces. No board is shown. You work entirely from the algebraic description of the position.

### 🎯 Blindfold Sniper — Medium
A real chess position is shown, with one white piece highlighted. A random sequence of moves is then announced in algebraic notation — no visual updates. Follow the game in your head and identify which black pieces your tracked piece can capture at the end of the sequence.

### 🗺️ Blindfold Coordinates — Easy
A square is named — answer whether it's light or dark as fast as you can. Two modes: **Score** (10 questions, tracks accuracy and average response time) and **Streak** (keep going until your first mistake).

### ⚔️ Blindfold Fork Finder — Easy
A knight or bishop and 2 black pieces are placed on the board — described in text only. Find a square from which your piece attacks both enemy pieces simultaneously. Score mode (5 puzzles) or Streak. An explanatory board is revealed on wrong answers.

*More games coming.*

---

## Run locally

Requires [Node.js](https://nodejs.org/) (v18+).

```bash
git clone https://github.com/garatc/blindfold-chess-trainer.git
cd blindfold-chess-trainer
npm install
npm run dev
```

Then open [http://localhost:5173/blindfold-chess-trainer/](http://localhost:5173/blindfold-chess-trainer/) in your browser.

---

## Credits

Chess pieces: [cburnett](https://en.wikipedia.org/wiki/User:Cburnett) — CC BY-SA 3.0