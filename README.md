# Blindfold Chess Trainer ♟️

A collection of blindfold chess training exercises. No board — you work from descriptions and algebraic notation alone.

**Play online → [garatc.github.io/blindfold-chess-trainer](https://garatc.github.io/blindfold-chess-trainer/)**

---

## Exercises

### Blindfold Minefield — Hard
Navigate a piece from its starting square to a target, avoiding all squares controlled by enemy pieces. The position is described in text. No board is shown.

### Blindfold Tracker — Medium
A sequence of moves is announced in algebraic notation. No board updates. Follow the game mentally and identify which black pieces your tracked piece can capture from its final position.

### Blindfold Mate in One — Medium
A position from the Lichess puzzle database is described in text. Find the move that delivers checkmate in one. Three difficulty levels based on piece count (Easy: ≤5, Medium: 6–10, Hard: 11–15).

### Blindfold Fork Finder — Easy
A knight or bishop and two enemy pieces are described by their squares. Find a square from which your piece attacks both simultaneously. Score mode (5 puzzles) or Streak. The board is revealed on wrong answers.

### Blindfold Coordinates — Easy
A square is named. Answer whether it is light or dark. Score mode (10 questions) or Streak.

*More exercises coming.*

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
Puzzles: [Lichess](https://lichess.org) puzzle database — CC BY-NC-SA 4.0