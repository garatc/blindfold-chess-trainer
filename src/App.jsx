import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ── Chess Engine ─────────────────────────────────────────────────────────────

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

// ── SVG Chess Pieces ──────────────────────────────────────────────────────────

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
          <circle cx="6" cy="12" r="2" /><circle cx="14" cy="9" r="2" /><circle cx="22.5" cy="8" r="2" /><circle cx="31" cy="9" r="2" /><circle cx="39" cy="12" r="2" />
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
    pawn: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" style={{opacity:"1",fill:"#ffffff",fillOpacity:"1",fillRule:"nonzero",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"miter",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}}/>
      </svg>
    ),
  },
  black: {
    king: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{fill:"none",fillOpacity:"1",fillRule:"evenodd",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}}>
          <path d="M 22.5,11.63 L 22.5,6" style={{fill:"none",stroke:"#000000",strokeLinejoin:"miter"}}/>
          <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style={{fill:"#000000",fillOpacity:"1",strokeLinecap:"butt",strokeLinejoin:"miter"}}/>
          <path d="M 12.5,37 C 18,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37" style={{fill:"#000000",stroke:"#000000"}}/>
          <path d="M 20,8 L 25,8" style={{fill:"none",stroke:"#000000",strokeLinejoin:"miter"}}/>
          <path d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.5,26.6 L 22.5,24.5 C 20,18 10.85,14 6.97,19.85 C 4.5,25.5 13,29.5 13,29.5" style={{fill:"none",stroke:"#ffffff"}}/>
          <path d="M 12.5,30 C 18,27 27,27 32.5,30 M 12.5,33.5 C 18,30.5 27,30.5 32.5,33.5 M 12.5,37 C 18,34 27,34 32.5,37" style={{fill:"none",stroke:"#ffffff"}}/>
        </g>
      </svg>
    ),
    queen: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <g style={{fill:"#000000",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"round"}}>
          <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" style={{strokeLinecap:"butt",fill:"#000000"}} />
          <path d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1,2.5 -1,2.5 -1.5,1.5 0,2.5 0,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0,-2.5 0,0 0.5,-1.5 -1,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z" />
          <path d="M 11.5,30 C 15,29 30,29 33.5,30" /><path d="m 12,33.5 c 6,-1 15,-1 21,0" />
          <circle cx="6" cy="12" r="2" /><circle cx="14" cy="9" r="2" /><circle cx="22.5" cy="8" r="2" /><circle cx="31" cy="9" r="2" /><circle cx="39" cy="12" r="2" />
          <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style={{fill:"none",stroke:"#000000",strokeLinecap:"butt"}} />
          <g style={{fill:"none",stroke:"#ffffff"}}>
            <path d="M 11,29 A 35,35 1 0 1 34,29" /><path d="M 12.5,31.5 L 32.5,31.5" />
            <path d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" /><path d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" />
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
    pawn: (
      <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="45" height="45">
        <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 H 34 C 34,31.58 29.59,27.09 26.59,26.03 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" style={{opacity:"1",fill:"#000000",fillOpacity:"1",fillRule:"nonzero",stroke:"#000000",strokeWidth:"1.5",strokeLinecap:"round",strokeLinejoin:"miter",strokeMiterlimit:"4",strokeDasharray:"none",strokeOpacity:"1"}}/>
      </svg>
    ),
  },
};

function ChessPiece({ type, color }) {
  return (
    <div style={{ width: "85%", height: "85%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <svg viewBox="0 0 45 45" style={{ width: "100%", height: "100%" }}>
        {PIECE_SVGS[color]?.[type]?.props?.children}
      </svg>
    </div>
  );
}

// ── Move functions ────────────────────────────────────────────────────────────

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
function rookMoves(sq, occ)   { return rayMoves(sq, [[-1,0],[1,0],[0,-1],[0,1]], occ); }
function queenMoves(sq, occ)  { return [...bishopMoves(sq, occ), ...rookMoves(sq, occ)]; }

function pieceMoves(type, sq, occupied = new Set()) {
  switch(type) {
    case "king":   return kingMoves(sq);
    case "knight": return knightMoves(sq);
    case "bishop": return bishopMoves(sq, occupied);
    case "rook":   return rookMoves(sq, occupied);
    case "queen":  return queenMoves(sq, occupied);
    default: return [];
  }
}

// ── Theme ─────────────────────────────────────────────────────────────────────


function chipStyle(val, current) {
  return {
    padding: "5px 11px", border: `1px solid ${val === current ? T.accent : T.panelBorder}`,
    borderRadius: 4, background: val === current ? "rgba(74,158,202,0.12)" : "transparent",
    color: val === current ? T.accent : T.textDim, cursor: "pointer", fontSize: 13,
    fontFamily: "inherit", transition: "all 0.2s",
  };
}

// ── Shared Shell ──────────────────────────────────────────────────────────────

function AppShell({ title, subtitle, onHome, headerRight, children, themeBtn }) {
  return (
    <div style={{
      background: T.bg, minHeight: "100vh", color: T.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      backgroundImage: `repeating-linear-gradient(0deg, ${T.scanline} 0px, ${T.scanline} 1px, transparent 1px, transparent 3px)`,
    }}>
      <style>{BASE_STYLE}</style>
      <div style={{ width: "100%", maxWidth: 600, padding: "28px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={onHome} style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 10, color: T.accentDim, letterSpacing: 2, marginBottom: 4 }}>← BLINDFOLD SUITE</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: T.textBright, letterSpacing: 2 }}>{title}</h1>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 4, marginTop: 2 }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {headerRight}
            {themeBtn}
          </div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${T.accent}50, transparent 70%)`, margin: "12px 0 16px" }} />
      </div>
      {children}
    </div>
  );
}

function HowToPlayBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(74,158,202,0.1)", border: `1px solid ${T.accent}`, borderRadius: 4,
      padding: "5px 12px", color: T.accent, fontSize: 11, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
    }}>HOW TO PLAY</button>
  );
}

function RulesModal({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "28px 28px 24px", maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: T.accent, letterSpacing: 3 }}>▸ HOW TO PLAY</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.textDim, fontSize: 18, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
        </div>
        {children}
        <button onClick={onClose} style={{ marginTop: 8, width: "100%", padding: "10px", border: `1px solid ${T.accent}`, borderRadius: 4, background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 13, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>GOT IT</button>
      </div>
    </div>
  );
}

function RuleSection({ title, text }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, color: T.accent, letterSpacing: 2, marginBottom: 6 }}>{title.toUpperCase()}</div>
      <div style={{ fontSize: 13, color: T.text, lineHeight: 1.7 }}>{text}</div>
    </div>
  );
}

// ── Home Screen ───────────────────────────────────────────────────────────────

const GAMES = [
  {
    id: "minefield",
    title: "Blindfold Minefield",
    tagline: "Navigate the minefield",
    description: "Navigate a piece from its starting square to a target, avoiding all squares controlled by enemy pieces. The position is described in text. No board is shown.",
    difficulty: "Hard",
  },
  {
    id: "puzzles",
    title: "Blindfold Puzzles",
    tagline: "Calculate the line",
    description: "Real Lichess puzzles, no board. Enter your moves one at a time — the opponent replies after each correct move. Highly customizable: filter by piece count, number of half-moves, and rating range up to 2000+.",
    difficulty: "Hard",
  },
  {
    id: "sniper",
    title: "Blindfold Tracker",
    tagline: "Which enemy pieces are being attacked?",
    description: "A sequence of moves is announced in algebraic notation. No board updates. Follow the game mentally and identify which black pieces your tracked piece can capture from its final position.",
    difficulty: "Medium",
  },
  {
    id: "mate1",
    title: "Blindfold Mate in One",
    tagline: "Find the mate in one",
    description: "A position from the Lichess puzzle database is described in text. Find the move that delivers checkmate in one. Three difficulty levels based on piece count (Easy: ≤5, Medium: 6–10, Hard: 11–15).",
    difficulty: "Medium",
  },
  {
    id: "fork",
    title: "Blindfold Fork Finder",
    tagline: "Find the fork",
    description: "A knight or bishop and two enemy pieces are described by their squares. Find a square from which your piece attacks both simultaneously. Score mode (5 puzzles) or Streak. The board is revealed on wrong answers.",
    difficulty: "Easy",
  },
  {
    id: "coordinates",
    title: "Blindfold Coordinates",
    tagline: "Light or dark square?",
    description: "A square is named. Answer whether it is light or dark. Score mode (10 questions) or Streak.",
    difficulty: "Easy",
  },
];

function HomeScreen({ onSelect, themeBtn }) {
  return (
    <div style={{
      background: T.bg, minHeight: "100vh", color: T.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      backgroundImage: `repeating-linear-gradient(0deg, ${T.scanline} 0px, ${T.scanline} 1px, transparent 1px, transparent 3px)`,
    }}>
      <style>{BASE_STYLE}</style>
      <div style={{ width: "100%", maxWidth: 700, padding: "48px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.textBright, letterSpacing: 3 }}>BLINDFOLD TRAINER</h1>
            <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 4, marginTop: 4 }}>CHESS TRAINING SUITE</div>
          </div>
          {themeBtn}
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${T.accent}50, transparent 70%)`, margin: "20px 0 32px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {GAMES.map(game => (
            <div key={game.id} onClick={() => onSelect(game.id)}
              style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "16px 14px", cursor: "pointer", transition: "border-color 0.2s", display: "flex", flexDirection: "column" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.panelBorder}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.textBright, letterSpacing: 0.5 }}>{game.title}</div>
                <div style={{ fontSize: 9, color: game.difficulty === "Hard" ? T.red : game.difficulty === "Medium" ? T.accent : T.green, flexShrink: 0, marginLeft: 4, fontWeight: 600 }}>{game.difficulty}</div>
              </div>
              <div style={{ fontSize: 8, color: T.accent, letterSpacing: 2, marginBottom: 7 }}>{game.tagline.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: T.text, lineHeight: 1.6, flex: 1 }}>{game.description}</div>
              <div style={{ marginTop: 12, textAlign: "right" }}>
                <span style={{ fontSize: 9, color: T.accent, border: `1px solid ${T.accentDim}`, borderRadius: 4, padding: "3px 8px", letterSpacing: 1 }}>PLAY →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: 48, paddingBottom: 32,
          fontSize: 10, color: T.textDim, lineHeight: 2, letterSpacing: 0.5,
          borderTop: `1px solid ${T.panelBorder}`, paddingTop: 20,
        }}>
          <div>
            © <a href="https://github.com/garatc" target="_blank" rel="noreferrer"
              style={{ color: T.textDim, textDecoration: "none", borderBottom: `1px solid ${T.panelBorder}` }}>
              github.com/garatc
            </a>
            {" · "}
            Puzzles from{" "}
            <a href="https://lichess.org" target="_blank" rel="noreferrer"
              style={{ color: T.textDim, textDecoration: "none", borderBottom: `1px solid ${T.panelBorder}` }}>
              Lichess
            </a>
            {" "}(<a href="https://database.lichess.org" target="_blank" rel="noreferrer"
              style={{ color: T.textDim, textDecoration: "none", borderBottom: `1px solid ${T.panelBorder}` }}>
              CC BY-NC-SA 4.0
            </a>)
          </div>
          <div>
            Chess pieces by{" "}
            <a href="https://en.wikipedia.org/wiki/User:Cburnett" target="_blank" rel="noreferrer"
              style={{ color: T.textDim, textDecoration: "none", borderBottom: `1px solid ${T.panelBorder}` }}>
              cburnett
            </a>
            {" "}(CC BY-SA 3.0)
            {" · "}
            Font{" "}
            <a href="https://fonts.google.com/specimen/IBM+Plex+Mono" target="_blank" rel="noreferrer"
              style={{ color: T.textDim, textDecoration: "none", borderBottom: `1px solid ${T.panelBorder}` }}>
              IBM Plex Mono
            </a>
            {" "}(SIL Open Font License)
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GAME 1 — MINEFIELD
// ══════════════════════════════════════════════════════════════════════════════

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
      if (!visited.has(nk) && !blocked.has(nk)) { visited.add(nk); queue.push([nxt, [...path, nxt]]); }
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
      if (!dist.has(nk)) { dist.set(nk, dist.get(ck) + 1); count.set(nk, count.get(ck)); queue.push(nxt); }
      else if (dist.get(nk) === dist.get(ck) + 1) { count.set(nk, count.get(nk) + count.get(ck)); }
    }
  }
  return count.get(gk) || 0;
}

function validatePath(navigator, path, forbidden, minePositions) {
  const blocked = new Set([...forbidden, ...minePositions]);
  for (let i = 0; i < path.length; i++) {
    const k = sqKey(path[i]);
    if (forbidden.has(k) || minePositions.has(k))
      return { valid: false, error: `${sqName(path[i])} is a mined or occupied square!` };
  }
  for (let i = 0; i < path.length - 1; i++) {
    const moves = pieceMoves(navigator, path[i], blocked);
    if (!moves.some(m => sqKey(m) === sqKey(path[i + 1])))
      return { valid: false, error: `${sqName(path[i])} → ${sqName(path[i+1])} is not a legal move for this piece.` };
  }
  return { valid: true };
}

function generateMinefieldPuzzle({ navigator = "knight", mineTypes = MINE_TYPES, difficulty = "medium", maxAttempts = 3000 } = {}) {
  const ranges = { easy: { mines: [1,2], path: [2,4] }, medium: { mines: [2,4], path: [3,6] }, hard: { mines: [4,6], path: [5,10] } };
  const { mines: mineRange, path: pathRange } = ranges[difficulty];
  const allSq = [];
  for (let c = 0; c < 8; c++) for (let r = 0; r < 8; r++) allSq.push([c,r]);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const numMines = mineRange[0] + Math.floor(Math.random() * (mineRange[1] - mineRange[0] + 1));
    const start = allSq[Math.floor(Math.random() * 64)];
    const goal  = allSq[Math.floor(Math.random() * 64)];
    if (sqKey(start) === sqKey(goal)) continue;

    const shuffled = allSq.filter(sq => sqKey(sq) !== sqKey(start) && sqKey(sq) !== sqKey(goal));
    for (let i = shuffled.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i+1)); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const mines = shuffled.slice(0, numMines).map(sq => ({ type: mineTypes[Math.floor(Math.random() * mineTypes.length)], sq }));

    const minePositions = new Set(mines.map(m => sqKey(m.sq)));
    const ctrl = controlledSquares(mines);
    if (ctrl.has(sqKey(start)) || ctrl.has(sqKey(goal))) continue;

    const path = bfs(navigator, start, goal, ctrl, minePositions);
    if (!path) continue;
    const pathLen = path.length - 1;
    if (pathLen < pathRange[0] || pathLen > pathRange[1]) continue;

    const numSolutions = countShortestPaths(navigator, start, goal, ctrl, minePositions);
    return { navigator, start, goal, mines, solutionPath: path, numSolutions, pathLength: pathLen, controlled: ctrl, minePositions };
  }
  return null;
}

function RevealBoard({ puzzle, userPath, isCorrect }) {
  const mineMap = useMemo(() => { const m = new Map(); puzzle.mines.forEach(mine => m.set(sqKey(mine.sq), mine.type)); return m; }, [puzzle]);
  const userPathSet = useMemo(() => new Set((userPath || []).map(sqKey)), [userPath]);
  const solutionSet = useMemo(() => new Set(puzzle.solutionPath.map(sqKey)), [puzzle]);
  const userStepMap = useMemo(() => { const m = new Map(); if (userPath) userPath.forEach((sq, i) => { if (i > 0) m.set(sqKey(sq), i); }); return m; }, [userPath]);
  const solStepMap  = useMemo(() => { const m = new Map(); puzzle.solutionPath.forEach((sq, i) => { if (i > 0) m.set(sqKey(sq), i); }); return m; }, [puzzle]);

  const rows = [];
  for (let r = 7; r >= 0; r--) {
    const cells = [];
    for (let c = 0; c < 8; c++) {
      const k = sqKey([c, r]);
      const light = (c + r) % 2 === 1;
      const isMine   = mineMap.has(k);
      const isStart  = sqKey(puzzle.start) === k;
      const isGoal   = sqKey(puzzle.goal)  === k;
      const isCtrl   = puzzle.controlled.has(k);
      const isUserPath = userPathSet.has(k) && !isStart && !isGoal;
      const isSolPath  = solutionSet.has(k) && !isStart && !isGoal;

      let bg = light ? T.boardLight : T.boardDark;
      if (isCtrl && !isMine) bg = "#c47060";
      if (isUserPath) bg = isCorrect ? "#8aad7a" : "#c47060";
      if (!isCorrect && isSolPath && !isUserPath) bg = "#8aad7a";
      if (isGoal) bg = "#8aad7a";

      let content = null;
      if (isMine)  content = <ChessPiece type={mineMap.get(k)} color="black" />;
      if (isStart) content = <ChessPiece type={puzzle.navigator} color="white" />;
      if (isGoal && !isStart) content = <span style={{ fontSize: 24, lineHeight: 1 }}>🏁</span>;

      let stepNumber = null;
      if (!isGoal) {
        if (isUserPath && userStepMap.has(k)) stepNumber = userStepMap.get(k);
        else if (!isCorrect && isSolPath && !isUserPath && solStepMap.has(k)) stepNumber = solStepMap.get(k);
      }

      cells.push(
        <div key={k} style={{ position: "relative", width: "100%", paddingBottom: "100%" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
            {(isCtrl && !isMine && !isUserPath) && <span style={{ position: "absolute", fontSize: "76%", opacity: 0.5, userSelect: "none", lineHeight: 1 }}>💣</span>}
            {content}
            {stepNumber != null && (
              <span style={{ position: content ? "absolute" : "static", bottom: content ? 1 : undefined, right: content ? 2 : undefined, fontSize: content ? 10 : 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", textShadow: "0 1px 3px rgba(0,0,0,0.6)", lineHeight: 1 }}>{stepNumber}</span>
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
        {COLS.split("").map(l => <div key={l} style={{ flex: 1, textAlign: "center", fontSize: 11, color: T.textDim, paddingTop: 3 }}>{l}</div>)}
      </div>
    </div>
  );
}

const MPHASES = { BRIEFING: 0, INPUT: 1, RESULT: 2 };

function MinefieldGame({ onHome, themeBtn }) {
  const [config, setConfig] = useState({ navigator: "knight", difficulty: "medium" });
  const [puzzle, setPuzzle] = useState(null);
  const [phase, setPhase] = useState(MPHASES.BRIEFING);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState(null);
  const [showBoard, setShowBoard] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [briefingText, setBriefingText] = useState("");
  const [briefingDone, setBriefingDone] = useState(false);
  const inputRef = useRef(null);

  const newPuzzle = useCallback(() => {
    const nav = config.navigator === "random" ? NAVIGATORS[Math.floor(Math.random() * NAVIGATORS.length)] : config.navigator;
    const p = generateMinefieldPuzzle({ navigator: nav, difficulty: config.difficulty });
    if (p) {
      p.minePositions = new Set(p.mines.map(m => sqKey(m.sq)));
      const lines = [
        `PIECE    ${PIECE_INFO[p.navigator].white} ${PIECE_INFO[p.navigator].name}`,
        `START    ${sqName(p.start)}`,
        `TARGET   ${sqName(p.goal)}`,
        ``,
        `THREATS:`,
        ...p.mines.map(m => `  ${PIECE_INFO[m.type].black} ${PIECE_INFO[m.type].name} on ${sqName(m.sq)}`),
        ``,
        `Minimum moves: ${p.pathLength}`,
      ];
      setPuzzle(p);
      setBriefingText(lines.join("\n"));
      setBriefingDone(true);
      setPhase(MPHASES.BRIEFING);
      setInputValue(""); setResult(null); setShowBoard(false);
    }
  }, [config]);

  useEffect(() => { newPuzzle(); }, []);

  const startInput = useCallback(() => { setPhase(MPHASES.INPUT); setTimeout(() => inputRef.current?.focus(), 100); }, []);
  const giveUp = useCallback(() => {
    if (!puzzle) return;
    setResult({ type: "gaveup", message: "Gave up — solution revealed.", userPath: null });
    setPhase(MPHASES.RESULT); setShowBoard(true);
  }, [puzzle]);

  const submitAnswer = useCallback(() => {
    if (!puzzle || !inputValue.trim()) return;
    const raw = inputValue.trim().replace(/→|->|,|-/g, " ").split(/\s+/).filter(Boolean);
    const squares = raw.map(parseSq);
    if (squares.some(s => s === null)) { setResult({ type: "error", message: "Invalid squares. Use algebraic notation (e.g. e2 f4 g6)." }); setPhase(MPHASES.RESULT); return; }
    const fullPath = sqKey(squares[0]) === sqKey(puzzle.start) ? squares : [puzzle.start, ...squares];
    if (sqKey(fullPath[fullPath.length - 1]) !== sqKey(puzzle.goal)) {
      setResult({ type: "wrong", message: `Path doesn't reach the target ${sqName(puzzle.goal)}.`, userPath: fullPath });
      setPhase(MPHASES.RESULT); setShowBoard(true); return;
    }
    const validation = validatePath(puzzle.navigator, fullPath, puzzle.controlled, puzzle.minePositions);
    if (!validation.valid) { setResult({ type: "wrong", message: validation.error, userPath: fullPath }); setPhase(MPHASES.RESULT); setShowBoard(true); return; }
    const userMoves = fullPath.length - 1;
    const isOptimal = userMoves === puzzle.pathLength;
    setResult({ type: "correct", message: isOptimal ? `Optimal path in ${userMoves} move${userMoves > 1 ? "s" : ""}!` : `Correct in ${userMoves} move${userMoves > 1 ? "s" : ""} (optimal: ${puzzle.pathLength}).`, userPath: fullPath, isOptimal });
    setPhase(MPHASES.RESULT); setShowBoard(true);
  }, [puzzle, inputValue]);

  const handleKeyDown = useCallback((e) => { if (e.key === "Enter") submitAnswer(); }, [submitAnswer]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "n" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); newPuzzle(); } };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [newPuzzle]);

  if (!puzzle) return null;

  return (
    <AppShell title="BLINDFOLD MINEFIELD" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} themeBtn={themeBtn}
      headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}
    >
      {showRules && (
        <RulesModal onClose={() => setShowRules(false)}>
          <RuleSection title="Objective" text="Navigate your piece from its starting square to the target 🏁 in the fewest moves possible." />
          <RuleSection title="Mines" text="Enemy pieces are mines. Any square they attack is forbidden — marked in red. You cannot land on or pass through these squares." />
          <RuleSection title="Sliding pieces (queen, rook, bishop)" text="These pieces move in straight lines but cannot jump over blocked squares. If a2 is forbidden, a rook on a1 cannot reach a3 in one move — the path is physically interrupted." />
          <RuleSection title="The knight is different" text="The knight jumps — it ignores everything between start and destination. A knight on a1 can reach b3 even if a2 and b2 are forbidden, as long as b3 itself is not." />
          <RuleSection title="Entering your solution" text={`List the intermediate squares + the target, separated by spaces. Example: if your knight goes a1 → c2 → e3, type "c2 e3". The starting square is optional.`} />
          <RuleSection title="Scoring" text="A solution is optimal if it uses the minimum number of moves. You can also reveal the solution at any time." />
        </RulesModal>
      )}

      {/* Config */}
      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>PIECE</span>
          {[["random", "🎲"], ...NAVIGATORS.map(n => [n, PIECE_INFO[n].white])].map(([v, s]) => (
            <button key={v} onClick={() => setConfig(c => ({...c, navigator: v}))} style={chipStyle(v, config.navigator)}>{s}</button>
          ))}
          <div style={{ width: 12 }} />
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>DIFF</span>
          {["easy","medium","hard"].map(d => (
            <button key={d} onClick={() => setConfig(c => ({...c, difficulty: d}))} style={chipStyle(d, config.difficulty)}>{d === "easy" ? "I" : d === "medium" ? "II" : "III"}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={newPuzzle} style={{ padding: "5px 16px", border: "none", borderRadius: 4, background: T.accent, color: T.bg, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>NEW</button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", flex: 1 }}>
        {phase === MPHASES.BRIEFING && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: "rgba(74,158,202,0.06)", border: `1px solid rgba(74,158,202,0.2)`, borderRadius: 6, padding: "10px 16px", marginBottom: 10, fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: T.textBright }}>Navigate your piece from start to target while avoiding squares controlled by enemy pieces, without seeing the board.</span>
            </div>
            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "20px 24px", minHeight: 180 }}>
              <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 16 }}>▸ BRIEFING</div>
              <pre style={{ fontFamily: "inherit", fontSize: 14, lineHeight: 1.8, color: T.textBright, whiteSpace: "pre-wrap", margin: 0 }}>{briefingText}</pre>
            </div>
            {briefingDone && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12, animation: "fadeUp 0.4s ease" }}>
                <button onClick={startInput} style={{ padding: "10px 32px", border: `1px solid ${T.accent}`, borderRadius: 4, background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 14, fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1, animation: "glowPulse 2s infinite" }}>ENTER SOLUTION</button>
                <button onClick={giveUp} style={{ padding: "10px 24px", border: `1px solid ${T.panelBorder}`, borderRadius: 4, background: "transparent", color: T.textDim, fontSize: 13, fontFamily: "inherit", cursor: "pointer", fontWeight: 400, letterSpacing: 1 }}>SHOW SOLUTION</button>
              </div>
            )}
          </div>
        )}

        {phase === MPHASES.INPUT && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: T.text, lineHeight: 1.7 }}>
              <span style={{ color: T.accent }}>{PIECE_INFO[puzzle.navigator].white}</span>{" "}
              <span style={{ color: T.textBright }}>{sqName(puzzle.start)}</span>
              <span style={{ color: T.textDim }}> → </span>
              <span style={{ color: T.accent }}>{sqName(puzzle.goal)}</span>
              <span style={{ color: T.textDim }}> │ </span>
              {puzzle.mines.map((m, i) => (<span key={i}>{i > 0 && <span style={{ color: T.textDim }}>, </span>}<span style={{ color: T.red }}>{PIECE_INFO[m.type].black}{sqName(m.sq)}</span></span>))}
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
                  style={{ flex: 1, padding: "10px 14px", background: "rgba(0,0,0,0.3)", border: `1px solid ${T.panelBorder}`, borderRadius: 4, color: T.textBright, fontSize: 15, fontFamily: "inherit", letterSpacing: 1.5 }} />
                <button onClick={submitAnswer} style={{ padding: "10px 20px", border: "none", borderRadius: 4, background: T.accent, color: T.bg, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>✓</button>
              </div>
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 16 }}>
              <button onClick={() => setPhase(MPHASES.BRIEFING)} style={{ background: "transparent", border: "none", color: T.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>← re-read briefing</button>
              <button onClick={giveUp} style={{ background: "transparent", border: "none", color: T.textDim, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>show solution →</button>
            </div>
          </div>
        )}

        {phase === MPHASES.RESULT && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: result?.type === "correct" ? T.greenDim : result?.type === "gaveup" ? T.panel : T.redDim, border: `1px solid ${result?.type === "correct" ? "rgba(60,168,104,0.3)" : result?.type === "gaveup" ? T.panelBorder : "rgba(224,85,85,0.3)"}`, borderRadius: 6, padding: "14px 20px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: result?.type === "correct" ? T.green : result?.type === "gaveup" ? T.text : T.red }}>
                {result?.type === "correct" ? "✓" : result?.type === "gaveup" ? "⊘" : "✗"} {result?.message}
              </div>
              {result?.type === "correct" && result?.isOptimal && <div style={{ fontSize: 11, color: T.accent, marginTop: 4 }}>★ Optimal path</div>}
            </div>
            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "14px 20px", marginBottom: 16, fontSize: 12 }}>
              {result?.userPath && <div style={{ marginBottom: 8 }}><span style={{ color: T.textDim }}>Your path: </span><span style={{ color: result?.type === "correct" ? T.green : T.red }}>{result.userPath.map(sqName).join(" → ")}</span></div>}
              <div><span style={{ color: T.textDim }}>Optimal: </span><span style={{ color: T.accent }}>{puzzle.solutionPath.map(sqName).join(" → ")}</span></div>
              {puzzle.numSolutions > 1 && <div style={{ color: T.textDim, fontSize: 10, marginTop: 6 }}>{puzzle.numSolutions} optimal paths exist.</div>}
            </div>
            <div style={{ marginBottom: 8 }}>
              <button onClick={() => setShowBoard(v => !v)} style={{ background: "transparent", border: `1px solid ${T.panelBorder}`, borderRadius: 4, color: T.text, fontSize: 11, padding: "5px 14px", cursor: "pointer", fontFamily: "inherit" }}>
                {showBoard ? "▾ Hide board" : "▸ Show board"}
              </button>
            </div>
            {showBoard && (
              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "16px 12px", marginBottom: 16 }}>
                <RevealBoard puzzle={puzzle} userPath={result?.userPath} isCorrect={result?.type === "correct"} />
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: 8, marginBottom: 24 }}>
              <button onClick={newPuzzle} style={{ padding: "10px 32px", border: `1px solid ${T.accent}`, borderRadius: 4, background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 14, fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1, animation: "glowPulse 2s infinite" }}>NEXT PUZZLE</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}


// ══════════════════════════════════════════════════════════════════════════════
// CHESS ENGINE — Legal move generation + SAN notation
// ══════════════════════════════════════════════════════════════════════════════

const CE_FILES = 'abcdefgh';
function ce_sqStr([c, r]) { return CE_FILES[c] + (r + 1); }
function ce_onBoard([c, r]) { return c >= 0 && c < 8 && r >= 0 && r < 8; }
function ce_enemy(color) { return color === 'white' ? 'black' : 'white'; }
function ce_getAt(board, [c, r]) { return board[r][c]; }
function ce_setAt(board, [c, r], val) { board[r][c] = val; }

function ce_cloneBoard(board) { return board.map(row => row.map(cell => cell ? { ...cell } : null)); }
function ce_cloneState(state) {
  return { board: ce_cloneBoard(state.board), turn: state.turn, castling: { ...state.castling }, enPassant: state.enPassant ? [...state.enPassant] : null, halfmove: state.halfmove, fullmove: state.fullmove };
}

function ce_initialBoard() {
  const b = Array.from({ length: 8 }, () => Array(8).fill(null));
  const back = ['rook','knight','bishop','queen','king','bishop','knight','rook'];
  for (let c = 0; c < 8; c++) {
    b[0][c] = { type: back[c], color: 'white' };
    b[1][c] = { type: 'pawn', color: 'white' };
    b[6][c] = { type: 'pawn', color: 'black' };
    b[7][c] = { type: back[c], color: 'black' };
  }
  return b;
}

function ce_initialState() {
  return { board: ce_initialBoard(), turn: 'white', castling: { wk:true, wq:true, bk:true, bq:true }, enPassant: null, halfmove: 0, fullmove: 1 };
}

function ce_rawMoves(state, from) {
  const { board, enPassant } = state;
  const piece = ce_getAt(board, from);
  if (!piece) return [];
  const { type, color } = piece;
  const moves = [];

  function slide(dirs) {
    for (const [dc, dr] of dirs) {
      let [c, r] = from;
      while (true) {
        c += dc; r += dr;
        if (!ce_onBoard([c, r])) break;
        const t = ce_getAt(board, [c, r]);
        if (!t) moves.push({ from, to: [c, r] });
        else { if (t.color === ce_enemy(color)) moves.push({ from, to: [c, r], capture: true }); break; }
      }
    }
  }

  if (type === 'pawn') {
    const dir = color === 'white' ? 1 : -1;
    const startRow = color === 'white' ? 1 : 6;
    const promoRow = color === 'white' ? 7 : 0;
    const [fc, fr] = from;
    if (ce_onBoard([fc, fr+dir]) && !ce_getAt(board, [fc, fr+dir])) {
      if (fr+dir === promoRow) { for (const pt of ['queen','rook','bishop','knight']) moves.push({ from, to: [fc, fr+dir], promotion: pt }); }
      else {
        moves.push({ from, to: [fc, fr+dir] });
        if (fr === startRow && !ce_getAt(board, [fc, fr+2*dir])) moves.push({ from, to: [fc, fr+2*dir], doublePush: true });
      }
    }
    for (const dc of [-1, 1]) {
      const to = [fc+dc, fr+dir];
      if (!ce_onBoard(to)) continue;
      const t = ce_getAt(board, to);
      if (t && t.color === ce_enemy(color)) {
        if (to[1] === promoRow) { for (const pt of ['queen','rook','bishop','knight']) moves.push({ from, to, capture: true, promotion: pt }); }
        else moves.push({ from, to, capture: true });
      }
      if (enPassant && to[0] === enPassant[0] && to[1] === enPassant[1]) moves.push({ from, to, capture: true, enPassant: true });
    }
  }
  if (type === 'knight') {
    for (const [dc,dr] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const to = [from[0]+dc, from[1]+dr];
      if (!ce_onBoard(to)) continue;
      const t = ce_getAt(board, to);
      if (!t) moves.push({ from, to }); else if (t.color === ce_enemy(color)) moves.push({ from, to, capture: true });
    }
  }
  if (type === 'king') {
    for (const [dc,dr] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
      const to = [from[0]+dc, from[1]+dr];
      if (!ce_onBoard(to)) continue;
      const t = ce_getAt(board, to);
      if (!t) moves.push({ from, to }); else if (t.color === ce_enemy(color)) moves.push({ from, to, capture: true });
    }
    const row = color === 'white' ? 0 : 7;
    if (state.castling[color==='white'?'wk':'bk'] && !ce_getAt(board,[5,row]) && !ce_getAt(board,[6,row])) moves.push({ from, to: [6,row], castling: 'kingside' });
    if (state.castling[color==='white'?'wq':'bq'] && !ce_getAt(board,[3,row]) && !ce_getAt(board,[2,row]) && !ce_getAt(board,[1,row])) moves.push({ from, to: [2,row], castling: 'queenside' });
  }
  if (type === 'bishop') slide([[-1,-1],[-1,1],[1,-1],[1,1]]);
  if (type === 'rook')   slide([[-1,0],[1,0],[0,-1],[0,1]]);
  if (type === 'queen')  slide([[-1,-1],[-1,1],[1,-1],[1,1],[-1,0],[1,0],[0,-1],[0,1]]);
  return moves;
}

function ce_isSquareAttacked(board, sq, byColor) {
  const fakeState = { board, enPassant: null, castling: { wk:false,wq:false,bk:false,bq:false }, turn: byColor };
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p || p.color !== byColor) continue;
    if (ce_rawMoves(fakeState, [c,r]).some(m => m.to[0]===sq[0] && m.to[1]===sq[1])) return true;
  }
  return false;
}

function ce_isInCheck(board, color) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p && p.type==='king' && p.color===color) return ce_isSquareAttacked(board, [c,r], ce_enemy(color));
  }
  return false;
}

function ce_applyMove(state, move) {
  const next = ce_cloneState(state);
  const { board } = next;
  const piece = ce_getAt(board, move.from);
  const { color } = piece;
  ce_setAt(board, move.to, move.promotion ? { type: move.promotion, color } : { ...piece });
  ce_setAt(board, move.from, null);
  if (move.enPassant) { const dir = color==='white'?-1:1; ce_setAt(board, [move.to[0], move.to[1]+dir], null); }
  if (move.castling) {
    const row = move.to[1];
    if (move.castling==='kingside') { ce_setAt(board,[5,row],{type:'rook',color}); ce_setAt(board,[7,row],null); }
    else { ce_setAt(board,[3,row],{type:'rook',color}); ce_setAt(board,[0,row],null); }
  }
  if (piece.type==='king') { if (color==='white'){next.castling.wk=false;next.castling.wq=false;}else{next.castling.bk=false;next.castling.bq=false;} }
  if (piece.type==='rook') {
    const [fc,fr]=move.from;
    if(fr===0&&fc===0)next.castling.wq=false; if(fr===0&&fc===7)next.castling.wk=false;
    if(fr===7&&fc===0)next.castling.bq=false; if(fr===7&&fc===7)next.castling.bk=false;
  }
  next.enPassant = move.doublePush ? [move.to[0], (move.from[1]+move.to[1])/2] : null;
  next.halfmove = (piece.type==='pawn'||move.capture) ? 0 : next.halfmove+1;
  if (color==='black') next.fullmove++;
  next.turn = ce_enemy(color);
  return next;
}

function ce_legalMoves(state, from) {
  const piece = ce_getAt(state.board, from);
  if (!piece || piece.color !== state.turn) return [];
  return ce_rawMoves(state, from).filter(move => {
    if (move.castling) {
      const row = from[1];
      const path = move.castling==='kingside' ? [[4,row],[5,row],[6,row]] : [[4,row],[3,row],[2,row]];
      for (const sq of path) if (ce_isSquareAttacked(state.board, sq, ce_enemy(piece.color))) return false;
    }
    const next = ce_applyMove(state, move);
    return !ce_isInCheck(next.board, piece.color);
  });
}

function ce_allLegalMoves(state) {
  const moves = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = state.board[r][c];
    if (p && p.color===state.turn) moves.push(...ce_legalMoves(state, [c,r]));
  }
  return moves;
}

const CE_PIECE_LETTERS = { king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N', pawn:'' };

function ce_toSAN(state, move) {
  const { board } = state;
  const piece = ce_getAt(board, move.from);
  const { type, color } = piece;
  const nextState = ce_applyMove(state, move);
  const inCheck = ce_isInCheck(nextState.board, ce_enemy(color));
  const noMoves = inCheck && ce_allLegalMoves(nextState).length === 0;
  const suffix = noMoves ? '#' : inCheck ? '+' : '';
  if (move.castling==='kingside')  return 'O-O' + suffix;
  if (move.castling==='queenside') return 'O-O-O' + suffix;
  const toStr = ce_sqStr(move.to);
  const promoStr = move.promotion ? '=' + CE_PIECE_LETTERS[move.promotion] : '';
  if (type === 'pawn') {
    return (move.capture ? CE_FILES[move.from[0]] + 'x' : '') + toStr + promoStr + suffix;
  }
  const letter = CE_PIECE_LETTERS[type];
  const ambiguous = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (c===move.from[0] && r===move.from[1]) continue;
    const p = board[r][c];
    if (!p || p.type!==type || p.color!==color) continue;
    if (ce_legalMoves(state, [c,r]).some(m => m.to[0]===move.to[0] && m.to[1]===move.to[1])) ambiguous.push([c,r]);
  }
  let disambig = '';
  if (ambiguous.length > 0) {
    const sameFile = ambiguous.some(([c]) => c === move.from[0]);
    const sameRank = ambiguous.some(([,r]) => r === move.from[1]);
    if (!sameFile) disambig = CE_FILES[move.from[0]];
    else if (!sameRank) disambig = String(move.from[1]+1);
    else disambig = ce_sqStr(move.from);
  }
  return letter + disambig + (move.capture?'x':'') + toStr + promoStr + suffix;
}

function ce_gameStatus(state) {
  const moves = ce_allLegalMoves(state);
  if (moves.length === 0) return ce_isInCheck(state.board, state.turn) ? 'checkmate' : 'stalemate';
  if (state.halfmove >= 100) return 'draw';
  return 'ongoing';
}

// ── Sniper puzzle generator ───────────────────────────────────────────────────

function ce_shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function ce_randomMidgame() {
  let state = ce_initialState();
  const halfMoves = Math.floor(Math.random() * 20) + 10; // 5-15 moves each side
  for (let i = 0; i < halfMoves; i++) {
    if (ce_gameStatus(state) !== 'ongoing') break;
    const moves = ce_allLegalMoves(state);
    if (!moves.length) break;
    const nonCap = moves.filter(m => !m.capture);
    const pool = nonCap.length > 2 ? nonCap : moves;
    state = ce_applyMove(state, pool[Math.floor(Math.random() * pool.length)]);
  }
  return state;
}

function generateSniperPuzzle(numHalfMoves = 6) {
  const numFullMoves = Math.ceil(numHalfMoves / 2);

  for (let attempt = 0; attempt < 80; attempt++) {
    let state = ce_randomMidgame();
    if (ce_gameStatus(state) !== 'ongoing') continue;

    // Ensure white to move
    if (state.turn !== 'white') {
      const moves = ce_allLegalMoves(state);
      if (!moves.length) continue;
      state = ce_applyMove(state, moves[Math.floor(Math.random() * moves.length)]);
      if (ce_gameStatus(state) !== 'ongoing') continue;
    }

    // Pick a white piece to track — must have legal moves and not be blocked
    const candidates = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.color==='white' && p.type!=='king' && p.type!=='pawn') {
        // Only pick if piece has at least 2 legal moves (not completely blocked)
        const movesAvailable = ce_legalMoves(state, [c,r]);
        if (movesAvailable.length >= 2) candidates.push([c,r]);
      }
    }
    if (!candidates.length) continue;

    const trackedFrom = candidates[Math.floor(Math.random() * candidates.length)];
    const initialBoard = ce_cloneBoard(state.board);
    const initialStateSnap = ce_cloneState(state);

    // Map current position → initial position for every black piece
    const blackOrigins = new Map(); // key: "c,r" of current pos → [c,r] initial pos
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.color === 'black') blackOrigins.set(c+','+r, [c, r]);
    }

    let cur = ce_cloneState(state);
    let trackedPos = [...trackedFrom];
    const moveList = [];
    let failed = false;

    for (let m = 0; m < numFullMoves; m++) {
      if (ce_gameStatus(cur) !== 'ongoing') { failed = true; break; }

      // White move — always move tracked piece if it has legal moves
      const trackedMoves = ce_legalMoves(cur, trackedPos);
      const allWhite = ce_allLegalMoves(cur);
      let whiteMove;
      if (trackedMoves.length > 0) {
        whiteMove = trackedMoves[Math.floor(Math.random() * trackedMoves.length)];
      } else {
        const others = allWhite.filter(mv => !(mv.from[0]===trackedPos[0] && mv.from[1]===trackedPos[1]));
        if (!others.length) { failed = true; break; }
        whiteMove = others[Math.floor(Math.random() * others.length)];
      }

      const whiteSAN = ce_toSAN(cur, whiteMove);
      cur = ce_applyMove(cur, whiteMove);
      if (whiteMove.from[0]===trackedPos[0] && whiteMove.from[1]===trackedPos[1]) trackedPos = [...whiteMove.to];
      moveList.push({ san: whiteSAN, color: 'white', moveNum: m+1 });

      // Black move
      if (ce_gameStatus(cur) !== 'ongoing') break;
      const blackMoves = ce_allLegalMoves(cur);
      if (!blackMoves.length) break;
      // Prefer non-captures to avoid board getting too empty, but allow captures
      const blackPool = Math.random() < 0.4 ? blackMoves : (blackMoves.filter(m => !m.capture).length > 0 ? blackMoves.filter(m => !m.capture) : blackMoves);
      const blackMove = blackPool[Math.floor(Math.random() * blackPool.length)];

      // If black captures our tracked piece → retry
      if (blackMove.to[0]===trackedPos[0] && blackMove.to[1]===trackedPos[1]) { failed = true; break; }

      const blackSAN = ce_toSAN(cur, blackMove);
      cur = ce_applyMove(cur, blackMove);

      // Update blackOrigins: the piece that moved from blackMove.from to blackMove.to
      const fromKey = blackMove.from[0]+','+blackMove.from[1];
      const toKey   = blackMove.to[0]+','+blackMove.to[1];
      const origin  = blackOrigins.get(fromKey);
      if (origin) {
        blackOrigins.delete(fromKey);
        if (!blackMove.enPassant) blackOrigins.set(toKey, origin); // set new pos → original pos
        // If black captured a white piece at toKey, that's fine — just update origin
      }
      // If black captured en passant, the captured pawn was at a different square — already gone

      moveList.push({ san: blackSAN, color: 'black', moveNum: m+1 });
    }

    if (failed || moveList.length < 2) continue;

    // Tracked piece must have ended on a different square than it started
    // (catches cases where it moved away and came back)
    const finalPiece = ce_getAt(cur.board, trackedPos);
    if (!finalPiece || finalPiece.color !== 'white') continue;

    // Compute captures using raw moves so sliding pieces respect actual blockers
    const fakeState = { board: cur.board, enPassant: cur.enPassant, castling: { wk:false,wq:false,bk:false,bq:false }, turn: 'white' };
    const capMoves = ce_rawMoves(fakeState, trackedPos).filter(m => m.capture && !m.enPassant);

    // Must have at least 1 capture available from final position
    if (capMoves.length === 0) continue;

    // All black pieces still on board
    const blackPieces = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = cur.board[r][c];
      if (p && p.color==='black') blackPieces.push({ sq: [c,r], type: p.type });
    }

    if (blackPieces.length < 3) continue;
    const captureSet = new Set(capMoves.map(m => m.to[0]+','+m.to[1]));
    const capturable = blackPieces.filter(({ sq }) => captureSet.has(sq[0]+','+sq[1]));
    const nonCapturable = blackPieces.filter(({ sq }) => !captureSet.has(sq[0]+','+sq[1]));

    if (capturable.length === 0 || nonCapturable.length < 1) continue;

    // Map each capturable piece to its initial position using blackOrigins
    const capturableInitial = capturable.map(({ sq, type }) => {
      const origin = blackOrigins.get(sq[0]+','+sq[1]);
      return { sq: origin || sq, type };
    });

    // Format move list as SAN pairs: "1. Nf3 c5 2. e4 e6"
    const movePairs = [];
    for (let i = 0; i < moveList.length; i += 2) {
      const wMove = moveList[i];
      const bMove = moveList[i+1];
      movePairs.push({ num: wMove.moveNum, white: wMove.san, black: bMove ? bMove.san : null });
    }

    return {
      initialBoard,
      trackedFrom,
      trackedPos,
      trackedPiece: finalPiece,
      movePairs,
      finalBoard: cur.board,
      blackPieces,
      capturable,
      capturableInitial,
    };
  }
  return null; // fallback
}


// ══════════════════════════════════════════════════════════════════════════════
// GAME 2 — BLINDFOLD TRACKER
// ══════════════════════════════════════════════════════════════════════════════

const NUM_TARGETS = 6;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── Easy mode: pure mental attack pattern (no board, no moves) ────────────────

function generateSniperEasy() {
  const allSq = [];
  for (let c = 0; c < 8; c++) for (let r = 0; r < 8; r++) allSq.push([c, r]);
  const SNIPER_PIECES = ["queen", "rook", "bishop", "knight", "king"];
  const pieceType = SNIPER_PIECES[Math.floor(Math.random() * SNIPER_PIECES.length)];
  const pos = allSq[Math.floor(Math.random() * 64)];
  const attacked = new Set(pieceMoves(pieceType, pos).map(sqKey));
  const attackedSqs   = shuffle(allSq.filter(sq => attacked.has(sqKey(sq)) && sqKey(sq) !== sqKey(pos)));
  const unattackedSqs = shuffle(allSq.filter(sq => !attacked.has(sqKey(sq)) && sqKey(sq) !== sqKey(pos)));
  const numHits = Math.max(1, Math.min(3, attackedSqs.length));
  const targets = shuffle([...attackedSqs.slice(0, numHits), ...unattackedSqs.slice(0, NUM_TARGETS - numHits)]);
  const numAttackedTargets = targets.filter(sq => attacked.has(sqKey(sq))).length;
  return { mode: 'easy', pieceType, pos, attacked, targets, numAttackedTargets };
}

// ── Static board for Sniper (shows pieces, highlights tracked piece) ──────────

function SniperBoard({ board, finalBoard, trackedFrom, trackedPos, selectedBlack, submitted, capturable, capturableInitial, onToggle }) {
  // capturableInitial = initial positions of capturable pieces (for clicking on initial board)
  // capturable = final positions (for showing on final board after submit)
  const validSet = new Set((capturableInitial || capturable || []).map(({ sq }) => sq[0]+','+sq[1]));
  const capturableSet = new Set((capturable || []).map(({ sq }) => sq[0]+','+sq[1]));
  // Clickable if black piece exists in the displayed board
  const clickBoard = board;
  const rows = [];
  for (let r = 7; r >= 0; r--) {
    const cells = [];
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      const light = (c + r) % 2 === 1;
      const k = c + ',' + r;
      const isTracked = trackedFrom && trackedFrom[0]===c && trackedFrom[1]===r;
      const isBlack = piece && piece.color === 'black';
      const isSelected = selectedBlack && selectedBlack.has(k);
      const isCapturable = validSet.has(k);      // for click validation (initial or final pos)
      const isCapturableFinal = capturableSet.has(k); // for post-submit coloring on final board

      let bg = light ? T.boardLight : T.boardDark;
      if (isTracked) bg = light ? '#e8d060' : '#c8a820';

      if (submitted && isBlack) {
        const cap = capturableInitial ? isCapturable : isCapturableFinal;
        if (cap && isSelected)      bg = '#8aad7a';
        else if (cap && !isSelected) bg = T.accent + '44';
        else if (!cap && isSelected) bg = '#c47060';
      } else if (!submitted && isBlack && isSelected) {
        bg = "rgba(74,158,202,0.5)";
      }

      cells.push(
        <div key={k} onClick={() => isBlack && !submitted && onToggle && onToggle([c,r])}
          style={{ position: "relative", width: "100%", paddingBottom: "100%", cursor: isBlack && !submitted ? "pointer" : "default" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: bg }}>
            {piece && <ChessPiece type={piece.type} color={piece.color} />}
            {submitted && isBlack && isCapturable && !isSelected && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "40%", opacity: 0.9 }}>⚠️</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    rows.push(
      <div key={r} style={{ display: "flex", alignItems: "center" }}>
        <span style={{ width: 16, textAlign: "center", fontSize: 10, color: T.textDim }}>{r+1}</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", flex: 1 }}>{cells}</div>
      </div>
    );
  }
  return (
    <div>
      {rows}
      <div style={{ display: "flex", marginLeft: 16 }}>
        {COLS.split("").map(l => <div key={l} style={{ flex: 1, textAlign: "center", fontSize: 10, color: T.textDim, paddingTop: 2 }}>{l}</div>)}
      </div>
    </div>
  );
}

function SniperGame({ onHome, themeBtn }) {
  const [numMoves, setNumMoves] = useState(6);
  const [customInput, setCustomInput] = useState(null);
  const [puzzle, setPuzzle] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [loading, setLoading] = useState(false);

  const newPuzzle = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const p = generateSniperPuzzle(numMoves);
      setPuzzle(p ? { ...p } : null);
      setSelected(new Set());
      setSubmitted(false);
      setLoading(false);
    }, 10);
  }, [numMoves]);

  useEffect(() => { newPuzzle(); }, [numMoves]);

  const toggleTarget = (sqOrKey) => {
    if (submitted) return;
    const k = Array.isArray(sqOrKey) ? sqOrKey[0]+','+sqOrKey[1] : sqKey(sqOrKey);
    setSelected(prev => { const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next; });
  };

  if (loading) return (
    <AppShell title="TRACKER" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} themeBtn={themeBtn} headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}>
      <div style={{ width: "100%", maxWidth: 540, padding: "40px 20px", textAlign: "center", color: T.textDim, fontSize: 13 }}>Generating puzzle...</div>
    </AppShell>
  );

  if (!puzzle) return null;

  // Scoring — validate against initial positions of capturable pieces
  let score = null;
  if (submitted) {
    const capInitial = puzzle.capturableInitial || puzzle.capturable;
    const capSet = new Set(capInitial.map(({ sq }) => sq[0]+','+sq[1]));
    const hits  = capInitial.filter(({ sq }) => selected.has(sq[0]+','+sq[1])).length;
    const fp    = [...selected].filter(k => !capSet.has(k)).length;
    score = { hits, total: capInitial.length, falsePos: fp, perfect: hits === capInitial.length && fp === 0 };
  }

  return (
    <AppShell title="TRACKER" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} themeBtn={themeBtn}
      headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}
    >
      {showRules && (
        <RulesModal onClose={() => setShowRules(false)}>
          <RuleSection title="Objective" text="A real chess position is shown on the board. One white piece is highlighted in gold — that is the piece you track." />
          <RuleSection title="How it works" text="A sequence of moves is announced in algebraic notation. All pieces move — white and black. Track the position mentally, then click the black pieces your tracked piece can capture from its final position." />
          <RuleSection title="Move count" text="Choose how many half-moves to track. 2 = 1 white + 1 black. 6 = 3 each side (default). Higher = harder." />
          <RuleSection title="Selecting" text="Tap directly on the black pieces you think are capturable. Tap again to deselect." />
          <RuleSection title="Scoring" text="X / N captures found, where N is the actual number of black pieces capturable from the final position." />
        </RulesModal>
      )}

      {/* Config */}
      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>MOVES</span>
          {[2, 4, 6, 8, 10].map(n => (
            <button key={n} onClick={() => setNumMoves(n)} style={chipStyle(n, numMoves)}>{n}</button>
          ))}
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={customInput ?? ""}
            placeholder="…"
            onChange={e => {
              const v = parseInt(e.target.value);
              setCustomInput(isNaN(v) ? null : Math.min(v, 30));
            }}
            onKeyDown={e => { if (e.key === 'Enter' && customInput) setNumMoves(customInput); }}
            style={{
              width: 52, padding: "4px 8px", background: "rgba(0,0,0,0.3)",
              border: `1px solid ${customInput && ![2,4,6,8,10].includes(numMoves) ? T.accent : T.panelBorder}`,
              borderRadius: 4, color: T.textBright, fontSize: 13,
              fontFamily: "inherit", textAlign: "center",
            }}
          />
          <button onClick={() => { if (customInput) setNumMoves(customInput); }} style={{
            padding: "4px 10px", border: `1px solid ${T.accent}`, borderRadius: 4,
            background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 12,
            fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
          }}>OK</button>
          <div style={{ flex: 1 }} />
          <button onClick={newPuzzle} style={{ padding: "5px 16px", border: "none", borderRadius: 4, background: T.accent, color: T.bg, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>NEW</button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", flex: 1 }}>

        <div style={{ background:"rgba(74,158,202,0.06)", border:`1px solid rgba(74,158,202,0.2)`, borderRadius:6, padding:"10px 16px", marginBottom:12, fontSize:12, color:T.textDim, lineHeight:1.6, textAlign:"center" }}>
          <span style={{ color:T.textBright }}>Follow the moves mentally from the initial position, then tap the black pieces your tracked piece can capture in the final position.</span>
        </div>

        {/* Board — initial position, clickable */}
        <div style={{ background:T.panel, border:`1px solid ${T.panelBorder}`, borderRadius:6, padding:"14px 12px", marginBottom:12, animation:"fadeUp 0.3s ease" }}>
          <div style={{ fontSize:9, color:T.accentDim, letterSpacing:3, marginBottom:10 }}>▸ INITIAL POSITION — tap black pieces to select</div>
          <div style={{ marginBottom:12, padding:"8px 12px", background:"rgba(74,158,202,0.12)", border:`1px solid rgba(74,158,202,0.35)`, borderRadius:5, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:18 }}>{PIECE_INFO[puzzle.trackedPiece.type].white}</span>
            <div>
              <div style={{ fontSize:11, color:T.accent, fontWeight:600, letterSpacing:1 }}>TRACK THIS PIECE</div>
              <div style={{ fontSize:13, color:T.textBright }}>{PIECE_INFO[puzzle.trackedPiece.type].name} on <span style={{ fontWeight:600 }}>{sqName(puzzle.trackedFrom)}</span></div>
            </div>
          </div>
          <SniperBoard
            board={puzzle.initialBoard}
            trackedFrom={puzzle.trackedFrom}
            selectedBlack={selected}
            submitted={submitted}
            capturable={puzzle.capturable}
            capturableInitial={puzzle.capturableInitial}
            onToggle={(sq) => toggleTarget(sq)}
          />
        </div>

        {/* Move sequence */}
        <div style={{ background:T.panel, border:`1px solid ${T.panelBorder}`, borderRadius:6, padding:"14px 20px", marginBottom:16 }}>
          <div style={{ fontSize:9, color:T.accentDim, letterSpacing:3, marginBottom:12 }}>▸ MOVES</div>
          <div style={{ fontSize:13, color:T.text, lineHeight:2, fontFamily:"inherit" }}>
            {puzzle.movePairs.map((pair, i) => (
              <span key={i}>
                <span style={{ color:T.textDim }}>{pair.num}.</span>{" "}
                <span style={{ color:T.textBright }}>{pair.white}</span>
                {pair.black && <><span style={{ color:T.textDim }}> </span><span style={{ color:T.text }}>{pair.black}</span></>}
                {i < puzzle.movePairs.length-1 && <span style={{ color:T.textDim }}>{"  "}</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Result */}
        {submitted && score && (
          <div style={{ animation:"fadeUp 0.3s ease" }}>
            <div style={{ background:score.perfect?T.greenDim:"rgba(74,158,202,0.08)", border:`1px solid ${score.perfect?"rgba(60,168,104,0.3)":T.panelBorder}`, borderRadius:6, padding:"16px 20px", marginBottom:12, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:600, color:score.perfect?T.green:T.accent, marginBottom:4 }}>
                {score.hits} / {score.total}
              </div>
              <div style={{ fontSize:13, color:score.perfect?T.green:T.text }}>
                {score.perfect ? "✓ Perfect — all captures found!" : `captures found${score.falsePos>0?`, ${score.falsePos} wrong selection${score.falsePos>1?'s':''}`:''}`}
              </div>
              <div style={{ fontSize:11, color:T.textDim, marginTop:8 }}>
                Final position: <span style={{ color:T.textBright }}>{PIECE_INFO[puzzle.trackedPiece.type].white} on {sqName(puzzle.trackedPos)}</span>
              </div>
            </div>

            {/* Reveal final board after submission */}
            <div style={{ background:T.panel, border:`1px solid ${T.panelBorder}`, borderRadius:6, padding:"14px 12px", marginBottom:16 }}>
              <div style={{ fontSize:9, color:T.accentDim, letterSpacing:3, marginBottom:10 }}>▸ FINAL POSITION</div>
              <SniperBoard
                board={puzzle.finalBoard}
                trackedFrom={puzzle.trackedPos}
                selectedBlack={selected}
                submitted={submitted}
                capturable={puzzle.capturable}
              />
            </div>

            <div style={{ textAlign:"center", marginBottom:24 }}>
              <button onClick={newPuzzle} style={{ padding:"10px 32px", border:`1px solid ${T.accent}`, borderRadius:4, background:"rgba(74,158,202,0.08)", color:T.accent, fontSize:14, fontFamily:"inherit", cursor:"pointer", fontWeight:500, letterSpacing:1, animation:"glowPulse 2s infinite" }}>NEXT PUZZLE</button>
            </div>
          </div>
        )}

        {!submitted && (
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <button onClick={() => setSubmitted(true)} style={{ padding:"10px 40px", border:`1px solid ${T.accent}`, borderRadius:4, background:"rgba(74,158,202,0.08)", color:T.accent, fontSize:14, fontFamily:"inherit", cursor:"pointer", fontWeight:500, letterSpacing:1 }}>SUBMIT</button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────


// ══════════════════════════════════════════════════════════════════════════════
// GAME 3 — BLINDFOLD COORDINATES
// ══════════════════════════════════════════════════════════════════════════════

function isLightSquare(sq) {
  // Light square if (col + row) is odd — e.g. a1=[0,0] is dark, a2=[0,1] is light
  const c = COLS.indexOf(sq[0]);
  const r = parseInt(sq[1]) - 1;
  return (c + r) % 2 === 1;
}

function randomSquare() {
  const col = COLS[Math.floor(Math.random() * 8)];
  const row = Math.floor(Math.random() * 8) + 1;
  return `${col}${row}`;
}

const COORD_MODES = { IDLE: 0, PLAYING: 1, RESULT: 2 };

function CoordinatesGame({ onHome, themeBtn }) {
  const [mode, setMode] = useState("score"); // "score" | "streak"
  const [phase, setPhase] = useState(COORD_MODES.IDLE);
  const [square, setSquare] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [results, setResults] = useState([]); // [{correct, ms}]
  const [questionStart, setQuestionStart] = useState(null);
  const [showRules, setShowRules] = useState(false);

  const TOTAL = 10;

  const nextQuestion = useCallback((currentResults) => {
    // In score mode, stop after TOTAL questions
    if (mode === "score" && currentResults.length >= TOTAL) {
      setPhase(COORD_MODES.RESULT);
      return;
    }
    setSquare(randomSquare());
    setFeedback(null);
    setQuestionStart(Date.now());
  }, [mode]);

  const startGame = useCallback(() => {
    setResults([]);
    setFeedback(null);
    setPhase(COORD_MODES.PLAYING);
    setSquare(randomSquare());
    setQuestionStart(Date.now());
  }, []);

  const answer = useCallback((guessLight) => {
    if (phase !== COORD_MODES.PLAYING || feedback !== null) return;
    const ms = Date.now() - questionStart;
    const correct = isLightSquare(square) === guessLight;
    setFeedback(correct ? "correct" : "wrong");

    if (!correct && mode === "streak") {
      // Don't add wrong answer to results — streak = current results.length
      setTimeout(() => setPhase(COORD_MODES.RESULT), 400);
      return;
    }

    const newResults = [...results, { correct, ms }];
    setResults(newResults);

    setTimeout(() => {
      nextQuestion(newResults);
    }, 400);
  }, [phase, feedback, square, questionStart, results, mode, nextQuestion]);

  // Keyboard: L = light, D = dark
  useEffect(() => {
    const handler = (e) => {
      if (phase !== COORD_MODES.PLAYING || feedback !== null) return;
      if (e.key === "l" || e.key === "L") answer(true);
      if (e.key === "d" || e.key === "D") answer(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, feedback, answer]);

  // Stats
  const correct = results.filter(r => r.correct).length;
  const avgMs = results.length ? Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length) : 0;
  const streak = results.length; // in streak mode, all results up to first wrong = streak

  const bgColor = feedback === "correct" ? T.greenDim
                : feedback === "wrong"   ? T.redDim
                : T.panel;

  return (
    <AppShell title="COORDINATES" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} themeBtn={themeBtn}
      headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}
    >
      {showRules && (
        <RulesModal onClose={() => setShowRules(false)}>
          <RuleSection title="Objective" text="A square name is shown (e.g. f6). Answer whether it is a light or dark square as fast as possible." />
          <RuleSection title="Score mode" text="Answer 10 questions. At the end you get your score and average response time." />
          <RuleSection title="Streak mode" text="Keep answering until your first mistake. Your streak length and average time are shown." />
          <RuleSection title="Controls" text="Click the Light or Dark button — or press L / D on your keyboard." />
          <RuleSection title="Tip" text="The trick: a square is light if the letter and number are both odd or both even (a1, c1, b2, d2...). Or just memorize the pattern!" />
        </RulesModal>
      )}

      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>MODE</span>
          <button onClick={() => { setMode("score"); setPhase(COORD_MODES.IDLE); }} style={chipStyle("score", mode)}>Score</button>
          <button onClick={() => { setMode("streak"); setPhase(COORD_MODES.IDLE); }} style={chipStyle("streak", mode)}>Streak</button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", flex: 1 }}>

        {/* IDLE */}
        {phase === COORD_MODES.IDLE && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: "rgba(74,158,202,0.06)", border: `1px solid rgba(74,158,202,0.2)`, borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: T.textBright }}>
                {mode === "score"
                  ? "10 squares, answer as fast as you can. Light or Dark?"
                  : "Answer until your first mistake. How long can you go?"}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={startGame} style={{
                padding: "14px 48px", border: `1px solid ${T.accent}`, borderRadius: 4,
                background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 16,
                fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                animation: "glowPulse 2s infinite",
              }}>START</button>
            </div>
          </div>
        )}

        {/* PLAYING */}
        {phase === COORD_MODES.PLAYING && square && (
          <div style={{ animation: "fadeUp 0.2s ease" }}>
            {/* Progress */}
            {mode === "score" && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 11, color: T.textDim }}>
                <span>{results.length + 1} / {TOTAL}</span>
                <span>{results.filter(r => r.correct).length} correct</span>
              </div>
            )}
            {mode === "streak" && (
              <div style={{ marginBottom: 16, fontSize: 11, color: T.textDim, textAlign: "center" }}>
                Streak: <span style={{ color: T.accent, fontWeight: 600 }}>{results.length}</span>
              </div>
            )}

            {/* Square display */}
            <div style={{
              border: `1px solid ${feedback === "correct" ? T.green : feedback === "wrong" ? T.red : T.panelBorder}`,
              borderRadius: 8, padding: "40px 20px", marginBottom: 24,
              textAlign: "center", transition: "border-color 0.15s, background 0.15s",
              background: bgColor,
            }}>
              {feedback === null && (
                <div style={{ fontSize: 56, fontWeight: 700, color: T.textBright, letterSpacing: 4 }}>{square}</div>
              )}
              {feedback === "correct" && (
                <div style={{ fontSize: 48, color: T.green }}>✓</div>
              )}
              {feedback === "wrong" && (
                <div>
                  <div style={{ fontSize: 48, color: T.red }}>✗</div>
                  <div style={{ fontSize: 13, color: T.textDim, marginTop: 8 }}>
                    {square} is <span style={{ color: T.textBright }}>{isLightSquare(square) ? "light" : "dark"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => answer(true)} disabled={feedback !== null} style={{
                flex: 1, padding: "18px", border: `1px solid ${T.boardLight}`, borderRadius: 6,
                background: "var(--btn-light-bg, rgba(240,217,181,0.15))", color: T.textBright, fontSize: 15,
                fontFamily: "inherit", cursor: feedback !== null ? "default" : "pointer",
                fontWeight: 600, letterSpacing: 1, opacity: feedback !== null ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}>
                ☀️ LIGHT
              </button>
              <button onClick={() => answer(false)} disabled={feedback !== null} style={{
                flex: 1, padding: "18px", border: `1px solid ${T.boardDark}`, borderRadius: 6,
                background: "var(--btn-dark-bg, rgba(100,60,30,0.18))", color: T.textBright, fontSize: 15,
                fontFamily: "inherit", cursor: feedback !== null ? "default" : "pointer",
                fontWeight: 600, letterSpacing: 1, opacity: feedback !== null ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}>
                🌑 DARK
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 10, color: T.textDim }}>
              or press <span style={{ color: T.text }}>L</span> / <span style={{ color: T.text }}>D</span>
            </div>
          </div>
        )}

        {/* RESULT */}
        {phase === COORD_MODES.RESULT && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{
              background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8,
              padding: "32px 24px", marginBottom: 20, textAlign: "center",
            }}>
              {mode === "score" ? (
                <>
                  <div style={{ fontSize: 11, color: T.accentDim, letterSpacing: 3, marginBottom: 16 }}>▸ SCORE</div>
                  <div style={{ fontSize: 48, fontWeight: 700, color: correct === TOTAL ? T.green : T.accent, marginBottom: 4 }}>
                    {correct} / {TOTAL}
                  </div>
                  <div style={{ fontSize: 13, color: T.text, marginBottom: 20 }}>
                    {correct === TOTAL ? "✓ Perfect!" : `${correct} correct answer${correct !== 1 ? "s" : ""}`}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: T.textBright }}>{(avgMs / 1000).toFixed(2)}s</div>
                      <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginTop: 4 }}>AVG TIME</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: T.textBright }}>{(results.reduce((s,r) => s + r.ms, 0) / 1000).toFixed(1)}s</div>
                      <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginTop: 4 }}>TOTAL TIME</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: T.accentDim, letterSpacing: 3, marginBottom: 16 }}>▸ STREAK</div>
                  <div style={{ fontSize: 64, fontWeight: 700, color: T.accent, marginBottom: 4 }}>{streak}</div>
                  <div style={{ fontSize: 13, color: T.text, marginBottom: 20 }}>
                    {streak === 0 ? "First answer was wrong!" : `${streak} correct answer${streak !== 1 ? "s" : ""} in a row`}
                  </div>
                  {streak > 0 && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: T.textBright }}>{(avgMs / 1000).toFixed(2)}s</div>
                      <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginTop: 4 }}>AVG TIME PER ANSWER</div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={startGame} style={{
                padding: "10px 40px", border: `1px solid ${T.accent}`, borderRadius: 4,
                background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 14,
                fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                animation: "glowPulse 2s infinite",
              }}>PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GAME 4 — BLINDFOLD FORK FINDER
// ══════════════════════════════════════════════════════════════════════════════

const FORK_PIECES = ["knight", "bishop"];

function forkSquares(attackerType, targets) {
  // Returns all squares from which attackerType attacks >= 2 of the target squares
  const allSq = [];
  for (let c = 0; c < 8; c++) for (let r = 0; r < 8; r++) allSq.push([c, r]);

  const targetSet = new Set(targets.map(t => sqKey(t)));

  return allSq.filter(sq => {
    // Can't fork from a square occupied by a target
    if (targetSet.has(sqKey(sq))) return false;
    const occupied = new Set(targets.map(t => sqKey(t)));
    const attacks = pieceMoves(attackerType, sq, occupied);
    const hits = attacks.filter(a => targetSet.has(sqKey(a))).length;
    return hits >= 2;
  });
}

function generateForkPuzzle() {
  const allSq = [];
  for (let c = 0; c < 8; c++) for (let r = 0; r < 8; r++) allSq.push([c, r]);

  for (let attempt = 0; attempt < 500; attempt++) {
    const attackerType = FORK_PIECES[Math.floor(Math.random() * FORK_PIECES.length)];
    const numTargets = 2;

    // Shuffle and pick target squares
    const shuffled = [...allSq].sort(() => Math.random() - 0.5);
    const targets = shuffled.slice(0, numTargets);

    // Find fork squares
    const forks = forkSquares(attackerType, targets);

    // We want puzzles where forks exist (but not too many — keep it interesting)
    // Also sometimes generate no-fork puzzles (25% of time) to keep player honest
    const hasFork = forks.length > 0;
    const wantFork = Math.random() < 0.75;

    if (hasFork !== wantFork) continue;

    return { attackerType, targets, forks, hasFork };
  }

  // Fallback: guarantee a fork exists
  const attackerType = "knight";
  const targets = [[4, 4], [6, 4]]; // e5, g5 — knight on f2/f6/d2/d6 forks both
  const forks = forkSquares(attackerType, targets);
  return { attackerType, targets, forks, hasFork: true };
}

const FORK_PHASES = { IDLE: 0, QUESTION: 1, FEEDBACK: 2, RESULT: 3 };
const FORK_TOTAL = 5;

function ForkGame({ onHome, themeBtn }) {
  const [mode, setMode] = useState("score");
  const [phase, setPhase] = useState(FORK_PHASES.IDLE);
  const [puzzle, setPuzzle] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState(null); // null | { correct, userSq, message }
  const [results, setResults] = useState([]);
  const [questionStart, setQuestionStart] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const inputRef = useRef(null);

  const nextQuestion = useCallback((currentResults) => {
    if (mode === "score" && currentResults.length >= FORK_TOTAL) {
      setPhase(FORK_PHASES.RESULT);
      return;
    }
    setPuzzle(generateForkPuzzle());
    setInputValue("");
    setFeedback(null);
    setPhase(FORK_PHASES.QUESTION);
    setQuestionStart(Date.now());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [mode]);

  const startGame = useCallback(() => {
    setResults([]);
    setFeedback(null);
    setInputValue("");
    nextQuestion([]);
  }, [nextQuestion]);

  const [pendingResults, setPendingResults] = useState(null); // stored when waiting for user to click Next

  const submit = useCallback(() => {
    if (!puzzle || phase !== FORK_PHASES.QUESTION) return;
    const ms = Date.now() - questionStart;
    const raw = inputValue.trim().toLowerCase();

    // "no" / "none" answer
    if (raw === "no" || raw === "none" || raw === "-") {
      const correct = !puzzle.hasFork;
      const newResults = [...results, { correct, ms }];
      setResults(newResults);
      setFeedback({
        correct,
        message: correct
          ? "✓ Correct — no fork exists."
          : `✗ A fork existed! e.g. ${sqName(puzzle.forks[0])}`,
      });
      setPhase(FORK_PHASES.FEEDBACK);
      if (!correct && mode === "score") { setPendingResults(newResults); return; }
      if (!correct && mode === "streak") return;
      setTimeout(() => nextQuestion(newResults), 1200);
      return;
    }

    // Square answer
    const sq = parseSq(raw);
    if (!sq) {
      setFeedback({ correct: false, message: `"${raw}" is not a valid square. Type a square (e.g. f4) or "no".` });
      setPhase(FORK_PHASES.FEEDBACK);
      setTimeout(() => {
        setFeedback(null);
        setPhase(FORK_PHASES.QUESTION);
        setTimeout(() => inputRef.current?.focus(), 50);
      }, 1500);
      return;
    }

    // Check if the square is actually a fork
    const isFork = puzzle.forks.some(f => sqKey(f) === sqKey(sq));
    const correct = isFork;
    const newResults = [...results, { correct, ms }];
    setResults(newResults);

    let message;
    if (correct) {
      const hits = puzzle.targets.filter(t => {
        const occ = new Set(puzzle.targets.map(t2 => sqKey(t2)));
        return pieceMoves(puzzle.attackerType, sq, occ).some(a => sqKey(a) === sqKey(t));
      });
      message = `✓ ${sqName(sq)} forks ${hits.map(sqName).join(" and ")}!`;
    } else if (!puzzle.hasFork) {
      message = `✗ No fork exists from ${sqName(sq)} — and there's no fork on this board.`;
    } else {
      message = `✗ ${sqName(sq)} doesn't fork. Try ${sqName(puzzle.forks[0])}.`;
    }

    setFeedback({ correct, message });
    setPhase(FORK_PHASES.FEEDBACK);

    if (!correct && mode === "score") { setPendingResults(newResults); return; }
    if (!correct && mode === "streak") return;
    setTimeout(() => nextQuestion(newResults), 1200);
  }, [puzzle, phase, inputValue, questionStart, results, mode, nextQuestion]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") submit();
  }, [submit]);  const correct = results.filter(r => r.correct).length;
  const avgMs = results.length ? Math.round(results.reduce((s, r) => s + r.ms, 0) / results.length) : 0;
  const streak = results.length;

  // When streak ends — let user read feedback before showing result

  return (
    <AppShell title="FORK FINDER" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} themeBtn={themeBtn}
      headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}
    >
      {showRules && (
        <RulesModal onClose={() => setShowRules(false)}>
          <RuleSection title="Objective" text="A white piece type and 2 black pieces (with their squares) are given. Find a square from which your piece attacks both black pieces simultaneously — a fork." />
          <RuleSection title="Answering" text='Type the fork square (e.g. "f4") and press Enter or ✓. If no fork exists, click "No fork".' />
          <RuleSection title="Multiple forks" text="If several fork squares exist, any valid one is accepted. The total number of solutions is shown after each question." />
          <RuleSection title="Score mode" text="10 questions. Score and average response time shown at the end." />
          <RuleSection title="Streak mode" text="Answer until your first mistake. Your streak and average time are shown." />
          <RuleSection title="Pieces" text="Only knights and bishops appear as the attacking piece. The bishop is blocked by other pieces when checking attacks." />
        </RulesModal>
      )}

      {/* Config */}
      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>MODE</span>
          <button onClick={() => { setMode("score"); setPhase(FORK_PHASES.IDLE); }} style={chipStyle("score", mode)}>Score</button>
          <button onClick={() => { setMode("streak"); setPhase(FORK_PHASES.IDLE); }} style={chipStyle("streak", mode)}>Streak</button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", flex: 1 }}>

        {/* IDLE */}
        {phase === FORK_PHASES.IDLE && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ background: "rgba(74,158,202,0.06)", border: `1px solid rgba(74,158,202,0.2)`, borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: T.textBright }}>
                {mode === "score"
                  ? "5 puzzles. Find the fork square, or answer \"no\" if none exists."
                  : "Keep going until your first mistake. How long is your streak?"}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={startGame} style={{
                padding: "14px 48px", border: `1px solid ${T.accent}`, borderRadius: 4,
                background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 16,
                fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                animation: "glowPulse 2s infinite",
              }}>START</button>
            </div>
          </div>
        )}

        {/* QUESTION / FEEDBACK */}
        {(phase === FORK_PHASES.QUESTION || phase === FORK_PHASES.FEEDBACK) && puzzle && (
          <div style={{ animation: "fadeUp 0.2s ease" }}>
            {/* Progress */}
            {mode === "score" && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 11, color: T.textDim }}>
                <span>{results.length + (phase === FORK_PHASES.FEEDBACK ? 0 : 0) + 1} / {FORK_TOTAL}</span>
                <span>{correct} correct</span>
              </div>
            )}
            {mode === "streak" && (
              <div style={{ marginBottom: 14, fontSize: 11, color: T.textDim, textAlign: "center" }}>
                Streak: <span style={{ color: T.accent, fontWeight: 600 }}>{streak}</span>
              </div>
            )}

            {/* Puzzle */}
            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "20px 24px", marginBottom: 16 }}>
              <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 14 }}>▸ POSITION</div>
              <div style={{ fontSize: 14, color: T.textBright, marginBottom: 12 }}>
                <span style={{ color: T.accent }}>{PIECE_INFO[puzzle.attackerType].white} {PIECE_INFO[puzzle.attackerType].name}</span>
                {" — find a fork square"}
              </div>
              <div style={{ fontSize: 13, color: T.text, lineHeight: 2 }}>
                {puzzle.targets.map((t, i) => {
                  const pieceName = i === 0 ? "King" : "Queen";
                  const pieceSymbol = i === 0 ? "♚" : "♛";
                  return (
                    <span key={i}>
                      {i > 0 && <span style={{ color: T.textDim }}>,  </span>}
                      <span style={{ color: T.red }}>{pieceSymbol} {pieceName} {sqName(t)}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  background: feedback.correct ? T.greenDim : T.redDim,
                  border: `1px solid ${feedback.correct ? "rgba(60,168,104,0.3)" : "rgba(224,85,85,0.3)"}`,
                  borderRadius: 6, padding: "12px 16px",
                  fontSize: 13, color: feedback.correct ? T.green : T.red,
                  marginBottom: !feedback.correct ? 10 : 0,
                }}>
                  {feedback.message}
                  {feedback.correct && puzzle.forks.length > 1 && (
                    <span style={{ color: T.textDim, fontSize: 11 }}> ({puzzle.forks.length} solutions total)</span>
                  )}
                </div>

                {/* Mini board on wrong answer */}
                {!feedback.correct && (
                  <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "12px" }}>
                    <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 8 }}>▸ SOLUTION</div>
                    {(() => {
                      const targetSet = new Set(puzzle.targets.map(t => sqKey(t)));
                      const forkSet   = new Set(puzzle.forks.map(f => sqKey(f)));
                      // Alternate king/queen for black pieces
                      const targetPieces = ['king', 'queen'];
                      const targetArr = puzzle.targets.map((t, i) => ({ sq: t, type: targetPieces[i % 2] }));
                      const targetPieceMap = new Map(targetArr.map(({ sq, type }) => [sqKey(sq), type]));
                      const rows = [];
                      for (let r = 7; r >= 0; r--) {
                        const cells = [];
                        for (let c = 0; c < 8; c++) {
                          const light = (c + r) % 2 === 1;
                          const k = sqKey([c, r]);
                          const isTarget = targetSet.has(k);
                          const isFork   = forkSet.has(k);
                          let bg = light ? T.boardLight : T.boardDark;
                          if (isFork)   bg = light ? '#8aad7a' : '#5a8a5a';
                          if (isTarget) bg = light ? '#c47060' : '#8a4040';
                          cells.push(
                            <div key={k} style={{ position: "relative", width: "100%", paddingBottom: "100%" }}>
                              <div style={{ position: "absolute", inset: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isTarget && <ChessPiece type={targetPieceMap.get(k)} color="black" />}
                                {isFork && !isTarget && <ChessPiece type={puzzle.attackerType} color="white" />}
                              </div>
                            </div>
                          );
                        }
                        rows.push(
                          <div key={r} style={{ display: "flex", alignItems: "center" }}>
                            <span style={{ width: 14, textAlign: "center", fontSize: 9, color: T.textDim }}>{r+1}</span>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", flex: 1 }}>{cells}</div>
                          </div>
                        );
                      }
                      return (
                        <div>
                          {rows}
                          <div style={{ display: "flex", marginLeft: 14 }}>
                            {COLS.split("").map(l => <div key={l} style={{ flex: 1, textAlign: "center", fontSize: 9, color: T.textDim, paddingTop: 2 }}>{l}</div>)}
                          </div>
                          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 10, color: T.textDim }}>
                            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#c47060", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />black pieces</span>
                            <span><span style={{ display: "inline-block", width: 10, height: 10, background: "#8aad7a", borderRadius: 2, marginRight: 4, verticalAlign: "middle" }} />fork square{puzzle.forks.length > 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ textAlign: "center", marginTop: 14 }}>
                      {mode === "score" && (
                        <button onClick={() => { setPendingResults(null); nextQuestion(pendingResults); }} style={{
                          padding: "9px 32px", border: `1px solid ${T.accent}`, borderRadius: 4,
                          background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 13,
                          fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                        }}>NEXT →</button>
                      )}
                      {mode === "streak" && (
                        <button onClick={() => setPhase(FORK_PHASES.RESULT)} style={{
                          padding: "9px 32px", border: `1px solid ${T.accent}`, borderRadius: 4,
                          background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 13,
                          fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                        }}>SEE RESULTS →</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            {phase === FORK_PHASES.QUESTION && (
              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "16px 20px" }}>
                <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 10 }}>▸ YOUR ANSWER</div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 10 }}>
                  Type the fork square (e.g. <span style={{ color: T.text }}>f4</span>)
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input ref={inputRef} value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. f4"
                    style={{
                      flex: 1, padding: "10px 14px", background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${T.panelBorder}`, borderRadius: 4,
                      color: T.textBright, fontSize: 15, fontFamily: "inherit", letterSpacing: 1.5,
                    }}
                  />
                  <button onClick={submit} style={{
                    padding: "10px 20px", border: "none", borderRadius: 4,
                    background: T.accent, color: T.bg, fontSize: 13,
                    fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  }}>✓</button>
                  <button onClick={() => {
                    if (!puzzle || phase !== FORK_PHASES.QUESTION) return;
                    const ms = Date.now() - questionStart;
                    const correct = !puzzle.hasFork;
                    const newResults = [...results, { correct, ms }];
                    setResults(newResults);
                    setFeedback({
                      correct,
                      message: correct ? "✓ Correct — no fork exists." : `✗ A fork existed! e.g. ${sqName(puzzle.forks[0])}`,
                    });
                    setPhase(FORK_PHASES.FEEDBACK);
                    if (!correct && mode === "score") { setPendingResults(newResults); return; }
                    if (!correct && mode === "streak") return;
                    setTimeout(() => nextQuestion(newResults), 1200);
                  }} style={{
                    padding: "10px 14px", border: `1px solid ${T.accent}`, borderRadius: 4,
                    background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 12,
                    fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap", fontWeight: 600,
                  }}>No fork</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {phase === FORK_PHASES.RESULT && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{
              background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8,
              padding: "32px 24px", marginBottom: 20, textAlign: "center",
            }}>
              {mode === "score" ? (
                <>
                  <div style={{ fontSize: 11, color: T.accentDim, letterSpacing: 3, marginBottom: 16 }}>▸ SCORE</div>
                  <div style={{ fontSize: 48, fontWeight: 700, color: correct === FORK_TOTAL ? T.green : T.accent, marginBottom: 4 }}>
                    {correct} / {FORK_TOTAL}
                  </div>
                  <div style={{ fontSize: 13, color: T.text, marginBottom: 20 }}>
                    {correct === FORK_TOTAL ? "✓ Perfect!" : `${correct} correct answer${correct !== 1 ? "s" : ""}`}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 32 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: T.textBright }}>{(avgMs / 1000).toFixed(2)}s</div>
                      <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginTop: 4 }}>AVG TIME</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: T.textBright }}>{(results.reduce((s, r) => s + r.ms, 0) / 1000).toFixed(1)}s</div>
                      <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginTop: 4 }}>TOTAL TIME</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: T.accentDim, letterSpacing: 3, marginBottom: 16 }}>▸ STREAK</div>
                  <div style={{ fontSize: 64, fontWeight: 700, color: T.accent, marginBottom: 4 }}>{streak}</div>
                  <div style={{ fontSize: 13, color: T.text, marginBottom: 20 }}>
                    {streak === 0 ? "First answer was wrong!" : `${streak} correct answer${streak !== 1 ? "s" : ""} in a row`}
                  </div>
                  {streak > 0 && (
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: T.textBright }}>{(avgMs / 1000).toFixed(2)}s</div>
                      <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 1, marginTop: 4 }}>AVG TIME PER ANSWER</div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={startGame} style={{
                padding: "10px 40px", border: `1px solid ${T.accent}`, borderRadius: 4,
                background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 14,
                fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                animation: "glowPulse 2s infinite",
              }}>PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GAME 5 — BLINDFOLD MATE IN ONE (Lichess puzzles)
// ══════════════════════════════════════════════════════════════════════════════

const MATE_PIECE_SYMBOLS = {
  white: { king:'♔', queen:'♕', rook:'♖', bishop:'♗', knight:'♘', pawn:'♙' },
  black: { king:'♚', queen:'♛', rook:'♜', bishop:'♝', knight:'♞', pawn:'♟' },
};

const MATE_DIFFICULTIES = {
  easy:   { label: "Easy",   desc: "≤ 5 pieces"  },
  medium: { label: "Medium", desc: "6–10 pieces" },
  hard:   { label: "Hard",   desc: "11–15 pieces"},
};

// Parse FEN into a ce_ board state
function fenToState(fen) {
  const parts = fen.split(' ');
  const rows = parts[0].split('/');
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  const typeMap = { k:'king', q:'queen', r:'rook', b:'bishop', n:'knight', p:'pawn' };

  for (let r = 0; r < 8; r++) {
    let c = 0;
    for (const ch of rows[7 - r]) { // FEN rank 8 = row index 7
      if (/\d/.test(ch)) { c += parseInt(ch); }
      else {
        const color = ch === ch.toUpperCase() ? 'white' : 'black';
        board[r][c] = { type: typeMap[ch.toLowerCase()], color };
        c++;
      }
    }
  }

  const turn = parts[1] === 'w' ? 'white' : 'black';
  const castling = parts[2] || '-';
  const epStr = parts[3];
  const enPassant = epStr !== '-' ? [CE_FILES.indexOf(epStr[0]), parseInt(epStr[1]) - 1] : null;

  return {
    board,
    turn,
    castling: {
      wk: castling.includes('K'),
      wq: castling.includes('Q'),
      bk: castling.includes('k'),
      bq: castling.includes('q'),
    },
    enPassant,
    halfmove: parseInt(parts[4]) || 0,
    fullmove: parseInt(parts[5]) || 1,
  };
}

function boardToText(board) {
  const white = [], black = [];
  const order = { king:0, queen:1, rook:2, bishop:3, knight:4, pawn:5 };
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (!p) continue;
    const entry = `${MATE_PIECE_SYMBOLS[p.color][p.type]} ${ce_sqStr([c,r])}`;
    (p.color === 'white' ? white : black).push({ type: p.type, entry });
  }
  white.sort((a,b) => order[a.type] - order[b.type]);
  black.sort((a,b) => order[a.type] - order[b.type]);
  return {
    white: white.map(p => p.entry).join('  '),
    black: black.map(p => p.entry).join('  '),
  };
}

function findMatingMoves(state) {
  return ce_allLegalMoves(state).filter(m => {
    const next = ce_applyMove(state, m);
    return ce_gameStatus(next) === 'checkmate';
  });
}

// Real mate-in-1 positions, organized by difficulty (rating approximation)
// FEN is the position where the side to move delivers checkmate in 1
// Format: [fen, rating]
// All positions verified: the side to move has exactly one (or more) mating move(s)
// Puzzles inlined at build time — also fetchable from public/puzzles.json in Vite builds
const _INLINE_PUZZLES = {"easy":[{"id":"1JpdQ","mates":["Qg6#"],"turn":"black","pieces":4,"rating":1177,"white":"♔ King h7  ♕ Queen h8","black":"♚ King f5  ♛ Queen g1"},{"id":"0K4Eq","mates":["Rh1#"],"turn":"black","pieces":5,"rating":840,"white":"♔ King e1  ♖ Rook a5  ♙ Pawn a7","black":"♚ King e3  ♜ Rook h7"},{"id":"1gvcb","mates":["e8=Q#","e8=R#"],"turn":"white","pieces":5,"rating":856,"white":"♔ King g6  ♙ Pawn e7","black":"♚ King g8  ♞ Knight b7  ♟ Pawn f6"},{"id":"1paby","mates":["Rd1#"],"turn":"white","pieces":4,"rating":945,"white":"♔ King g3  ♖ Rook d2","black":"♚ King g1  ♛ Queen h1"},{"id":"0X5EW","mates":["Ra8#"],"turn":"white","pieces":5,"rating":542,"white":"♔ King f6  ♖ Rook a4","black":"♚ King f8  ♜ Rook g7  ♟ Pawn e3"},{"id":"0d7gs","mates":["Ra8#"],"turn":"white","pieces":5,"rating":447,"white":"♔ King c6  ♖ Rook c8","black":"♚ King a6  ♛ Queen d3  ♜ Rook e3"},{"id":"11tqt","mates":["Rh5#"],"turn":"black","pieces":4,"rating":1158,"white":"♔ King h8  ♖ Rook g8","black":"♚ King f6  ♜ Rook d5"},{"id":"0lKuy","mates":["h7#"],"turn":"white","pieces":5,"rating":857,"white":"♔ King g6  ♙ Pawn g7, h6","black":"♚ King g8  ♝ Bishop e5"},{"id":"0UzJM","mates":["Qd5#"],"turn":"black","pieces":5,"rating":1101,"white":"♔ King e4  ♕ Queen e3  ♙ Pawn f4","black":"♚ King d6  ♛ Queen h5"},{"id":"1dA1H","mates":["Rh1#"],"turn":"black","pieces":4,"rating":1002,"white":"♔ King c1  ♖ Rook a1","black":"♚ King c3  ♜ Rook h2"},{"id":"0Kakp","mates":["Qd2#"],"turn":"white","pieces":5,"rating":943,"white":"♔ King e3  ♕ Queen a2","black":"♚ King d1  ♛ Queen c7  ♜ Rook f4"},{"id":"22VFO","mates":["Rh3#"],"turn":"black","pieces":4,"rating":630,"white":"♔ King h5  ♕ Queen g8","black":"♚ King f5  ♜ Rook a3"},{"id":"09kuV","mates":["Ra8#"],"turn":"white","pieces":5,"rating":1219,"white":"♔ King e6  ♖ Rook a2","black":"♚ King f8  ♜ Rook g1  ♟ Pawn g7"},{"id":"1CEnO","mates":["Rh4#"],"turn":"white","pieces":5,"rating":726,"white":"♔ King g5  ♖ Rook f4","black":"♚ King h3  ♜ Rook g2  ♟ Pawn g3"},{"id":"1dXXW","mates":["Rh5#"],"turn":"black","pieces":4,"rating":1274,"white":"♔ King h7  ♕ Queen g8","black":"♚ King f6  ♜ Rook g5"},{"id":"0zeIA","mates":["Ra8#"],"turn":"black","pieces":4,"rating":573,"white":"♔ King h8  ♖ Rook h7","black":"♚ King f6  ♜ Rook a6"},{"id":"0viWP","mates":["Rh5#"],"turn":"black","pieces":5,"rating":726,"white":"♔ King h3  ♖ Rook b1  ♙ Pawn b4","black":"♚ King f3  ♜ Rook b5"},{"id":"1LD8O","mates":["Rh1#"],"turn":"black","pieces":5,"rating":529,"white":"♔ King f1  ♖ Rook a5  ♘ Knight f6","black":"♚ King f3  ♜ Rook h3"},{"id":"00T85","mates":["Qd2#"],"turn":"white","pieces":4,"rating":1041,"white":"♔ King e3  ♕ Queen f2","black":"♚ King c1  ♛ Queen b1"},{"id":"0iGD5","mates":["Rc1#"],"turn":"black","pieces":5,"rating":1091,"white":"♔ King g1  ♖ Rook h8  ♙ Pawn h5","black":"♚ King g3  ♜ Rook c2"},{"id":"2MMsr","mates":["Rh8#"],"turn":"black","pieces":5,"rating":544,"white":"♔ King h6  ♖ Rook h4  ♙ Pawn h3","black":"♚ King f6  ♜ Rook b8"},{"id":"1izER","mates":["Rh6#"],"turn":"black","pieces":4,"rating":682,"white":"♔ King h1  ♖ Rook g1","black":"♚ King f3  ♜ Rook f6"},{"id":"0AsAa","mates":["Rh4#"],"turn":"white","pieces":5,"rating":727,"white":"♔ King f7  ♖ Rook f4","black":"♚ King h8  ♜ Rook a1  ♟ Pawn a4"},{"id":"04I75","mates":["Rc8#"],"turn":"white","pieces":5,"rating":1185,"white":"♔ King f6  ♖ Rook c7","black":"♚ King f8  ♜ Rook g4  ♟ Pawn h6"},{"id":"0JB1V","mates":["Qg4#"],"turn":"black","pieces":4,"rating":1141,"white":"♔ King h4  ♕ Queen h8","black":"♚ King f5  ♛ Queen g6"},{"id":"0prgs","mates":["Rh1#"],"turn":"white","pieces":5,"rating":1186,"white":"♔ King d3  ♖ Rook h8","black":"♚ King d1  ♜ Rook c7  ♟ Pawn c3"},{"id":"07rDL","mates":["Ra8#"],"turn":"black","pieces":4,"rating":940,"white":"♔ King c8  ♕ Queen d8","black":"♚ King c6  ♜ Rook a7"},{"id":"1uUQc","mates":["d2#"],"turn":"black","pieces":5,"rating":519,"white":"♔ King e1  ♕ Queen g8","black":"♚ King e3  ♟ Pawn d3, e2"},{"id":"2FDOe","mates":["Qh3#"],"turn":"white","pieces":4,"rating":966,"white":"♔ King h4  ♕ Queen f3","black":"♚ King h2  ♛ Queen g1"},{"id":"1r3h1","mates":["Qxa4#"],"turn":"white","pieces":5,"rating":1021,"white":"♔ King c1  ♕ Queen a7","black":"♚ King a2  ♛ Queen e5  ♟ Pawn a4"},{"id":"1U5pu","mates":["Rh8#"],"turn":"black","pieces":5,"rating":929,"white":"♔ King h5  ♖ Rook b5  ♙ Pawn g6","black":"♚ King f4  ♜ Rook g8"},{"id":"1NCWI","mates":["Qg2#"],"turn":"white","pieces":5,"rating":857,"white":"♔ King f1  ♕ Queen g7","black":"♚ King h3  ♛ Queen h4  ♟ Pawn f4"},{"id":"2Hegp","mates":["Qg2#"],"turn":"white","pieces":4,"rating":1361,"white":"♔ King h3  ♕ Queen e4","black":"♚ King f1  ♛ Queen e1"},{"id":"0iLIf","mates":["Qa6#"],"turn":"black","pieces":4,"rating":1049,"white":"♔ King a7  ♕ Queen b8","black":"♚ King a5  ♛ Queen c6"},{"id":"0pIc1","mates":["Rh8#"],"turn":"white","pieces":5,"rating":969,"white":"♔ King b6  ♖ Rook h7","black":"♚ King b8  ♜ Rook a4  ♝ Bishop e4"},{"id":"1wuYb","mates":["Qa6#"],"turn":"black","pieces":4,"rating":953,"white":"♔ King a7  ♕ Queen b8","black":"♚ King a5  ♛ Queen f6"},{"id":"02Fvr","mates":["Ra8#"],"turn":"black","pieces":4,"rating":1074,"white":"♔ King f8  ♕ Queen g8","black":"♚ King f6  ♜ Rook a7"},{"id":"29phf","mates":["Ra8#"],"turn":"black","pieces":5,"rating":1252,"white":"♔ King f8  ♖ Rook g5  ♙ Pawn g7","black":"♚ King f6  ♜ Rook a2"},{"id":"12UY0","mates":["Rxc1#"],"turn":"black","pieces":4,"rating":530,"white":"♔ King a1  ♖ Rook c1","black":"♚ King a3  ♜ Rook c4"},{"id":"0Og6f","mates":["Rf8#"],"turn":"white","pieces":5,"rating":1075,"white":"♔ King g6  ♖ Rook f1  ♗ Bishop h7","black":"♚ King h8  ♛ Queen d1"},{"id":"1g2TF","mates":["Nxb3#"],"turn":"black","pieces":5,"rating":1163,"white":"♔ King a1  ♖ Rook b3","black":"♚ King a3  ♞ Knight d2  ♟ Pawn a2"},{"id":"0WNbo","mates":["Qe8#"],"turn":"black","pieces":5,"rating":914,"white":"♔ King f7  ♕ Queen f6  ♙ Pawn g7","black":"♚ King d7  ♛ Queen a8"},{"id":"0v417","mates":["Qe1#"],"turn":"white","pieces":4,"rating":1328,"white":"♔ King d3  ♕ Queen b4","black":"♚ King c1  ♛ Queen b2"},{"id":"0iMlo","mates":["Qxg8#"],"turn":"black","pieces":4,"rating":614,"white":"♔ King h8  ♕ Queen g8","black":"♚ King f7  ♛ Queen g2"},{"id":"1EXnU","mates":["Ra8#"],"turn":"black","pieces":4,"rating":735,"white":"♔ King f8  ♕ Queen g8","black":"♚ King f6  ♜ Rook a4"},{"id":"2DScx","mates":["Ra1#"],"turn":"white","pieces":5,"rating":817,"white":"♔ King e3  ♖ Rook a7","black":"♚ King g1  ♜ Rook g2  ♟ Pawn h2"},{"id":"20CEa","mates":["Qb8#"],"turn":"black","pieces":5,"rating":866,"white":"♔ King d8  ♕ Queen e7  ♙ Pawn d7","black":"♚ King d3  ♛ Queen b5"},{"id":"01vlx","mates":["g3#"],"turn":"white","pieces":5,"rating":1249,"white":"♔ King f4  ♙ Pawn g2","black":"♚ King h4  ♟ Pawn h3, h5"},{"id":"21ciI","mates":["Rh2#"],"turn":"black","pieces":5,"rating":1161,"white":"♔ King h4  ♖ Rook d1  ♙ Pawn g5","black":"♚ King f3  ♜ Rook a2"},{"id":"1ZlXB","mates":["Rh8#"],"turn":"white","pieces":4,"rating":886,"white":"♔ King f5  ♖ Rook d8","black":"♚ King h5  ♜ Rook a4"},{"id":"04jun","mates":["Rh8#"],"turn":"white","pieces":5,"rating":764,"white":"♔ King f1  ♖ Rook b8","black":"♚ King h2  ♜ Rook a2  ♟ Pawn g3"},{"id":"28Bgo","mates":["Ra8#"],"turn":"black","pieces":4,"rating":673,"white":"♔ King h8  ♖ Rook h7","black":"♚ King f6  ♜ Rook a1"},{"id":"1lFlr","mates":["Qxb2#"],"turn":"white","pieces":4,"rating":1030,"white":"♔ King b3  ♕ Queen d2","black":"♚ King b1  ♛ Queen b2"},{"id":"0mRia","mates":["Rh8#"],"turn":"white","pieces":5,"rating":520,"white":"♔ King f6  ♖ Rook h3","black":"♚ King f8  ♜ Rook f4  ♟ Pawn f5"},{"id":"0hGc1","mates":["Rh8#"],"turn":"black","pieces":5,"rating":626,"white":"♔ King c8  ♖ Rook b1  ♙ Pawn c7","black":"♚ King c6  ♜ Rook h2"},{"id":"2Iw5a","mates":["Rb8#"],"turn":"white","pieces":4,"rating":735,"white":"♔ King g6  ♖ Rook b7","black":"♚ King h8  ♜ Rook a5"},{"id":"23OcW","mates":["Qc1#"],"turn":"black","pieces":5,"rating":824,"white":"♔ King d2  ♕ Queen e2  ♖ Rook d3","black":"♚ King b1  ♛ Queen g1"},{"id":"05gQQ","mates":["Rd1#"],"turn":"black","pieces":4,"rating":430,"white":"♔ King h1  ♖ Rook h2","black":"♚ King f3  ♜ Rook d3"},{"id":"2CLuM","mates":["Rh8#"],"turn":"white","pieces":4,"rating":592,"white":"♔ King c6  ♖ Rook h3","black":"♚ King a8  ♜ Rook a7"},{"id":"1xcwE","mates":["Ra2#"],"turn":"black","pieces":4,"rating":1071,"white":"♔ King a5  ♖ Rook h6","black":"♚ King c5  ♜ Rook b2"},{"id":"2FKQK","mates":["Rf1#"],"turn":"black","pieces":5,"rating":549,"white":"♔ King d1  ♕ Queen e5","black":"♚ King d3  ♜ Rook f3  ♟ Pawn e4"},{"id":"0pkR7","mates":["Ra1#"],"turn":"white","pieces":4,"rating":834,"white":"♔ King f3  ♖ Rook a8","black":"♚ King f1  ♜ Rook h1"},{"id":"1buai","mates":["Rh3#"],"turn":"black","pieces":5,"rating":1023,"white":"♔ King h6  ♖ Rook f1  ♙ Pawn f5","black":"♚ King f6  ♜ Rook g3"},{"id":"0lNdq","mates":["Rh1#"],"turn":"black","pieces":5,"rating":632,"white":"♔ King h5  ♕ Queen h8  ♙ Pawn g7","black":"♚ King f5  ♜ Rook a1"},{"id":"0Z647","mates":["Ra6#"],"turn":"white","pieces":5,"rating":716,"white":"♔ King c3  ♖ Rook e6","black":"♚ King a4  ♜ Rook h4  ♟ Pawn b5"},{"id":"09rCC","mates":["Qh2#"],"turn":"white","pieces":4,"rating":1103,"white":"♔ King g3  ♕ Queen h3","black":"♚ King g1  ♛ Queen f1"},{"id":"1u8Vs","mates":["Qh5#"],"turn":"black","pieces":5,"rating":1093,"white":"♔ King h4  ♕ Queen g8  ♙ Pawn g3","black":"♚ King h6  ♛ Queen d1"},{"id":"1vnPz","mates":["Rh1#"],"turn":"black","pieces":4,"rating":1046,"white":"♔ King d1  ♖ Rook a5","black":"♚ King d3  ♜ Rook h2"},{"id":"1gQAC","mates":["Rh1#"],"turn":"white","pieces":4,"rating":644,"white":"♔ King f4  ♖ Rook b1","black":"♚ King h4  ♜ Rook g5"},{"id":"13cu4","mates":["Ra8#"],"turn":"black","pieces":4,"rating":594,"white":"♔ King a4  ♖ Rook b2","black":"♚ King c4  ♜ Rook h8"},{"id":"0CTuf","mates":["Ra1#"],"turn":"black","pieces":5,"rating":1040,"white":"♔ King e1  ♖ Rook b5  ♙ Pawn b4","black":"♚ King e3  ♜ Rook a2"},{"id":"1dylC","mates":["Rh8#"],"turn":"black","pieces":5,"rating":728,"white":"♔ King h6  ♖ Rook h5  ♙ Pawn f5","black":"♚ King f6  ♜ Rook b8"},{"id":"1jNl1","mates":["Qc3#"],"turn":"white","pieces":5,"rating":1258,"white":"♔ King c4  ♕ Queen a5","black":"♚ King b2  ♛ Queen b1  ♟ Pawn a2"},{"id":"1gobX","mates":["Rxh3#"],"turn":"black","pieces":4,"rating":450,"white":"♔ King h5  ♖ Rook h3","black":"♚ King f5  ♜ Rook f3"},{"id":"0y5z2","mates":["Ra8#"],"turn":"white","pieces":4,"rating":598,"white":"♔ King c3  ♖ Rook c8","black":"♚ King a3  ♛ Queen b1"},{"id":"02Qrx","mates":["Rh4#"],"turn":"black","pieces":5,"rating":650,"white":"♔ King h6  ♕ Queen g8  ♖ Rook c7","black":"♚ King f6  ♜ Rook b4"},{"id":"0E6H0","mates":["Rh1#"],"turn":"black","pieces":5,"rating":1470,"white":"♔ King h6  ♖ Rook a7  ♙ Pawn g7","black":"♚ King f6  ♜ Rook g1"},{"id":"27sIk","mates":["Rh7#"],"turn":"black","pieces":4,"rating":526,"white":"♔ King h4  ♖ Rook d8","black":"♚ King f4  ♜ Rook f7"},{"id":"12EOZ","mates":["Re1#"],"turn":"white","pieces":5,"rating":921,"white":"♔ King c3  ♖ Rook e2","black":"♚ King c1  ♛ Queen b1  ♝ Bishop g8"},{"id":"1hXlF","mates":["Qxb8#"],"turn":"black","pieces":5,"rating":722,"white":"♔ King a8  ♕ Queen b8  ♙ Pawn c5","black":"♚ King c7  ♛ Queen g8"},{"id":"1Zh8t","mates":["Rc8#"],"turn":"white","pieces":4,"rating":1172,"white":"♔ King e6  ♖ Rook c7","black":"♚ King e8  ♜ Rook f1"},{"id":"2JOI4","mates":["Qf7#"],"turn":"black","pieces":4,"rating":1181,"white":"♔ King g8  ♕ Queen h8","black":"♚ King e6  ♛ Queen f6"},{"id":"0CZgJ","mates":["Qf8#"],"turn":"white","pieces":5,"rating":833,"white":"♔ King e7  ♕ Queen a8","black":"♚ King g7  ♛ Queen g6  ♟ Pawn h7"},{"id":"2J6Nz","mates":["g2#"],"turn":"black","pieces":5,"rating":1021,"white":"♔ King h1  ♖ Rook f1","black":"♚ King h3  ♟ Pawn g3, h2"},{"id":"1qd2q","mates":["Qd7#"],"turn":"black","pieces":4,"rating":1088,"white":"♔ King e8  ♕ Queen f8","black":"♚ King c6  ♛ Queen d6"},{"id":"2N1Ec","mates":["Rh8#"],"turn":"white","pieces":5,"rating":616,"white":"♔ King f2  ♖ Rook e8","black":"♚ King h4  ♜ Rook g4  ♟ Pawn g5"},{"id":"0qJti","mates":["Ra8#"],"turn":"white","pieces":4,"rating":541,"white":"♔ King g6  ♖ Rook a2","black":"♚ King h8  ♜ Rook h7"},{"id":"1hzSw","mates":["b7#"],"turn":"white","pieces":5,"rating":508,"white":"♔ King a6  ♙ Pawn a7, b6","black":"♚ King a8  ♜ Rook c8"},{"id":"0uK8w","mates":["Ra8#"],"turn":"black","pieces":4,"rating":752,"white":"♔ King f8  ♕ Queen g8","black":"♚ King f6  ♜ Rook a3"},{"id":"1l0wb","mates":["Rxc8#"],"turn":"black","pieces":4,"rating":773,"white":"♔ King e8  ♕ Queen c8","black":"♚ King e6  ♜ Rook a8"},{"id":"1jBZE","mates":["Rd8#"],"turn":"black","pieces":4,"rating":1039,"white":"♔ King g8  ♕ Queen h8","black":"♚ King g6  ♜ Rook d5"},{"id":"1eJ1Q","mates":["f2#"],"turn":"black","pieces":5,"rating":830,"white":"♔ King e1  ♕ Queen g8","black":"♚ King e3  ♟ Pawn e2, f3"},{"id":"14g3r","mates":["Ra1#"],"turn":"white","pieces":4,"rating":1157,"white":"♔ King f3  ♖ Rook a2","black":"♚ King f1  ♛ Queen g1"},{"id":"1PQIH","mates":["Rc8#"],"turn":"black","pieces":4,"rating":1074,"white":"♔ King g8  ♕ Queen h8","black":"♚ King g6  ♜ Rook c7"},{"id":"1hOzn","mates":["Ra1#"],"turn":"white","pieces":5,"rating":979,"white":"♔ King f3  ♖ Rook a2","black":"♚ King f1  ♛ Queen g1  ♟ Pawn f5"},{"id":"1huKO","mates":["Rb8#"],"turn":"white","pieces":5,"rating":895,"white":"♔ King g6  ♖ Rook b7","black":"♚ King g8  ♜ Rook b3  ♟ Pawn b4"},{"id":"0wnnN","mates":["Rh2#"],"turn":"black","pieces":4,"rating":932,"white":"♔ King h1  ♖ Rook g1","black":"♚ King h3  ♜ Rook b2"},{"id":"01R6L","mates":["Qb7#"],"turn":"black","pieces":5,"rating":860,"white":"♔ King c6  ♕ Queen d6  ♙ Pawn c5","black":"♚ King c8  ♛ Queen b1"},{"id":"1dKlk","mates":["Qxb6#"],"turn":"black","pieces":5,"rating":823,"white":"♔ King a6  ♕ Queen b6  ♙ Pawn b4","black":"♚ King c7  ♛ Queen g6"},{"id":"2GDrK","mates":["Rh5#"],"turn":"white","pieces":5,"rating":1265,"white":"♔ King f3  ♖ Rook g5","black":"♚ King h3  ♜ Rook a4  ♟ Pawn f4"},{"id":"1LA7X","mates":["Rc8#"],"turn":"white","pieces":5,"rating":434,"white":"♔ King e6  ♖ Rook c4","black":"♚ King e8  ♜ Rook g2  ♟ Pawn h6"},{"id":"1MSij","mates":["Ra6#"],"turn":"black","pieces":4,"rating":1165,"white":"♔ King a2  ♖ Rook b1","black":"♚ King c3  ♜ Rook f6"},{"id":"1bJcc","mates":["Nf7#"],"turn":"white","pieces":5,"rating":755,"white":"♔ King g6  ♘ Knight e5, f6","black":"♚ King h8  ♛ Queen b6"},{"id":"01bSB","mates":["Qb4#"],"turn":"white","pieces":5,"rating":966,"white":"♔ King c4  ♕ Queen c5","black":"♚ King a4  ♛ Queen h1  ♟ Pawn a6"},{"id":"203fu","mates":["Ra7#"],"turn":"black","pieces":4,"rating":1246,"white":"♔ King a2  ♖ Rook h1","black":"♚ King c2  ♜ Rook b7"},{"id":"0whH8","mates":["Qa5#","Qa4#"],"turn":"black","pieces":5,"rating":1331,"white":"♔ King a7  ♕ Queen b8  ♙ Pawn b2","black":"♚ King c6  ♛ Queen b5"},{"id":"1kCxt","mates":["Qd7#"],"turn":"black","pieces":4,"rating":1401,"white":"♔ King c8  ♕ Queen b8","black":"♚ King e7  ♛ Queen d6"},{"id":"0h7Xf","mates":["Rxh6#"],"turn":"black","pieces":4,"rating":805,"white":"♔ King h8  ♖ Rook h6","black":"♚ King f8  ♜ Rook g6"},{"id":"0c9yz","mates":["Rh8#"],"turn":"white","pieces":5,"rating":452,"white":"♔ King e6  ♖ Rook h6","black":"♚ King e8  ♜ Rook g2  ♟ Pawn g5"},{"id":"0qOBD","mates":["Ra8#"],"turn":"black","pieces":4,"rating":815,"white":"♔ King d8  ♕ Queen e8","black":"♚ King d6  ♜ Rook a5"},{"id":"0YIbP","mates":["f7#"],"turn":"white","pieces":5,"rating":780,"white":"♔ King e6  ♙ Pawn e7, f6","black":"♚ King e8  ♞ Knight g6"},{"id":"270SO","mates":["Ra8#"],"turn":"black","pieces":4,"rating":789,"white":"♔ King a4  ♖ Rook h3","black":"♚ King c4  ♜ Rook c8"},{"id":"1axqn","mates":["Ra5#"],"turn":"black","pieces":5,"rating":828,"white":"♔ King a6  ♕ Queen b7  ♙ Pawn b6","black":"♚ King b4  ♜ Rook g5"},{"id":"1XmMB","mates":["Ra4#"],"turn":"white","pieces":5,"rating":690,"white":"♔ King c6  ♖ Rook f4","black":"♚ King a6  ♜ Rook a1  ♟ Pawn a2"},{"id":"1TPI4","mates":["Rb8#"],"turn":"black","pieces":4,"rating":1373,"white":"♔ King f8  ♖ Rook h2","black":"♚ King f6  ♜ Rook b7"},{"id":"2Jywg","mates":["Qxb8#"],"turn":"black","pieces":4,"rating":576,"white":"♔ King a8  ♕ Queen b8","black":"♚ King c7  ♛ Queen b5"},{"id":"0ib8J","mates":["Ra8#"],"turn":"black","pieces":5,"rating":1075,"white":"♔ King a6  ♖ Rook h2  ♙ Pawn h7","black":"♚ King c6  ♜ Rook h8"},{"id":"0XWyX","mates":["Ra4#"],"turn":"white","pieces":5,"rating":1422,"white":"♔ King c7  ♖ Rook g4","black":"♚ King a8  ♜ Rook d2  ♟ Pawn g2"},{"id":"0j0R8","mates":["g2#"],"turn":"black","pieces":5,"rating":1175,"white":"♔ King h1  ♖ Rook f1","black":"♚ King h3  ♟ Pawn g3, h2"},{"id":"13ky1","mates":["Rh8#"],"turn":"black","pieces":4,"rating":1060,"white":"♔ King h3  ♖ Rook g2","black":"♚ King f4  ♜ Rook c8"},{"id":"1XUlx","mates":["g2#"],"turn":"black","pieces":5,"rating":579,"white":"♔ King h1  ♖ Rook f1","black":"♚ King h3  ♟ Pawn g3, h2"},{"id":"0MZvc","mates":["Qh4#"],"turn":"white","pieces":4,"rating":1373,"white":"♔ King f3  ♕ Queen e1","black":"♚ King h2  ♛ Queen g1"},{"id":"0v46x","mates":["Rh6#"],"turn":"black","pieces":5,"rating":894,"white":"♔ King h4  ♖ Rook g7  ♙ Pawn g2","black":"♚ King f4  ♜ Rook b6"},{"id":"2MMqT","mates":["Ra1#"],"turn":"black","pieces":5,"rating":1255,"white":"♔ King e1  ♖ Rook f5  ♙ Pawn c3","black":"♚ King e3  ♜ Rook a2"},{"id":"0IL1Z","mates":["Rb1#"],"turn":"white","pieces":4,"rating":611,"white":"♔ King d3  ♖ Rook b6","black":"♚ King d1  ♜ Rook e2"},{"id":"0Tbzw","mates":["Qxb8#"],"turn":"black","pieces":4,"rating":663,"white":"♔ King a8  ♕ Queen b8","black":"♚ King c7  ♛ Queen b6"},{"id":"1iBSv","mates":["g2#"],"turn":"black","pieces":5,"rating":612,"white":"♔ King h1  ♕ Queen b8","black":"♚ King h3  ♝ Bishop b6  ♟ Pawn g3"},{"id":"0s8AL","mates":["Rh1#"],"turn":"white","pieces":5,"rating":722,"white":"♔ King f3  ♖ Rook b1","black":"♚ King h3  ♜ Rook h5  ♟ Pawn g5"},{"id":"1VzrL","mates":["Ra1#"],"turn":"black","pieces":5,"rating":1095,"white":"♔ King c1  ♖ Rook a8  ♙ Pawn a4","black":"♚ King c3  ♜ Rook a2"},{"id":"1fkyU","mates":["Rh1#"],"turn":"black","pieces":4,"rating":1142,"white":"♔ King h6  ♖ Rook a7","black":"♚ King f6  ♜ Rook g1"},{"id":"2IeZI","mates":["Qc2#"],"turn":"white","pieces":4,"rating":1096,"white":"♔ King d3  ♕ Queen c3","black":"♚ King b1  ♛ Queen a1"},{"id":"0lrfJ","mates":["Qd2#"],"turn":"white","pieces":4,"rating":1144,"white":"♔ King c2  ♕ Queen g2","black":"♚ King e1  ♛ Queen f1"},{"id":"0vZd6","mates":["Ra8#"],"turn":"black","pieces":4,"rating":736,"white":"♔ King f8  ♕ Queen g8","black":"♚ King f6  ♜ Rook a4"},{"id":"12SoK","mates":["Rh8#"],"turn":"black","pieces":5,"rating":1015,"white":"♔ King h4  ♖ Rook g4  ♙ Pawn g5","black":"♚ King f2  ♜ Rook f8"},{"id":"0JV7w","mates":["Qd2#"],"turn":"white","pieces":4,"rating":1016,"white":"♔ King e3  ♕ Queen c3","black":"♚ King d1  ♛ Queen b1"},{"id":"21yzy","mates":["g5#"],"turn":"black","pieces":5,"rating":1143,"white":"♔ King h4  ♙ Pawn h3, h5","black":"♚ King f4  ♟ Pawn g6"},{"id":"2ILpx","mates":["Qd7#"],"turn":"black","pieces":4,"rating":1425,"white":"♔ King c8  ♕ Queen b8","black":"♚ King e7  ♛ Queen d6"},{"id":"0YMqu","mates":["Nf6#"],"turn":"white","pieces":5,"rating":1037,"white":"♔ King e6  ♘ Knight d5  ♙ Pawn e7","black":"♚ King e8  ♛ Queen c1"},{"id":"1IxkF","mates":["Qf8#"],"turn":"black","pieces":5,"rating":1169,"white":"♔ King h8  ♕ Queen a7  ♙ Pawn h7","black":"♚ King d8  ♛ Queen f5"},{"id":"2AwFd","mates":["Ra1#"],"turn":"white","pieces":4,"rating":1011,"white":"♔ King g3  ♖ Rook a2","black":"♚ King g1  ♛ Queen h1"},{"id":"28K1s","mates":["Ra6#"],"turn":"white","pieces":4,"rating":516,"white":"♔ King c2  ♖ Rook h6","black":"♚ King a2  ♜ Rook b8"},{"id":"1HIou","mates":["Rc8#"],"turn":"white","pieces":5,"rating":1301,"white":"♔ King f6  ♖ Rook c7","black":"♚ King f8  ♜ Rook f3  ♟ Pawn f4"},{"id":"063On","mates":["Qxg7#"],"turn":"black","pieces":4,"rating":462,"white":"♔ King h8  ♕ Queen g7","black":"♚ King f6  ♛ Queen f7"},{"id":"1PjLn","mates":["Rb1#"],"turn":"black","pieces":5,"rating":1218,"white":"♔ King f1  ♖ Rook h4  ♙ Pawn b6","black":"♚ King f3  ♜ Rook b2"},{"id":"1N1SD","mates":["Qxb1#"],"turn":"white","pieces":5,"rating":599,"white":"♔ King c2  ♕ Queen g1","black":"♚ King a2  ♛ Queen b1  ♟ Pawn a3"},{"id":"1ISdw","mates":["Rh4#"],"turn":"white","pieces":4,"rating":1165,"white":"♔ King f5  ♖ Rook a4","black":"♚ King h6  ♜ Rook g7"},{"id":"1wQLb","mates":["Rh1#"],"turn":"white","pieces":4,"rating":593,"white":"♔ King f6  ♖ Rook e1","black":"♚ King h6  ♜ Rook g7"},{"id":"2MBoW","mates":["Ra8#"],"turn":"black","pieces":5,"rating":654,"white":"♔ King e8  ♖ Rook e7  ♙ Pawn f7","black":"♚ King d6  ♜ Rook a1"},{"id":"19BAA","mates":["Rg5#"],"turn":"black","pieces":5,"rating":612,"white":"♔ King h5  ♖ Rook h4  ♙ Pawn h6","black":"♚ King f6  ♜ Rook g1"},{"id":"1Gz9X","mates":["Ra1#"],"turn":"black","pieces":4,"rating":1314,"white":"♔ King a7  ♕ Queen b8","black":"♚ King c6  ♜ Rook b1"}],"medium":[{"id":"01ZiW","mates":["Rd1#"],"turn":"black","pieces":8,"rating":400,"white":"♔ King g1  ♖ Rook a7  ♙ Pawn g2, h3","black":"♚ King f5  ♜ Rook d4  ♟ Pawn g3, h4"},{"id":"0DKSf","mates":["f7#"],"turn":"white","pieces":8,"rating":508,"white":"♔ King g6  ♙ Pawn e3, f6, g7","black":"♚ King g8  ♞ Knight e6  ♟ Pawn a3, c6"},{"id":"053vG","mates":["Rb1#"],"turn":"black","pieces":10,"rating":810,"white":"♔ King f1  ♖ Rook b8  ♙ Pawn b7, f5, g3, h2","black":"♚ King f3  ♜ Rook b2  ♟ Pawn g7, h6"},{"id":"03lYh","mates":["a2#"],"turn":"black","pieces":6,"rating":854,"white":"♔ King b1  ♕ Queen h8","black":"♚ King b3  ♞ Knight f6  ♟ Pawn a3, b2"},{"id":"0FJr6","mates":["Qh6#"],"turn":"black","pieces":8,"rating":1323,"white":"♔ King h4  ♖ Rook g4  ♘ Knight a4  ♙ Pawn d3, g3","black":"♚ King a6  ♛ Queen d2  ♟ Pawn b6"},{"id":"0Bkls","mates":["Rh7#"],"turn":"white","pieces":8,"rating":1484,"white":"♔ King g4  ♖ Rook a7  ♘ Knight f8  ♙ Pawn f4","black":"♚ King h6  ♜ Rook b3, h5  ♟ Pawn g5"},{"id":"0ExCS","mates":["Nf7#"],"turn":"white","pieces":7,"rating":1291,"white":"♔ King h2  ♖ Rook g8  ♘ Knight d6","black":"♚ King h6  ♜ Rook h5  ♞ Knight h7  ♟ Pawn h4"},{"id":"00IaZ","mates":["Rb8#"],"turn":"white","pieces":10,"rating":923,"white":"♔ King d6  ♖ Rook e7, e8  ♙ Pawn b4, b5","black":"♚ King b6  ♜ Rook c3, h3  ♟ Pawn d3, g6"},{"id":"097U6","mates":["Qe5#"],"turn":"white","pieces":9,"rating":1289,"white":"♔ King g1  ♕ Queen c7  ♖ Rook g2  ♙ Pawn f4","black":"♚ King f5  ♛ Queen h6  ♜ Rook f6  ♟ Pawn d5, e6"},{"id":"01oaC","mates":["h5#"],"turn":"black","pieces":10,"rating":952,"white":"♔ King g4  ♖ Rook c7  ♙ Pawn a3, f4, h4","black":"♚ King f6  ♜ Rook b3  ♟ Pawn b6, g6, h6"},{"id":"06DtY","mates":["Rxh5#"],"turn":"white","pieces":9,"rating":1231,"white":"♔ King g1  ♖ Rook b5  ♙ Pawn a5, f2","black":"♚ King h3  ♜ Rook c2  ♟ Pawn f3, g4, h5"},{"id":"06S0K","mates":["Rb8#"],"turn":"black","pieces":10,"rating":763,"white":"♔ King d8  ♖ Rook f7  ♗ Bishop h7  ♙ Pawn c3, g6","black":"♚ King d6  ♜ Rook b2  ♝ Bishop a6  ♟ Pawn c6, d5"},{"id":"0EMGo","mates":["Qh8#"],"turn":"white","pieces":10,"rating":817,"white":"♔ King g3  ♕ Queen d4  ♙ Pawn f3, g2","black":"♚ King h6  ♜ Rook a2  ♝ Bishop d5  ♟ Pawn c6, g5, g6"},{"id":"02YNl","mates":["Rh8#"],"turn":"white","pieces":6,"rating":502,"white":"♔ King f6  ♖ Rook c8","black":"♚ King h6  ♞ Knight f2  ♟ Pawn g6, h5"},{"id":"0AAwI","mates":["Rc8#"],"turn":"white","pieces":7,"rating":1487,"white":"♔ King f6  ♖ Rook c7  ♙ Pawn h6","black":"♚ King f8  ♜ Rook h1  ♟ Pawn a6, c5"},{"id":"09t9E","mates":["Rh4#"],"turn":"black","pieces":9,"rating":661,"white":"♔ King h5  ♖ Rook e3  ♗ Bishop c4  ♙ Pawn b3, f5","black":"♚ King f7  ♜ Rook d4  ♝ Bishop f6  ♟ Pawn e6"},{"id":"0CoSH","mates":["Bh5#"],"turn":"black","pieces":10,"rating":1148,"white":"♔ King f3  ♗ Bishop c4  ♙ Pawn a6, b5, g2","black":"♚ King e5  ♝ Bishop e8  ♟ Pawn f4, f5, g3"},{"id":"01uXH","mates":["Rh2#"],"turn":"black","pieces":7,"rating":656,"white":"♔ King h4  ♖ Rook a8  ♙ Pawn a2, b3","black":"♚ King f3  ♜ Rook b2  ♟ Pawn f6"},{"id":"05hfp","mates":["Nf2#"],"turn":"black","pieces":8,"rating":970,"white":"♔ King h3  ♘ Knight e7  ♙ Pawn f7, h2","black":"♚ King f3  ♞ Knight g4  ♟ Pawn g5, h7"},{"id":"0FLeU","mates":["Rh4#"],"turn":"black","pieces":9,"rating":1360,"white":"♔ King h5  ♖ Rook a7  ♙ Pawn a2, e4, e6, f5","black":"♚ King g7  ♜ Rook g4  ♝ Bishop e7"},{"id":"076oK","mates":["Qf3#"],"turn":"white","pieces":7,"rating":1072,"white":"♔ King g2  ♕ Queen d1","black":"♚ King f4  ♜ Rook f5  ♝ Bishop g5  ♟ Pawn e5, h4"},{"id":"09hgG","mates":["Rd4#"],"turn":"black","pieces":10,"rating":1466,"white":"♔ King e4  ♕ Queen c7  ♖ Rook e7  ♘ Knight e3  ♙ Pawn c4","black":"♚ King a8  ♛ Queen f6  ♜ Rook d8  ♟ Pawn a6, b7"},{"id":"01zHy","mates":["Re6#"],"turn":"white","pieces":10,"rating":925,"white":"♔ King e3  ♖ Rook a6  ♙ Pawn f5, g4, h2","black":"♚ King e5  ♜ Rook d7  ♟ Pawn d5, g7, h5"},{"id":"02GOZ","mates":["f1=Q#"],"turn":"black","pieces":9,"rating":925,"white":"♔ King g2  ♖ Rook c8  ♗ Bishop g4  ♙ Pawn a4, b2","black":"♚ King e1  ♝ Bishop g3  ♟ Pawn f2, f4"},{"id":"02Pxu","mates":["Ra8#"],"turn":"white","pieces":6,"rating":1073,"white":"♔ King g6  ♖ Rook a7  ♙ Pawn h5","black":"♚ King g8  ♜ Rook h1  ♟ Pawn g2"},{"id":"0A5yl","mates":["Rc8#"],"turn":"white","pieces":8,"rating":995,"white":"♔ King f6  ♖ Rook c5","black":"♚ King h8  ♜ Rook b7  ♟ Pawn a2, d4, e3, h7"},{"id":"016ow","mates":["Bd6#"],"turn":"white","pieces":9,"rating":745,"white":"♔ King f6  ♗ Bishop b8  ♙ Pawn a4, f4, f7, h4","black":"♚ King f8  ♛ Queen c1  ♟ Pawn h5"},{"id":"0BG7S","mates":["Qh5#"],"turn":"black","pieces":10,"rating":1191,"white":"♔ King h4  ♕ Queen a7  ♙ Pawn b7, e3, f2, g3, h2","black":"♚ King g6  ♛ Queen f5  ♟ Pawn f6"},{"id":"0Dbq9","mates":["Rxf2#"],"turn":"black","pieces":10,"rating":1244,"white":"♔ King f1  ♖ Rook a6, e1  ♙ Pawn a2, f2, h2","black":"♚ King f3  ♜ Rook b2, g8  ♟ Pawn f6"},{"id":"002vV","mates":["Rh1#"],"turn":"black","pieces":9,"rating":446,"white":"♔ King h4  ♖ Rook b6  ♙ Pawn f4, g3, h5","black":"♚ King g7  ♜ Rook a1  ♟ Pawn f5, h6"},{"id":"096b6","mates":["g5#"],"turn":"black","pieces":10,"rating":1034,"white":"♔ King h4  ♕ Queen e8  ♖ Rook e1  ♗ Bishop h2  ♙ Pawn b4, g4","black":"♚ King h6  ♜ Rook c3  ♟ Pawn b6, g7"},{"id":"07JVq","mates":["f6#"],"turn":"black","pieces":8,"rating":1241,"white":"♔ King g5  ♖ Rook h4  ♘ Knight g3  ♙ Pawn f5","black":"♚ King g7  ♜ Rook a4  ♟ Pawn f7, g6"},{"id":"07DU9","mates":["Rh7#"],"turn":"black","pieces":7,"rating":711,"white":"♔ King h5  ♖ Rook a2  ♙ Pawn f5, g4","black":"♚ King f6  ♜ Rook a7  ♟ Pawn a3"},{"id":"0C5UE","mates":["Rc2#"],"turn":"black","pieces":10,"rating":1211,"white":"♔ King c1  ♕ Queen g8  ♖ Rook b1, g1  ♙ Pawn a3","black":"♚ King h6  ♜ Rook d4, h2  ♟ Pawn b3, b7"},{"id":"0BrHk","mates":["Rh6#"],"turn":"white","pieces":6,"rating":1299,"white":"♔ King f4  ♖ Rook c6  ♙ Pawn g2","black":"♚ King h4  ♜ Rook f2  ♟ Pawn f3"},{"id":"01RuT","mates":["Rh1#"],"turn":"black","pieces":9,"rating":445,"white":"♔ King h2  ♖ Rook e3, h5  ♙ Pawn b5, f2, h3","black":"♚ King f4  ♜ Rook a1  ♝ Bishop e4"},{"id":"04ezE","mates":["Qe8#"],"turn":"white","pieces":7,"rating":907,"white":"♔ King h2  ♕ Queen e5  ♙ Pawn g3","black":"♚ King h5  ♛ Queen g4  ♟ Pawn g5, h6"},{"id":"088TL","mates":["Qf7#"],"turn":"white","pieces":7,"rating":1054,"white":"♔ King g6  ♕ Queen e6  ♙ Pawn h4","black":"♚ King f8  ♛ Queen a1  ♟ Pawn a3, f4"},{"id":"0ALBX","mates":["Nc2#"],"turn":"black","pieces":9,"rating":668,"white":"♔ King a3  ♘ Knight c8  ♙ Pawn a2, b2, c3","black":"♚ King c5  ♞ Knight e3  ♟ Pawn b5, c4"},{"id":"0CPF2","mates":["f7#"],"turn":"white","pieces":8,"rating":652,"white":"♔ King e6  ♗ Bishop g5  ♙ Pawn e7, f6","black":"♚ King e8  ♛ Queen b1  ♟ Pawn c6, h5"},{"id":"01Zna","mates":["Rd8#"],"turn":"white","pieces":8,"rating":1449,"white":"♔ King g6  ♖ Rook d7  ♙ Pawn d6, g5","black":"♚ King f8  ♜ Rook d4  ♟ Pawn b4, c4"},{"id":"05MED","mates":["Qxf1#"],"turn":"white","pieces":10,"rating":1362,"white":"♔ King d3  ♕ Queen h1  ♖ Rook e4  ♙ Pawn a6, b3","black":"♚ King d1  ♛ Queen f1  ♜ Rook a2  ♟ Pawn g5, h6"},{"id":"04haU","mates":["Rh1#"],"turn":"black","pieces":8,"rating":743,"white":"♔ King h6  ♖ Rook a5  ♗ Bishop d4  ♙ Pawn g5","black":"♚ King f7  ♜ Rook f1  ♝ Bishop b3  ♟ Pawn a4"},{"id":"00C7m","mates":["Rh4#"],"turn":"black","pieces":6,"rating":745,"white":"♔ King h6  ♖ Rook g6  ♙ Pawn b6, g5","black":"♚ King f7  ♜ Rook b4"},{"id":"0AZM3","mates":["Qh8#"],"turn":"black","pieces":8,"rating":1472,"white":"♔ King h6  ♕ Queen g5  ♙ Pawn a2, f5, g4, h3","black":"♚ King f7  ♛ Queen d4"},{"id":"08CEA","mates":["Qxf1#"],"turn":"black","pieces":10,"rating":924,"white":"♔ King h1  ♕ Queen c3  ♗ Bishop f1  ♙ Pawn e5, h3","black":"♚ King h7  ♛ Queen f4  ♟ Pawn f7, g3, g6"},{"id":"07lZT","mates":["Nf7#"],"turn":"white","pieces":9,"rating":1008,"white":"♔ King g6  ♖ Rook g7  ♘ Knight d8","black":"♚ King h8  ♛ Queen d1  ♞ Knight e4  ♟ Pawn e5, f5, h6"},{"id":"00uV1","mates":["Ra3#"],"turn":"white","pieces":7,"rating":648,"white":"♔ King b2  ♖ Rook h3","black":"♚ King a4  ♞ Knight b4  ♟ Pawn a2, b5, c4"},{"id":"0DgmV","mates":["Qxh2#"],"turn":"black","pieces":9,"rating":751,"white":"♔ King h1  ♕ Queen f3  ♖ Rook f1  ♙ Pawn g2, h2","black":"♚ King f7  ♛ Queen h5  ♝ Bishop d6  ♟ Pawn f6"},{"id":"0DOEK","mates":["Rxh3#"],"turn":"black","pieces":8,"rating":648,"white":"♔ King h2  ♖ Rook e8  ♗ Bishop h3  ♙ Pawn a3, g5","black":"♚ King f2  ♜ Rook c3  ♞ Knight f4"},{"id":"058k2","mates":["Rh1#"],"turn":"black","pieces":10,"rating":839,"white":"♔ King e1  ♖ Rook b7  ♗ Bishop d4  ♙ Pawn a6, b4, f2","black":"♚ King f3  ♜ Rook h2  ♝ Bishop f4  ♟ Pawn g5"},{"id":"02psu","mates":["Ra5#"],"turn":"black","pieces":6,"rating":627,"white":"♔ King h5  ♖ Rook h6  ♙ Pawn g6, h4","black":"♚ King g3  ♜ Rook a8"},{"id":"0B2hq","mates":["Rh1#"],"turn":"black","pieces":8,"rating":818,"white":"♔ King h3  ♗ Bishop c6  ♘ Knight c5, g2  ♙ Pawn a6","black":"♚ King h8  ♜ Rook b1, g8"},{"id":"0BQWq","mates":["Rg4#"],"turn":"white","pieces":7,"rating":574,"white":"♔ King e2  ♖ Rook g8  ♙ Pawn f3","black":"♚ King f4  ♜ Rook b5  ♞ Knight f5  ♟ Pawn e5"},{"id":"08Rkl","mates":["Ra8#"],"turn":"white","pieces":8,"rating":1471,"white":"♔ King g6  ♖ Rook a7  ♙ Pawn g4, h4","black":"♚ King g8  ♜ Rook a1  ♟ Pawn a2, g7"},{"id":"0D5c0","mates":["h5#"],"turn":"white","pieces":10,"rating":1230,"white":"♔ King g4  ♖ Rook e7  ♙ Pawn e4, g5, h4","black":"♚ King g6  ♛ Queen c1  ♜ Rook a2  ♟ Pawn b4, d6"},{"id":"08cL0","mates":["Rb2#"],"turn":"black","pieces":9,"rating":1132,"white":"♔ King b1  ♕ Queen e8  ♘ Knight h5  ♙ Pawn a6, g3","black":"♚ King h7  ♜ Rook d2  ♝ Bishop c3  ♞ Knight b3"},{"id":"09JqR","mates":["Qg6#"],"turn":"white","pieces":7,"rating":1055,"white":"♔ King c6  ♕ Queen g4  ♙ Pawn c4, f5","black":"♚ King h6  ♛ Queen a3  ♜ Rook e1"},{"id":"0B3ni","mates":["Qe7#"],"turn":"white","pieces":10,"rating":965,"white":"♔ King e4  ♕ Queen b7  ♘ Knight d5  ♙ Pawn a4, h2","black":"♚ King e6  ♛ Queen c1  ♝ Bishop b2  ♟ Pawn a5, h7"},{"id":"04tSk","mates":["Ra6#"],"turn":"black","pieces":6,"rating":913,"white":"♔ King h6  ♖ Rook h7  ♙ Pawn g7, h5","black":"♚ King f5  ♜ Rook a8"},{"id":"0AcJu","mates":["Ra8#"],"turn":"white","pieces":9,"rating":400,"white":"♔ King e1  ♖ Rook a6  ♙ Pawn a2, c6, g5","black":"♚ King c8  ♜ Rook c7  ♝ Bishop h5  ♟ Pawn e6"},{"id":"09vxG","mates":["Rh2#"],"turn":"white","pieces":10,"rating":1495,"white":"♔ King b4  ♖ Rook b2  ♗ Bishop e3  ♘ Knight g4  ♙ Pawn a5, d4, h4","black":"♚ King h1  ♛ Queen f3  ♜ Rook c8"},{"id":"04vvt","mates":["Bf3#"],"turn":"black","pieces":9,"rating":1289,"white":"♔ King e4  ♖ Rook c6  ♘ Knight f6  ♙ Pawn d4, e5, g4","black":"♚ King g5  ♜ Rook a3  ♝ Bishop e2"},{"id":"0DwVv","mates":["Rh2#"],"turn":"black","pieces":6,"rating":773,"white":"♔ King h7  ♕ Queen g8  ♖ Rook a7","black":"♚ King f6  ♜ Rook a2  ♟ Pawn a3"},{"id":"02SWp","mates":["g6#"],"turn":"white","pieces":10,"rating":1276,"white":"♔ King g2  ♕ Queen a8  ♙ Pawn f2, g5, h5","black":"♚ King h7  ♛ Queen b3  ♟ Pawn a2, g7, h6"},{"id":"06MoJ","mates":["Rf2#"],"turn":"black","pieces":9,"rating":1450,"white":"♔ King f1  ♕ Queen b8  ♖ Rook g8  ♙ Pawn e4, h4","black":"♚ King e3  ♜ Rook b2  ♞ Knight f3  ♟ Pawn h5"},{"id":"0CAsd","mates":["Qb1#"],"turn":"white","pieces":8,"rating":947,"white":"♔ King h2  ♕ Queen d3  ♙ Pawn g2, h3","black":"♚ King d1  ♜ Rook d2, e2  ♟ Pawn a5"},{"id":"082QD","mates":["Re8#"],"turn":"white","pieces":6,"rating":426,"white":"♔ King f6  ♖ Rook e6  ♙ Pawn h6","black":"♚ King h8  ♜ Rook b7  ♟ Pawn h7"},{"id":"0CCsd","mates":["h8=Q#","h8=R#"],"turn":"white","pieces":7,"rating":715,"white":"♔ King c6  ♙ Pawn c5, h3, h7","black":"♚ King c8  ♛ Queen f1  ♟ Pawn f5"},{"id":"04MqJ","mates":["g3#"],"turn":"white","pieces":7,"rating":869,"white":"♔ King h2  ♖ Rook g6  ♙ Pawn g2","black":"♚ King h4  ♜ Rook a7  ♟ Pawn f5, h5"},{"id":"02yHD","mates":["g4#"],"turn":"black","pieces":10,"rating":531,"white":"♔ King h3  ♕ Queen d8  ♙ Pawn a7, f2, g3, h2","black":"♚ King h5  ♟ Pawn f3, g5, h7"},{"id":"06aAU","mates":["Qc5#"],"turn":"white","pieces":8,"rating":1378,"white":"♔ King f4  ♕ Queen g5  ♙ Pawn b4","black":"♚ King d6  ♜ Rook a3, d7  ♟ Pawn e6, g7"},{"id":"0AY0L","mates":["Rh8#"],"turn":"white","pieces":7,"rating":1357,"white":"♔ King f6  ♖ Rook b8  ♙ Pawn g6","black":"♚ King h6  ♜ Rook c3  ♟ Pawn a6, b3"},{"id":"0EIUd","mates":["Qg3#"],"turn":"white","pieces":7,"rating":895,"white":"♔ King f1  ♕ Queen g7  ♙ Pawn f2","black":"♚ King f4  ♛ Queen f5  ♟ Pawn e4, f3"},{"id":"04vNC","mates":["Qe1#"],"turn":"white","pieces":7,"rating":1102,"white":"♔ King f4  ♕ Queen c3  ♙ Pawn a4","black":"♚ King c1  ♜ Rook b2, c2  ♟ Pawn c4"},{"id":"00OPk","mates":["Nf7#"],"turn":"white","pieces":10,"rating":809,"white":"♔ King h4  ♖ Rook a6  ♘ Knight d6  ♙ Pawn a3, b4, h6","black":"♚ King h8  ♜ Rook d5, g8  ♟ Pawn h7"},{"id":"01V7x","mates":["Rb8#"],"turn":"white","pieces":9,"rating":1354,"white":"♔ King d6  ♖ Rook b7  ♙ Pawn a5, e6","black":"♚ King e8  ♜ Rook f5, f8  ♟ Pawn a6, c6"},{"id":"0BLbM","mates":["Re1#"],"turn":"black","pieces":9,"rating":505,"white":"♔ King c1  ♖ Rook a8  ♙ Pawn a2, b2, c2","black":"♚ King d5  ♜ Rook e2  ♟ Pawn c5, e3"},{"id":"054YX","mates":["Qa8#"],"turn":"white","pieces":6,"rating":759,"white":"♔ King f2  ♕ Queen e4","black":"♚ King a6  ♛ Queen b5  ♟ Pawn b6, c7"},{"id":"02O7b","mates":["Rh1#"],"turn":"black","pieces":7,"rating":495,"white":"♔ King h6  ♕ Queen g8  ♗ Bishop b5  ♙ Pawn b6, b7","black":"♚ King f6  ♜ Rook e1"},{"id":"08XQI","mates":["Rf2#"],"turn":"black","pieces":9,"rating":763,"white":"♔ King f1  ♖ Rook e1  ♘ Knight f6, g1  ♙ Pawn c3","black":"♚ King g3  ♜ Rook a2, h7  ♟ Pawn f7"},{"id":"04o8O","mates":["d1=Q#","d1=R#"],"turn":"black","pieces":9,"rating":1051,"white":"♔ King g1  ♕ Queen b8  ♘ Knight f7  ♙ Pawn c5","black":"♚ King e3  ♜ Rook f2  ♟ Pawn d2, g6, h7"},{"id":"0DIXH","mates":["Ra8#"],"turn":"white","pieces":10,"rating":1180,"white":"♔ King f6  ♖ Rook a7  ♙ Pawn c2, f3, h3","black":"♚ King f8  ♜ Rook g2  ♟ Pawn a5, b4, h6"},{"id":"01YDB","mates":["Rh1#"],"turn":"black","pieces":10,"rating":630,"white":"♔ King h4  ♖ Rook f5  ♘ Knight g6  ♙ Pawn f3, g4, h5","black":"♚ King e6  ♜ Rook a1  ♞ Knight e4  ♟ Pawn g7"},{"id":"0A7dj","mates":["Ra2#"],"turn":"black","pieces":9,"rating":676,"white":"♔ King a4  ♖ Rook g4  ♙ Pawn b3, b4, h4","black":"♚ King d5  ♜ Rook h2  ♟ Pawn a6, d6"},{"id":"03xrP","mates":["Rh4#"],"turn":"white","pieces":6,"rating":1029,"white":"♔ King f6  ♖ Rook b4","black":"♚ King h6  ♝ Bishop f5  ♟ Pawn f7, g6"},{"id":"00UkB","mates":["Rxh6#"],"turn":"white","pieces":10,"rating":573,"white":"♔ King g2  ♖ Rook c6  ♙ Pawn f2, h3","black":"♚ King h4  ♜ Rook a5  ♞ Knight a6  ♟ Pawn f4, g5, h6"},{"id":"0E13z","mates":["Re6#"],"turn":"white","pieces":9,"rating":1167,"white":"♔ King c4  ♖ Rook g6  ♘ Knight d4","black":"♚ King e5  ♜ Rook g2  ♟ Pawn a7, b6, f4, g3"},{"id":"0Bokm","mates":["Rh7#"],"turn":"white","pieces":9,"rating":928,"white":"♔ King h6  ♖ Rook a7  ♙ Pawn b4, c3, h5","black":"♚ King h8  ♜ Rook g8  ♝ Bishop f3  ♟ Pawn c6"},{"id":"0EAR2","mates":["Ra8#"],"turn":"white","pieces":10,"rating":802,"white":"♔ King c6  ♖ Rook e8  ♙ Pawn h3","black":"♚ King a6  ♜ Rook a2, g2  ♞ Knight g6  ♟ Pawn a4, b6, c5"},{"id":"0BrU2","mates":["f2#"],"turn":"black","pieces":8,"rating":964,"white":"♔ King g1  ♕ Queen b8  ♖ Rook b1  ♙ Pawn a7","black":"♚ King h3  ♜ Rook e2  ♟ Pawn f3, g2"},{"id":"0AHve","mates":["Rxb1#"],"turn":"white","pieces":6,"rating":674,"white":"♔ King d3  ♖ Rook b5  ♙ Pawn d5","black":"♚ King d1  ♛ Queen b1  ♜ Rook h2"},{"id":"0ALuj","mates":["Qc4#"],"turn":"white","pieces":9,"rating":888,"white":"♔ King d1  ♕ Queen c8  ♙ Pawn d3, f3","black":"♚ King d5  ♛ Queen a3  ♜ Rook d6  ♟ Pawn e5, f4"},{"id":"0Cnug","mates":["Rh4#"],"turn":"black","pieces":10,"rating":640,"white":"♔ King e4  ♖ Rook b5  ♙ Pawn a4, b3, c3, e3","black":"♚ King e6  ♜ Rook h2  ♞ Knight e5  ♟ Pawn h5"},{"id":"007fJ","mates":["c2#"],"turn":"black","pieces":10,"rating":638,"white":"♔ King d1  ♕ Queen b8  ♙ Pawn g2, h3","black":"♚ King d3  ♟ Pawn c3, d2, f7, g7, h7"},{"id":"02c59","mates":["Nd7#","a7#"],"turn":"white","pieces":6,"rating":440,"white":"♔ King b6  ♘ Knight c5  ♙ Pawn a6, b7","black":"♚ King b8  ♜ Rook e5"},{"id":"07505","mates":["Rg1#"],"turn":"black","pieces":6,"rating":1177,"white":"♔ King e1  ♖ Rook h5  ♙ Pawn a2, h3","black":"♚ King e3  ♜ Rook g2"},{"id":"0EonG","mates":["Ra1#"],"turn":"white","pieces":9,"rating":649,"white":"♔ King b2  ♖ Rook e1  ♙ Pawn c2, c3","black":"♚ King a4  ♜ Rook h2  ♟ Pawn a5, b5, c4"},{"id":"00OXc","mates":["Rh3#"],"turn":"white","pieces":9,"rating":841,"white":"♔ King f7  ♖ Rook f3","black":"♚ King h6  ♜ Rook e4  ♝ Bishop d4  ♟ Pawn b6, f4, g5, h7"},{"id":"0Dlgh","mates":["Ra1#"],"turn":"black","pieces":8,"rating":1216,"white":"♔ King f1  ♖ Rook g6  ♙ Pawn a4, e5","black":"♚ King f3  ♜ Rook a2  ♟ Pawn a5, h5"},{"id":"0DUPY","mates":["Rxh5#"],"turn":"white","pieces":8,"rating":1376,"white":"♔ King f3  ♖ Rook c5  ♙ Pawn a2","black":"♚ King h3  ♜ Rook d1  ♟ Pawn d3, f6, h5"},{"id":"0BFcC","mates":["Rb1#"],"turn":"black","pieces":8,"rating":1268,"white":"♔ King e1  ♖ Rook e7  ♙ Pawn a2, c5","black":"♚ King d3  ♜ Rook b2  ♟ Pawn a7, e3"},{"id":"019i4","mates":["Rh7#"],"turn":"white","pieces":10,"rating":683,"white":"♔ King g4  ♖ Rook b7  ♙ Pawn g6","black":"♚ King h8  ♜ Rook g8, h1  ♝ Bishop d2  ♟ Pawn a5, c5, h6"},{"id":"06J9W","mates":["Qh8#"],"turn":"white","pieces":8,"rating":561,"white":"♔ King f1  ♕ Queen c8  ♙ Pawn h4","black":"♚ King h6  ♛ Queen e4  ♟ Pawn d4, g6, h5"},{"id":"08vkr","mates":["g5#"],"turn":"black","pieces":6,"rating":1086,"white":"♔ King h4  ♖ Rook b3  ♙ Pawn h3","black":"♚ King h6  ♜ Rook g2  ♟ Pawn g6"},{"id":"00O9q","mates":["Rh1#"],"turn":"white","pieces":10,"rating":1278,"white":"♔ King g2  ♖ Rook a1  ♘ Knight e5  ♙ Pawn f6, g3","black":"♚ King h6  ♜ Rook f8  ♞ Knight e6  ♟ Pawn f7, g5"},{"id":"043WP","mates":["Qxg2#"],"turn":"black","pieces":9,"rating":688,"white":"♔ King h2  ♕ Queen e4  ♖ Rook e7  ♙ Pawn g2, h5","black":"♚ King g8  ♛ Queen b2  ♟ Pawn f3, g7"},{"id":"04l13","mates":["Ra8#"],"turn":"white","pieces":8,"rating":941,"white":"♔ King f6  ♖ Rook a7  ♙ Pawn f3, h4","black":"♚ King f8  ♜ Rook a1  ♟ Pawn a2, h5"},{"id":"04ttV","mates":["Bd3#"],"turn":"white","pieces":10,"rating":1067,"white":"♔ King c2  ♗ Bishop f5  ♙ Pawn c3, d4, g4","black":"♚ King c4  ♝ Bishop b7  ♟ Pawn c5, d5, g5"},{"id":"0CBPG","mates":["Rd8#"],"turn":"white","pieces":10,"rating":420,"white":"♔ King b2  ♖ Rook d3  ♙ Pawn a3, c2, g6","black":"♚ King g8  ♜ Rook c7  ♟ Pawn a7, b7, g7"},{"id":"0ETSc","mates":["Rad7#"],"turn":"white","pieces":9,"rating":1198,"white":"♔ King d3  ♖ Rook a7, e7  ♙ Pawn b4","black":"♚ King d6  ♜ Rook a2, g1  ♟ Pawn a5, c6"},{"id":"05jQI","mates":["Rh1#"],"turn":"black","pieces":8,"rating":941,"white":"♔ King h3  ♖ Rook a8  ♙ Pawn a7, g2","black":"♚ King f4  ♜ Rook a1  ♟ Pawn f5, h4"},{"id":"0156I","mates":["Rh8#"],"turn":"white","pieces":7,"rating":1384,"white":"♔ King d6  ♖ Rook h7  ♙ Pawn a5","black":"♚ King c8  ♜ Rook b5  ♟ Pawn b3, b7"},{"id":"0A797","mates":["Rh8#"],"turn":"black","pieces":7,"rating":853,"white":"♔ King h3  ♖ Rook e6  ♙ Pawn f6, g3, h2","black":"♚ King f3  ♜ Rook a8"},{"id":"0C94n","mates":["Rxe8#"],"turn":"white","pieces":10,"rating":716,"white":"♔ King d6  ♖ Rook h8  ♗ Bishop b5  ♙ Pawn d5","black":"♚ King d8  ♜ Rook e8  ♟ Pawn a2, b4, c5, h4"},{"id":"065JG","mates":["Ra1#"],"turn":"black","pieces":10,"rating":1471,"white":"♔ King e1  ♖ Rook c6  ♙ Pawn a6, f2, g3, g6","black":"♚ King f3  ♜ Rook a2  ♟ Pawn b4, c3"},{"id":"06rvM","mates":["Rg8#"],"turn":"black","pieces":6,"rating":1168,"white":"♔ King d8  ♖ Rook c7  ♙ Pawn d7, g2","black":"♚ King e6  ♜ Rook g3"},{"id":"0DCwb","mates":["Rh1#"],"turn":"white","pieces":7,"rating":1155,"white":"♔ King f4  ♖ Rook a1","black":"♚ King h4  ♜ Rook a8  ♝ Bishop f7  ♟ Pawn a3, g3"},{"id":"02EUf","mates":["Rg1#"],"turn":"black","pieces":10,"rating":1271,"white":"♔ King e1  ♕ Queen b8  ♖ Rook b2  ♗ Bishop c6  ♙ Pawn h3","black":"♚ King d4  ♜ Rook g8  ♟ Pawn d3, e3, h4"},{"id":"0EOdO","mates":["Rh7#"],"turn":"black","pieces":9,"rating":1076,"white":"♔ King h2  ♖ Rook e4, e8  ♙ Pawn g2, g3, g4","black":"♚ King g6  ♜ Rook e1, f7"},{"id":"0EAoJ","mates":["Ra8#"],"turn":"white","pieces":8,"rating":749,"white":"♔ King f6  ♖ Rook a7  ♙ Pawn f4","black":"♚ King g8  ♜ Rook h3  ♟ Pawn f5, g6, h7"},{"id":"0D0tL","mates":["Rg6#"],"turn":"white","pieces":8,"rating":662,"white":"♔ King g2  ♖ Rook a6  ♙ Pawn a4, g3","black":"♚ King g4  ♜ Rook d3  ♟ Pawn f5, h5"},{"id":"0Elre","mates":["Ra8#"],"turn":"white","pieces":10,"rating":1167,"white":"♔ King b2  ♖ Rook a1  ♗ Bishop f3  ♙ Pawn b3","black":"♚ King b8  ♛ Queen h1  ♜ Rook h8  ♝ Bishop c7  ♞ Knight g3  ♟ Pawn b5"},{"id":"05Jkf","mates":["Re1#"],"turn":"black","pieces":9,"rating":591,"white":"♔ King g1  ♖ Rook d7  ♙ Pawn f4, g5, h7","black":"♚ King g3  ♜ Rook e3  ♟ Pawn f5, g6"},{"id":"06e6U","mates":["Rh8#"],"turn":"white","pieces":7,"rating":603,"white":"♔ King f6  ♖ Rook d8  ♙ Pawn e4","black":"♚ King h6  ♜ Rook e3  ♞ Knight f4  ♟ Pawn g5"},{"id":"04UH5","mates":["Re8#"],"turn":"white","pieces":10,"rating":1193,"white":"♔ King h3  ♖ Rook d7, e4  ♙ Pawn f3","black":"♚ King g8  ♜ Rook g6  ♝ Bishop a5  ♟ Pawn a6, b6, h6"},{"id":"06iB9","mates":["Ra8#"],"turn":"white","pieces":6,"rating":1255,"white":"♔ King g6  ♖ Rook a7  ♙ Pawn f4","black":"♚ King g8  ♜ Rook f3  ♟ Pawn f5"},{"id":"07oyn","mates":["Rf5#"],"turn":"white","pieces":8,"rating":713,"white":"♔ King h4  ♖ Rook a5  ♙ Pawn g4","black":"♚ King f4  ♜ Rook e3  ♟ Pawn e4, f6, h6"},{"id":"0BZff","mates":["Rh4#"],"turn":"white","pieces":7,"rating":996,"white":"♔ King d2  ♖ Rook b4, g8","black":"♚ King h6  ♜ Rook e5, f3  ♟ Pawn f5"},{"id":"07wTU","mates":["g4#"],"turn":"white","pieces":9,"rating":896,"white":"♔ King h3  ♖ Rook g7  ♙ Pawn e3, g3, h2","black":"♚ King h5  ♜ Rook f2  ♞ Knight d5  ♟ Pawn h6"},{"id":"0DXM7","mates":["Rf1#"],"turn":"black","pieces":9,"rating":447,"white":"♔ King h1  ♖ Rook a6, b2  ♙ Pawn a3, b7","black":"♚ King g5  ♜ Rook f3  ♟ Pawn g3, h3"},{"id":"01OTB","mates":["Rh6#"],"turn":"white","pieces":6,"rating":546,"white":"♔ King f4  ♖ Rook d6  ♙ Pawn g5","black":"♚ King h5  ♜ Rook b1  ♟ Pawn b4"},{"id":"08ysH","mates":["Rxh4#"],"turn":"black","pieces":7,"rating":529,"white":"♔ King h5  ♖ Rook f5  ♘ Knight d7  ♙ Pawn h4","black":"♚ King g7  ♜ Rook a4  ♝ Bishop f6"},{"id":"0Ednu","mates":["Rh7#"],"turn":"white","pieces":8,"rating":933,"white":"♔ King e4  ♖ Rook c7  ♘ Knight e5","black":"♚ King h5  ♜ Rook f8  ♞ Knight d4  ♟ Pawn e6, g5"},{"id":"01Egl","mates":["Re8#"],"turn":"white","pieces":9,"rating":686,"white":"♔ King c6  ♖ Rook e1  ♙ Pawn h4","black":"♚ King c8  ♜ Rook a7  ♟ Pawn a2, f6, g7, h6"},{"id":"0AHE4","mates":["Rc1#"],"turn":"black","pieces":7,"rating":462,"white":"♔ King g1  ♖ Rook a7  ♘ Knight e5  ♙ Pawn a4","black":"♚ King g3  ♜ Rook c3  ♟ Pawn g5"},{"id":"0F5QD","mates":["Rxd8#"],"turn":"white","pieces":10,"rating":469,"white":"♔ King h2  ♖ Rook d1  ♙ Pawn a3, g3, h3","black":"♚ King h8  ♜ Rook d8  ♟ Pawn a7, g7, h7"},{"id":"00EWi","mates":["h5#","f5#"],"turn":"black","pieces":10,"rating":887,"white":"♔ King g4  ♖ Rook b5  ♙ Pawn b4, c5, f4, h4","black":"♚ King g6  ♜ Rook a3  ♟ Pawn f6, h6"},{"id":"0BQZX","mates":["Rxg5#"],"turn":"white","pieces":8,"rating":1230,"white":"♔ King f3  ♖ Rook g8  ♙ Pawn f4","black":"♚ King f5  ♜ Rook f6  ♟ Pawn d5, e6, g5"},{"id":"0DKJw","mates":["Ra5#"],"turn":"white","pieces":8,"rating":893,"white":"♔ King b1  ♖ Rook g5  ♙ Pawn a2, h5","black":"♚ King a3  ♜ Rook f7  ♟ Pawn b4, g7"},{"id":"0Eze1","mates":["Rf3#"],"turn":"black","pieces":8,"rating":1309,"white":"♔ King h3  ♖ Rook b4, d7  ♘ Knight d3","black":"♚ King g5  ♜ Rook e2, f5  ♟ Pawn g6"},{"id":"0291d","mates":["Rh3#"],"turn":"black","pieces":8,"rating":937,"white":"♔ King h5  ♖ Rook a5  ♙ Pawn d5, f4, g4","black":"♚ King f6  ♜ Rook d3  ♟ Pawn d6"},{"id":"0DtoK","mates":["Qb4#"],"turn":"black","pieces":10,"rating":917,"white":"♔ King b3  ♕ Queen c2  ♙ Pawn a2, g2, h3","black":"♚ King g7  ♛ Queen d6  ♟ Pawn a5, g6, h6"},{"id":"05jY1","mates":["Ra2#"],"turn":"black","pieces":8,"rating":1456,"white":"♔ King a6  ♖ Rook d1  ♙ Pawn b7, f3, h2","black":"♚ King c6  ♜ Rook b2  ♟ Pawn d2"},{"id":"0ESSC","mates":["Rg5#"],"turn":"white","pieces":10,"rating":1176,"white":"♔ King g2  ♖ Rook a5  ♙ Pawn f2, g3, h4","black":"♚ King g4  ♜ Rook c2  ♟ Pawn f7, g6, h5"},{"id":"0C9JQ","mates":["Qc7#"],"turn":"black","pieces":8,"rating":1340,"white":"♔ King d8  ♕ Queen e8  ♖ Rook g1  ♙ Pawn b7","black":"♚ King b2  ♛ Queen c1  ♜ Rook h7  ♟ Pawn d4"},{"id":"09015","mates":["Qxf5#"],"turn":"white","pieces":9,"rating":1315,"white":"♔ King h2  ♕ Queen f6  ♙ Pawn f4, g2","black":"♚ King h5  ♛ Queen a7  ♟ Pawn f5, h4, h6"},{"id":"03c5I","mates":["Rh7#"],"turn":"white","pieces":9,"rating":738,"white":"♔ King g4  ♖ Rook b7  ♗ Bishop g8  ♙ Pawn h2","black":"♚ King h6  ♜ Rook a1  ♝ Bishop c1  ♟ Pawn b2, g6"},{"id":"04Exi","mates":["g3#"],"turn":"black","pieces":10,"rating":1005,"white":"♔ King h2  ♖ Rook b8  ♙ Pawn b5, g2, h3","black":"♚ King f4  ♜ Rook b1  ♟ Pawn f5, g4, h4"},{"id":"0BYlO","mates":["Rh3#"],"turn":"white","pieces":9,"rating":826,"white":"♔ King f4  ♖ Rook f3, g1  ♙ Pawn c3","black":"♚ King h7  ♛ Queen c2  ♟ Pawn c5, c6, d5"}],"hard":[{"id":"02hTQ","mates":["Ng6#"],"turn":"white","pieces":15,"rating":972,"white":"♔ King g2  ♖ Rook f1  ♘ Knight e5  ♙ Pawn b4, c5, f7, g3, h2","black":"♚ King f8  ♜ Rook c8, d5  ♟ Pawn b5, c6, g7, h6"},{"id":"045Ao","mates":["Qh7#"],"turn":"white","pieces":13,"rating":674,"white":"♔ King h2  ♕ Queen e4  ♖ Rook h5  ♙ Pawn d4, g2, h3","black":"♚ King g8  ♛ Queen c4  ♜ Rook f8  ♟ Pawn a6, b4, f7, g7"},{"id":"00pmn","mates":["Qe1#"],"turn":"black","pieces":11,"rating":969,"white":"♔ King g1  ♕ Queen d4  ♙ Pawn a7, b3, c3, g2, h2","black":"♚ King b5  ♛ Queen e4  ♟ Pawn g6, h7"},{"id":"033VR","mates":["Rxh3#"],"turn":"black","pieces":15,"rating":933,"white":"♔ King h1  ♕ Queen c4  ♖ Rook g1  ♗ Bishop d1  ♙ Pawn a4, b4, h3","black":"♚ King g8  ♜ Rook d2, f3  ♟ Pawn a7, c6, f7, g7, h4"},{"id":"01HI3","mates":["Rc1#"],"turn":"black","pieces":12,"rating":1259,"white":"♔ King e1  ♕ Queen a8  ♖ Rook e8, f7  ♙ Pawn b2, c3","black":"♚ King h7  ♜ Rook c2, h2  ♟ Pawn c4, g7, h6"},{"id":"02m0s","mates":["Rf1#"],"turn":"black","pieces":14,"rating":1240,"white":"♔ King g1  ♕ Queen g3  ♖ Rook d5, h1  ♙ Pawn a2, b2, e3","black":"♚ King e7  ♜ Rook c2, f5  ♞ Knight h2  ♟ Pawn a7, f7, g7"},{"id":"01ig0","mates":["Rc8#"],"turn":"white","pieces":13,"rating":408,"white":"♔ King h2  ♖ Rook c6, d2  ♙ Pawn b4, d4, f6","black":"♚ King f8  ♜ Rook a3, f5  ♞ Knight g8  ♟ Pawn b5, f7, g6"},{"id":"01cZp","mates":["Qf1#"],"turn":"black","pieces":13,"rating":601,"white":"♔ King h1  ♕ Queen g6  ♗ Bishop c3  ♙ Pawn a3, b2, e4, h2, h4","black":"♚ King d8  ♛ Queen c4  ♟ Pawn a4, g4, h5"},{"id":"01zLs","mates":["fxg3#"],"turn":"white","pieces":12,"rating":945,"white":"♔ King h2  ♖ Rook e5, g6  ♙ Pawn c5, f2","black":"♚ King h4  ♜ Rook h8  ♝ Bishop g3  ♟ Pawn a2, b7, c6, d5"},{"id":"02PgC","mates":["Re8#"],"turn":"white","pieces":15,"rating":643,"white":"♔ King c1  ♖ Rook e2  ♙ Pawn a2, b3, f2, g3, h2","black":"♚ King g8  ♜ Rook d4  ♟ Pawn a6, b7, c6, f7, g7, h7"},{"id":"042LP","mates":["Qe5#"],"turn":"black","pieces":14,"rating":1328,"white":"♔ King f4  ♕ Queen f7  ♖ Rook c7  ♗ Bishop h6  ♘ Knight e6  ♙ Pawn g2, h3","black":"♚ King b8  ♛ Queen d5  ♜ Rook a8, g3  ♟ Pawn a7, c6, d6"},{"id":"00wVj","mates":["Ra1#"],"turn":"black","pieces":14,"rating":573,"white":"♔ King c1  ♖ Rook a7, e2  ♘ Knight g3  ♙ Pawn a6, c2, g2","black":"♚ King f8  ♜ Rook a4  ♟ Pawn c3, e4, f5, f7, h6"},{"id":"02k1g","mates":["Rf2#"],"turn":"black","pieces":12,"rating":1131,"white":"♔ King f3  ♖ Rook c7  ♘ Knight e3  ♙ Pawn f4, g4, h2","black":"♚ King g8  ♜ Rook a2  ♞ Knight e4  ♟ Pawn f5, g6, h7"},{"id":"025Et","mates":["Qxe1#"],"turn":"black","pieces":15,"rating":677,"white":"♔ King g1  ♕ Queen b7  ♖ Rook a2, e1  ♗ Bishop e4  ♙ Pawn e3, f2, g2, h2","black":"♚ King g8  ♛ Queen c3  ♜ Rook c8  ♟ Pawn f7, g7, h7"},{"id":"03cDB","mates":["Qh5#"],"turn":"white","pieces":11,"rating":872,"white":"♔ King g1  ♕ Queen f5  ♙ Pawn f2, g3, h2","black":"♚ King h3  ♛ Queen d2  ♟ Pawn c2, f6, g4, h6"},{"id":"02Ab5","mates":["Qh2#"],"turn":"black","pieces":11,"rating":955,"white":"♔ King g1  ♕ Queen b7  ♖ Rook d1, f1  ♙ Pawn a6","black":"♚ King h7  ♛ Queen h3  ♝ Bishop g3  ♟ Pawn c5, g6, g7"},{"id":"03JRQ","mates":["Bf6#"],"turn":"white","pieces":15,"rating":751,"white":"♔ King g2  ♗ Bishop e2, g7  ♙ Pawn b2, c2, g4, h3","black":"♚ King h4  ♜ Rook b8  ♝ Bishop d5  ♟ Pawn a6, b5, e4, f7, h7"},{"id":"01v9U","mates":["Rh7#"],"turn":"white","pieces":15,"rating":700,"white":"♔ King a1  ♖ Rook c7, d7  ♙ Pawn a3, b2, f3, g4","black":"♚ King h8  ♛ Queen e6  ♜ Rook g8  ♞ Knight h4  ♟ Pawn a7, e5, f6, h6"},{"id":"00HHN","mates":["Re1#"],"turn":"black","pieces":14,"rating":895,"white":"♔ King c1  ♖ Rook f7, g3  ♙ Pawn b3, c4, g2, h2","black":"♚ King h8  ♜ Rook a2, e8  ♟ Pawn a7, b6, c5, h7"},{"id":"03vyj","mates":["Rf8#"],"turn":"white","pieces":14,"rating":798,"white":"♔ King d2  ♖ Rook f7  ♙ Pawn b3, c2, c6, d3, f2","black":"♚ King c8  ♜ Rook c5  ♟ Pawn c7, d6, e5, f6, g5"},{"id":"02LWd","mates":["Qh2#"],"turn":"black","pieces":13,"rating":1076,"white":"♔ King h1  ♕ Queen f3  ♗ Bishop f1  ♙ Pawn a4, b3, d5, g4, h3","black":"♚ King h4  ♛ Queen d2  ♝ Bishop e5  ♟ Pawn c5, d6"},{"id":"03B7b","mates":["Qe8#"],"turn":"white","pieces":14,"rating":714,"white":"♔ King h1  ♕ Queen h5  ♗ Bishop f5  ♙ Pawn b4, f2, g2, h3","black":"♚ King h8  ♛ Queen f4  ♝ Bishop h6  ♟ Pawn a5, b6, g7, h4"},{"id":"02h1I","mates":["Qh2#"],"turn":"black","pieces":12,"rating":1076,"white":"♔ King g1  ♕ Queen c3  ♖ Rook e1  ♙ Pawn a4, d6, g2","black":"♚ King h7  ♛ Queen h5  ♜ Rook f7  ♟ Pawn a7, g3, h6"},{"id":"0104L","mates":["Rf1#"],"turn":"black","pieces":15,"rating":1093,"white":"♔ King g1  ♕ Queen b7  ♖ Rook c2  ♙ Pawn a2, b2, d4, g3, h2","black":"♚ King g8  ♜ Rook f2  ♝ Bishop h3  ♟ Pawn a7, f7, g7, h6"},{"id":"016I9","mates":["h5#"],"turn":"white","pieces":14,"rating":1119,"white":"♔ King g4  ♖ Rook e7  ♘ Knight d2  ♙ Pawn a4, b4, g5, h4","black":"♚ King g6  ♜ Rook c3  ♝ Bishop b7  ♞ Knight d4  ♟ Pawn a6, d5, h7"},{"id":"00rIF","mates":["Rh8#"],"turn":"black","pieces":14,"rating":610,"white":"♔ King h6  ♖ Rook b1, g5  ♙ Pawn a5, c2, c3, g2, g3","black":"♚ King f6  ♜ Rook b8  ♟ Pawn a7, b6, c4, d5"},{"id":"02oT0","mates":["Qh8#","Qg8#"],"turn":"white","pieces":15,"rating":755,"white":"♔ King e1  ♕ Queen g7  ♘ Knight f5  ♙ Pawn a2, d5, f3, h3","black":"♚ King e8  ♛ Queen d7  ♝ Bishop b7  ♟ Pawn a6, c7, d6, f6, f7"},{"id":"02iLq","mates":["Rxh7#"],"turn":"white","pieces":14,"rating":1018,"white":"♔ King h1  ♖ Rook b7, e1  ♘ Knight f6  ♙ Pawn g2, h3","black":"♚ King h8  ♛ Queen d2  ♜ Rook a8  ♞ Knight e5  ♟ Pawn a7, c6, d4, h7"},{"id":"03qMO","mates":["Qxa8#"],"turn":"white","pieces":15,"rating":825,"white":"♔ King g1  ♕ Queen c6  ♖ Rook d1  ♙ Pawn c2, f2, g2, h2","black":"♚ King h8  ♛ Queen a2  ♜ Rook a8  ♟ Pawn a7, b5, d5, g7, h7"},{"id":"0158e","mates":["Rh8#"],"turn":"white","pieces":15,"rating":797,"white":"♔ King f1  ♖ Rook h7  ♘ Knight e4  ♙ Pawn c2, e6, g2, h2","black":"♚ King e8  ♜ Rook b2  ♝ Bishop e3  ♟ Pawn b6, c6, d4, e7, g6"},{"id":"02FH7","mates":["Qh7#"],"turn":"white","pieces":13,"rating":829,"white":"♔ King h2  ♕ Queen h5  ♙ Pawn g3, g6","black":"♚ King g8  ♛ Queen a3  ♜ Rook f8  ♟ Pawn a5, b6, c6, d5, d7, g5"},{"id":"031Yd","mates":["Rh3#"],"turn":"white","pieces":11,"rating":1252,"white":"♔ King h1  ♕ Queen g2  ♖ Rook f3  ♙ Pawn a2","black":"♚ King h5  ♛ Queen d5  ♜ Rook g8  ♟ Pawn a7, b7, f6, h6"},{"id":"00fXd","mates":["Qc5#"],"turn":"white","pieces":15,"rating":1374,"white":"♔ King f1  ♕ Queen a7  ♘ Knight g5  ♙ Pawn a3, b4, f2, g2","black":"♚ King d5  ♛ Queen e5  ♝ Bishop g7  ♞ Knight e2  ♟ Pawn a6, b5, e6, f5"},{"id":"01our","mates":["Re2#"],"turn":"black","pieces":12,"rating":1473,"white":"♔ King e3  ♖ Rook a7  ♘ Knight b3  ♙ Pawn a3, f3, h2","black":"♚ King g6  ♜ Rook c2  ♞ Knight f4  ♟ Pawn b6, e5, h7"},{"id":"01zWA","mates":["Rxf1#"],"turn":"black","pieces":15,"rating":709,"white":"♔ King h1  ♕ Queen e4  ♖ Rook g5  ♗ Bishop f1  ♙ Pawn b5, d5, g2, h3","black":"♚ King h6  ♜ Rook c1, c7  ♝ Bishop b6  ♟ Pawn e5, g3, h4"},{"id":"00BQD","mates":["Re1#"],"turn":"black","pieces":15,"rating":717,"white":"♔ King g1  ♖ Rook d2, d7  ♗ Bishop f3  ♙ Pawn b2, b5, f2, g2, h2","black":"♚ King g7  ♜ Rook e8  ♝ Bishop b4  ♟ Pawn f7, g6, h7"},{"id":"03PL7","mates":["Qh4#"],"turn":"black","pieces":12,"rating":1041,"white":"♔ King h2  ♖ Rook g1, g2  ♗ Bishop f3  ♙ Pawn a2, c3, d4","black":"♚ King f6  ♛ Queen g5  ♝ Bishop d7  ♟ Pawn a7, c7"},{"id":"0184P","mates":["Rxg7#"],"turn":"white","pieces":15,"rating":1140,"white":"♔ King g4  ♖ Rook d7  ♘ Knight h5  ♙ Pawn a2, b3, g2, h2","black":"♚ King g6  ♜ Rook b8  ♞ Knight d4  ♟ Pawn a6, c4, e5, g7, h6"},{"id":"00H9n","mates":["Qxg2#"],"turn":"black","pieces":12,"rating":893,"white":"♔ King g1  ♕ Queen d4  ♖ Rook f1  ♙ Pawn a4, b3, g2","black":"♚ King h8  ♛ Queen h3  ♝ Bishop f3  ♟ Pawn b4, e5, g7"},{"id":"00X66","mates":["Re1#"],"turn":"black","pieces":15,"rating":410,"white":"♔ King f1  ♖ Rook b6  ♗ Bishop f4  ♙ Pawn a5, b4, f2, g2, h3","black":"♚ King g8  ♜ Rook e8  ♝ Bishop c3  ♟ Pawn d4, f6, g7, h7"},{"id":"00hck","mates":["Qxg2#"],"turn":"black","pieces":15,"rating":1222,"white":"♔ King h2  ♕ Queen c1  ♗ Bishop d6  ♙ Pawn a2, b4, c5, g2, h3","black":"♚ King f7  ♛ Queen f2  ♞ Knight e3  ♟ Pawn a7, b7, g6, h7"},{"id":"01Pbw","mates":["Rd1#"],"turn":"black","pieces":15,"rating":717,"white":"♔ King h1  ♖ Rook b2, c4  ♙ Pawn a2, c3, g2, h2","black":"♚ King g8  ♜ Rook d3  ♟ Pawn a7, b7, c7, f7, g7, h6"},{"id":"02fPe","mates":["Rg8#"],"turn":"white","pieces":13,"rating":898,"white":"♔ King c1  ♖ Rook b8  ♘ Knight f6  ♙ Pawn a5, b2, g5","black":"♚ King g7  ♜ Rook e5  ♞ Knight f3  ♟ Pawn e6, f7, g6, h7"},{"id":"03MOh","mates":["Qg8#"],"turn":"white","pieces":15,"rating":888,"white":"♔ King g1  ♕ Queen d5  ♗ Bishop b3  ♙ Pawn a4, b2, g4, h3","black":"♚ King h8  ♛ Queen a6  ♝ Bishop c7  ♟ Pawn a5, b4, f4, g7, h6"},{"id":"02Clu","mates":["Nxf2#"],"turn":"black","pieces":15,"rating":780,"white":"♔ King h1  ♕ Queen f2  ♖ Rook g1  ♘ Knight c7  ♙ Pawn a2, b2, g2, h2","black":"♚ King g7  ♝ Bishop b4  ♞ Knight d3  ♟ Pawn a6, b7, f7, g6"},{"id":"008o6","mates":["Qxf8#","Rxf8#"],"turn":"white","pieces":14,"rating":471,"white":"♔ King g1  ♕ Queen a8  ♖ Rook f1  ♗ Bishop a1  ♙ Pawn d4, g6, h3","black":"♚ King g8  ♛ Queen a2  ♜ Rook e2, f8  ♟ Pawn a7, c7, g7"},{"id":"02o14","mates":["Qf2#"],"turn":"black","pieces":15,"rating":1325,"white":"♔ King f1  ♕ Queen b7  ♖ Rook g7  ♙ Pawn a2, b2, d4, e3, g2, h3","black":"♚ King h6  ♛ Queen g3  ♞ Knight e4  ♟ Pawn d5, e6, g6"},{"id":"02aIt","mates":["Rh8#"],"turn":"white","pieces":11,"rating":796,"white":"♔ King e6  ♖ Rook h7  ♙ Pawn a3, b4, f5","black":"♚ King e8  ♜ Rook c3  ♟ Pawn a7, b6, c7, d4"},{"id":"03Lde","mates":["Rd1#"],"turn":"black","pieces":15,"rating":733,"white":"♔ King g1  ♖ Rook b2  ♗ Bishop h2  ♘ Knight c4  ♙ Pawn f2, g2, h3","black":"♚ King c8  ♜ Rook d3  ♞ Knight c6  ♟ Pawn a6, c7, f5, g5, h7"},{"id":"01GkW","mates":["Qh7#"],"turn":"white","pieces":12,"rating":630,"white":"♔ King h2  ♕ Queen b7  ♗ Bishop g6  ♙ Pawn f5, g2, h3","black":"♚ King h8  ♛ Queen f6  ♝ Bishop f8  ♟ Pawn a7, g4, h6"},{"id":"02rnl","mates":["Re8#"],"turn":"white","pieces":12,"rating":928,"white":"♔ King f1  ♖ Rook b7, e1  ♙ Pawn d5, f4, h2","black":"♚ King g8  ♜ Rook a3, h8  ♞ Knight f5  ♟ Pawn g6, h6"},{"id":"01EB4","mates":["Rf8#"],"turn":"white","pieces":14,"rating":437,"white":"♔ King h1  ♖ Rook f1  ♗ Bishop d3  ♙ Pawn a4, b3, c2, g2, h3","black":"♚ King h8  ♛ Queen e5  ♟ Pawn a5, c6, g7, h6"},{"id":"01eLb","mates":["Re7#"],"turn":"white","pieces":11,"rating":1144,"white":"♔ King c5  ♖ Rook h7  ♘ Knight f5  ♙ Pawn e4, f3","black":"♚ King e6  ♜ Rook d1  ♞ Knight g1  ♟ Pawn f6, g5, h5"},{"id":"00FHX","mates":["Rxc8#"],"turn":"white","pieces":14,"rating":485,"white":"♔ King g1  ♖ Rook c1  ♙ Pawn f3, f6, g2, h5","black":"♚ King g8  ♜ Rook c8  ♝ Bishop b1  ♟ Pawn a2, d5, e6, f7, h7"},{"id":"03Sox","mates":["Rxb8#"],"turn":"white","pieces":15,"rating":522,"white":"♔ King g2  ♖ Rook b2  ♗ Bishop a1, c2  ♙ Pawn f2, f3, h2","black":"♚ King g8  ♜ Rook a3, b8  ♟ Pawn a2, d5, f7, g7, h6"},{"id":"00fDM","mates":["Qxg7#"],"turn":"white","pieces":15,"rating":1001,"white":"♔ King g1  ♕ Queen h6  ♖ Rook d1  ♗ Bishop c3  ♙ Pawn b4, g2, h3","black":"♚ King g8  ♛ Queen e6  ♜ Rook d8, e8  ♝ Bishop g7  ♟ Pawn b6, c7, d5"},{"id":"0119E","mates":["Qxf8#"],"turn":"white","pieces":13,"rating":477,"white":"♔ King g1  ♕ Queen f1  ♘ Knight d6  ♙ Pawn d4, e5, g4, h6","black":"♚ King h8  ♛ Queen f8  ♝ Bishop g6  ♞ Knight c3  ♟ Pawn e6, h7"},{"id":"02sIl","mates":["Rxe1#"],"turn":"black","pieces":13,"rating":688,"white":"♔ King c1  ♕ Queen a3  ♖ Rook e1, g2  ♙ Pawn c2, g7","black":"♚ King g8  ♜ Rook a8, e8  ♞ Knight f8  ♟ Pawn a6, c3, d5"},{"id":"02HEw","mates":["Qe4#","Qd1#"],"turn":"black","pieces":14,"rating":882,"white":"♔ King d3  ♕ Queen d8  ♗ Bishop e5  ♙ Pawn a5, e3, f4, g5, h3","black":"♚ King h7  ♛ Queen h1  ♜ Rook c2  ♟ Pawn f5, g6, h4"},{"id":"01liD","mates":["Ra5#"],"turn":"white","pieces":15,"rating":1169,"white":"♔ King g1  ♖ Rook b1, c5  ♙ Pawn b4, f2, g2, h3","black":"♚ King a4  ♛ Queen f6  ♟ Pawn a6, b7, c7, f7, g6, h5"},{"id":"01MCO","mates":["Qf8#"],"turn":"white","pieces":12,"rating":1342,"white":"♔ King h1  ♕ Queen a8  ♖ Rook f1  ♗ Bishop h2  ♙ Pawn a2, b2","black":"♚ King g7  ♛ Queen e3  ♜ Rook c1  ♝ Bishop d4  ♟ Pawn g6, h7"},{"id":"02S4F","mates":["Rh8#"],"turn":"white","pieces":12,"rating":731,"white":"♔ King d3  ♖ Rook f8, g1","black":"♚ King h6  ♜ Rook b6, b7  ♟ Pawn c5, d5, e6, g6, g7, h5"},{"id":"00NR5","mates":["Rxd8#"],"turn":"white","pieces":14,"rating":572,"white":"♔ King d2  ♖ Rook a8  ♘ Knight d6  ♙ Pawn a2, b3, c5, f3, g4","black":"♚ King g8  ♜ Rook d8  ♞ Knight b5, g2  ♟ Pawn g7, h7"},{"id":"016aw","mates":["Qxg2#"],"turn":"black","pieces":15,"rating":651,"white":"♔ King g1  ♕ Queen d4  ♖ Rook c1  ♗ Bishop g2  ♙ Pawn b4, e4, f3","black":"♚ King g8  ♛ Queen g3  ♝ Bishop h3  ♟ Pawn d6, e7, f7, g6, h4"},{"id":"02d53","mates":["Qxg7#"],"turn":"white","pieces":15,"rating":772,"white":"♔ King g1  ♕ Queen b2  ♘ Knight e6  ♙ Pawn e3, f2, g3, h2","black":"♚ King g8  ♛ Queen c6  ♜ Rook a8  ♟ Pawn a6, d5, e4, g7, h7"},{"id":"036MU","mates":["Bc6#"],"turn":"black","pieces":13,"rating":781,"white":"♔ King h1  ♗ Bishop c8, d6  ♙ Pawn a2, f4, g3, h2","black":"♚ King h8  ♝ Bishop b5, b6  ♟ Pawn a7, g7, h5"},{"id":"013fd","mates":["Qxg2#"],"turn":"black","pieces":13,"rating":980,"white":"♔ King h1  ♖ Rook a1, a4  ♗ Bishop d5  ♙ Pawn b7, e4, f3, g2, h3","black":"♚ King g3  ♛ Queen b2  ♟ Pawn g6, h5"},{"id":"01za4","mates":["Qa1#"],"turn":"black","pieces":15,"rating":947,"white":"♔ King a2  ♕ Queen h4  ♖ Rook e2  ♗ Bishop g4  ♙ Pawn a3, b3, d5, g6","black":"♚ King e8  ♛ Queen c3  ♝ Bishop d4  ♞ Knight e5  ♟ Pawn a7, b7, c5"},{"id":"03OqO","mates":["Qg3#"],"turn":"black","pieces":12,"rating":1319,"white":"♔ King h3  ♕ Queen e4, e8  ♗ Bishop f5  ♙ Pawn a4, d4, e3","black":"♚ King g7  ♛ Queen f2  ♝ Bishop e1  ♟ Pawn a5, g5"},{"id":"02gZ7","mates":["Rf1#"],"turn":"black","pieces":15,"rating":399,"white":"♔ King c1  ♕ Queen h8  ♖ Rook e7  ♘ Knight d4  ♙ Pawn a4, b2, c2","black":"♚ King g5  ♜ Rook f5  ♝ Bishop g2  ♞ Knight e4, f6  ♟ Pawn b7, d5, g6"},{"id":"03gvn","mates":["Qg2#"],"turn":"black","pieces":14,"rating":795,"white":"♔ King h3  ♕ Queen e3  ♖ Rook a1, h1  ♗ Bishop f5  ♙ Pawn f3, f4, h4","black":"♚ King h7  ♛ Queen b2  ♜ Rook g6  ♟ Pawn a5, g7, h6"},{"id":"00HPz","mates":["c5#"],"turn":"black","pieces":15,"rating":659,"white":"♔ King d4  ♖ Rook f2  ♘ Knight c3  ♙ Pawn a4, a5, e3, f4, h2","black":"♚ King d6  ♜ Rook g8  ♝ Bishop e4  ♟ Pawn c6, d5, f6, h7"},{"id":"02KIQ","mates":["Qh8#"],"turn":"white","pieces":12,"rating":1316,"white":"♔ King f1  ♕ Queen b2  ♖ Rook b7  ♙ Pawn c5, h2","black":"♚ King h6  ♛ Queen e6  ♞ Knight e4  ♟ Pawn d5, f7, g5, g6"},{"id":"01H4V","mates":["Nf2#"],"turn":"black","pieces":15,"rating":887,"white":"♔ King h1  ♖ Rook g1  ♘ Knight c6  ♙ Pawn a4, b3, d4, g2, h2","black":"♚ King g8  ♜ Rook a8  ♞ Knight h3  ♟ Pawn d5, g6, g7, h6"},{"id":"042Fz","mates":["Nh6#"],"turn":"white","pieces":15,"rating":1290,"white":"♔ King h1  ♕ Queen b2  ♖ Rook f1  ♘ Knight f5  ♙ Pawn a2, g2, h2","black":"♚ King g8  ♛ Queen d5  ♜ Rook a8, d7  ♟ Pawn a7, b6, g6, h7"},{"id":"03iWK","mates":["Rxb1#"],"turn":"black","pieces":15,"rating":511,"white":"♔ King g1  ♖ Rook a7, b1  ♙ Pawn a4, f2, g2, h3","black":"♚ King g8  ♜ Rook b8  ♝ Bishop e5  ♟ Pawn c5, d6, f7, g6, h7"},{"id":"02xnk","mates":["Rf5#"],"turn":"black","pieces":11,"rating":789,"white":"♔ King g5  ♖ Rook b6, e2  ♙ Pawn a3, b2, h4","black":"♚ King g7  ♜ Rook f6  ♟ Pawn a4, e6, h5"},{"id":"039zu","mates":["Rf1#"],"turn":"black","pieces":14,"rating":399,"white":"♔ King h1  ♖ Rook b8  ♘ Knight f6  ♙ Pawn b4, c3, d4, e5, h2","black":"♚ King f7  ♜ Rook f4  ♞ Knight e3  ♟ Pawn b6, d5, f5"},{"id":"03XGG","mates":["Qxh2#"],"turn":"black","pieces":15,"rating":996,"white":"♔ King h1  ♕ Queen d5  ♖ Rook e1, f1  ♙ Pawn a2, f3, h2","black":"♚ King h8  ♛ Queen f4  ♜ Rook f8  ♝ Bishop b8  ♟ Pawn a7, g5, g7, h6"},{"id":"00fZM","mates":["Qh8#"],"turn":"white","pieces":15,"rating":988,"white":"♔ King g1  ♕ Queen h6  ♗ Bishop d4  ♙ Pawn a2, c3, f3, g2, h2","black":"♚ King g8  ♛ Queen b7  ♜ Rook f7, f8  ♟ Pawn d5, d6, g6"},{"id":"041Bo","mates":["Bc6#","Rxd1#"],"turn":"black","pieces":14,"rating":429,"white":"♔ King h1  ♕ Queen h6  ♗ Bishop d1  ♙ Pawn a2, c4, d3, f4","black":"♚ King g3  ♜ Rook b1  ♝ Bishop d7  ♟ Pawn d6, g6, h2, h7"},{"id":"025AE","mates":["Re7#"],"turn":"white","pieces":11,"rating":600,"white":"♔ King f1  ♖ Rook b7  ♘ Knight g8  ♙ Pawn e4, g4","black":"♚ King e6  ♜ Rook h3  ♞ Knight g5  ♟ Pawn d6, g6, h7"},{"id":"03zEM","mates":["Qxg5#"],"turn":"white","pieces":14,"rating":1247,"white":"♔ King e2  ♕ Queen f6  ♗ Bishop c5  ♙ Pawn a2, b3, e4, f2, f4","black":"♚ King h5  ♛ Queen h3  ♜ Rook b8, g5  ♟ Pawn a7, h7"},{"id":"01BjV","mates":["Rb1#"],"turn":"black","pieces":13,"rating":716,"white":"♔ King g1  ♖ Rook a2  ♘ Knight e4  ♙ Pawn a4, d3, f2, g2, h3","black":"♚ King e6  ♜ Rook b8  ♝ Bishop d6  ♟ Pawn c5, d4"},{"id":"02DSN","mates":["Rxf7#"],"turn":"white","pieces":11,"rating":1336,"white":"♔ King g1  ♖ Rook h7  ♗ Bishop c2  ♙ Pawn f4, g6","black":"♚ King f6  ♜ Rook e3  ♝ Bishop d6  ♟ Pawn d5, e6, f7"},{"id":"0495p","mates":["Rg8#"],"turn":"white","pieces":14,"rating":524,"white":"♔ King e1  ♖ Rook g1  ♗ Bishop f7  ♙ Pawn a2, b2, e3, f2, h2","black":"♚ King h8  ♛ Queen f6  ♞ Knight a6  ♟ Pawn a7, b7, h7"},{"id":"00g2W","mates":["Qh1#","Rh1#"],"turn":"black","pieces":12,"rating":726,"white":"♔ King h2  ♕ Queen f2  ♗ Bishop g6  ♙ Pawn a2, d6, g3, h4","black":"♚ King g8  ♛ Queen b7  ♜ Rook e1  ♟ Pawn a6, g7"},{"id":"03T43","mates":["Qxg2#"],"turn":"black","pieces":11,"rating":602,"white":"♔ King h2  ♕ Queen g2  ♖ Rook b8  ♙ Pawn f7, h3","black":"♚ King h7  ♛ Queen e4  ♝ Bishop d5  ♟ Pawn a4, g6, g7"},{"id":"00Hfa","mates":["Re8#"],"turn":"white","pieces":14,"rating":617,"white":"♔ King g1  ♖ Rook a1, e4  ♗ Bishop f6, g2  ♙ Pawn a3, h3","black":"♚ King g8  ♛ Queen g6  ♜ Rook f2  ♟ Pawn a4, f7, g7, h7"},{"id":"005Ep","mates":["Rd8#"],"turn":"white","pieces":15,"rating":813,"white":"♔ King c1  ♖ Rook c7, d6  ♙ Pawn b2, f2, g2, h2","black":"♚ King f8  ♜ Rook b4, g8  ♞ Knight b5  ♟ Pawn a7, b7, g7, h6"},{"id":"00GY4","mates":["Rb8#"],"turn":"white","pieces":15,"rating":1167,"white":"♔ King h2  ♖ Rook b7, h7  ♙ Pawn a2, b2, d3, g3, h3","black":"♚ King d8  ♛ Queen h4  ♜ Rook d6, g8  ♞ Knight e3  ♟ Pawn a7, e5"},{"id":"03Ulb","mates":["Rd8#"],"turn":"white","pieces":13,"rating":612,"white":"♔ King e1  ♖ Rook d1  ♙ Pawn a7, g2, h3","black":"♚ King g8  ♜ Rook a2  ♞ Knight c4  ♟ Pawn c7, e6, f7, g7, h7"},{"id":"046JT","mates":["Qd1#"],"turn":"black","pieces":13,"rating":1432,"white":"♔ King f1  ♕ Queen b5  ♗ Bishop c5  ♙ Pawn a2, b2, f2, g4, h3","black":"♚ King h7  ♛ Queen d5  ♞ Knight h4  ♟ Pawn g5, g7"},{"id":"03vEG","mates":["Qe4#"],"turn":"white","pieces":14,"rating":1190,"white":"♔ King g1  ♕ Queen h4  ♖ Rook c4  ♙ Pawn e5, f2, g2, h3","black":"♚ King d5  ♛ Queen b6  ♜ Rook a2  ♞ Knight c6  ♟ Pawn e6, g7, h6"},{"id":"02emx","mates":["Qe7#"],"turn":"white","pieces":15,"rating":1096,"white":"♔ King f2  ♕ Queen e2  ♗ Bishop d8  ♙ Pawn f3, g4, h5","black":"♚ King d6  ♛ Queen d5  ♝ Bishop c6  ♟ Pawn a7, c4, d3, f6, g5, h6"},{"id":"01ykJ","mates":["Ne2#"],"turn":"black","pieces":13,"rating":521,"white":"♔ King g1  ♖ Rook a7, b8  ♙ Pawn c5, e3, f2, h2","black":"♚ King e6  ♝ Bishop c6  ♞ Knight c3  ♟ Pawn a6, g2, g7"},{"id":"00K48","mates":["Rf8#"],"turn":"white","pieces":15,"rating":425,"white":"♔ King g1  ♖ Rook f1  ♗ Bishop d6  ♙ Pawn a4, c2, d5, g3, h2","black":"♚ King g8  ♛ Queen c4  ♟ Pawn a6, c5, e2, g7, h7"},{"id":"03YGJ","mates":["Qg8#"],"turn":"white","pieces":12,"rating":889,"white":"♔ King f1  ♕ Queen c4  ♖ Rook d1  ♙ Pawn h6","black":"♚ King e8  ♛ Queen h5  ♝ Bishop h4  ♟ Pawn b6, c5, e7, g6, h7"},{"id":"02vo8","mates":["Rxf8#","Qxf8#"],"turn":"white","pieces":14,"rating":584,"white":"♔ King g2  ♕ Queen h6  ♖ Rook c8  ♙ Pawn d5, g3, h4","black":"♚ King g8  ♛ Queen a3  ♝ Bishop f8  ♞ Knight e2  ♟ Pawn d6, f6, f7, h7"},{"id":"03c9m","mates":["Rxe8#"],"turn":"white","pieces":14,"rating":399,"white":"♔ King a2  ♖ Rook e1  ♗ Bishop h6  ♙ Pawn a4, b2, b3, d5, f3, g2","black":"♚ King h8  ♛ Queen a7  ♜ Rook e8  ♝ Bishop c2  ♟ Pawn h7"},{"id":"00lio","mates":["Rg8#","Qg8#","Qe7#"],"turn":"white","pieces":13,"rating":1117,"white":"♔ King h1  ♕ Queen e6  ♖ Rook g7  ♙ Pawn b5, e3","black":"♚ King f8  ♛ Queen e4  ♜ Rook a8, f3  ♟ Pawn a5, b7, d6, e5"},{"id":"00b3n","mates":["Qh5#"],"turn":"black","pieces":14,"rating":999,"white":"♔ King h3  ♕ Queen b8, g2  ♖ Rook h8  ♙ Pawn e3, f2, g3, h2","black":"♚ King g7  ♛ Queen e2  ♜ Rook f6  ♟ Pawn f7, g6, h6"},{"id":"02ry1","mates":["Rf3#"],"turn":"black","pieces":11,"rating":615,"white":"♔ King f4  ♖ Rook e7  ♙ Pawn d5, e4, f5, h2","black":"♚ King h4  ♜ Rook b3  ♟ Pawn d6, f6, g4"},{"id":"01UaM","mates":["Rh5#"],"turn":"black","pieces":14,"rating":907,"white":"♔ King h3  ♕ Queen e1  ♗ Bishop e5  ♙ Pawn a5, b2, c3, g3, h2","black":"♚ King g6  ♜ Rook f2, f5  ♞ Knight f6  ♟ Pawn a6, b5"},{"id":"02IQK","mates":["Qxe8#"],"turn":"white","pieces":14,"rating":496,"white":"♔ King g1  ♕ Queen d7  ♙ Pawn a2, f3, g2, h2","black":"♚ King h8  ♜ Rook e8  ♝ Bishop b7  ♞ Knight d8  ♟ Pawn a7, b6, g7, h7"},{"id":"00Yfi","mates":["Bxf5#"],"turn":"black","pieces":14,"rating":948,"white":"♔ King g4  ♕ Queen b8  ♖ Rook e2  ♗ Bishop f5  ♙ Pawn a2, g3, h4","black":"♚ King h7  ♜ Rook f1  ♝ Bishop e6  ♟ Pawn d4, f7, g6, h6"},{"id":"03RgK","mates":["Qxe8#"],"turn":"white","pieces":13,"rating":1059,"white":"♔ King c5  ♕ Queen c6  ♘ Knight b3  ♙ Pawn a2, d4, e3","black":"♚ King g8  ♛ Queen e2  ♜ Rook e8  ♟ Pawn d5, e4, g7, h7"},{"id":"02Nlw","mates":["Qxg2#"],"turn":"black","pieces":14,"rating":939,"white":"♔ King h2  ♕ Queen d7  ♖ Rook c8  ♗ Bishop g3  ♙ Pawn f2, g2, h3","black":"♚ King g5  ♛ Queen e4  ♝ Bishop d5  ♟ Pawn e5, f6, g7, h6"},{"id":"01qHx","mates":["Rc1#"],"turn":"black","pieces":14,"rating":405,"white":"♔ King g1  ♖ Rook b2  ♙ Pawn a2, e4, f2, g2, h2","black":"♚ King f8  ♜ Rook c3  ♟ Pawn a7, b6, f7, g6, h7"},{"id":"02dGQ","mates":["Qh3#"],"turn":"white","pieces":13,"rating":1318,"white":"♔ King g2  ♕ Queen h2  ♙ Pawn a3, b3, e3","black":"♚ King g4  ♛ Queen c1  ♝ Bishop b7  ♟ Pawn a6, d3, e4, g5, h7"},{"id":"02NMH","mates":["Rh4#"],"turn":"black","pieces":14,"rating":1135,"white":"♔ King h1  ♕ Queen e2  ♖ Rook d1  ♗ Bishop g6  ♙ Pawn a2, e5, g2","black":"♚ King h8  ♛ Queen c5  ♜ Rook d4  ♝ Bishop g7  ♟ Pawn a7, b6, e6"},{"id":"004JD","mates":["Nc2#"],"turn":"black","pieces":14,"rating":1297,"white":"♔ King e3  ♖ Rook a7  ♘ Knight e2  ♙ Pawn a2, b3, c5, f2","black":"♚ King g4  ♜ Rook d8  ♞ Knight a3  ♟ Pawn a5, b4, c6, f5"},{"id":"045Xz","mates":["Qxg2#"],"turn":"black","pieces":14,"rating":1082,"white":"♔ King h1  ♕ Queen f6  ♖ Rook g2  ♗ Bishop e5  ♙ Pawn f4, h3","black":"♚ King g8  ♛ Queen b7  ♜ Rook d2  ♟ Pawn a7, c5, f5, g6, h7"},{"id":"01J49","mates":["Qg3#"],"turn":"white","pieces":13,"rating":847,"white":"♔ King h1  ♕ Queen g1  ♖ Rook g8  ♙ Pawn a2, g4, h2","black":"♚ King h4  ♛ Queen f7  ♜ Rook f2  ♟ Pawn a7, c6, g5, h6"},{"id":"02LWp","mates":["Rxa7#"],"turn":"white","pieces":15,"rating":693,"white":"♔ King g1  ♖ Rook f7  ♗ Bishop c5  ♙ Pawn a4, c2, g2, h3","black":"♚ King a6  ♛ Queen h6  ♜ Rook a7, b8  ♟ Pawn d5, e6, g7, h4"},{"id":"022JP","mates":["Re4#"],"turn":"white","pieces":14,"rating":1297,"white":"♔ King c2  ♖ Rook e6  ♘ Knight c3  ♙ Pawn a3, f2, g2, h2","black":"♚ King d4  ♜ Rook b8  ♝ Bishop g7  ♟ Pawn c5, f4, g5, h5"},{"id":"00jUu","mates":["Qxb2#"],"turn":"black","pieces":15,"rating":644,"white":"♔ King b1  ♕ Queen c6  ♖ Rook c1  ♙ Pawn b2, e4, f3, g2, h5","black":"♚ King h7  ♛ Queen b4  ♞ Knight d1  ♟ Pawn a6, f7, g7, h6"},{"id":"00LWa","mates":["Nf2#"],"turn":"black","pieces":15,"rating":880,"white":"♔ King h1  ♖ Rook a1, g1  ♗ Bishop g2  ♙ Pawn a3, c6, f4, g3, h2","black":"♚ King g8  ♜ Rook c8  ♞ Knight h3  ♟ Pawn f7, g7, h7"},{"id":"03LKc","mates":["Nf2#"],"turn":"black","pieces":15,"rating":938,"white":"♔ King h1  ♕ Queen c4  ♖ Rook g1  ♘ Knight g3  ♙ Pawn a2, b3, g2, h2","black":"♚ King g8  ♜ Rook a8  ♞ Knight h3  ♟ Pawn a6, f7, g6, h7"},{"id":"03Y1O","mates":["Qg2#"],"turn":"black","pieces":15,"rating":997,"white":"♔ King h1  ♕ Queen b5  ♖ Rook b1  ♘ Knight g1  ♙ Pawn c3, e4, g3, h2","black":"♚ King e6  ♛ Queen a2  ♜ Rook f8  ♝ Bishop d6  ♟ Pawn a7, e5, h3"},{"id":"00bJi","mates":["Rd2#"],"turn":"black","pieces":12,"rating":1465,"white":"♔ King d3  ♖ Rook e7  ♘ Knight e6  ♙ Pawn a2, b2, c3","black":"♚ King h8  ♜ Rook h2  ♞ Knight c4  ♟ Pawn a6, b7, d5"},{"id":"01BI2","mates":["R1d7#"],"turn":"white","pieces":13,"rating":1064,"white":"♔ King g1  ♖ Rook d1, d8  ♙ Pawn b4, e5","black":"♚ King f7  ♜ Rook e2, f2  ♟ Pawn b5, c7, e6, g6, h5"},{"id":"03Pkr","mates":["Qd7#"],"turn":"white","pieces":13,"rating":1004,"white":"♔ King f2  ♕ Queen g4  ♘ Knight f6  ♙ Pawn a3, c5, d4, e5","black":"♚ King e7  ♛ Queen f8  ♜ Rook f7  ♟ Pawn a6, b5, d5"},{"id":"02DbV","mates":["Qe1#"],"turn":"black","pieces":15,"rating":1448,"white":"♔ King c1  ♕ Queen f8  ♙ Pawn a2, b3, c2, e3, g2, h6","black":"♚ King d7  ♛ Queen c3  ♟ Pawn a3, b6, c6, e4, e7"},{"id":"02r0o","mates":["Rd8#"],"turn":"white","pieces":15,"rating":600,"white":"♔ King h1  ♖ Rook d2  ♗ Bishop h2  ♙ Pawn a3, c5, e5, f6","black":"♚ King f8  ♛ Queen a6  ♜ Rook h3  ♟ Pawn a5, c6, f7, g4, g7"},{"id":"02lJV","mates":["Qh7#"],"turn":"white","pieces":14,"rating":1022,"white":"♔ King h2  ♕ Queen f5  ♘ Knight f8  ♙ Pawn f2, g2, h3","black":"♚ King h8  ♛ Queen f6  ♞ Knight d5  ♟ Pawn a6, b5, c6, g7, h6"},{"id":"02XKt","mates":["Rxf8#"],"turn":"white","pieces":14,"rating":483,"white":"♔ King g1  ♖ Rook f2  ♗ Bishop f1, g3  ♙ Pawn a2, b2, c3, d5","black":"♚ King h8  ♛ Queen e1  ♜ Rook f8  ♟ Pawn d6, g7, h7"},{"id":"01QId","mates":["Qf6#"],"turn":"black","pieces":14,"rating":1160,"white":"♔ King f4  ♕ Queen c7  ♖ Rook e3, e4  ♙ Pawn a2, b6, f3, g4, h3","black":"♚ King g7  ♛ Queen c6  ♜ Rook g1  ♟ Pawn f7, g6"},{"id":"03kbx","mates":["Qf2#"],"turn":"black","pieces":12,"rating":965,"white":"♔ King e1  ♕ Queen e6  ♖ Rook b7  ♙ Pawn b2, b3, g2, h3","black":"♚ King h8  ♛ Queen f4  ♜ Rook d2  ♟ Pawn g6, h7"},{"id":"01WoY","mates":["g3#"],"turn":"white","pieces":14,"rating":920,"white":"♔ King f2  ♙ Pawn a2, b2, c2, f3, g2, h4","black":"♚ King f4  ♟ Pawn a7, c6, e5, f5, f7, h7"},{"id":"01qhs","mates":["Rc1#"],"turn":"black","pieces":14,"rating":726,"white":"♔ King g1  ♖ Rook a7  ♗ Bishop e6  ♙ Pawn a2, b3, e3, e4, g3, h2","black":"♚ King f8  ♜ Rook c8, d2  ♟ Pawn b6, h7"},{"id":"022dd","mates":["Rd1#"],"turn":"black","pieces":13,"rating":482,"white":"♔ King f1  ♖ Rook c4, h5  ♗ Bishop e5  ♙ Pawn f2, g2, h3","black":"♚ King f7  ♜ Rook a8, d7  ♞ Knight c1  ♟ Pawn a3, g7"},{"id":"01HU7","mates":["Rh8#"],"turn":"white","pieces":12,"rating":826,"white":"♔ King f2  ♖ Rook c8  ♗ Bishop f6  ♙ Pawn e5, f3, g2","black":"♚ King h7  ♛ Queen g6  ♝ Bishop d5  ♟ Pawn b6, e6, h5"},{"id":"03XAy","mates":["Rf7#"],"turn":"white","pieces":13,"rating":832,"white":"♔ King f1  ♖ Rook c7  ♗ Bishop e8  ♙ Pawn f4, g2, h2","black":"♚ King f6  ♜ Rook a3  ♝ Bishop b4  ♟ Pawn e6, f5, g6, h7"},{"id":"00l3p","mates":["Qg4#","Qxf4#"],"turn":"white","pieces":13,"rating":1277,"white":"♔ King f2  ♕ Queen f5  ♘ Knight f6  ♙ Pawn b2, c3, e4, g5","black":"♚ King h4  ♛ Queen d8  ♜ Rook h3  ♞ Knight f4  ♟ Pawn a6, b7"},{"id":"00lMW","mates":["Qxg7#"],"turn":"white","pieces":15,"rating":670,"white":"♔ King g1  ♕ Queen g5  ♗ Bishop b2  ♙ Pawn a2, f2, g2, h3","black":"♚ King h8  ♛ Queen e6  ♜ Rook c8  ♟ Pawn a7, b6, c5, g7, h7"},{"id":"03X8P","mates":["Qa4#"],"turn":"black","pieces":12,"rating":1068,"white":"♔ King b3  ♕ Queen f6  ♙ Pawn a6, b2, c3, g5","black":"♚ King g8  ♛ Queen g4  ♟ Pawn a7, b5, e6, f7"},{"id":"02tNt","mates":["Re1#"],"turn":"black","pieces":11,"rating":1085,"white":"♔ King c1  ♖ Rook c5, g6  ♙ Pawn a6, b4, c3, f5","black":"♚ King f4  ♜ Rook e8, f2  ♟ Pawn h6"},{"id":"00AfZ","mates":["Qf7#"],"turn":"white","pieces":14,"rating":1026,"white":"♔ King g2  ♕ Queen a7  ♗ Bishop b1  ♘ Knight e5  ♙ Pawn e3, f4, g3","black":"♚ King g8  ♛ Queen h8  ♜ Rook c5, c8  ♝ Bishop b5  ♟ Pawn d5, g4"},{"id":"00cZ4","mates":["Qh2#"],"turn":"black","pieces":14,"rating":1056,"white":"♔ King h1  ♖ Rook c7, f2  ♘ Knight e4  ♙ Pawn a2, g2, h3","black":"♚ King h6  ♛ Queen f4  ♞ Knight f3  ♟ Pawn a5, e5, g6, h5"},{"id":"02HQm","mates":["Rf8#"],"turn":"white","pieces":15,"rating":490,"white":"♔ King h3  ♖ Rook f4  ♙ Pawn a2, c2, c4, g3, h6","black":"♚ King h8  ♜ Rook e5  ♟ Pawn a7, b6, c5, d4, g6, h7"},{"id":"02lt5","mates":["Rg2#"],"turn":"black","pieces":11,"rating":816,"white":"♔ King g3  ♕ Queen a6  ♖ Rook c5  ♘ Knight f3","black":"♚ King h5  ♜ Rook b2  ♝ Bishop h3  ♞ Knight f4  ♟ Pawn e3, g5, h6"},{"id":"01N7F","mates":["Qh1#"],"turn":"black","pieces":11,"rating":1457,"white":"♔ King h3  ♕ Queen c5  ♙ Pawn a4, b3, c2, g3, h4","black":"♚ King g8  ♛ Queen f3  ♟ Pawn g6, h5"},{"id":"008LD","mates":["Rf1#"],"turn":"black","pieces":12,"rating":404,"white":"♔ King g1  ♖ Rook e2  ♘ Knight g5  ♙ Pawn f4, g3, h2","black":"♚ King g6  ♜ Rook f3  ♝ Bishop h3  ♟ Pawn f5, g7, h7"},{"id":"02KC6","mates":["Qxg7#"],"turn":"white","pieces":14,"rating":755,"white":"♔ King h2  ♕ Queen g6  ♖ Rook g3  ♙ Pawn a4, c3, g2, h3","black":"♚ King h8  ♛ Queen f4  ♜ Rook d8  ♟ Pawn a6, b7, f6, g7"},{"id":"02jRN","mates":["Rxg2#"],"turn":"black","pieces":12,"rating":462,"white":"♔ King g5  ♖ Rook b7  ♘ Knight d5  ♙ Pawn f4, g2, h4","black":"♚ King g7  ♜ Rook b2  ♟ Pawn b5, f7, g6, h5"},{"id":"01XW1","mates":["Rd8#"],"turn":"white","pieces":11,"rating":968,"white":"♔ King e6  ♖ Rook d7  ♙ Pawn f3, g2, g4","black":"♚ King f8  ♜ Rook c4  ♟ Pawn d4, f6, g7, h6"},{"id":"0332A","mates":["Qxh7#"],"turn":"white","pieces":12,"rating":1283,"white":"♔ King h1  ♕ Queen e4  ♘ Knight c3, g5  ♙ Pawn a2, h2","black":"♚ King h8  ♛ Queen d8  ♜ Rook f2  ♟ Pawn a6, g7, h7"},{"id":"01S1N","mates":["Ra8#"],"turn":"white","pieces":14,"rating":663,"white":"♔ King g1  ♖ Rook a1  ♙ Pawn b6, g3, h2","black":"♚ King g8  ♜ Rook b2  ♝ Bishop e4  ♞ Knight d4  ♟ Pawn d5, e6, f7, g7, h7"},{"id":"00nNa","mates":["Re4#"],"turn":"black","pieces":12,"rating":1270,"white":"♔ King e5  ♖ Rook b5  ♙ Pawn b4, f2, g3, h4","black":"♚ King c7  ♜ Rook c4  ♟ Pawn e6, f5, g7, h7"}]};
let _puzzleCache = null;

async function loadPuzzles() {
  if (_puzzleCache) return _puzzleCache;
  // Try to fetch from public/puzzles.json (when deployed via Vite/GitHub Pages)
  try {
    const res = await fetch('puzzles.json');
    if (res.ok) { _puzzleCache = await res.json(); return _puzzleCache; }
  } catch (e) {}
  // Fall back to inline data (viewer mode / offline)
  _puzzleCache = _INLINE_PUZZLES;
  return _puzzleCache;
}

async function fetchMate1Puzzle(difficulty) {
  const db = await loadPuzzles();
  const pool = db[difficulty];
  if (!pool || pool.length === 0) return null;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const p = shuffled[0];
  return {
    mates:          p.mates,
    text:           { white: p.white, black: p.black },
    attackingColor: p.turn,
    pieces:         p.pieces,
    rating:         p.rating,
    lichessId:      p.id,
  };
}

const MATE_PHASES = { IDLE: 0, QUESTION: 1, FEEDBACK: 2 };

function MateGame({ onHome, themeBtn }) {
  const [difficulty, setDifficulty] = useState('easy');
  const [phase, setPhase] = useState(MATE_PHASES.IDLE);
  const [puzzle, setPuzzle] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [questionStart, setQuestionStart] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const inputRef = useRef(null);

  const newPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFeedback(null);
    setInputValue('');
    setPhase(MATE_PHASES.IDLE);
    try {
      const p = await fetchMate1Puzzle(difficulty);
      if (!p) { setError('No puzzle found for this difficulty. Make sure puzzles.json is generated.'); return; }
      setPuzzle(p);
      setPhase(MATE_PHASES.QUESTION);
      setQuestionStart(Date.now());
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      setError('Could not load puzzles. Run scripts/generate_puzzles.py first.');
    } finally {
      setLoading(false);
    }
  }, [difficulty]);

  useEffect(() => { newPuzzle(); }, [difficulty]);

  const submit = useCallback(() => {
    if (!puzzle || phase !== MATE_PHASES.QUESTION) return;
    const ms = Date.now() - questionStart;
    const raw = inputValue.trim();
    if (!raw) return;

    const normalize = s => s.replace(/\s/g,'').replace(/[+#!=?]/g,'').toLowerCase();
    const isCorrect = puzzle.mates.some(san => normalize(san) === normalize(raw));

    const newResults = [...results, { correct: isCorrect, ms }];
    setResults(newResults);
    setFeedback({
      correct: isCorrect,
      message: isCorrect ? `✓ ${raw} — checkmate!` : `✗ "${raw}" doesn't give checkmate.`,
      mates: puzzle.mates,
    });
    setPhase(MATE_PHASES.FEEDBACK);
  }, [puzzle, phase, inputValue, questionStart, results]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') submit();
  }, [submit]);

  const correct = results.filter(r => r.correct).length;
  const total   = results.length;

  return (
    <AppShell title="MATE IN ONE" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} themeBtn={themeBtn}
      headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}
    >
      {showRules && (
        <RulesModal onClose={() => setShowRules(false)}>
          <RuleSection title="Objective" text="A chess position from a real Lichess puzzle is described in text — no board shown. Find any move that delivers checkmate in one." />
          <RuleSection title="Input" text="Type your move in algebraic notation (e.g. Qh5, Rxf7, e8=Q) and press Enter or ✓. All valid mating moves are accepted." />
          <RuleSection title="Difficulty" text="Based on the number of pieces on the board. Easy: 5 or fewer. Medium: 6–10. Hard: 11–15. Fewer pieces = easier to visualize." />
          <RuleSection title="Tip" text="Scan all checks first: queen lines, rook files, bishop diagonals, knight jumps. Then verify the enemy king has no escape square." />
        </RulesModal>
      )}

      {/* Config */}
      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginRight: 2 }}>DIFF</span>
          {Object.entries(MATE_DIFFICULTIES).map(([key, { label }]) => (
            <button key={key} onClick={() => setDifficulty(key)} style={chipStyle(key, difficulty)}>{label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={newPuzzle} style={{ padding: "5px 16px", border: "none", borderRadius: 4, background: T.accent, color: T.bg, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>NEW</button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", flex: 1 }}>

        {loading && (
          <div style={{ textAlign: "center", color: T.textDim, fontSize: 13, padding: "40px 0" }}>
            Fetching puzzle from Lichess...
          </div>
        )}

        {!loading && error && (
          <div style={{ background: T.redDim, border: "1px solid rgba(224,85,85,0.3)", borderRadius: 6, padding: "16px 20px", color: T.red, fontSize: 13, marginBottom: 16 }}>
            {error}
            <div style={{ marginTop: 10 }}>
              <button onClick={newPuzzle} style={{ background: "transparent", border: `1px solid ${T.red}`, borderRadius: 4, color: T.red, padding: "6px 16px", fontFamily: "inherit", fontSize: 12, cursor: "pointer" }}>Retry</button>
            </div>
          </div>
        )}

        {!loading && puzzle && (
          <>
            {total > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontSize: 11, color: T.textDim }}>
                <span>{correct} / {total} correct</span>
                <span style={{ color: T.textDim }}>{puzzle.pieces} pieces · {MATE_DIFFICULTIES[difficulty].desc}</span>
              </div>
            )}

            {/* Position */}
            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "20px 24px", marginBottom: 14, animation: "fadeUp 0.3s ease" }}>
              <div style={{
                fontSize: 13, fontWeight: 600, letterSpacing: 2,
                color: puzzle.attackingColor === 'white' ? T.textBright : T.text,
                background: T.panelBorder,
                border: `1px solid ${T.panelBorder}`,
                borderRadius: 4, padding: "6px 12px", display: "inline-block", marginBottom: 14,
              }}>
                {puzzle.attackingColor === 'white' ? '♔ WHITE TO MOVE' : '♚ BLACK TO MOVE'}
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 6 }}>WHITE</div>
                <div style={{ fontSize: 13, color: T.textBright, lineHeight: 2, letterSpacing: 0.5 }}>{puzzle.text.white}</div>
              </div>
              <div style={{ height: 1, background: T.panelBorder, margin: "12px 0" }} />
              <div>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 6 }}>BLACK</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 2, letterSpacing: 0.5 }}>{puzzle.text.black}</div>
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  background: feedback.correct ? T.greenDim : T.redDim,
                  border: `1px solid ${feedback.correct ? "rgba(60,168,104,0.3)" : "rgba(224,85,85,0.3)"}`,
                  borderRadius: 6, padding: "12px 16px",
                  marginBottom: feedback.correct ? 0 : 10,
                  fontSize: 13, color: feedback.correct ? T.green : T.red,
                }}>
                  {feedback.message}
                  {feedback.correct && feedback.mates.length > 1 && (
                    <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>
                      Other mates: {feedback.mates.filter(s => normalize(s) !== normalize(inputValue.trim())).join(', ')}
                    </div>
                  )}
                  {puzzle.lichessId && (
                    <div style={{ marginTop: 12 }}>
                      <a href={`https://lichess.org/training/${puzzle.lichessId}`} target="_blank" rel="noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: T.accent,
                          textDecoration: "none", border: `1px solid ${T.accentDim}`,
                          borderRadius: 4, padding: "4px 10px", fontFamily: "inherit",
                          letterSpacing: 0.5,
                        }}>
                        View on Lichess ↗
                      </a>
                    </div>
                  )}
                </div>
                {!feedback.correct && (
                  <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "12px 16px", fontSize: 12 }}>
                    <span style={{ color: T.textDim }}>Mating move{feedback.mates.length > 1 ? 's' : ''}: </span>
                    <span style={{ color: T.accent }}>{feedback.mates.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            {phase === MATE_PHASES.QUESTION && (
              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "16px 20px", marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 10 }}>▸ YOUR MOVE</div>
                <div style={{ fontSize: 11, color: T.textDim, marginBottom: 10 }}>
                  e.g. <span style={{ color: T.text }}>Qh5</span>, <span style={{ color: T.text }}>Rxf7</span>, <span style={{ color: T.text }}>e8=Q</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input ref={inputRef} value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Qh5"
                    style={{
                      flex: 1, padding: "10px 14px", background: "rgba(0,0,0,0.3)",
                      border: `1px solid ${T.panelBorder}`, borderRadius: 4,
                      color: T.textBright, fontSize: 15, fontFamily: "inherit", letterSpacing: 1.5,
                    }}
                  />
                  <button onClick={submit} style={{
                    padding: "10px 20px", border: "none", borderRadius: 4,
                    background: T.accent, color: T.bg, fontSize: 13,
                    fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  }}>✓</button>
                </div>
              </div>
            )}

            {phase === MATE_PHASES.FEEDBACK && (
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <button onClick={newPuzzle} style={{
                  padding: "10px 32px", border: `1px solid ${T.accent}`, borderRadius: 4,
                  background: "rgba(74,158,202,0.08)", color: T.accent, fontSize: 14,
                  fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                  animation: "glowPulse 2s infinite",
                }}>NEXT PUZZLE</button>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GAME 6 — BLINDFOLD PUZZLES
// ══════════════════════════════════════════════════════════════════════════════

const _INLINE_LONG_PUZZLES = {"easy":{"short":{"standard":[{"id":"09eXc","fen":"1r1k4/1P6/2K5/8/1P6/8/8/8 w - - 3 52","solution":["b5","Ke7","Kc7"],"turn":"white","pieces":5,"moves":3,"rating":1308,"themes":"crushing endgame master quietMove rookEndgame short","white":"♔ King c6  ♙ Pawn b4, b7","black":"♚ King d8  ♜ Rook b8"},{"id":"08Dl3","fen":"8/8/8/3N1P2/5K2/1kp5/8/8 b - - 0 58","solution":["c2","Ke5","c1=Q"],"turn":"black","pieces":5,"moves":3,"rating":819,"themes":"advancedPawn crushing endgame knightEndgame promotion short","white":"♔ King f4  ♘ Knight d5  ♙ Pawn f5","black":"♚ King b3  ♟ Pawn c3"},{"id":"03A1C","fen":"4K3/1k2P2q/3Q4/8/8/8/8/8 b - - 4 55","solution":["Qg8+","Kd7","Qc8#"],"turn":"black","pieces":5,"moves":3,"rating":1327,"themes":"endgame master mate mateIn2 queenEndgame short","white":"♔ King e8  ♕ Queen d6  ♙ Pawn e7","black":"♚ King b7  ♛ Queen h7"},{"id":"09TD1","fen":"8/8/8/P7/5p2/8/4K1k1/8 b - - 1 46","solution":["f3+","Ke3","f2"],"turn":"black","pieces":4,"moves":3,"rating":565,"themes":"advancedPawn crushing endgame pawnEndgame short","white":"♔ King e2  ♙ Pawn a5","black":"♚ King g2  ♟ Pawn f4"},{"id":"02Yx1","fen":"4R3/8/K7/1P2r3/5k2/8/8/8 b - - 2 65","solution":["Rxe8","Kb6","Ke5"],"turn":"black","pieces":5,"moves":3,"rating":1784,"themes":"crushing defensiveMove endgame hangingPiece master rookEndgame short","white":"♔ King a6  ♖ Rook e8  ♙ Pawn b5","black":"♚ King f4  ♜ Rook e5"}],"hard":[{"id":"26NWe","fen":"4K3/3P4/4P3/4k3/8/8/7r/8 w - - 5 75","solution":["e7","Ke6","Kd8"],"turn":"white","pieces":5,"moves":3,"rating":2355,"themes":"advancedPawn crushing defensiveMove endgame rookEndgame short","white":"♔ King e8  ♙ Pawn d7, e6","black":"♚ King e5  ♜ Rook h2"},{"id":"0VuEF","fen":"8/8/8/1p6/2k2KP1/8/8/8 w - - 0 48","solution":["g5","Kd5","g6","Ke6","Kg5"],"turn":"white","pieces":4,"moves":5,"rating":2280,"themes":"crushing defensiveMove endgame long pawnEndgame quietMove","white":"♔ King f4  ♙ Pawn g4","black":"♚ King c4  ♟ Pawn b5"},{"id":"0Si3m","fen":"8/3k4/p7/2K5/1P6/8/8/8 w - - 5 60","solution":["Kb6","a5","Kxa5","Kc6","Ka6"],"turn":"white","pieces":4,"moves":5,"rating":2002,"themes":"crushing defensiveMove endgame long pawnEndgame","white":"♔ King c5  ♙ Pawn b4","black":"♚ King d7  ♟ Pawn a6"},{"id":"0AiJd","fen":"8/6k1/6p1/1K4Np/8/8/8/8 b - - 2 61","solution":["Kf6","Nf3","Kf5","Kc4","Ke4"],"turn":"black","pieces":5,"moves":5,"rating":2701,"themes":"crushing endgame knightEndgame long","white":"♔ King b5  ♘ Knight g5","black":"♚ King g7  ♟ Pawn g6, h5"},{"id":"10SrD","fen":"8/8/8/1pk5/4K3/5P2/8/8 b - - 1 68","solution":["Kc4","Ke3","Kc3","Ke2","b4"],"turn":"black","pieces":4,"moves":5,"rating":2657,"themes":"crushing defensiveMove endgame long pawnEndgame","white":"♔ King e4  ♙ Pawn f3","black":"♚ King c5  ♟ Pawn b5"}]},"medium":{"standard":[{"id":"0H5H4","fen":"8/8/5K2/p7/6P1/1k6/8/8 b - - 1 44","solution":["a4","Kf7","a3","g5","a2","g6","a1=Q"],"turn":"black","pieces":4,"moves":7,"rating":659,"themes":"advancedPawn crushing endgame pawnEndgame promotion quietMove veryLong","white":"♔ King f6  ♙ Pawn g4","black":"♚ King b3  ♟ Pawn a5"},{"id":"0K8k9","fen":"8/8/8/p5K1/6P1/1k3P2/8/8 b - - 0 54","solution":["a4","f4","a3","f5","a2","f6","a1=Q"],"turn":"black","pieces":5,"moves":7,"rating":599,"themes":"advancedPawn crushing endgame master pawnEndgame promotion quietMove veryLong","white":"♔ King g5  ♙ Pawn f3, g4","black":"♚ King b3  ♟ Pawn a5"},{"id":"0wdFP","fen":"8/8/8/4p3/4k1K1/6P1/8/8 b - - 0 45","solution":["Kd3","Kf3","e4+","Kf2","Kd2","g4","e3+"],"turn":"black","pieces":4,"moves":7,"rating":1840,"themes":"crushing endgame pawnEndgame veryLong","white":"♔ King g4  ♙ Pawn g3","black":"♚ King e4  ♟ Pawn e5"},{"id":"0gfhl","fen":"r7/k7/8/1K6/8/8/8/7R w - - 0 56","solution":["Rh7+","Kb8","Kb6","Kc8","Rh8+","Kd7","Rxa8"],"turn":"white","pieces":4,"moves":7,"rating":1678,"themes":"crushing endgame exposedKing rookEndgame skewer veryLong","white":"♔ King b5  ♖ Rook h1","black":"♚ King a7  ♜ Rook a8"},{"id":"0ahGl","fen":"8/8/8/2k1KpP1/1p6/8/8/8 w - - 0 54","solution":["g6","b3","g7","b2","g8=Q","b1=Q","Qc8+"],"turn":"white","pieces":5,"moves":7,"rating":1670,"themes":"advancedPawn crushing endgame pawnEndgame promotion veryLong","white":"♔ King e5  ♙ Pawn g5","black":"♚ King c5  ♟ Pawn b4, f5"}],"hard":[{"id":"4DVMg","fen":"8/5p2/8/5P2/8/1K6/8/4k3 b - - 1 64","solution":["Kd2","Kc4","Ke3","Kd5","Kf4","f6","Kf5"],"turn":"black","pieces":4,"moves":7,"rating":2316,"themes":"crushing endgame pawnEndgame veryLong","white":"♔ King b3  ♙ Pawn f5","black":"♚ King e1  ♟ Pawn f7"},{"id":"0eLmS","fen":"8/8/r7/1K3kp1/8/R7/8/8 w - - 0 53","solution":["Rxa6","g4","Kc4","g3","Kd3","g2","Ra1","Kf4","Ke2"],"turn":"white","pieces":5,"moves":9,"rating":2103,"themes":"crushing defensiveMove endgame hangingPiece quietMove rookEndgame veryLong","white":"♔ King b5  ♖ Rook a3","black":"♚ King f5  ♜ Rook a6  ♟ Pawn g5"},{"id":"1zoe2","fen":"8/6K1/8/5R1P/6k1/5p2/8/8 b - - 0 50","solution":["Kxf5","h6","f2","h7","f1=Q","h8=Q","Qg2+","Kf8","Qa8+"],"turn":"black","pieces":5,"moves":9,"rating":2101,"themes":"advancedPawn crushing endgame hangingPiece promotion veryLong","white":"♔ King g7  ♖ Rook f5  ♙ Pawn h5","black":"♚ King g4  ♟ Pawn f3"},{"id":"0HmzV","fen":"8/5k1K/8/4nPP1/8/8/8/8 w - - 3 61","solution":["g6+","Ke7","f6+","Kxf6","g7","Kf5","g8=Q"],"turn":"white","pieces":5,"moves":7,"rating":2324,"themes":"advancedPawn crushing endgame exposedKing knightEndgame promotion veryLong","white":"♔ King h7  ♙ Pawn f5, g5","black":"♚ King f7  ♞ Knight e5"},{"id":"3jZJD","fen":"8/8/8/5p2/1P6/4k3/2K5/8 w - - 1 46","solution":["b5","f4","Kd1","f3","Ke1","f2+","Kf1"],"turn":"white","pieces":4,"moves":7,"rating":2118,"themes":"crushing endgame pawnEndgame quietMove veryLong","white":"♔ King c2  ♙ Pawn b4","black":"♚ King e3  ♟ Pawn f5"}]},"long":{"standard":[{"id":"1j8Cp","fen":"8/6p1/8/5K2/3k4/6P1/8/8 w - - 2 52","solution":["g4","Ke3","g5","Kf3","g6","Kg3","Ke6","Kg4","Kf7","Kf5","Kxg7"],"turn":"white","pieces":4,"moves":11,"rating":1903,"themes":"crushing endgame pawnEndgame quietMove veryLong","white":"♔ King f5  ♙ Pawn g3","black":"♚ King d4  ♟ Pawn g7"},{"id":"1vpw1","fen":"8/8/8/5K1p/3k1P2/8/8/8 w - - 0 58","solution":["Kg5","Ke4","f5","Ke5","f6","Ke6","Kg6","h4","f7","Ke7","Kg7"],"turn":"white","pieces":4,"moves":11,"rating":1155,"themes":"advancedPawn crushing defensiveMove endgame pawnEndgame quietMove veryLong","white":"♔ King f5  ♙ Pawn f4","black":"♚ King d4  ♟ Pawn h5"},{"id":"3dGOM","fen":"8/8/8/p7/3k3P/8/5K2/8 b - - 0 57","solution":["a4","h5","Ke5","h6","Kf6","h7","Kg7","h8=R","Kxh8","Ke1","a3"],"turn":"black","pieces":4,"moves":11,"rating":1962,"themes":"crushing endgame pawnEndgame quietMove veryLong","white":"♔ King f2  ♙ Pawn h4","black":"♚ King d4  ♟ Pawn a5"},{"id":"ABC7z","fen":"8/8/8/3kp2K/5R1P/8/8/8 b - - 0 61","solution":["exf4","Kg4","Ke4","h5","f3","Kg3","Ke3","h6","f2","Kg2","Ke2","h7","f1=Q+"],"turn":"black","pieces":5,"moves":13,"rating":1242,"themes":"advancedPawn crushing endgame promotion veryLong","white":"♔ King h5  ♖ Rook f4  ♙ Pawn h4","black":"♚ King d5  ♟ Pawn e5"},{"id":"4v10V","fen":"8/8/1K1k4/4p3/P7/8/8/8 w - - 0 59","solution":["a5","e4","a6","e3","a7","e2","a8=Q","e1=Q","Qd8+","Ke6","Qe8+","Kf6","Qxe1"],"turn":"white","pieces":4,"moves":13,"rating":1469,"themes":"advancedPawn crushing endgame pawnEndgame promotion quietMove skewer veryLong","white":"♔ King b6  ♙ Pawn a4","black":"♚ King d6  ♟ Pawn e5"}],"hard":[{"id":"Arf65","fen":"8/8/4k3/2p3KP/8/4P3/8/8 b - - 0 47","solution":["c4","h6","Kf7","h7","Kg7","e4","c3","h8=Q+","Kxh8","Kf4","c2"],"turn":"black","pieces":5,"moves":11,"rating":2123,"themes":"advancedPawn crushing endgame pawnEndgame quietMove veryLong","white":"♔ King g5  ♙ Pawn e3, h5","black":"♚ King e6  ♟ Pawn c5"},{"id":"3JaB2","fen":"8/8/8/3K3p/2P5/8/5k2/8 b - - 1 57","solution":["h4","c5","h3","c6","h2","c7","h1=Q+","Kd6","Qh3","Kc6","Qc8"],"turn":"black","pieces":4,"moves":11,"rating":2285,"themes":"advancedPawn crushing endgame pawnEndgame promotion quietMove veryLong","white":"♔ King d5  ♙ Pawn c4","black":"♚ King f2  ♟ Pawn h5"},{"id":"H3UAt","fen":"8/4k3/6K1/4p3/7P/8/8/8 b - - 2 73","solution":["e4","h5","Kf8","h6","Kg8","h7+","Kh8","Kg5","e3","Kf4","e2"],"turn":"black","pieces":4,"moves":11,"rating":2100,"themes":"advancedPawn crushing endgame pawnEndgame quietMove veryLong","white":"♔ King g6  ♙ Pawn h4","black":"♚ King e7  ♟ Pawn e5"},{"id":"2XKh4","fen":"8/8/5p2/4k3/PK6/8/8/8 w - - 1 46","solution":["Kc5","Ke6","Kc6","f5","a5","f4","a6","f3","a7","f2","a8=Q"],"turn":"white","pieces":4,"moves":11,"rating":2057,"themes":"advancedPawn crushing endgame pawnEndgame promotion quietMove veryLong","white":"♔ King b4  ♙ Pawn a4","black":"♚ King e5  ♟ Pawn f6"},{"id":"BjsAM","fen":"8/8/8/1P2kp2/8/K7/8/8 b - - 2 52","solution":["f4","Kb4","f3","b6","Kd6","Kc3","f2","b7","Kc7","b8=Q+","Kxb8"],"turn":"black","pieces":4,"moves":11,"rating":2015,"themes":"advancedPawn crushing endgame pawnEndgame quietMove veryLong","white":"♔ King a3  ♙ Pawn b5","black":"♚ King e5  ♟ Pawn f5"}]}},"medium":{"short":{"standard":[{"id":"00lHu","fen":"8/p7/6P1/4p3/R5K1/1r2kp1P/8/8 w - - 0 48","solution":["g7","Rb8","Ra3+"],"turn":"white","pieces":9,"moves":3,"rating":1791,"themes":"advancedPawn crushing endgame rookEndgame short","white":"♔ King g4  ♖ Rook a4  ♙ Pawn g6, h3","black":"♚ King e3  ♜ Rook b3  ♟ Pawn a7, e5, f3"},{"id":"006OI","fen":"6R1/p7/5k2/P7/6KP/8/8/5r2 b - - 6 53","solution":["Rg1+","Kf4","Rxg8"],"turn":"black","pieces":7,"moves":3,"rating":843,"themes":"crushing endgame rookEndgame short skewer","white":"♔ King g4  ♖ Rook g8  ♙ Pawn a5, h4","black":"♚ King f6  ♜ Rook f1  ♟ Pawn a7"},{"id":"00hYk","fen":"8/8/6p1/3nkp1p/7P/1B2KPP1/8/8 w - - 1 55","solution":["Bxd5","Kxd5","Kf4"],"turn":"white","pieces":10,"moves":3,"rating":1277,"themes":"crushing endgame short","white":"♔ King e3  ♗ Bishop b3  ♙ Pawn f3, g3, h4","black":"♚ King e5  ♞ Knight d5  ♟ Pawn f5, g6, h5"},{"id":"00b6f","fen":"6k1/8/5B2/1R3K2/6p1/6P1/P4P1q/8 b - - 0 41","solution":["Qh5+","Bg5","Qf7+","Kxg4","Qc4+"],"turn":"black","pieces":9,"moves":5,"rating":1749,"themes":"crushing endgame long","white":"♔ King f5  ♖ Rook b5  ♗ Bishop f6  ♙ Pawn a2, f2, g3","black":"♚ King g8  ♛ Queen h2  ♟ Pawn g4"},{"id":"000rO","fen":"3R4/8/8/KB2b3/1p6/1P2k3/3p4/8 b - - 0 58","solution":["Bc7+","Kxb4","Bxd8"],"turn":"black","pieces":8,"moves":3,"rating":1110,"themes":"crushing endgame fork master short","white":"♔ King a5  ♖ Rook d8  ♗ Bishop b5  ♙ Pawn b3","black":"♚ King e3  ♝ Bishop e5  ♟ Pawn b4, d2"}],"hard":[{"id":"022mo","fen":"8/3R1p2/P4kp1/2K4p/7r/8/8/8 w - - 0 38","solution":["a7","Ra4","Kb5","Rxa7","Rxa7"],"turn":"white","pieces":8,"moves":5,"rating":2583,"themes":"advancedPawn advantage endgame long rookEndgame","white":"♔ King c5  ♖ Rook d7  ♙ Pawn a6","black":"♚ King f6  ♜ Rook h4  ♟ Pawn f7, g6, h5"},{"id":"01Nny","fen":"8/p7/5k2/8/3P1K1p/P7/8/8 b - - 3 46","solution":["Ke6","Kg4","Kd5","a4","Kxd4"],"turn":"black","pieces":6,"moves":5,"rating":2122,"themes":"crushing endgame long pawnEndgame","white":"♔ King f4  ♙ Pawn a3, d4","black":"♚ King f6  ♟ Pawn a7, h4"},{"id":"03DEb","fen":"5r2/8/kpBp2R1/3P4/P6K/8/5p2/8 b - - 1 46","solution":["f1=Q","Bb5+","Qxb5","axb5+","Kxb5"],"turn":"black","pieces":10,"moves":5,"rating":2204,"themes":"advancedPawn crushing endgame long promotion","white":"♔ King h4  ♖ Rook g6  ♗ Bishop c6  ♙ Pawn a4, d5","black":"♚ King a6  ♜ Rook f8  ♟ Pawn b6, d6, f2"},{"id":"02OW7","fen":"4R3/2k5/p4P2/8/8/8/rp4PK/8 w - - 0 39","solution":["f7","b1=Q","Re7+","Kb6","f8=Q"],"turn":"white","pieces":8,"moves":5,"rating":2244,"themes":"advancedPawn crushing endgame exposedKing long promotion rookEndgame","white":"♔ King h2  ♖ Rook e8  ♙ Pawn f6, g2","black":"♚ King c7  ♜ Rook a2  ♟ Pawn a6, b2"},{"id":"00dt1","fen":"Q7/8/3B4/2p5/1rkn4/K7/8/8 b - - 2 54","solution":["Nb5+","Ka2","Nc3+","Ka1","Rb1#"],"turn":"black","pieces":7,"moves":5,"rating":2194,"themes":"arabianMate endgame exposedKing fork long master mate mateIn3","white":"♔ King a3  ♕ Queen a8  ♗ Bishop d6","black":"♚ King c4  ♜ Rook b4  ♞ Knight d4  ♟ Pawn c5"}]},"medium":{"standard":[{"id":"07ty4","fen":"8/8/5pk1/4pn2/6KP/5P2/8/8 w - - 0 74","solution":["h5+","Kh6","Kxf5","e4","fxe4","Kxh5","Kxf6"],"turn":"white","pieces":7,"moves":7,"rating":1155,"themes":"crushing deflection endgame knightEndgame master veryLong","white":"♔ King g4  ♙ Pawn f3, h4","black":"♚ King g6  ♞ Knight f5  ♟ Pawn e5, f6"},{"id":"070XP","fen":"8/7p/6p1/6KP/6P1/7k/8/8 w - - 1 56","solution":["h6","Kg3","Kf6","Kxg4","Kg7","g5","Kxh7"],"turn":"white","pieces":6,"moves":7,"rating":1904,"themes":"crushing endgame pawnEndgame veryLong","white":"♔ King g5  ♙ Pawn g4, h5","black":"♚ King h3  ♟ Pawn g6, h7"},{"id":"07UbC","fen":"8/8/1p3K2/8/p6P/8/P4P2/2k5 b - - 0 47","solution":["b5","Ke6","b4","h5","b3","a3","b2"],"turn":"black","pieces":7,"moves":7,"rating":1921,"themes":"advancedPawn crushing endgame pawnEndgame quietMove veryLong","white":"♔ King f6  ♙ Pawn a2, f2, h4","black":"♚ King c1  ♟ Pawn a4, b6"},{"id":"07bjx","fen":"8/1p3N2/8/p2pkn2/8/1PP5/1P1K4/8 b - - 5 35","solution":["Kf6","Nd8","Nd6","Ke3","Ke7","Kd4","Kxd8"],"turn":"black","pieces":10,"moves":7,"rating":1974,"themes":"crushing defensiveMove endgame knightEndgame quietMove trappedPiece veryLong","white":"♔ King d2  ♘ Knight f7  ♙ Pawn b2, b3, c3","black":"♚ King e5  ♞ Knight f5  ♟ Pawn a5, b7, d5"},{"id":"04O0Z","fen":"8/8/6pk/7Q/1K6/1P6/P7/8 b - - 0 54","solution":["gxh5","Kc5","h4","b4","h3","b5","h2","b6","h1=Q"],"turn":"black","pieces":6,"moves":9,"rating":1306,"themes":"advancedPawn crushing endgame promotion quietMove veryLong","white":"♔ King b4  ♕ Queen h5  ♙ Pawn a2, b3","black":"♚ King h6  ♟ Pawn g6"}],"hard":[{"id":"01JUS","fen":"8/2k4p/2P1K1p1/5p2/5P2/8/7P/8 w - - 0 49","solution":["Kd5","g5","fxg5","f4","Ke4","Kxc6","Kxf4"],"turn":"white","pieces":8,"moves":7,"rating":2171,"themes":"crushing endgame pawnEndgame veryLong","white":"♔ King e6  ♙ Pawn c6, f4, h2","black":"♚ King c7  ♟ Pawn f5, g6, h7"},{"id":"06eiB","fen":"8/p7/1p5k/6p1/2P1K3/1P6/P7/8 w - - 2 57","solution":["Kf5","Kh5","b4","g4","Kf4","g3","Kxg3"],"turn":"white","pieces":8,"moves":7,"rating":2472,"themes":"crushing endgame pawnEndgame quietMove veryLong","white":"♔ King e4  ♙ Pawn a2, b3, c4","black":"♚ King h6  ♟ Pawn a7, b6, g5"},{"id":"078do","fen":"8/5k2/6p1/6P1/3r1p2/2PK4/8/8 w - - 0 72","solution":["Kxd4","Ke6","c4","f3","Ke3","f2","Kxf2","Kf5","c5"],"turn":"white","pieces":7,"moves":9,"rating":2394,"themes":"crushing defensiveMove endgame quietMove veryLong","white":"♔ King d3  ♙ Pawn c3, g5","black":"♚ King f7  ♜ Rook d4  ♟ Pawn f4, g6"},{"id":"04T3f","fen":"2Q5/pp6/8/1P2K3/7q/4k3/P7/8 b - - 6 44","solution":["Qf4+","Kd5","Qd4+","Ke6","Qg4+","Ke7","Qxc8"],"turn":"black","pieces":8,"moves":7,"rating":2296,"themes":"crushing endgame queenEndgame skewer veryLong","white":"♔ King e5  ♕ Queen c8  ♙ Pawn a2, b5","black":"♚ King e3  ♛ Queen h4  ♟ Pawn a7, b7"},{"id":"02BWG","fen":"8/8/1p4p1/p2p4/3k4/1P3PP1/P2K4/8 b - - 0 36","solution":["b5","a3","b4","a4","g5","Ke2","Kc3"],"turn":"black","pieces":10,"moves":7,"rating":2661,"themes":"crushing endgame pawnEndgame quietMove veryLong zugzwang","white":"♔ King d2  ♙ Pawn a2, b3, f3, g3","black":"♚ King d4  ♟ Pawn a5, b6, d5, g6"}]},"long":{"standard":[{"id":"0Bsai","fen":"8/8/2pKBp2/5n2/1P2k3/8/8/8 w - - 0 52","solution":["Bxf5+","Kxf5","Kxc6","Ke4","b5","f5","b6","f4","b7","f3","b8=Q"],"turn":"white","pieces":7,"moves":11,"rating":1233,"themes":"advancedPawn crushing endgame promotion quietMove veryLong","white":"♔ King d6  ♗ Bishop e6  ♙ Pawn b4","black":"♚ King e4  ♞ Knight f5  ♟ Pawn c6, f6"},{"id":"0bBfG","fen":"2b5/8/p1p5/8/PPP5/6Pp/5K1k/8 w - - 1 48","solution":["b5","cxb5","cxb5","axb5","axb5","Bf5","b6","Bc8","g4","Bb7","g5","Bh1","g6"],"turn":"white","pieces":10,"moves":13,"rating":1921,"themes":"bishopEndgame crushing endgame quietMove veryLong","white":"♔ King f2  ♙ Pawn a4, b4, c4, g3","black":"♚ King h2  ♝ Bishop c8  ♟ Pawn a6, c6, h3"},{"id":"19tQz","fen":"8/8/3p1kp1/p2P3p/P3K2P/8/5P2/8 w - - 1 43","solution":["Kf4","g5+","hxg5+","Kg6","f3","h4","Kg4","h3","Kxh3","Kxg5","Kg3","Kf5","f4"],"turn":"white","pieces":10,"moves":13,"rating":1780,"themes":"crushing defensiveMove endgame pawnEndgame quietMove veryLong zugzwang","white":"♔ King e4  ♙ Pawn a4, d5, f2, h4","black":"♚ King f6  ♟ Pawn a5, d6, g6, h5"},{"id":"0VpX4","fen":"8/5n2/7p/1p3P2/2k1K1NP/8/8/8 w - - 0 60","solution":["Ne5+","Nxe5","Kxe5","b4","f6","b3","f7","b2","f8=Q","b1=Q","Qc8+"],"turn":"white","pieces":8,"moves":11,"rating":1696,"themes":"advancedPawn crushing endgame knightEndgame promotion veryLong","white":"♔ King e4  ♘ Knight g4  ♙ Pawn f5, h4","black":"♚ King c4  ♞ Knight f7  ♟ Pawn b5, h6"},{"id":"0SWvf","fen":"8/8/8/p3k1pp/P1P1p2P/4K1P1/8/8 b - - 0 43","solution":["g4","c5","Kd5","c6","Kxc6","Kxe4","Kc5","Kf4","Kb4","Kg5","Kxa4"],"turn":"black","pieces":10,"moves":11,"rating":1621,"themes":"crushing endgame master pawnEndgame quietMove veryLong zugzwang","white":"♔ King e3  ♙ Pawn a4, c4, g3, h4","black":"♚ King e5  ♟ Pawn a5, e4, g5, h5"}],"hard":[{"id":"0T2lR","fen":"8/2k3p1/8/4p2p/4P3/5KP1/7P/8 w - - 0 41","solution":["g4","h4","g5","Kb6","Kg4","Kc5","Kf5","Kd4","h3","g6+","Kxg6"],"turn":"white","pieces":8,"moves":11,"rating":2368,"themes":"crushing endgame pawnEndgame quietMove veryLong","white":"♔ King f3  ♙ Pawn e4, g3, h2","black":"♚ King c7  ♟ Pawn e5, g7, h5"},{"id":"0WECn","fen":"8/2n5/6p1/1PP4p/P4k2/4p2P/4K3/8 w - - 0 56","solution":["b6","Ne6","b7","Nd4+","Ke1","Nc6","a5","Kf3","a6","Nb4","b8=Q","Nd3+","Kd1","e2+","Kc2"],"turn":"white","pieces":10,"moves":15,"rating":2297,"themes":"advancedPawn crushing defensiveMove endgame knightEndgame promotion quietMove veryLong","white":"♔ King e2  ♙ Pawn a4, b5, c5, h3","black":"♚ King f4  ♞ Knight c7  ♟ Pawn e3, g6, h5"},{"id":"0UaWs","fen":"6R1/8/8/3p4/P2kb3/4p3/1PP5/1K6 b - - 3 48","solution":["e2","Rg1","Ke3","a5","Kd2","a6","Bxc2+","Ka2","d4","a7","Be4"],"turn":"black","pieces":9,"moves":11,"rating":2709,"themes":"advancedPawn crushing defensiveMove endgame quietMove veryLong","white":"♔ King b1  ♖ Rook g8  ♙ Pawn a4, b2, c2","black":"♚ King d4  ♝ Bishop e4  ♟ Pawn d5, e3"},{"id":"07BTO","fen":"1k6/5p2/K7/1P2pp1p/7P/5P2/6P1/8 w - - 4 41","solution":["g4","fxg4","fxg4","hxg4","h5","g3","h6","g2","h7","g1=Q","h8=Q+","Kc7","Qxe5+"],"turn":"white","pieces":10,"moves":13,"rating":2249,"themes":"advancedPawn advantage endgame exposedKing pawnEndgame promotion quietMove veryLong","white":"♔ King a6  ♙ Pawn b5, f3, g2, h4","black":"♚ King b8  ♟ Pawn e5, f5, f7, h5"},{"id":"076gz","fen":"8/8/8/P7/4kp2/K7/R7/r7 b - - 4 56","solution":["Rxa2+","Kxa2","Kd5","a6","Kc6","a7","Kb7","a8=R","Kxa8","Kb1","f3","Kc2","f2"],"turn":"black","pieces":6,"moves":13,"rating":2198,"themes":"advancedPawn crushing endgame rookEndgame veryLong","white":"♔ King a3  ♖ Rook a2  ♙ Pawn a5","black":"♚ King e4  ♜ Rook a1  ♟ Pawn f4"}]}},"hard":{"short":{"standard":[{"id":"00Mgf","fen":"2RQ4/p4pp1/4p1kp/8/6PP/4qPK1/1r6/8 w - - 0 36","solution":["h5+","Kh7","Qg8#"],"turn":"white","pieces":14,"moves":3,"rating":1132,"themes":"endgame mate mateIn2 short","white":"♔ King g3  ♕ Queen d8  ♖ Rook c8  ♙ Pawn f3, g4, h4","black":"♚ King g6  ♛ Queen e3  ♜ Rook b2  ♟ Pawn a7, e6, f7, g7, h6"},{"id":"00Sr6","fen":"4r2k/p6p/1p3p2/8/2p2P2/P4Q1q/8/3R1RK1 b - - 1 37","solution":["Rg8+","Kf2","Qh2+"],"turn":"black","pieces":14,"moves":3,"rating":1520,"themes":"advantage endgame master short","white":"♔ King g1  ♕ Queen f3  ♖ Rook d1, f1  ♙ Pawn a3, f4","black":"♚ King h8  ♛ Queen h3  ♜ Rook e8  ♟ Pawn a7, b6, c4, f6, h7"},{"id":"00DcC","fen":"5k2/6p1/p1b3Pp/2N2P1r/p7/8/1KP5/5R2 w - - 0 37","solution":["Ne6+","Ke7","Nxg7"],"turn":"white","pieces":13,"moves":3,"rating":1383,"themes":"crushing deflection endgame master short","white":"♔ King b2  ♖ Rook f1  ♘ Knight c5  ♙ Pawn c2, f5, g6","black":"♚ King f8  ♜ Rook h5  ♝ Bishop c6  ♟ Pawn a4, a6, g7, h6"},{"id":"00MFe","fen":"7k/p5pp/2r2q2/2p4Q/8/8/P5PP/3r1R1K w - - 0 30","solution":["Qe8+","Qf8","Qxf8#"],"turn":"white","pieces":14,"moves":3,"rating":1295,"themes":"endgame mate mateIn2 short","white":"♔ King h1  ♕ Queen h5  ♖ Rook f1  ♙ Pawn a2, g2, h2","black":"♚ King h8  ♛ Queen f6  ♜ Rook c6, d1  ♟ Pawn a7, c5, g7, h7"},{"id":"00ME0","fen":"8/1p6/p1b5/4k2p/1PB1p2P/P3P1K1/8/8 w - - 3 36","solution":["Bf7","Bd7","Bxh5"],"turn":"white","pieces":12,"moves":3,"rating":1609,"themes":"bishopEndgame crushing endgame short","white":"♔ King g3  ♗ Bishop c4  ♙ Pawn a3, b4, e3, h4","black":"♚ King e5  ♝ Bishop c6  ♟ Pawn a6, b7, e4, h5"}],"hard":[{"id":"01pSj","fen":"8/5k2/8/2N1p1p1/1P2Pn1p/2P2P1P/5RPK/1r6 b - - 5 37","solution":["Nh5","g3","hxg3+","Kg2","gxf2"],"turn":"black","pieces":15,"moves":5,"rating":2045,"themes":"advancedPawn crushing endgame fork long quietMove","white":"♔ King h2  ♖ Rook f2  ♘ Knight c5  ♙ Pawn b4, c3, e4, f3, g2, h3","black":"♚ King f7  ♜ Rook b1  ♞ Knight f4  ♟ Pawn e5, g5, h4"},{"id":"0104o","fen":"6rk/2QR3p/p5q1/1p4n1/6P1/PP3P2/8/6K1 w - - 1 42","solution":["Qc3+","Qg7","Rxg7"],"turn":"white","pieces":14,"moves":3,"rating":2097,"themes":"advantage endgame master short","white":"♔ King g1  ♕ Queen c7  ♖ Rook d7  ♙ Pawn a3, b3, f3, g4","black":"♚ King h8  ♛ Queen g6  ♜ Rook g8  ♞ Knight g5  ♟ Pawn a6, b5, h7"},{"id":"01uH8","fen":"3r4/R1R5/7k/p2r2pp/3p1P2/7P/6P1/7K w - - 0 51","solution":["f5","R5d7","Rxd7","Rxd7","Rxd7"],"turn":"white","pieces":13,"moves":5,"rating":2438,"themes":"crushing endgame long quietMove rookEndgame","white":"♔ King h1  ♖ Rook a7, c7  ♙ Pawn f4, g2, h3","black":"♚ King h6  ♜ Rook d5, d8  ♟ Pawn a5, d4, g5, h5"},{"id":"02Cmy","fen":"8/p6p/6pk/8/3n4/3Pr3/3q1PPP/2R2QK1 w - - 0 27","solution":["Rd1","Ne2+","Kh1","Rxd3","Rxd2"],"turn":"white","pieces":14,"moves":5,"rating":2056,"themes":"advantage endgame long","white":"♔ King g1  ♕ Queen f1  ♖ Rook c1  ♙ Pawn d3, f2, g2, h2","black":"♚ King h6  ♛ Queen d2  ♜ Rook e3  ♞ Knight d4  ♟ Pawn a7, g6, h7"},{"id":"00qJM","fen":"2R5/p4ppk/1p2q3/6Q1/8/7P/5PPK/4r3 w - - 1 36","solution":["Qh5+","Qh6","Qxf7"],"turn":"white","pieces":13,"moves":3,"rating":2097,"themes":"crushing deflection endgame short","white":"♔ King h2  ♕ Queen g5  ♖ Rook c8  ♙ Pawn f2, g2, h3","black":"♚ King h7  ♛ Queen e6  ♜ Rook e1  ♟ Pawn a7, b6, f7, g7"}]},"medium":{"standard":[{"id":"03RER","fen":"8/1p1k4/4p3/3pPn2/1PpN1P2/2P5/2K5/8 w - - 1 37","solution":["Nxf5","exf5","Kd2","d4","cxd4","b5","d5"],"turn":"white","pieces":12,"moves":7,"rating":1934,"themes":"crushing defensiveMove endgame knightEndgame veryLong","white":"♔ King c2  ♘ Knight d4  ♙ Pawn b4, c3, e5, f4","black":"♚ King d7  ♞ Knight f5  ♟ Pawn b7, c4, d5, e6"},{"id":"05P2i","fen":"8/3k2p1/1p1Np2p/1P2PnPP/8/5K2/8/8 w - - 5 46","solution":["Nxf5","exf5","Kf4","Ke6","g6","Ke7","Kxf5"],"turn":"white","pieces":12,"moves":7,"rating":1963,"themes":"crushing endgame knightEndgame veryLong zugzwang","white":"♔ King f3  ♘ Knight d6  ♙ Pawn b5, e5, g5, h5","black":"♚ King d7  ♞ Knight f5  ♟ Pawn b6, e6, g7, h6"},{"id":"03goR","fen":"2r3k1/R4pbp/6p1/8/1B6/8/P4RPP/6K1 b - - 0 23","solution":["Rc1+","Be1","Rxe1+","Rf1","Bd4+","Kh1","Rxf1#"],"turn":"black","pieces":13,"moves":7,"rating":1281,"themes":"backRankMate deflection endgame fork mate mateIn4 veryLong","white":"♔ King g1  ♖ Rook a7, f2  ♗ Bishop b4  ♙ Pawn a2, g2, h2","black":"♚ King g8  ♜ Rook c8  ♝ Bishop g7  ♟ Pawn f7, g6, h7"},{"id":"02EM7","fen":"2q5/4Q3/4p1k1/3p2P1/3Pp3/p3P3/5PK1/8 w - - 0 53","solution":["Qf6+","Kh7","g6+","Kh6","g7+","Kh7","Qf8"],"turn":"white","pieces":12,"moves":7,"rating":1809,"themes":"advancedPawn crushing discoveredAttack discoveredCheck endgame exposedKing queenEndgame veryLong","white":"♔ King g2  ♕ Queen e7  ♙ Pawn d4, e3, f2, g5","black":"♚ King g6  ♛ Queen c8  ♟ Pawn a3, d5, e4, e6"},{"id":"01idc","fen":"8/8/1r3k2/3R1p2/R5p1/5nP1/P4PK1/8 b - - 2 39","solution":["Rb1","Rxf5+","Kxf5","Rf4+","Kg5","Rxf3","gxf3+"],"turn":"black","pieces":11,"moves":7,"rating":1853,"themes":"endgame master","white":"♔ King g2  ♖ Rook a4, d5  ♙ Pawn a2, f2, g3","black":"♚ King f6  ♜ Rook b6  ♞ Knight f3  ♟ Pawn f5, g4"}],"hard":[{"id":"04zsH","fen":"8/1r2k3/n3p1p1/K7/2P1P1P1/5P2/8/5R2 w - - 0 37","solution":["Kxa6","Rb4","c5","Kd7","Rd1+","Kc6","Rd6+","Kxc5","Rxe6"],"turn":"white","pieces":11,"moves":9,"rating":2215,"themes":"crushing endgame quietMove veryLong","white":"♔ King a5  ♖ Rook f1  ♙ Pawn c4, e4, f3, g4","black":"♚ King e7  ♜ Rook b7  ♞ Knight a6  ♟ Pawn e6, g6"},{"id":"04m1I","fen":"2R5/5kp1/3r4/8/5KP1/3r1PP1/2p5/2R5 b - - 3 48","solution":["Rf6+","Ke4","Rd1","Rc7+","Kg6","Rxg7+","Kxg7"],"turn":"black","pieces":11,"moves":7,"rating":2786,"themes":"crushing endgame rookEndgame veryLong","white":"♔ King f4  ♖ Rook c1, c8  ♙ Pawn f3, g3, g4","black":"♚ King f7  ♜ Rook d3, d6  ♟ Pawn c2, g7"},{"id":"05MGM","fen":"6k1/6p1/3K4/2pPp1P1/2P1Np2/5r2/8/8 w - - 0 49","solution":["Ke7","Kh7","d6","Rd3","Nxc5","Rd4","d7"],"turn":"white","pieces":11,"moves":7,"rating":2832,"themes":"advancedPawn crushing endgame veryLong","white":"♔ King d6  ♘ Knight e4  ♙ Pawn c4, d5, g5","black":"♚ King g8  ♜ Rook f3  ♟ Pawn c5, e5, f4, g7"},{"id":"04BSu","fen":"8/3r1r1k/8/PP4pp/3R4/4P3/3p2PP/1R4K1 b - - 1 35","solution":["Rxd4","exd4","Rc7","Rd1","Rc1","Kf2","Rxd1"],"turn":"black","pieces":14,"moves":7,"rating":2135,"themes":"clearance crushing endgame pin quietMove rookEndgame veryLong","white":"♔ King g1  ♖ Rook b1, d4  ♙ Pawn a5, b5, e3, g2, h2","black":"♚ King h7  ♜ Rook d7, f7  ♟ Pawn d2, g5, h5"},{"id":"042Gi","fen":"8/p7/1p1Pk1p1/8/4KPPP/8/nP6/8 w - - 1 36","solution":["h5","gxh5","gxh5","Nb4","d7","Nc6","h6","Kf7","Kd5"],"turn":"white","pieces":11,"moves":9,"rating":2593,"themes":"advancedPawn crushing endgame knightEndgame veryLong","white":"♔ King e4  ♙ Pawn b2, d6, f4, g4, h4","black":"♚ King e6  ♞ Knight a2  ♟ Pawn a7, b6, g6"}]},"long":{"standard":[{"id":"2RDQe","fen":"8/7p/8/6R1/1Brkpp2/P2p3P/3K1PP1/8 b - - 0 42","solution":["e3+","fxe3+","fxe3+","Kd1","e2+","Kd2","Rc2+","Ke1","Rc1+","Kf2","Rf1+"],"turn":"black","pieces":13,"moves":11,"rating":1849,"themes":"advancedPawn advantage endgame exposedKing veryLong","white":"♔ King d2  ♖ Rook g5  ♗ Bishop b4  ♙ Pawn a3, f2, g2, h3","black":"♚ King d4  ♜ Rook c4  ♟ Pawn d3, e4, f4, h7"},{"id":"0QThr","fen":"8/8/1pk1Kp2/2Pp4/pBp3P1/2P5/2P5/8 b - - 0 42","solution":["bxc5","Ba3","d4","Kxf6","d3","cxd3","cxd3","g5","d2","g6","d1=Q"],"turn":"black","pieces":12,"moves":11,"rating":1583,"themes":"advancedPawn bishopEndgame crushing endgame promotion veryLong","white":"♔ King e6  ♗ Bishop b4  ♙ Pawn c2, c3, c5, g4","black":"♚ King c6  ♟ Pawn a4, b6, c4, d5, f6"},{"id":"0BaFV","fen":"6k1/5pp1/2K1p3/4P3/2P1n3/7p/P7/6B1 w - - 4 42","solution":["a4","g5","a5","Kg7","a6","g4","a7","g3","a8=Q","h2","Bxh2","gxh2","Qa1"],"turn":"white","pieces":11,"moves":13,"rating":1596,"themes":"advancedPawn crushing defensiveMove endgame promotion quietMove veryLong","white":"♔ King c6  ♗ Bishop g1  ♙ Pawn a2, c4, e5","black":"♚ King g8  ♞ Knight e4  ♟ Pawn e6, f7, g7, h3"},{"id":"0pOXI","fen":"4b3/1p6/p2pk3/3N3p/2P1PK2/1P6/P7/8 w - - 0 45","solution":["Nc7+","Ke7","Nxe8","Kxe8","Kg5","Kf7","Kxh5","Ke6","Kg4","Ke5","Kf3"],"turn":"white","pieces":12,"moves":11,"rating":1891,"themes":"crushing defensiveMove endgame fork veryLong","white":"♔ King f4  ♘ Knight d5  ♙ Pawn a2, b3, c4, e4","black":"♚ King e6  ♝ Bishop e8  ♟ Pawn a6, b7, d6, h5"},{"id":"2FEqF","fen":"4Nq1k/8/4Q3/p3N1p1/Pp1P4/4KP2/1Pr5/8 b - - 0 35","solution":["Qf4+","Kd3","Rd2+","Kc4","Qxd4+","Kb5","Qd5+","Qxd5","Rxd5+","Kc4","Rxe5"],"turn":"black","pieces":14,"moves":11,"rating":1932,"themes":"advantage endgame fork master veryLong","white":"♔ King e3  ♕ Queen e6  ♘ Knight e5, e8  ♙ Pawn a4, b2, d4, f3","black":"♚ King h8  ♛ Queen f8  ♜ Rook c2  ♟ Pawn a5, b4, g5"}],"hard":[{"id":"0UCGN","fen":"8/7p/4kppP/p2p4/Pp4P1/1P1K1P2/2P5/8 w - - 0 47","solution":["c3","bxc3","Kxc3","Ke5","b4","d4+","Kc4","axb4","a5","d3","Kxd3","Kd5","a6","Kc6","Kc4","Kb6","Kxb4"],"turn":"white","pieces":14,"moves":17,"rating":2807,"themes":"crushing endgame pawnEndgame quietMove veryLong","white":"♔ King d3  ♙ Pawn a4, b3, c2, f3, g4, h6","black":"♚ King e6  ♟ Pawn a5, b4, d5, f6, g6, h7"},{"id":"0FTvR","fen":"2Q3R1/5p1p/p5pk/3P2P1/2P5/7P/r4q2/4R2K b - - 0 34","solution":["Kxg5","Rg1+","Kh6","R1xg6+","hxg6","Rh8+","Kg7","Qf8+","Kf6","Qd8+","Kf5"],"turn":"black","pieces":15,"moves":11,"rating":2309,"themes":"crushing defensiveMove endgame veryLong","white":"♔ King h1  ♕ Queen c8  ♖ Rook e1, g8  ♙ Pawn c4, d5, g5, h3","black":"♚ King h6  ♛ Queen f2  ♜ Rook a2  ♟ Pawn a6, f7, g6, h7"},{"id":"01aGQ","fen":"1Q6/p5k1/2q4p/1p4p1/4R3/2P3P1/r6P/6K1 w - - 2 37","solution":["Re7+","Kg6","Qg8+","Kh5","Qf7+","Kg4","h3+","Kxg3","Re3+","Kh4","Qxa2"],"turn":"white","pieces":13,"moves":11,"rating":2380,"themes":"crushing endgame fork veryLong","white":"♔ King g1  ♕ Queen b8  ♖ Rook e4  ♙ Pawn c3, g3, h2","black":"♚ King g7  ♛ Queen c6  ♜ Rook a2  ♟ Pawn a7, b5, g5, h6"},{"id":"0NDot","fen":"R1Q5/1p4pk/2Pq2rp/8/5P2/4n2P/6P1/5RK1 b - - 3 30","solution":["Rxg2+","Kh1","Rh2+","Kxh2","Qd2+","Kg3","Qg2+","Kh4","g5+","Kh5","Qe2+","Qg4","Nxg4"],"turn":"black","pieces":15,"moves":13,"rating":2322,"themes":"attraction crushing endgame fork sacrifice veryLong","white":"♔ King g1  ♕ Queen c8  ♖ Rook a8, f1  ♙ Pawn c6, f4, g2, h3","black":"♚ King h7  ♛ Queen d6  ♜ Rook g6  ♞ Knight e3  ♟ Pawn b7, g7, h6"},{"id":"0Xbot","fen":"3r4/8/N1p2p2/P4k2/1P2p3/4P1r1/4K3/1R1R4 b - - 3 45","solution":["Rg2+","Kf1","Rdg8","Re1","Rg1+","Ke2","R8g2+","Kd1","Rxe1+","Kxe1","Rg1+","Kd2","Rxb1"],"turn":"black","pieces":13,"moves":13,"rating":2198,"themes":"advantage attraction endgame quietMove skewer veryLong","white":"♔ King e2  ♖ Rook b1, d1  ♘ Knight a6  ♙ Pawn a5, b4, e3","black":"♚ King f5  ♜ Rook d8, g3  ♟ Pawn c6, e4, f6"}]}}};
let _longPuzzleCache = null;

async function loadLongPuzzles() {
  if (_longPuzzleCache) return _longPuzzleCache;
  try {
    const res = await fetch('puzzles_long.json');
    if (res.ok) { _longPuzzleCache = await res.json(); return _longPuzzleCache; }
  } catch (e) {}
  // Fallback: small inline subset (10 per bucket) for offline/viewer mode
  _longPuzzleCache = _INLINE_LONG_PUZZLES;
  return _longPuzzleCache;
}

async function fetchLongPuzzle({ pieces, moves, minRating, maxRating }) {
  const db = await loadLongPuzzles();
  if (!db) return null;

  const ratingKey = minRating >= 2000 ? 'hard' : 'standard';
  const pool = db[pieces]?.[moves]?.[ratingKey];
  if (!pool || pool.length === 0) return null;

  // For standard bucket, also filter by maxRating in case of mixed data
  const filtered = ratingKey === 'standard'
    ? pool.filter(p => p.rating >= minRating && p.rating <= maxRating)
    : pool;
  if (filtered.length === 0) return null;

  return filtered[Math.floor(Math.random() * filtered.length)];
}

const PUZZLE_PHASES = { IDLE: 0, QUESTION: 1, FEEDBACK: 2 };

const PIECES_LABELS = { easy: '≤ 5 pieces', medium: '6–10 pieces', hard: '11–15 pieces' };
const MOVES_LABELS  = { short: '1–5 half-moves', medium: '6–10 half-moves', long: '10+ half-moves' };

function PuzzlesGame({ onHome, themeBtn }) {
  const [piecesDiff, setPiecesDiff] = useState('medium');
  const [movesDiff,  setMovesDiff]  = useState('medium');
  const [minRating,  setMinRating]  = useState(500);
  const [maxRating,  setMaxRating]  = useState(2000);
  const ratingLabel = minRating === 500 && maxRating === 2000 ? '500–2000' : minRating === 2000 ? '2000+' : '';

  const [phase,      setPhase]      = useState(PUZZLE_PHASES.IDLE);
  const [puzzle,     setPuzzle]     = useState(null);
  const [input,      setInput]      = useState('');
  const [moveIndex,  setMoveIndex]  = useState(0);
  const [history,    setHistory]    = useState([]);
  const [wrongInput, setWrongInput] = useState(false);
  const [solved,     setSolved]     = useState(false);
  const [gaveUp,     setGaveUp]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [showRules,  setShowRules]  = useState(false);
  const [correct,    setCorrect]    = useState(0);
  const [total,      setTotal]      = useState(0);
  const inputRef = useRef(null);

  const normSAN = s => s.replace(/[+#!=?]/g, '').toLowerCase();

  const loadPuzzle = useCallback(async () => {
    setLoading(true);
    setError(null);
    setInput('');
    setMoveIndex(0);
    setHistory([]);
    setWrongInput(false);
    setSolved(false);
    setGaveUp(false);
    setPhase(PUZZLE_PHASES.IDLE);
    try {
      const p = await fetchLongPuzzle({ pieces: piecesDiff, moves: movesDiff, minRating, maxRating });
      if (!p) { setError('No puzzle found for these filters. Try adjusting the difficulty settings.'); setLoading(false); return; }
      setPuzzle(p);
      setPhase(PUZZLE_PHASES.QUESTION);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      setError('Could not load puzzles. Run scripts/generate_long_puzzles.py first.');
    } finally {
      setLoading(false);
    }
  }, [piecesDiff, movesDiff, minRating, maxRating]);

  function submit() {
    if (!puzzle || phase !== PUZZLE_PHASES.QUESTION || solved || gaveUp) return;
    const raw = input.trim();
    if (!raw) return;

    const solution = puzzle.solution;
    const expected = solution[moveIndex];

    if (normSAN(raw) !== normSAN(expected)) {
      setWrongInput(true);
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    setWrongInput(false);
    const opponentMove = solution[moveIndex + 1] ?? null;
    const newHistory = [...history, { player: expected, opponent: opponentMove }];
    setHistory(newHistory);
    setInput('');

    const nextMoveIndex = moveIndex + 2;
    if (nextMoveIndex >= solution.length) {
      setSolved(true);
      setTotal(t => t + 1);
      setCorrect(c => c + 1);
      setPhase(PUZZLE_PHASES.FEEDBACK);
    } else {
      setMoveIndex(nextMoveIndex);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function doGiveUp() {
    setGaveUp(true);
    setTotal(t => t + 1);
    setPhase(PUZZLE_PHASES.FEEDBACK);
  }

  function handleKey(e) {
    if (e.key === 'Enter') submit();
  }

  return (
    <AppShell title="BLINDFOLD PUZZLES" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} themeBtn={themeBtn}
      headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}
    >
      {showRules && (
        <RulesModal onClose={() => setShowRules(false)}>
          <RuleSection title="Objective" text="A Lichess puzzle position is described in text. Enter your moves one at a time — the opponent's reply is shown after each correct move." />
          <RuleSection title="Input" text="Type one move at a time in algebraic notation (e.g. Rxf7). Press Enter or ✓ to submit." />
          <RuleSection title="Attempts" text="Unlimited attempts per move. Give up at any time to reveal the full solution." />
          <RuleSection title="Filters" text="Piece count controls position complexity. Half-moves = individual ply (1 half-move = one side plays once; a 3-move combination = 6 half-moves). Rating range is the Lichess puzzle rating." />
        </RulesModal>
      )}

      {/* Config */}
      <div style={{ width: '100%', maxWidth: 540, padding: '0 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, width: 52 }}>PIECES</span>
            {Object.keys(PIECES_LABELS).map(k => (
              <button key={k} onClick={() => setPiecesDiff(k)} style={chipStyle(k, piecesDiff)}>{PIECES_LABELS[k]}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, width: 52 }}>MOVES</span>
            {Object.keys(MOVES_LABELS).map(k => (
              <button key={k} onClick={() => setMovesDiff(k)} style={chipStyle(k, movesDiff)}>{MOVES_LABELS[k]}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, width: 52 }}>RATING</span>
            {[[500,2000,'500–2000'],[2000,9999,'2000+']].map(([lo,hi,label]) => (
              <button key={label} onClick={() => { setMinRating(lo); setMaxRating(hi); }} style={chipStyle(label, ratingLabel)}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 540, padding: '0 20px', flex: 1 }}>

        {/* Stats */}
        {total > 0 && (
          <div style={{ marginBottom: 14, fontSize: 11, color: T.textDim }}>
            <span>{correct} / {total} correct</span>
          </div>
        )}

        {/* IDLE */}
        {phase === PUZZLE_PHASES.IDLE && !loading && !error && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{ background: 'rgba(74,158,202,0.06)', border: '1px solid rgba(74,158,202,0.2)', borderRadius: 6, padding: '10px 16px', marginBottom: 20, fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: 'center' }}>
              <span style={{ color: T.textBright }}>Enter your moves one at a time. The opponent reply is shown after each correct move.</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={loadPuzzle} style={{ padding: '14px 48px', border: `1px solid ${T.accent}`, borderRadius: 4, background: 'rgba(74,158,202,0.08)', color: T.accent, fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500, letterSpacing: 1, animation: 'glowPulse 2s infinite' }}>START</button>
            </div>
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', color: T.textDim, fontSize: 13, padding: '40px 0' }}>Loading puzzle...</div>}
        {error && <div style={{ background: T.redDim, border: '1px solid rgba(224,85,85,0.3)', borderRadius: 6, padding: '12px 16px', fontSize: 13, color: T.red }}>{error}</div>}

        {/* QUESTION + FEEDBACK */}
        {(phase === PUZZLE_PHASES.QUESTION || phase === PUZZLE_PHASES.FEEDBACK) && puzzle && (
          <div style={{ animation: 'fadeUp 0.2s ease' }}>

            {/* Position + rating */}
            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: '20px 24px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 2, color: T.textBright, background: T.panelBorder, border: `1px solid ${T.panelBorder}`, borderRadius: 4, padding: '6px 12px' }}>
                  {puzzle.turn === 'white' ? '♔ WHITE TO MOVE' : '♚ BLACK TO MOVE'}
                </div>
                <div style={{ fontSize: 11, color: T.textDim, paddingTop: 6 }}>rating {puzzle.rating}</div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 6 }}>WHITE</div>
                <div style={{ fontSize: 13, color: T.textBright, lineHeight: 2, letterSpacing: 0.5 }}>{puzzle.white}</div>
              </div>
              <div style={{ height: 1, background: T.panelBorder, margin: '12px 0' }} />
              <div>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 6 }}>BLACK</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 2, letterSpacing: 0.5 }}>{puzzle.black}</div>
              </div>
            </div>

            {/* Move history */}
            {history.length > 0 && (
              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: '12px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 8 }}>▸ MOVES PLAYED</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 13, lineHeight: 2 }}>
                  {history.map((entry, i) => {
                    const sIdx = i * 2;
                    const fullMove = Math.floor(sIdx / 2) + 1;
                    const isBlackFirst = puzzle.turn === 'black';
                    const showNum = !isBlackFirst || i > 0;
                    return (
                      <span key={i}>
                        {(!isBlackFirst || i === 0) && (
                          <span style={{ color: T.textDim, marginRight: 2 }}>
                            {fullMove}{isBlackFirst && i === 0 ? '...' : '.'}
                          </span>
                        )}
                        <span style={{ color: T.green, fontWeight: 600, marginRight: 4 }}>{entry.player}</span>
                        {entry.opponent && (
                          <span style={{ color: T.textDim, marginRight: 4 }}>{entry.opponent}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Wrong move */}
            {wrongInput && (
              <div style={{ background: T.redDim, border: '1px solid rgba(224,85,85,0.3)', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: T.red }}>
                ✗ Incorrect — try again.
              </div>
            )}

            {/* Solved */}
            {solved && (
              <div style={{ background: T.greenDim, border: '1px solid rgba(60,168,104,0.3)', borderRadius: 6, padding: '12px 16px', marginBottom: 14, fontSize: 13, color: T.green }}>
                ✓ Correct!
              </div>
            )}

            {/* Give up — solution */}
            {gaveUp && (
              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: '12px 16px', fontSize: 12, marginBottom: 14 }}>
                <div style={{ color: T.textDim, marginBottom: 8, fontSize: 10, letterSpacing: 2 }}>SOLUTION</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {puzzle.solution.map((move, i) => {
                    const isPlayerMove = puzzle.turn === 'white' ? i % 2 === 0 : i % 2 === 1;
                    const alreadyPlayed = i < history.length * 2;
                    return (
                      <span key={i} style={{ fontWeight: isPlayerMove ? 600 : 400, color: alreadyPlayed ? T.textDim : isPlayerMove ? T.textBright : T.textDim, fontSize: 13, opacity: alreadyPlayed ? 0.5 : 1 }}>
                        {move}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lichess link */}
            {(solved || gaveUp) && puzzle.id && (
              <div style={{ marginBottom: 14 }}>
                <a href={`https://lichess.org/training/${puzzle.id}`} target="_blank" rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.accent, textDecoration: 'none', border: `1px solid ${T.accentDim}`, borderRadius: 4, padding: '4px 10px', fontFamily: 'inherit', letterSpacing: 0.5 }}>
                  View on Lichess ↗
                </a>
              </div>
            )}

            {/* Input */}
            {phase === PUZZLE_PHASES.QUESTION && !solved && !gaveUp && (
              <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: '16px 20px', marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 10 }}>
                  ▸ YOUR MOVE
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input ref={inputRef} value={input}
                    onChange={e => { setInput(e.target.value); setWrongInput(false); }}
                    onKeyDown={handleKey}
                    placeholder="e.g. Rxf7"
                    style={{ flex: 1, background: T.bg, border: `1px solid ${wrongInput ? T.red : T.panelBorder}`, borderRadius: 4, padding: '10px 12px', color: T.textBright, fontSize: 14, fontFamily: 'inherit', letterSpacing: 1 }}
                  />
                  <button onClick={submit} style={{ padding: '10px 18px', border: `1px solid ${T.accent}`, borderRadius: 4, background: 'rgba(74,158,202,0.1)', color: T.accent, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 600 }}>✓</button>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button onClick={doGiveUp} style={{ background: 'transparent', border: `1px solid ${T.red}`, borderRadius: 4, color: T.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1, padding: '6px 14px' }}>GIVE UP</button>
                  <button onClick={loadPuzzle} style={{ background: 'transparent', border: `1px solid ${T.accent}`, borderRadius: 4, color: T.accent, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 1, padding: '6px 14px' }}>NEW PUZZLE</button>
                </div>
              </div>
            )}

            {/* Next puzzle */}
            {phase === PUZZLE_PHASES.FEEDBACK && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button onClick={loadPuzzle} style={{ padding: '10px 32px', border: `1px solid ${T.accent}`, borderRadius: 4, background: 'rgba(74,158,202,0.08)', color: T.accent, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500, letterSpacing: 1, animation: 'glowPulse 2s infinite' }}>
                  NEXT PUZZLE
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}



// ── Root ──────────────────────────────────────────────────────────────────────

// ── Theme ─────────────────────────────────────────────────────────────────────

// T always points to CSS variable references — actual values set via :root vars
const T = {
  bg:          "var(--bg)",
  panel:       "var(--panel)",
  panelBorder: "var(--panelBorder)",
  text:        "var(--text)",
  textBright:  "var(--textBright)",
  textDim:     "var(--textDim)",
  accent:      "var(--accent)",
  accentDim:   "var(--accentDim)",
  green:       "var(--green)",
  greenDim:    "var(--greenDim)",
  red:         "var(--red)",
  redDim:      "var(--redDim)",
  boardLight:  "#f0d9b5",
  boardDark:   "#b58863",
  scanline:    "var(--scanline)",
};

const DARK_VARS = `
  --bg: #0d1117; --panel: #161b22; --panelBorder: #21303f;
  --text: #8fa8bc; --textBright: #cfe0ed; --textDim: #3d5468;
  --accent: #4a9eca; --accentDim: #2a5a7a;
  --green: #3ca868; --greenDim: #0e2a1c;
  --red: #e05555; --redDim: #2a1414;
  --scanline: rgba(74,158,202,0.025);
`;

const LIGHT_VARS = `
  --bg: #f0ede6; --panel: #faf8f3; --panelBorder: #d4cfc5;
  --text: #2d3f52; --textBright: #0f1e2e; --textDim: #8a9aaa;
  --accent: #1e5080; --accentDim: #a0c0d8;
  --green: #1e7a48; --greenDim: #d4ede0;
  --red: #c03030; --redDim: #f5dede;
  --scanline: rgba(30,80,128,0.02);
`;

const BASE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); transition: background 0.2s; }
  @keyframes boardReveal { from { opacity:0; transform:scale(0.96); filter:blur(3px); } to { opacity:1; transform:scale(1); filter:blur(0); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes glowPulse { 0%,100% { box-shadow:0 0 0 rgba(74,158,202,0); } 50% { box-shadow:0 0 18px rgba(74,158,202,0.12); } }
  button:hover { filter: brightness(1.1); }
  input:focus { outline: none; border-color: var(--accent) !important; }
  input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`;

function applyTheme(dark) {
  document.documentElement.style.cssText = dark ? DARK_VARS : LIGHT_VARS;
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useState(true);
  const [screen, setScreen] = useState("home");

  useEffect(() => { applyTheme(dark); }, [dark]);
  useEffect(() => { applyTheme(true); }, []); // init on mount

  function toggle() { setDark(d => !d); }

  const themeBtn = (
    <button onClick={toggle} title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{ background:"transparent", border:`1px solid ${T.panelBorder}`, borderRadius:4,
               color:T.textDim, fontSize:16, cursor:"pointer", padding:"5px 9px",
               fontFamily:"inherit", lineHeight:1, flexShrink:0 }}>
      {dark ? "☀" : "☾"}
    </button>
  );

  if (screen === "minefield")   return <MinefieldGame    onHome={() => setScreen("home")} themeBtn={themeBtn} />;
  if (screen === "puzzles")     return <PuzzlesGame      onHome={() => setScreen("home")} themeBtn={themeBtn} />;
  if (screen === "sniper")      return <SniperGame       onHome={() => setScreen("home")} themeBtn={themeBtn} />;
  if (screen === "coordinates") return <CoordinatesGame  onHome={() => setScreen("home")} themeBtn={themeBtn} />;
  if (screen === "fork")        return <ForkGame         onHome={() => setScreen("home")} themeBtn={themeBtn} />;
  if (screen === "mate1")       return <MateGame         onHome={() => setScreen("home")} themeBtn={themeBtn} />;
  return <HomeScreen onSelect={setScreen} themeBtn={themeBtn} />;
}