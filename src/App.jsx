import { useState, useCallback, useMemo, useEffect, useRef } from "react";

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
  scanline: "rgba(60, 168, 104, 0.03)",
};

const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${T.bg}; }
  @keyframes boardReveal { from { opacity: 0; transform: scale(0.96); filter: blur(3px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes glowPulse { 0%,100% { box-shadow: 0 0 0 rgba(196,154,60,0); } 50% { box-shadow: 0 0 18px rgba(196,154,60,0.12); } }
  button:hover { filter: brightness(1.15); }
  input:focus { outline: none; border-color: ${T.accent} !important; }
  input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
`;

function chipStyle(val, current) {
  return {
    padding: "5px 11px", border: `1px solid ${val === current ? T.accent : T.panelBorder}`,
    borderRadius: 4, background: val === current ? "rgba(196,154,60,0.12)" : "transparent",
    color: val === current ? T.accent : T.textDim, cursor: "pointer", fontSize: 13,
    fontFamily: "inherit", transition: "all 0.2s",
  };
}

// ── Shared Shell ──────────────────────────────────────────────────────────────

function AppShell({ title, subtitle, onHome, headerRight, children }) {
  return (
    <div style={{
      background: T.bg, minHeight: "100vh", color: T.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      backgroundImage: `repeating-linear-gradient(0deg, ${T.scanline} 0px, ${T.scanline} 1px, transparent 1px, transparent 3px)`,
    }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ width: "100%", maxWidth: 540, padding: "28px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={onHome} style={{ cursor: "pointer" }}>
            <div style={{ fontSize: 10, color: T.accentDim, letterSpacing: 2, marginBottom: 4 }}>← BLINDFOLD SUITE</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: T.textBright, letterSpacing: 2 }}>{title}</h1>
            <div style={{ fontSize: 10, color: T.textDim, letterSpacing: 4, marginTop: 2 }}>{subtitle}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{headerRight}</div>
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
      background: "rgba(196,154,60,0.1)", border: `1px solid ${T.accent}`, borderRadius: 4,
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
        <button onClick={onClose} style={{ marginTop: 8, width: "100%", padding: "10px", border: `1px solid ${T.accent}`, borderRadius: 4, background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 13, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>GOT IT</button>
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
    icon: "💣",
    tagline: "Navigate the minefield",
    description: "Move your piece from start to target in the fewest moves — without stepping on any square controlled by enemy pieces. No board. Pure visualization.",
    difficulty: "Hard",
  },
  {
    id: "sniper",
    title: "Blindfold Sniper",
    icon: "🎯",
    tagline: "Who's in your crosshairs?",
    description: "A position is given with a white piece to track. A random sequence of moves is generated in algebraic notation — no visual updates. Follow the moves in your head and click the black pieces your piece can capture at the end of the sequence.",
    difficulty: "Medium",
  },
  {
    id: "coordinates",
    title: "Blindfold Coordinates",
    icon: "🗺️",
    tagline: "Light or dark?",
    description: "A square is named — say whether it's light or dark as fast as you can. Score mode: 10 questions, track your accuracy and average time. Streak mode: how far can you go before your first mistake?",
    difficulty: "Easy",
  },
  {
    id: "fork",
    title: "Blindfold Fork Finder",
    icon: "⚔️",
    tagline: "Two for the price of one",
    description: "A knight or bishop and 2 black pieces are placed on the board — described in text only. Find a square from which your piece attacks both enemy pieces simultaneously. No board. Pure calculation.",
    difficulty: "Easy",
  },
];

function HomeScreen({ onSelect }) {
  return (
    <div style={{
      background: T.bg, minHeight: "100vh", color: T.text,
      fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
      display: "flex", flexDirection: "column", alignItems: "center",
      backgroundImage: `repeating-linear-gradient(0deg, ${T.scanline} 0px, ${T.scanline} 1px, transparent 1px, transparent 3px)`,
    }}>
      <style>{GLOBAL_STYLE}</style>
      <div style={{ width: "100%", maxWidth: 540, padding: "48px 20px 0" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, color: T.textBright, letterSpacing: 3 }}>BLINDFOLD</h1>
        <div style={{ fontSize: 11, color: T.textDim, letterSpacing: 4, marginTop: 4 }}>CHESS TRAINING SUITE</div>
        <div style={{ height: 1, background: `linear-gradient(90deg, ${T.accent}50, transparent 70%)`, margin: "20px 0 32px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {GAMES.map(game => (
            <div key={game.id} onClick={() => onSelect(game.id)}
              style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 8, padding: "18px 16px", cursor: "pointer", transition: "border-color 0.2s", display: "flex", flexDirection: "column" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.panelBorder}
            >
              <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 10 }}>{game.icon}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.textBright, letterSpacing: 0.5 }}>{game.title}</div>
                <div style={{ fontSize: 10, color: game.difficulty === "Hard" ? T.red : game.difficulty === "Medium" ? T.accent : T.green, flexShrink: 0, marginLeft: 6, fontWeight: 600 }}>{game.difficulty}</div>
              </div>
              <div style={{ fontSize: 9, color: T.accent, letterSpacing: 2, marginBottom: 8 }}>{game.tagline.toUpperCase()}</div>
              <div style={{ fontSize: 11, color: T.text, lineHeight: 1.6, flex: 1 }}>{game.description}</div>
              <div style={{ marginTop: 14, textAlign: "right" }}>
                <span style={{ fontSize: 10, color: T.accent, border: `1px solid ${T.accentDim}`, borderRadius: 4, padding: "3px 10px", letterSpacing: 1 }}>PLAY →</span>
              </div>
            </div>
          ))}
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

function MinefieldGame({ onHome }) {
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
    <AppShell title="BLINDFOLD MINEFIELD" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome}
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
            <div style={{ background: "rgba(196,154,60,0.06)", border: `1px solid rgba(196,154,60,0.2)`, borderRadius: 6, padding: "10px 16px", marginBottom: 10, fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: T.textBright }}>Navigate your piece from start to target while avoiding squares controlled by enemy pieces, without seeing the board.</span>
            </div>
            <div style={{ background: T.panel, border: `1px solid ${T.panelBorder}`, borderRadius: 6, padding: "20px 24px", minHeight: 180 }}>
              <div style={{ fontSize: 9, color: T.accentDim, letterSpacing: 3, marginBottom: 16 }}>▸ BRIEFING</div>
              <pre style={{ fontFamily: "inherit", fontSize: 14, lineHeight: 1.8, color: T.textBright, whiteSpace: "pre-wrap", margin: 0 }}>{briefingText}</pre>
            </div>
            {briefingDone && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 12, animation: "fadeUp 0.4s ease" }}>
                <button onClick={startInput} style={{ padding: "10px 32px", border: `1px solid ${T.accent}`, borderRadius: 4, background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 14, fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1, animation: "glowPulse 2s infinite" }}>ENTER SOLUTION</button>
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
            <div style={{ background: result?.type === "correct" ? T.greenDim : result?.type === "gaveup" ? T.panel : T.redDim, border: `1px solid ${result?.type === "correct" ? "rgba(60,168,104,0.3)" : result?.type === "gaveup" ? T.panelBorder : "rgba(196,74,60,0.3)"}`, borderRadius: 6, padding: "14px 20px", marginBottom: 16, textAlign: "center" }}>
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
              <button onClick={newPuzzle} style={{ padding: "10px 32px", border: `1px solid ${T.accent}`, borderRadius: 4, background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 14, fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1, animation: "glowPulse 2s infinite" }}>NEXT PUZZLE</button>
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
// GAME 2 — BLINDFOLD SNIPER
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
        bg = "rgba(196,154,60,0.5)";
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

function SniperGame({ onHome }) {
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
    <AppShell title="SNIPER" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome} headerRight={<HowToPlayBtn onClick={() => setShowRules(true)} />}>
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
    <AppShell title="SNIPER" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome}
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
            background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 12,
            fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
          }}>OK</button>
          <div style={{ flex: 1 }} />
          <button onClick={newPuzzle} style={{ padding: "5px 16px", border: "none", borderRadius: 4, background: T.accent, color: T.bg, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", letterSpacing: 1 }}>NEW</button>
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 540, padding: "0 20px", flex: 1 }}>

        <div style={{ background:"rgba(196,154,60,0.06)", border:`1px solid rgba(196,154,60,0.2)`, borderRadius:6, padding:"10px 16px", marginBottom:12, fontSize:12, color:T.textDim, lineHeight:1.6, textAlign:"center" }}>
          <span style={{ color:T.textBright }}>Follow the moves mentally from the initial position, then tap the black pieces your tracked piece can capture in the final position.</span>
        </div>

        {/* Board — initial position, clickable */}
        <div style={{ background:T.panel, border:`1px solid ${T.panelBorder}`, borderRadius:6, padding:"14px 12px", marginBottom:12, animation:"fadeUp 0.3s ease" }}>
          <div style={{ fontSize:9, color:T.accentDim, letterSpacing:3, marginBottom:10 }}>▸ INITIAL POSITION — tap black pieces to select</div>
          <div style={{ marginBottom:12, padding:"8px 12px", background:"rgba(196,154,60,0.12)", border:`1px solid rgba(196,154,60,0.35)`, borderRadius:5, display:"flex", alignItems:"center", gap:10 }}>
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
            <div style={{ background:score.perfect?T.greenDim:"rgba(196,154,60,0.08)", border:`1px solid ${score.perfect?"rgba(60,168,104,0.3)":T.panelBorder}`, borderRadius:6, padding:"16px 20px", marginBottom:12, textAlign:"center" }}>
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
              <button onClick={newPuzzle} style={{ padding:"10px 32px", border:`1px solid ${T.accent}`, borderRadius:4, background:"rgba(196,154,60,0.08)", color:T.accent, fontSize:14, fontFamily:"inherit", cursor:"pointer", fontWeight:500, letterSpacing:1, animation:"glowPulse 2s infinite" }}>NEXT PUZZLE</button>
            </div>
          </div>
        )}

        {!submitted && (
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <button onClick={() => setSubmitted(true)} style={{ padding:"10px 40px", border:`1px solid ${T.accent}`, borderRadius:4, background:"rgba(196,154,60,0.08)", color:T.accent, fontSize:14, fontFamily:"inherit", cursor:"pointer", fontWeight:500, letterSpacing:1 }}>SUBMIT</button>
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

function CoordinatesGame({ onHome }) {
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

  const bgColor = feedback === "correct" ? "rgba(60,168,104,0.15)"
                : feedback === "wrong"   ? "rgba(196,74,60,0.15)"
                : "transparent";

  return (
    <AppShell title="COORDINATES" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome}
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
            <div style={{ background: "rgba(196,154,60,0.06)", border: `1px solid rgba(196,154,60,0.2)`, borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: T.textBright }}>
                {mode === "score"
                  ? "10 squares, answer as fast as you can. Light or Dark?"
                  : "Answer until your first mistake. How long can you go?"}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={startGame} style={{
                padding: "14px 48px", border: `1px solid ${T.accent}`, borderRadius: 4,
                background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 16,
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
              background: T.panel, border: `1px solid ${feedback === "correct" ? T.green : feedback === "wrong" ? T.red : T.panelBorder}`,
              borderRadius: 8, padding: "40px 20px", marginBottom: 24,
              textAlign: "center", transition: "border-color 0.15s, background 0.15s",
              background: bgColor || T.panel,
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
                flex: 1, padding: "18px", border: `1px solid ${T.panelBorder}`, borderRadius: 6,
                background: "rgba(240,217,181,0.08)", color: "#f0d9b5", fontSize: 15,
                fontFamily: "inherit", cursor: feedback !== null ? "default" : "pointer",
                fontWeight: 600, letterSpacing: 1, opacity: feedback !== null ? 0.5 : 1,
                transition: "opacity 0.15s",
              }}>
                ☀️ LIGHT
              </button>
              <button onClick={() => answer(false)} disabled={feedback !== null} style={{
                flex: 1, padding: "18px", border: `1px solid ${T.panelBorder}`, borderRadius: 6,
                background: "rgba(100,60,30,0.25)", color: "#b58863", fontSize: 15,
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
                background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 14,
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

function ForkGame({ onHome }) {
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
    <AppShell title="FORK FINDER" subtitle="BLINDFOLD CHESS TRAINER" onHome={onHome}
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
            <div style={{ background: "rgba(196,154,60,0.06)", border: `1px solid rgba(196,154,60,0.2)`, borderRadius: 6, padding: "10px 16px", marginBottom: 20, fontSize: 12, color: T.textDim, lineHeight: 1.6, textAlign: "center" }}>
              <span style={{ color: T.textBright }}>
                {mode === "score"
                  ? "5 puzzles. Find the fork square, or answer \"no\" if none exists."
                  : "Keep going until your first mistake. How long is your streak?"}
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={startGame} style={{
                padding: "14px 48px", border: `1px solid ${T.accent}`, borderRadius: 4,
                background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 16,
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
                {puzzle.targets.map((t, i) => (
                  <span key={i}>
                    {i > 0 && <span style={{ color: T.textDim }}>,  </span>}
                    <span style={{ color: T.red }}>♟ {sqName(t)}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Feedback */}
            {feedback && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  background: feedback.correct ? T.greenDim : T.redDim,
                  border: `1px solid ${feedback.correct ? "rgba(60,168,104,0.3)" : "rgba(196,74,60,0.3)"}`,
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
                          background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 13,
                          fontFamily: "inherit", cursor: "pointer", fontWeight: 500, letterSpacing: 1,
                        }}>NEXT →</button>
                      )}
                      {mode === "streak" && (
                        <button onClick={() => setPhase(FORK_PHASES.RESULT)} style={{
                          padding: "9px 32px", border: `1px solid ${T.accent}`, borderRadius: 4,
                          background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 13,
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
                    background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 12,
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
                background: "rgba(196,154,60,0.08)", color: T.accent, fontSize: 14,
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

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("home");
  if (screen === "minefield")   return <MinefieldGame    onHome={() => setScreen("home")} />;
  if (screen === "sniper")      return <SniperGame       onHome={() => setScreen("home")} />;
  if (screen === "coordinates") return <CoordinatesGame  onHome={() => setScreen("home")} />;
  if (screen === "fork")        return <ForkGame         onHome={() => setScreen("home")} />;
  return <HomeScreen onSelect={setScreen} />;
}