export type PieceId = "tl" | "tr" | "bl" | "br";

export const PIECES: PieceId[] = ["tl", "tr", "bl", "br"];

export const TARGET: Record<PieceId, { x: number; y: number }> = {
  tl: { x: 0, y: 0 },
  tr: { x: 0, y: 0 },
  bl: { x: 0, y: 0 },
  br: { x: 0, y: 0 },
};

export type Piece = { id: PieceId; x: number; y: number; group: number };

const START: Record<PieceId, { x: number; y: number }>[] = [
  { tl: { x: 46, y: 37 }, tr: { x: -47, y: 39 }, bl: { x: 46, y: -44 }, br: { x: -47, y: -44 } },
  { tl: { x: -22, y: 38 }, tr: { x: 22, y: -42 }, bl: { x: 40, y: 18 }, br: { x: -44, y: -8 } },
];

export function freshPieces(seed: number): Piece[] {
  const n = Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : 0;
  const layout = START[n % START.length] ?? START[0];
  return PIECES.map((id, i) => ({ id, x: layout[id].x, y: layout[id].y, group: i + 1 }));
}

function pieceOk(p: Piece | null | undefined): p is Piece {
  return !!p && typeof p.group === "number" && (p.id === "tl" || p.id === "tr" || p.id === "bl" || p.id === "br");
}

export function sanitize(pieces: Piece[] | null | undefined, seed = 0): Piece[] {
  if (!Array.isArray(pieces) || pieces.length !== 4 || pieces.some((p) => !pieceOk(p))) return freshPieces(seed);
  return pieces;
}
export function moveGroup(pieces: Piece[], group: number, dx: number, dy: number): Piece[] {
  return sanitize(pieces).map((p) =>
    p.group === group
      ? { ...p, x: clamp(p.x + dx, -58, 58), y: clamp(p.y + dy, -58, 58) }
      : p,
  );
}

function clamp(n: number, a: number, b: number) {
  return Math.min(b, Math.max(a, n));
}

function adjacent(a: PieceId, b: PieceId) {
  const pair = [a, b].sort().join("");
  return pair === "tltr" || pair === "blbr" || pair === "bltl" || pair === "brtr";
}

const SNAP = 14;
export const MAGNET_PULL = 20;

export function magnet(pieces: Piece[], group: number): { pieces: Piece[]; locked: boolean } {
  const list = sanitize(pieces);
  let best: { dx: number; dy: number; dist: number } | null = null;
  for (const a of list) {
    if (a.group !== group) continue;
    for (const b of list) {
      if (!b || b.group === group || !adjacent(a.id, b.id)) continue;
      const expectX = TARGET[a.id].x - TARGET[b.id].x;
      const expectY = TARGET[a.id].y - TARGET[b.id].y;
      const dx = b.x + expectX - a.x;
      const dy = b.y + expectY - a.y;
      const dist = Math.hypot(dx, dy);
      if (!Number.isFinite(dist)) continue;
      if (!best || dist < best.dist) best = { dx, dy, dist };
    }
  }
  if (!best || best.dist > MAGNET_PULL) return { pieces: list, locked: false };
  if (best.dist <= SNAP) {
    const snapped = trySnap(list);
    return { pieces: snapped.pieces, locked: snapped.snapped };
  }
  const pull = best;
  const strength = 0.35 + (1 - pull.dist / MAGNET_PULL) * 0.4;
  return {
    pieces: list.map((p) =>
      p.group === group ? { ...p, x: p.x + pull.dx * strength, y: p.y + pull.dy * strength } : p,
    ),
    locked: false,
  };
}

export function trySnap(pieces: Piece[]): { pieces: Piece[]; snapped: boolean } {
  let next = sanitize(pieces).map((p) => ({ ...p }));
  let snapped = false;
  let guard = 0;
  while (guard++ < 6) {
    let hit = false;
    for (let i = 0; i < next.length; i++) {
      for (let j = i + 1; j < next.length; j++) {
        const a = next[i];
        const b = next[j];
        if (!a || !b || a.group === b.group || !adjacent(a.id, b.id)) continue;
        const expectX = TARGET[a.id].x - TARGET[b.id].x;
        const expectY = TARGET[a.id].y - TARGET[b.id].y;
        const dx = b.x + expectX - a.x;
        const dy = b.y + expectY - a.y;
        if (!Number.isFinite(dx) || !Number.isFinite(dy)) continue;
        if (Math.abs(dx) > SNAP || Math.abs(dy) > SNAP) continue;
        const keep = Math.min(a.group, b.group);
        const from = a.group;
        const onto = b.group;
        next = next.map((p) => {
          if (p.group === from) return { ...p, group: keep, x: p.x + dx, y: p.y + dy };
          if (p.group === onto) return { ...p, group: keep };
          return p;
        });
        snapped = true;
        hit = true;
      }
    }
    if (!hit) break;
  }
  if (new Set(next.map((p) => p.group)).size === 1) {
    next = next.map((p) => ({ ...p, x: TARGET[p.id].x, y: TARGET[p.id].y }));
  }
  return { pieces: next, snapped };
}

export function isComplete(pieces: Piece[]) {
  const list = sanitize(pieces);
  return (
    new Set(list.map((p) => p.group)).size === 1 &&
    list.every((p) => Math.abs(p.x - TARGET[p.id].x) < 1.2 && Math.abs(p.y - TARGET[p.id].y) < 1.2)
  );
}
