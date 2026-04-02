import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ── Chess Engine ────────────────────────────────────────────────────────────

const COLS = "abcdefgh";
const sqName = ([c, r]) => `${COLS[c]}${r + 1}`;
const sqKey = ([c, r]) => `${c},${r}`;
const onBoard = ([c, r]) => c >= 0 && c <= 7 && r >= 0 && r <= 7;

function parseSq(name) {
  const n = name.trim().toLowerCase();
  if (n.length !== 2) return null;
  const c = COLS.indexOf(n[0]);
  const r = parseInt(n[1]) - 1;
  if (c < 0 || isNaN(r) || r < 0 || r > 7) return null;
  return [c, r];
}

const PIECE_INFO = {
  king:   { white: "♔", black: "♚", name: "King" },
  knight: { white: "♘", black: "♞", name: "Knight" },
  bishop: { white: "♗", black: "♝", name: "Bishop" },
  rook:   { white: "♖", black: "♜", name: "Rook" },
  queen:  { white: "♕", black: "♛", name: "Queen" },
};

// ── SVG Chess Pieces (cburnett style, matching reference image) ──────────────

const PIECE_SVGS = {
  white: {
    king: (
      <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45">
        <g fill="none" fillRule="evenodd" stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
          <path strokeLinejoin="miter" d="M22.5 11.63V6M20 8h5"/>
          <path fill="#fff" strokeLinecap="butt" strokeLinejoin="miter" d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"/>
          <path fill="#fff" d="M12.5 37c5.5 3.5 14.5 3.5 20 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7"/>
          <path d="M12.5 30c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0m-20 3.5c5.5-3 14.5-3 20 0"/>
        </g>
      </svg>
    ),
    queen: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{fill:"#ffffff",stroke:"#000000",strokeWidth:"1.5",strokeLinejoin:"round"}}>
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z"/>
          <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z"/>
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" style={{fill:"none"}}/>
          <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style={{fill:"none"}}/>
          <circle cx="6" cy="12" r="2" />
          <circle cx="14" cy="9" r="2" />
          <circle cx="22.5" cy="8" r="2" />
          <circle cx="31" cy="9" r="2" />
          <circle cx="39" cy="12" r="2" />
        </g>
      </svg>
    ),
    rook: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{opacity:"1",fill:"#ffffff",fillOpacity:"1",fillRule:"evenodd",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}} transform="translate(0,0.3)">
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" style={{strokeLinecap:"butt"}} />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" style={{strokeLinecap:"butt"}} />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" style={{strokeLinecap:"butt"}} />
          <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
          <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" style={{strokeLinecap:"butt",strokeLinejoin:"miter"}} />
          <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
          <path d="M 11,14 L 34,14" style={{fill:"none",stroke:"#000000",strokeLinejoin:"miter"}} />
        </g>
      </svg>
    ),
    bishop: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{opacity:"1",fill:"none",fillRule:"evenodd",fillOpacity:"1",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}} transform="translate(0,0.6)">
          <g style={{fill:"#ffffff",stroke:"#000000",strokeLinecap:"butt"}}>
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z"/>
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/>
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/>
          </g>
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style={{fill:"none",stroke:"#000000",strokeLinejoin:"miter"}} />
        </g>
      </svg>
    ),
    knight: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{opacity:"1",fill:"none",fillOpacity:"1",fillRule:"evenodd",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}} transform="translate(0,0.3)">
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style={{fill:"#ffffff",stroke:"#000000"}} />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style={{fill:"#ffffff",stroke:"#000000"}} />
          <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style={{fill:"#000000",stroke:"#000000"}} />
          <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style={{fill:"#000000",stroke:"#000000"}} />
        </g>
      </svg>
    ),
  },
  black: {
    king: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45">
        <g fill="none" fillRule="evenodd" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.5 11.63V6" strokeLinejoin="miter"/>
          <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#000" strokeLinecap="butt" strokeLinejoin="miter"/>
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-3.5-13 4c-3 6.5 5 10.5 5 10.5v7" fill="#000"/>
          <path d="M20 8h5" strokeLinejoin="miter"/>
          <path d="M32 29.5s8.5-4 6.03-9.65C34.15 14 25 18 22.5 24.5l.01 2.1-.01-2.1C20 18 9.906 14 6.997 19.85c-2.497 5.65 4.853 9 4.853 9" fill="#000"/>
          <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" stroke="#fff"/>
        </g>
      </svg>
    ),
    queen: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{fill:"#000000",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"}}>
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" style={{strokeLinecap:"butt",fill:"#000000"}} />
          <path d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1,2.5 -1,2.5 -1.5,1.5 0,2.5 0,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0,-2.5 0,0 0.5,-1.5 -1,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z" />
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" />
          <path d="m 12,33.5 c 6,-1 15,-1 21,0" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="14" cy="9" r="2" />
          <circle cx="22.5" cy="8" r="2" />
          <circle cx="31" cy="9" r="2" />
          <circle cx="39" cy="12" r="2" />
          <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style={{fill:"none",stroke:"#000000",strokeLinecap:"butt"}} />
          <g style={{fill:"none",stroke:"#ffffff"}}>
            <path d="M 11,29 A 35,35 1 0 1 34,29" />
            <path d="M 12.5,31.5 L 32.5,31.5" />
            <path d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" />
            <path d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" />
          </g>
        </g>
      </svg>
    ),
    rook: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{opacity:"1",fill:"#000000",fillOpacity:"1",fillRule:"evenodd",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}} transform="translate(0,0.3)">
          <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" style={{strokeLinecap:"butt"}} />
          <path d="M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z" style={{strokeLinecap:"butt"}} />
          <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" style={{strokeLinecap:"butt"}} />
          <path d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z" style={{strokeLinecap:"butt",strokeLinejoin:"miter"}} />
          <path d="M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z" style={{strokeLinecap:"butt"}} />
          <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z" style={{strokeLinecap:"butt"}} />
          <path d="M 12,35.5 L 33,35.5 L 33,35.5" style={{fill:"none",stroke:"#ffffff",strokeWidth:"1",strokeLinejoin:"miter"}} />
          <path d="M 13,31.5 L 32,31.5" style={{fill:"none",stroke:"#ffffff",strokeWidth:"1",strokeLinejoin:"miter"}} />
          <path d="M 14,29.5 L 31,29.5" style={{fill:"none",stroke:"#ffffff",strokeWidth:"1",strokeLinejoin:"miter"}} />
          <path d="M 14,16.5 L 31,16.5" style={{fill:"none",stroke:"#ffffff",strokeWidth:"1",strokeLinejoin:"miter"}} />
          <path d="M 11,14 L 34,14" style={{fill:"none",stroke:"#ffffff",strokeWidth:"1",strokeLinejoin:"miter"}} />
        </g>
      </svg>
    ),
    bishop: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{opacity:"1",fill:"none",fillRule:"evenodd",fillOpacity:"1",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}} transform="translate(0,0.6)">
          <g style={{fill:"#000000",stroke:"#000000",strokeLinecap:"butt"}}>
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.65,38.99 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36 z"/>
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/>
            <path d="M 25 8 A 2.5 2.5 0 1 1 20,8 A 2.5 2.5 0 1 1 25 8 z"/>
          </g>
          <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style={{fill:"none",stroke:"#ffffff",strokeLinejoin:"miter"}} />
        </g>
      </svg>
    ),
    knight: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{opacity:"1",fill:"none",fillOpacity:"1",fillRule:"evenodd",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}} transform="translate(0,0.3)">
          <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style={{fill:"#000000",stroke:"#000000"}} />
          <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style={{fill:"#000000",stroke:"#000000"}} />
          <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style={{fill:"#ffffff",stroke:"#ffffff"}} />
          <path d="M 15 15.5 A 0.5 1.5 0 1 1 14,15.5 A 0.5 1.5 0 1 1 15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style={{fill:"#ffffff",stroke:"#ffffff"}} />
          <path d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z" style={{fill:"#ffffff",stroke:"none"}} />
        </g>
      </svg>
    ),
  },
};

function ChessPiece({ type, color, size = 44 }) {
  const svg = PIECE_SVGS[color]?.[type];
  if (!svg) return null;
  return (
    <div style={{ width: "85%", height: "85%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", transform: `scale(1)`, transformOrigin: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg viewBox="0 0 45 45" style={{ width: "100%", height: "100%" }}>
          {PIECE_SVGS[color]?.[type]?.props?.children}
        </svg>
      </div>
    </div>
  );
}

const NAVIGATORS = ["king", "knight", "bishop", "rook", "queen"];
const MINE_TYPES = ["knight", "bishop", "rook", "queen"];

function knightMoves([c, r]) {
  return [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]
    .map(([dc,dr]) => [c+dc, r+dr]).filter(onBoard);
}
function kingMoves([c, r]) {
  return [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]
    .map(([dc,dr]) => [c+dc, r+dr]).filter(onBoard);
}
function rayMoves(sq, directions, occupied) {
  const results = [];
  for (const [dc,dr] of directions) {
    let [c,r] = sq;
    while (true) {
      c += dc; r += dr;
      if (!onBoard([c,r])) break;
      results.push([c,r]);
      if (occupied.has(sqKey([c,r]))) break;
    }
  }
  return results;
}
function bishopMoves(sq, occ) { return rayMoves(sq, [[-1,-1],[-1,1],[1,-1],[1,1]], occ); }
function rookMoves(sq, occ) { return rayMoves(sq, [[-1,0],[1,0],[0,-1],[0,1]], occ); }
function queenMoves(sq, occ) { return [...bishopMoves(sq, occ), ...rookMoves(sq, occ)]; }

function pieceMoves(type, sq, occupied = new Set()) {
  switch(type) {
    case "king": return kingMoves(sq);
    case "knight": return knightMoves(sq);
    case "bishop": return bishopMoves(sq, occupied);
    case "rook": return rookMoves(sq, occupied);
    case "queen": return queenMoves(sq, occupied);
    default: return [];
  }
}

function controlledSquares(mines) {
  const minePos = new Set(mines.map(m => sqKey(m.sq)));
  const ctrl = new Set();
  for (const mine of mines) {
    const others = new Set(minePos);
    others.delete(sqKey(mine.sq));
    for (const t of pieceMoves(mine.type, mine.sq, others)) ctrl.add(sqKey(t));
  }
  return ctrl;
}

function bfs(navigator, start, goal, forbidden, minePositions) {
  const blocked = new Set([...forbidden, ...minePositions]);
  const sk = sqKey(start), gk = sqKey(goal);
  if (blocked.has(sk) || blocked.has(gk)) return null;
  const visited = new Set([sk]);
  const queue = [[start, [start]]];
  let head = 0;
  while (head < queue.length) {
    const [current, path] = queue[head++];
    if (sqKey(current) === gk) return path;
    for (const nxt of pieceMoves(navigator, current, blocked)) {
      const nk = sqKey(nxt);
      if (!visited.has(nk) && !blocked.has(nk)) {
        visited.add(nk);
        queue.push([nxt, [...path, nxt]]);
      }
    }
  }
  return null;
}

function countShortestPaths(navigator, start, goal, forbidden, minePositions) {
  const blocked = new Set([...forbidden, ...minePositions]);
  const sk = sqKey(start), gk = sqKey(goal);
  if (blocked.has(sk) || blocked.has(gk)) return 0;
  const dist = new Map([[sk, 0]]);
  const count = new Map([[sk, 1]]);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const ck = sqKey(current);
    if (ck === gk) continue;
    for (const nxt of pieceMoves(navigator, current, blocked)) {
      const nk = sqKey(nxt);
      if (blocked.has(nk)) continue;
      if (!dist.has(nk)) {
        dist.set(nk, dist.get(ck) + 1);
        count.set(nk, count.get(ck));
        queue.push(nxt);
      } else if (dist.get(nk) === dist.get(ck) + 1) {
        count.set(nk, count.get(nk) + count.get(ck));
      }
    }
  }
  return count.get(gk) || 0;
}

function validatePath(navigator, path, forbidden, minePositions) {
  const blocked = new Set([...forbidden, ...minePositions]);
  for (let i = 0; i < path.length; i++) {
    const k = sqKey(path[i]);
    if (forbidden.has(k) || minePositions.has(k)) {
      return { valid: false, error: `${sqName(path[i])} is a mined or occupied square!`, failIndex: i };
    }
  }
  for (let i = 0; i < path.length - 1; i++) {
    const moves = pieceMoves(navigator, path[i], blocked);
    const nextKey = sqKey(path[i + 1]);
    if (!moves.some(m => sqKey(m) === nextKey)) {
      return { valid: false, error: `${sqName(path[i])} → ${sqName(path[i+1])} is not a legal move for this piece.`, failIndex: i + 1 };
    }
  }
  return { valid: true };
}

function generatePuzzle({ navigator = "knight", mineTypes = MINE_TYPES, difficulty = "medium", maxAttempts = 3000 } = {}) {
  const ranges = {
    easy:   { mines: [1,2], path: [2,4] },
    medium: { mines: [2,4], path: [3,6] },
    hard:   { mines: [4,6], path: [5,10] },
  };
  const { mines: mineRange, path: pathRange } = ranges[difficulty];
  const allSq = [];
  for (let c = 0; c < 8; c++) for (let r = 0; r < 8; r++) allSq.push([c,r]);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const numMines = mineRange[0] + Math.floor(Math.random() * (mineRange[1] - mineRange[0] + 1));
    const start = allSq[Math.floor(Math.random() * 64)];
    const goal = allSq[Math.floor(Math.random() * 64)];
    if (sqKey(start) === sqKey(goal)) continue;

    const available = allSq.filter(sq => sqKey(sq) !== sqKey(start) && sqKey(sq) !== sqKey(goal));
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const mines = shuffled.slice(0, numMines).map(sq => ({
      type: mineTypes[Math.floor(Math.random() * mineTypes.length)],
      sq,
    }));

    const minePositions = new Set(mines.map(m => sqKey(m.sq)));
    const ctrl = controlledSquares(mines);
    if (ctrl.has(sqKey(start)) || ctrl.has(sqKey(goal))) continue;

    const path = bfs(navigator, start, goal, ctrl, minePositions);
    if (!path) continue;

    const pathLen = path.length - 1;
    if (pathLen < pathRange[0] || pathLen > pathRange[1]) continue;

    const numSolutions = countShortestPaths(navigator, start, goal, ctrl, minePositions);
    const score = pathLen * 2 + numMines * 3 - Math.min(numSolutions, 10);
    const diff = score <= 8 ? "Easy" : score <= 16 ? "Medium" : "Hard";

    return { navigator, start, goal, mines, solutionPath: path, numSolutions, difficulty: diff, pathLength: pathLen, controlled: ctrl, minePositions };
  }
  return null;
}

// ── Theme ───────────────────────────────────────────────────────────────────

const T = {
  bg: "#0b0e0f",
  panel: "#0f1314",
  panelBorder: "#1a2224",
  text: "#8a9a9e",
  textBright: "#d0dce0",
  textDim: "#4a5a5e",
  accent: "#c49a3c",
  accentDim: "#7a6228",
  green: "#3ca868",
  greenDim: "#1a3a28",
  red: "#c44a3c",
  redDim: "#2a1614",
  boardLight: "#f0d9b5",
  boardDark: "#b58863",
  mined: "rgba(180, 90, 60, 0.22)",
  minedLight: "rgba(180, 90, 60, 0.14)",
  pathGood: "rgba(90, 120, 70, 0.3)",
  pathBad: "rgba(180, 90, 60, 0.28)",
  scanline: "rgba(60, 168, 104, 0.03)",
};

// ── Board Component (reveal only) ───────────────────────────────────────────

function RevealBoard({ puzzle, userPath, isCorrect }) {
  const mineMap = useMemo(() => {
    const m = new Map();
    puzzle.mines.forEach(mine => m.set(sqKey(mine.sq), mine.type));
    return m;
  }, [puzzle]);

  const userPathSet = useMemo(() => new Set((userPath || []).map(sqKey)), [userPath]);
  const solutionSet = useMemo(() => new Set(puzzle.solutionPath.map(sqKey)), [puzzle]);

  const userStepMap = useMemo(() => {
    const m = new Map();
    if (userPath) userPath.forEach((sq, i) => { if (i > 0) m.set(sqKey(sq), i); });
    return m;
  }, [userPath]);
  
  const solStepMap = useMemo(() => {
    const m = new Map();
    puzzle.solutionPath.forEach((sq, i) => { if (i > 0) m.set(sqKey(sq), i); });
    return m;
  }, [puzzle]);

  const rows = [];
  // 1. Boucle des rangées
  for (let r = 7; r >= 0; r--) {
    const cells = [];
    
    // 2. Boucle des colonnes
    for (let c = 0; c < 8; c++) {
      const k = sqKey([c, r]);
      const light = (c + r) % 2 === 1;
      const isMine = mineMap.has(k);
      const isCtrl = puzzle.controlled.has(k);
      const isStart = sqKey(puzzle.start) === k;
      const isGoal = sqKey(puzzle.goal) === k;
      const isUserPath = userPathSet.has(k) && !isStart && !isGoal;
      const isSolPath = solutionSet.has(k) && !isStart && !isGoal;

      let bg = light ? T.boardLight : T.boardDark;
      if (isCtrl && !isMine) bg = "#c47060";
      if (isUserPath) bg = isCorrect ? "#8aad7a" : "#c47060";
      if (!isCorrect && isSolPath && !isUserPath) bg = "#8aad7a";
      if (isGoal) bg = "#8aad7a";

      let content = null;
      if (isMine) {
        content = <ChessPiece type={mineMap.get(k)} color="black" size={52} />;
      }
      
      if (isStart) {
        content = <ChessPiece type={puzzle.navigator} color="white" size={52} />;
      }
      
      if (isGoal && !isStart) {
        content = <span style={{ fontSize: 24, lineHeight: 1 }}>🏁</span>;
      }

      let stepNumber = null;
      if (!isGoal) {
        if (isUserPath && userStepMap.has(k)) {
          stepNumber = userStepMap.get(k);
        } else if (!isCorrect && isSolPath && !isUserPath && solStepMap.has(k)) {
          stepNumber = solStepMap.get(k);
        }
      }

      cells.push(
        <div key={k} style={{ position: "relative", width: "100%", paddingBottom: "100%" }}>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: bg,
          }}>
            {(isCtrl && !isMine && !isUserPath) && (
              <span style={{
                position: "absolute", fontSize: "76%", opacity: 0.5,
                userSelect: "none", lineHeight: 1,
              }}>💣</span>
            )}
            {content}
            {stepNumber != null && (
              <span style={{
                position: content ? "absolute" : "static",
                bottom: content ? 1 : undefined, right: content ? 2 : undefined,
                fontSize: content ? 10 : 15, fontWeight: 700,
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
                lineHeight: 1,
              }}>{stepNumber}</span>
            )}
          </div>
        </div>
      );
    }

    rows.push(
      <div key={r} style={{ display: "flex", alignItems: "center" }}>
        <span style={{ width: 18, textAlign: "center", fontSize: 11, color: T.textDim, fontFamily: "inherit" }}>{r+1}</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", flex: 1 }}>{cells}</div>
      </div>
    );
  }

  return (
    <div style={{ animation: "boardReveal 0.8s ease forwards" }}>
      {rows}
      <div style={{ display: "flex", marginLeft: 18 }}>
        {COLS.split("").map(l => (
          <div key={l} style={{ flex: 1, textAlign: "center", fontSize: 11, color: T.textDim, paddingTop: 3 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────

const PHASES = { BRIEFING: 0, INPUT: 1, RESULT: 2 };

export default function MinefieldApp() {
  const [config, setConfig] = useState({ navigator: "knight", difficulty: "medium" });
  const [puzzle, setPuzzle] = useState(null);
  const [phase, setPhase] = useState(PHASES.BRIEFING);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState({ played: 0, won: 0, optimal: 0 });
  const [showBoard, setShowBoard] = useState(false);
  const inputRef = useRef(null);
  const [typedBriefing, setTypedBriefing] = useState("");
  const [briefingDone, setBriefingDone] = useState(false);

  const newPuzzle = useCallback(() => {
    const nav = config.navigator === "random"
      ? NAVIGATORS[Math.floor(Math.random() * NAVIGATORS.length)]
      : config.navigator;
    const p = generatePuzzle({ navigator: nav, difficulty: config.difficulty });
    if (p) {
      p.minePositions = new Set(p.mines.map(m => sqKey(m.sq)));
      setPuzzle(p);
      setPhase(PHASES.BRIEFING);
      setInputValue("");
      setResult(null);
      setShowBoard(false);
      setTypedBriefing("");
      setBriefingDone(false);
    }
  }, [config]);

  useEffect(() => { newPuzzle(); }, []);

  // Typewriter
  const briefingText = useMemo(() => {
    if (!puzzle) return "";
    const lines = [];
    lines.push(`PIECE    ${PIECE_INFO[puzzle.navigator].white} ${PIECE_INFO[puzzle.navigator].name}`);
    lines.push(`START    ${sqName(puzzle.start)}`);
    lines.push(`TARGET   ${sqName(puzzle.goal)}`);
    lines.push(``);
    lines.push(`THREATS:`);
    puzzle.mines.forEach(m => {
      lines.push(`  ${PIECE_INFO[m.type].black} ${PIECE_INFO[m.type].name} on ${sqName(m.sq)}`);
    });
    lines.push(``);
    lines.push(`Minimum moves: ${puzzle.pathLength}`);
    return lines.join("\n");
  }, [puzzle]);

  useEffect(() => {
    if (phase !== PHASES.BRIEFING || !briefingText) return;
    setTypedBriefing(briefingText);
    setBriefingDone(true);
  }, [phase, briefingText]);

  const skipTypewriter = useCallback(() => {
    setTypedBriefing(briefingText);
    setBriefingDone(true);
  }, [briefingText]);

  const startInput = useCallback(() => {
    setPhase(PHASES.INPUT);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const giveUp = useCallback(() => {
    if (!puzzle) return;
    setResult({
      type: "gaveup",
      message: "Gave up — solution revealed.",
      userPath: null,
    });
    setPhase(PHASES.RESULT);
    setShowBoard(true);
    setStats(s => ({ ...s, played: s.played + 1 }));
  }, [puzzle]);

  const submitAnswer = useCallback(() => {
    if (!puzzle || !inputValue.trim()) return;

    const raw = inputValue.trim().replace(/→|->|,|-/g, " ").split(/\s+/).filter(Boolean);
    const squares = raw.map(parseSq);

    if (squares.some(s => s === null)) {
      setResult({ type: "error", message: "Invalid squares. Use algebraic notation (e.g. e2 f4 g6)." });
      setPhase(PHASES.RESULT);
      return;
    }

    const fullPath = sqKey(squares[0]) === sqKey(puzzle.start) ? squares : [puzzle.start, ...squares];
    const lastSq = fullPath[fullPath.length - 1];

    if (sqKey(lastSq) !== sqKey(puzzle.goal)) {
      setResult({ type: "wrong", message: `Path doesn't reach the target ${sqName(puzzle.goal)}.`, userPath: fullPath });
      setPhase(PHASES.RESULT);
      setShowBoard(true);
      setStats(s => ({ ...s, played: s.played + 1 }));
      return;
    }

    const validation = validatePath(puzzle.navigator, fullPath, puzzle.controlled, puzzle.minePositions);
    if (!validation.valid) {
      setResult({ type: "wrong", message: validation.error, userPath: fullPath });
      setPhase(PHASES.RESULT);
      setShowBoard(true);
      setStats(s => ({ ...s, played: s.played + 1 }));
      return;
    }

    const userMoves = fullPath.length - 1;
    const isOptimal = userMoves === puzzle.pathLength;
    setResult({
      type: "correct",
      message: isOptimal ? `Optimal path in ${userMoves} move${userMoves > 1 ? "s" : ""}!` : `Correct in ${userMoves} move${userMoves > 1 ? "s" : ""} (optimal: ${puzzle.pathLength}).`,
      userPath: fullPath, isOptimal,
    });
    setPhase(PHASES.RESULT);
    setShowBoard(true);
    setStats(s => ({ played: s.played + 1, won: s.won + 1, optimal: s.optimal + (isOptimal ? 1 : 0) }));
  }, [puzzle, inputValue]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") submitAnswer();
  }, [submitAnswer]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "n" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); newPuzzle(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [newPuzzle]);

  const chip = (val, current) => ({
    padding: "5px 11px", border: `1px solid ${val === current ? T.accent : T.panelBorder}`,
    borderRadius: 4, background: val === current ? "rgba(196,154,60,0.12)" : "transparent",
    color: val === current ? T.accent : T.textDim, cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.2s",
  });

  const [showRules, setShowRules] = useState(false);

  const closeRules = () => {
    setShowRules(false);
  };

  if (!puzzle) return null;

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", color: T.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      backgroundImage: `repeating-linear-gradient(0deg, ${T.scanline} 0px, ${T.scanline} 1px, transparent 1px, transparent 3px)`,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${T.bg}; }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes boardReveal { from { opacity: 0; transform: scale(0.96); filter: blur(3px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 rgba(196,154,60,0); } 50% { box-shadow: 0 0 18px rgba(196,154,60,0.12); } }
        button:hover { filter: brightness(1.15); }
        input:focus { outline: none; border-color: ${T.accent} !important; }
        .chess-piece svg { width: 100% !important; height: 100% !important; display: block; }
      `}</style>

      {/* Rules Modal */}
      {showRules && (
        <div onClick={() => closeRules()} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8,
            padding: "28px 28px 24px", maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: T.accent, letterSpacing: 3 }}>▸ HOW TO PLAY</div>
              <button onClick={() => closeRules()} style={{
                background: "transparent", border: "none", color: T.textDim, fontSize: 18, cursor: "pointer", fontFamily: "inherit", lineHeight: 1,
              }}>✕</button>
            </div>

            {[
              {
                title: "Objective",
                text: "Navigate your piece from its starting square to the target 🏁 in the fewest moves possible.",
              },
              {
                title: "Mines",
                text: "Enemy pieces are mines. Any square they attack is forbidden — marked in red. You cannot land on or pass through these squares.",
              },
              {
                title: "Sliding pieces (queen, rook, bishop)",
                text: "These pieces move in straight lines but cannot jump over blocked squares. If a2 is forbidden, a rook on a1 cannot reach a3 in one move — the path is physically interrupted.",
              },
              {
                title: "The knight is different",
                text: "The knight jumps — it ignores everything between start and destination. A knight on a1 can reach b3 even if a2 and b2 are forbidden, as long as b3 itself is not.",
              },
              {
                title: "Entering your solution",
                text: `List the intermediate squares + the target, separated by spaces. Example: if your knight goes a1 → c2 → e3, type "c2 e3". The starting square is optional.`,
              },
              {
                title: "Scoring",
                text: "A solution is optimal if it uses the minimum number of moves. You can also reveal the solution at any time.",
              },
            ].map(({ title, text }) => (
              <div key={title} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: T.accent, letterSpacing: 2, marginBottom: 6 }}>{title.toUpperCase()}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{text}</div>
              </div>
            ))}

            <button onClick={() => closeRules()} style={{
              marginTop: 8, width: "100%", padding: "10px", border: `1px solid ${T.accent}`,
              borderRadius: 4, background: "rgba(196,154,60,0.08)", color: T.accent,
              fontSize: 13, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1,
            }}>GOT IT</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 540, padding: "28px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: T.textBright, letterSpacing: 2 }}>MINEFIELD</h1>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 4, marginTop: 2 }}>BLINDFOLD CHESS TRAINER</div>
          </div>
          <button onClick={() => setShowRules(true)} style={{
            background: "rgba(196,154,60,0.1)", border: `1px solid ${T.accent}`, borderRadius: 4,
            padding: "5px 12px", color: T.accent, fontSize: 11, fontWeight: 600, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: 1, flexShrink: 0,
          }}>HOW TO PLAY</button>
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${T.accent}50, transparent 70%)`, margin: "12px 0 16px" }} />
      </div>

      {/* Config */}
      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>PIECE</span>
          {[["random", "🎲"], ...NAVIGATORS.map(n => [n, PIECE_INFO[n].white])].map(([v, s]) => (
            <button key={v} onClick={() => setConfig(c => ({...c, navigator: v}))} style={chip(v, config.navigator)}>{s}</button>
          ))}
          <div style={{ width: 12 }} />
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>DIFF</span>
          {["easy","medium","hard"].map(d => (
            <button key={d} onClick={() => setConfig(c => ({...c, difficulty: d}))} style={chip(d, config.difficulty)}>
              {d === "easy" ? "I" : d === "medium" ? "II" : "III"}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={newPuzzle} style={{
            padding: "5px 16px", border: "none", borderRadius: 4, background: T.accent,
            color: T.bg, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1,
          }}>NEW</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", flex: 1 }}>

        {/* BRIEFING */}
        {phase === PHASES.BRIEFING && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{
              background: "rgba(196,154,60,0.06)", border: `1px solid rgba(196,154,60,0.2)`,
              borderRadius: 6, padding: "10px 16px", marginBottom: 10,
              fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: "center",
            }}>
              <span style={{ color: T.textBright }}>Navigate your piece from start to target while avoiding squares controlled by enemy pieces, without seeing the board :)</span>.
            </div>
            <div style={{
              background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6,
              padding: "20px 24px", minHeight: 180,
            }}>
              <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 16 }}>▸ BRIEFING</div>
              <pre style={{ fontFamily: "inherit", fontSize: 14, lineHeight: 1.8, color: T.textBright, whiteSpace: "pre-wrap", margin: 0 }}>
                {typedBriefing}
              </pre>
            </div>
            {briefingDone && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12, animation: "fadeUp 0.4s ease" }}>
                <button onClick={startInput} style={{
                  padding: "10px 32px", border: `1px solid ${T.accent}`, borderRadius: 4,
                  background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 14,
                  fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                  animation: "glowPulse 2s infinite",
                }}>ENTER SOLUTION</button>
                <button onClick={giveUp} style={{
                  padding: "10px 24px", border: `1px solid ${T.panelBorder}`, borderRadius: 4,
                  background: "transparent", color: T.textDim, fontSize: 13,
                  fontFamily: "inherit", cursor: "pointer", fontWeight: 400, letterSpacing: 1,
                }}>SHOW SOLUTION</button>
              </div>
            )}
          </div>
        )}

        {/* INPUT */}
        {phase === PHASES.INPUT && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{
              background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6,
              padding: "10px 16px", marginBottom: 16, fontSize: 12, color: T.text, lineHeight: 1.7,
            }}>
              <span style={{ color: T.accent }}>{PIECE_INFO[puzzle.navigator].white}</span>{" "}
              <span style={{ color: T.textBright }}>{sqName(puzzle.start)}</span>
              <span style={{ color: T.textDim }}> → </span>
              <span style={{ color: T.accent }}>{sqName(puzzle.goal)}</span>
              <span style={{ color: T.textDim }}> │ </span>
              {puzzle.mines.map((m, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: T.textDim }}>, </span>}
                  <span style={{ color: T.red }}>{PIECE_INFO[m.type].black}{sqName(m.sq)}</span>
                </span>
              ))}
              <span style={{ color: T.textDim }}> │ {puzzle.pathLength} min moves</span>
            </div>

            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "20px 24px" }}>
              <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 10 }}>▸ YOUR PATH</div>
              <div style={{ fontSize: 11, color: T.textDim, marginBottom: 12, lineHeight: 1.6 }}>
                Intermediate squares + target, separated by spaces.
                <br /><span style={{ fontSize: 10 }}>E.g.: <span style={{ color: T.text }}>f3 d4 e6 d5</span></span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder={`... ${sqName(puzzle.goal)}`}
                  style={{
                    flex: 1, padding: "10px 14px", background: "rgba(0,0,0,0.3)",
                    border: `1px solid ${T.panelBorder}`, borderRadius: 4, color: T.textBright,
                    fontSize: 15, fontFamily: "inherit", letterSpacing: 1.5,
                  }} />
                <button onClick={submitAnswer} style={{
                  padding: "10px 20px", border: "none", borderRadius: 4, background: T.accent,
                  color: T.bg, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                }}>✓</button>
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 16 }}>
              <button onClick={() => setPhase(PHASES.BRIEFING)} style={{
                background: "transparent", border: "none", color: T.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}>← re-read briefing</button>
              <button onClick={giveUp} style={{
                background: "transparent", border: "none", color: T.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              }}>show solution →</button>
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === PHASES.RESULT && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{
              background: result?.type === "correct" ? T.greenDim : result?.type === "gaveup" ? T.panel : T.redDim,
              border: `1px solid ${result?.type === "correct" ? "rgba(60,168,104,0.3)" : result?.type === "gaveup" ? T.panelBorder : "rgba(196,74,60,0.3)"}`,
              borderRadius: 6, padding: "14px 20px", marginBottom: 16, textAlign: "center",
            }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: result?.type === "correct" ? T.green : result?.type === "gaveup" ? T.text : T.red }}>
                {result?.type === "correct" ? "✓" : result?.type === "gaveup" ? "⊘" : "✗"} {result?.message}
              </div>
              {result?.type === "correct" && result?.isOptimal && (
                <div style={{ fontSize: 11, color: T.accent, marginTop: 4 }}>★ Optimal path</div>
              )}
            </div>

            <div style={{
              background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6,
              padding: "14px 20px", marginBottom: 16, fontSize: 12,
            }}>
              {result?.userPath && (
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: T.textDim }}>Your path: </span>
                  <span style={{ color: result?.type === "correct" ? T.green : T.red }}>
                    {result.userPath.map(sqName).join(" → ")}
                  </span>
                </div>
              )}
              <div>
                <span style={{ color: T.textDim }}>Optimal: </span>
                <span style={{ color: T.accent }}>{puzzle.solutionPath.map(sqName).join(" → ")}</span>
              </div>
              {puzzle.numSolutions > 1 && (
                <div style={{ color: T.textDim, fontSize: 10, marginTop: 6 }}>
                  {puzzle.numSolutions} optimal path{puzzle.numSolutions > 1 ? "s" : ""} exist.
                </div>
              )}
            </div>

            <div style={{ marginBottom: 8 }}>
              <button onClick={() => setShowBoard(v => !v)} style={{
                background: "transparent", border: `1px solid ${T.panelBorder}`, borderRadius: 4,
                color: T.text, fontSize: 11, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit",
              }}>
                {showBoard ? "▾ Hide board" : "▸ Show board"}
              </button>
            </div>

            {showBoard && (
              <div style={{
                background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6,
                padding: "16px 12px", marginBottom: 16,
              }}>
                <RevealBoard puzzle={puzzle} userPath={result?.userPath} isCorrect={result?.type === "correct"} />
                <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, fontSize: 10, color: T.textDim }}>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, background: T.mined, borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />mined</span>
                  <span><span style={{ display: "inline-block", width: 10, height: 10, background: result?.type === "correct" ? T.pathGood : T.pathBad, borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />your path</span>
                  {result?.type !== "correct" && (
                    <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(60,168,104,0.22)", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />optimal</span>
                  )}
                </div>
              </div>
            )}

            <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
              <button onClick={newPuzzle} style={{
                padding: "10px 32px", border: `1px solid ${T.accent}`, borderRadius: 4,
                background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 14,
                fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                animation: "glowPulse 2s infinite",
              }}>NEXT PUZZLE</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}