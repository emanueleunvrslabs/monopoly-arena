import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';

/* ─── Palette ──────────────────────────────────────────────── */
const PROVIDER_COLOR_HEX: Record<string, number> = {
  OPENAI:            0x10B981,
  ANTHROPIC:         0xFF7043,
  GOOGLE:            0x4285F4,
  OPENAI_COMPATIBLE: 0xAB47BC,
  DEMO:              0x78909C,
};
const PROVIDER_COLOR_CSS: Record<string, string> = {
  OPENAI:            '#10B981',
  ANTHROPIC:         '#FF7043',
  GOOGLE:            '#4285F4',
  OPENAI_COMPATIBLE: '#AB47BC',
  DEMO:              '#78909C',
};

const PROP_COLOR_HEX: Record<string, number> = {
  brown:     0x7B3F00,
  lightblue: 0x29B6D4,
  pink:      0xE91E8C,
  orange:    0xFF6F00,
  red:       0xD32F2F,
  yellow:    0xFDD835,
  green:     0x388E3C,
  darkblue:  0x1565C0,
};

/* ─── Board data ───────────────────────────────────────────── */
interface Sq { id: number; name: string; type: string; color?: string; price?: number }

const BOARD: Sq[] = [
  { id: 0,  name: 'GO',         type: 'go' },
  { id: 1,  name: 'Vicolo\nCorto',  type: 'property', color: 'brown',     price: 60 },
  { id: 2,  name: 'Imprevisti', type: 'community_chest' },
  { id: 3,  name: 'V.Stretto',  type: 'property', color: 'brown',     price: 60 },
  { id: 4,  name: 'Tassa',      type: 'tax',                        price: 200 },
  { id: 5,  name: 'Staz.N',     type: 'station',                      price: 200 },
  { id: 6,  name: 'Via Dante',  type: 'property', color: 'lightblue', price: 100 },
  { id: 7,  name: 'Probab.',    type: 'chance' },
  { id: 8,  name: 'Via Verdi',  type: 'property', color: 'lightblue', price: 100 },
  { id: 9,  name: 'V.Accad.',   type: 'property', color: 'lightblue', price: 120 },
  { id: 10, name: 'JAIL',       type: 'jail' },
  { id: 11, name: 'P.Castello', type: 'property', color: 'pink',      price: 140 },
  { id: 12, name: 'Enel',       type: 'utility',                      price: 150 },
  { id: 13, name: 'C.Vitt.',    type: 'property', color: 'pink',      price: 140 },
  { id: 14, name: 'Via Po',     type: 'property', color: 'pink',      price: 160 },
  { id: 15, name: 'Staz.E',     type: 'station',                      price: 200 },
  { id: 16, name: 'Via Roma',   type: 'property', color: 'orange',    price: 180 },
  { id: 17, name: 'Imprevisti', type: 'community_chest' },
  { id: 18, name: 'C.Italia',   type: 'property', color: 'orange',    price: 180 },
  { id: 19, name: 'V.Cost.',    type: 'property', color: 'orange',    price: 200 },
  { id: 20, name: 'FREE\nPARK', type: 'free_parking' },
  { id: 21, name: 'V.Giard.',   type: 'property', color: 'red',       price: 220 },
  { id: 22, name: 'Probab.',    type: 'chance' },
  { id: 23, name: 'P.Colonna',  type: 'property', color: 'red',       price: 220 },
  { id: 24, name: 'L.Augusto',  type: 'property', color: 'red',       price: 240 },
  { id: 25, name: 'Staz.O',     type: 'station',                      price: 200 },
  { id: 26, name: 'Via Cond.',  type: 'property', color: 'yellow',    price: 260 },
  { id: 27, name: 'C.Ven.',     type: 'property', color: 'yellow',    price: 260 },
  { id: 28, name: 'Acqua',      type: 'utility',                      price: 150 },
  { id: 29, name: 'P.Duomo',    type: 'property', color: 'yellow',    price: 280 },
  { id: 30, name: 'GO TO\nJAIL', type: 'go_to_jail' },
  { id: 31, name: 'V.Liber.',   type: 'property', color: 'green',     price: 300 },
  { id: 32, name: 'V.Tulip.',   type: 'property', color: 'green',     price: 300 },
  { id: 33, name: 'Imprevisti', type: 'community_chest' },
  { id: 34, name: 'L.Milano',   type: 'property', color: 'green',     price: 320 },
  { id: 35, name: 'Staz.S',     type: 'station',                      price: 200 },
  { id: 36, name: 'Probab.',    type: 'chance' },
  { id: 37, name: 'L.Colom.',   type: 'property', color: 'darkblue',  price: 350 },
  { id: 38, name: 'T.Lusso',    type: 'tax',                          price: 100 },
  { id: 39, name: 'P.Vittoria', type: 'property', color: 'darkblue',  price: 400 },
];

/* ─── Layout helpers (world units) ─────────────────────────── */
// Board is 11×11 units. Each normal cell = 1u, corner = 1.5u
const CS = 1.5;  // corner size
const NS = 1.0;  // normal cell size
const BOARD_SIZE = CS * 2 + NS * 9; // 12

// Returns center (x, z) of each square in world space
// Board centered at origin, y=0 is top surface
function getSquareCenter(id: number): [number, number] {
  const half = BOARD_SIZE / 2;

  // corners
  if (id === 0)  return [half - CS/2,  half - CS/2];   // GO: bottom-right
  if (id === 10) return [-half + CS/2, half - CS/2];   // JAIL: bottom-left
  if (id === 20) return [-half + CS/2, -half + CS/2];  // FREE PARK: top-left
  if (id === 30) return [half - CS/2,  -half + CS/2];  // GO TO JAIL: top-right

  // Bottom row (id 1-9): from right to left
  if (id <= 9) {
    const x = (half - CS) - (id - 0.5) * NS;
    return [x, half - CS/2];
  }
  // Left col (id 11-19): from bottom to top
  if (id <= 19) {
    const z = (half - CS) - (id - 10 - 0.5) * NS;
    return [-half + CS/2, z];
  }
  // Top row (id 21-29): from left to right
  if (id <= 29) {
    const x = -(half - CS) + (id - 20 - 0.5) * NS;
    return [x, -half + CS/2];
  }
  // Right col (id 31-39): from top to bottom
  const z = -(half - CS) + (id - 30 - 0.5) * NS;
  return [half - CS/2, z];
}

function getSquareSize(id: number): [number, number] {
  if (id === 0 || id === 10 || id === 20 || id === 30) return [CS, CS];
  if (id <= 9  || (id >= 21 && id <= 29)) return [NS, CS]; // bottom/top rows: narrow x, deep z
  return [CS, NS]; // left/right cols: wide x, narrow z
}

/* ─── Canvas texture helper ─────────────────────────────────── */
function makeSquareTexture(sq: Sq, w: number, h: number, ownerColor?: string): THREE.CanvasTexture {
  const scale = 128;
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d')!;

  // Base
  ctx.fillStyle = ownerColor ? blendColors('#F5F0E0', ownerColor, 0.15) : '#F5F0E0';
  ctx.fillRect(0, 0, cw, ch);

  // Border
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, cw - 1, ch - 1);

  const propCss = sq.color ? hexToCSS(PROP_COLOR_HEX[sq.color]) : null;

  // ── Color stripe for properties ──
  const STRIPE = Math.round(scale * 0.38);
  if (propCss) {
    // For bottom row (1-9): stripe at bottom of texture (faces interior = top of world)
    // For left col (11-19): stripe at right
    // For top row (21-29): stripe at top
    // For right col (31-39): stripe at left
    ctx.fillStyle = propCss;
    if (sq.id >= 1  && sq.id <= 9)  ctx.fillRect(0, ch - STRIPE, cw, STRIPE);
    if (sq.id >= 11 && sq.id <= 19) ctx.fillRect(0, 0, STRIPE, ch);
    if (sq.id >= 21 && sq.id <= 29) ctx.fillRect(0, 0, cw, STRIPE);
    if (sq.id >= 31 && sq.id <= 39) ctx.fillRect(cw - STRIPE, 0, STRIPE, ch);
  }

  // ── Corner content ──
  if (sq.id === 0) {
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#A5D6A7';
    ctx.fillRect(4, 4, cw - 8, ch - 8);
    ctx.fillStyle = '#D32F2F';
    ctx.font = `bold ${Math.round(scale * 0.45)}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GO', cw / 2, ch * 0.55);
    ctx.fillStyle = '#1B5E20';
    ctx.font = `${Math.round(scale * 0.18)}px Georgia, serif`;
    ctx.fillText('COLLECT €200', cw / 2, ch * 0.82);
    // Arrow
    ctx.fillStyle = '#D32F2F';
    ctx.font = `bold ${Math.round(scale * 0.3)}px serif`;
    ctx.fillText('↑', cw / 2, ch * 0.22);
    return new THREE.CanvasTexture(canvas);
  }

  if (sq.id === 10) {
    ctx.fillStyle = '#FFF9C4';
    ctx.fillRect(0, 0, cw, ch);
    // Jail bars
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const x = cw * 0.15 + i * cw * 0.16;
      ctx.beginPath(); ctx.moveTo(x, ch * 0.3); ctx.lineTo(x, ch * 0.85); ctx.stroke();
    }
    ctx.strokeStyle = '#5D4037'; ctx.lineWidth = 2;
    ctx.strokeRect(cw * 0.12, ch * 0.28, cw * 0.76, ch * 0.1);
    ctx.fillStyle = '#4E342E';
    ctx.font = `bold ${Math.round(scale * 0.22)}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('JAIL', cw / 2, 8);
    return new THREE.CanvasTexture(canvas);
  }

  if (sq.id === 20) {
    ctx.fillStyle = '#E3F2FD';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#0D47A1';
    ctx.font = `bold ${Math.round(scale * 0.22)}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('FREE', cw / 2, ch * 0.35);
    ctx.fillText('PARKING', cw / 2, ch * 0.55);
    ctx.font = `${Math.round(scale * 0.35)}px serif`;
    ctx.fillText('🅿', cw / 2, ch * 0.78);
    return new THREE.CanvasTexture(canvas);
  }

  if (sq.id === 30) {
    ctx.fillStyle = '#FFEBEE';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#B71C1C';
    ctx.font = `bold ${Math.round(scale * 0.22)}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('GO TO', cw / 2, ch * 0.35);
    ctx.fillText('JAIL', cw / 2, ch * 0.55);
    ctx.font = `${Math.round(scale * 0.32)}px serif`;
    ctx.fillText('🚔', cw / 2, ch * 0.8);
    return new THREE.CanvasTexture(canvas);
  }

  // ── Normal square text ──
  const padTop = (propCss && (sq.id >= 21 && sq.id <= 29)) ? STRIPE + 4 : 4;
  const padBot = (propCss && (sq.id >= 1  && sq.id <= 9))  ? STRIPE + 4 : 4;
  const padLeft = (propCss && (sq.id >= 11 && sq.id <= 19)) ? STRIPE + 4 : 4;
  const padRight = (propCss && (sq.id >= 31 && sq.id <= 39)) ? STRIPE + 4 : 4;
  const usableW = cw - padLeft - padRight;
  const usableH = ch - padTop - padBot;
  const cx = padLeft + usableW / 2;
  const cy = padTop + usableH / 2;

  // Icon
  const icons: Record<string, string> = {
    station: '🚂', utility: sq.id === 12 ? '⚡' : '💧',
    chance: '?', community_chest: '🎁', tax: '💸',
  };
  const icon = icons[sq.type];

  if (sq.type === 'chance') {
    ctx.fillStyle = '#D32F2F';
    ctx.font = `bold ${Math.round(usableH * 0.55)}px Georgia, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', cx, cy);
  } else if (icon && sq.type !== 'property') {
    ctx.font = `${Math.round(Math.min(usableW, usableH) * 0.5)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, cx, cy * 0.9);
  }

  // Name
  const name = sq.name.replace(/\\n/g, '\n');
  const lines = name.split('\n');
  const fontSize = Math.round(Math.min(usableW / (lines[0].length * 0.55 + 1), usableH * 0.22));
  ctx.fillStyle = '#111';
  ctx.font = `bold ${Math.max(10, fontSize)}px Georgia, serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lineH = fontSize * 1.25;
  const totalH = lines.length * lineH;
  const startY = (sq.type !== 'property' && icon) ? cy + usableH * 0.22 : cy - totalH / 2 + lineH / 2;
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineH));

  // Price
  if (sq.price && sq.type === 'property') {
    ctx.fillStyle = '#555';
    ctx.font = `${Math.max(9, Math.round(fontSize * 0.8))}px monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(`€${sq.price}`, cx, ch - padBot - 2);
  }

  return new THREE.CanvasTexture(canvas);
}

function hexToCSS(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

function blendColors(base: string, accent: string, t: number): string {
  const parse = (c: string) => [
    parseInt(c.slice(1, 3), 16),
    parseInt(c.slice(3, 5), 16),
    parseInt(c.slice(5, 7), 16),
  ];
  const b = parse(base), a = parse(accent);
  const r = b.map((v, i) => Math.round(v + (a[i] - v) * t));
  return `#${r.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/* ─── Types ─────────────────────────────────────────────────── */
interface BoardPlayer {
  index: number;
  position: number;
  provider: string;
  isAlive: boolean;
  agentName?: string;
  properties: Array<{ squareId: number; houses: number }>;
}

/* ─── Component ─────────────────────────────────────────────── */
export default function MonopolyBoard({
  players,
  currentPlayerIndex,
}: {
  players: BoardPlayer[];
  currentPlayerIndex: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef  = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    pieces: THREE.Mesh[];
    pieceLights: THREE.PointLight[];
    animId: number;
    clock: THREE.Clock;
  } | null>(null);

  const ownerMap = useMemo(() => {
    const m: Record<number, number> = {};
    players.forEach(p => p.properties.forEach(prop => { m[prop.squareId] = p.index; }));
    return m;
  }, [players]);

  const housesMap = useMemo(() => {
    const m: Record<number, number> = {};
    players.forEach(p => p.properties.forEach(prop => { m[prop.squareId] = prop.houses; }));
    return m;
  }, [players]);

  // ── Build scene ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = 600, H = 520;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const scene = new THREE.Scene();
    scene.background = null;

    // Camera — isometric-ish perspective from above
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 14, 10);
    camera.lookAt(0, 0, 0);

    // ── Lighting ──
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff8e1, 1.8);
    sun.position.set(8, 20, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -15;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xc8d8ff, 0.5);
    fill.position.set(-6, 10, -4);
    scene.add(fill);

    // ── Board base (thick slab) ──
    const boardThickness = 0.35;
    const slabGeo = new THREE.BoxGeometry(BOARD_SIZE + 0.3, boardThickness, BOARD_SIZE + 0.3);
    const slabMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.4, metalness: 0.1 });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = -boardThickness / 2;
    slab.receiveShadow = true;
    slab.castShadow = true;
    scene.add(slab);

    // Slab edge highlight
    const edgeGeo = new THREE.BoxGeometry(BOARD_SIZE + 0.32, boardThickness + 0.02, BOARD_SIZE + 0.32);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2d5a2d, roughness: 0.6, metalness: 0.3 });
    const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
    edgeMesh.position.y = -boardThickness / 2;
    scene.add(edgeMesh);

    // ── Center green area ──
    const innerSize = BOARD_SIZE - CS * 2;
    const centerGeo = new THREE.BoxGeometry(innerSize, 0.02, innerSize);
    const centerMat = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.8 });
    const centerMesh = new THREE.Mesh(centerGeo, centerMat);
    centerMesh.position.y = 0.01;
    scene.add(centerMesh);

    // MONOPOLY text on center (canvas texture)
    const txtCanvas = document.createElement('canvas');
    txtCanvas.width = 512; txtCanvas.height = 256;
    const tc = txtCanvas.getContext('2d')!;
    tc.clearRect(0, 0, 512, 256);
    tc.fillStyle = '#FFD700';
    tc.font = 'bold italic 80px Georgia, serif';
    tc.textAlign = 'center'; tc.textBaseline = 'middle';
    tc.shadowColor = 'rgba(0,0,0,0.5)';
    tc.shadowBlur = 8;
    tc.fillText('MONOPOLY', 256, 90);
    tc.font = 'bold 28px monospace';
    tc.fillStyle = 'rgba(255,215,0,0.55)';
    tc.fillText('◆  ARENA  ◆', 256, 160);
    const txtTex = new THREE.CanvasTexture(txtCanvas);
    const txtGeo = new THREE.PlaneGeometry(innerSize * 0.75, innerSize * 0.38);
    const txtMat = new THREE.MeshBasicMaterial({ map: txtTex, transparent: true, depthWrite: false });
    const txtMesh = new THREE.Mesh(txtGeo, txtMat);
    txtMesh.rotation.x = -Math.PI / 2;
    txtMesh.position.y = 0.03;
    scene.add(txtMesh);

    // ── Board squares ──
    BOARD.forEach(sq => {
      const [cx, cz] = getSquareCenter(sq.id);
      const [sw, sd] = getSquareSize(sq.id);

      const ownerIdx = ownerMap[sq.id];
      const ownerCss = ownerIdx !== undefined
        ? (PROVIDER_COLOR_CSS[players[ownerIdx]?.provider] || '#888')
        : undefined;

      const tex = makeSquareTexture(sq, sw, sd, ownerCss);
      tex.flipY = false;

      const geo = new THREE.BoxGeometry(sw - 0.02, 0.04, sd - 0.02);
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.85,
        metalness: 0.02,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cx, 0.02, cz);
      mesh.receiveShadow = true;
      scene.add(mesh);

      // Houses / Hotel
      const houses = housesMap[sq.id] || 0;
      if (houses > 0 && sq.type === 'property') {
        const isHotel = houses === 5;
        const count = isHotel ? 1 : houses;
        for (let h = 0; h < count; h++) {
          const houseColor = isHotel ? 0xCC2222 : 0x2E7D32;
          const hW = isHotel ? 0.28 : 0.18;
          const hH = isHotel ? 0.22 : 0.16;
          const hGeo = new THREE.BoxGeometry(hW, hH, hW);
          const hMat = new THREE.MeshStandardMaterial({ color: houseColor, roughness: 0.5 });
          const hMesh = new THREE.Mesh(hGeo, hMat);
          // Roof
          const rGeo = new THREE.ConeGeometry(hW * 0.75, hH * 0.7, 4);
          const rMat = new THREE.MeshStandardMaterial({ color: isHotel ? 0x8B0000 : 0x1B5E20, roughness: 0.5 });
          const rMesh = new THREE.Mesh(rGeo, rMat);
          rMesh.rotation.y = Math.PI / 4;
          rMesh.position.y = hH / 2 + hH * 0.35;
          hMesh.add(rMesh);

          const offset = count === 1 ? 0 : (h - (count - 1) / 2) * (hW + 0.04);
          let hx = cx, hz = cz;
          // Position houses toward the interior of the board
          if (sq.id >= 1  && sq.id <= 9)  { hz = cz - sd * 0.25; hx = cx + offset; }
          if (sq.id >= 11 && sq.id <= 19) { hx = cx + sw * 0.25; hz = cz + offset; }
          if (sq.id >= 21 && sq.id <= 29) { hz = cz + sd * 0.25; hx = cx + offset; }
          if (sq.id >= 31 && sq.id <= 39) { hx = cx - sw * 0.25; hz = cz + offset; }

          hMesh.position.set(hx, hH / 2 + 0.04, hz);
          hMesh.castShadow = true;
          scene.add(hMesh);
        }
      }
    });

    // ── Player pieces ──
    const pieces: THREE.Mesh[] = [];
    const pieceLights: THREE.PointLight[] = [];

    players.forEach(p => {
      if (!p.isAlive) return;
      const col = PROVIDER_COLOR_HEX[p.provider] || 0x888888;

      // Piece: cylinder body + sphere top
      const bodyGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 16);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.3,
        metalness: 0.6,
        emissive: col,
        emissiveIntensity: 0.15,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = true;

      const topGeo = new THREE.SphereGeometry(0.2, 16, 12);
      const topMat = new THREE.MeshStandardMaterial({
        color: col,
        roughness: 0.2,
        metalness: 0.7,
        emissive: col,
        emissiveIntensity: 0.2,
      });
      const top = new THREE.Mesh(topGeo, topMat);
      top.position.y = 0.22;
      top.castShadow = true;
      body.add(top);

      // Highlight sphere
      const hlGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
      const hl = new THREE.Mesh(hlGeo, hlMat);
      hl.position.set(0.06, 0.3, -0.05);
      body.add(hl);

      // Base disc
      const baseGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -0.17;
      base.castShadow = true;
      body.add(base);

      const [px, pz] = getSquareCenter(p.position);
      // Offset multiple pieces on same square
      const sameSquare = players.filter(pp => pp.isAlive && pp.position === p.position);
      const idx = sameSquare.findIndex(pp => pp.index === p.index);
      const total = sameSquare.length;
      const angle = (idx / total) * Math.PI * 2;
      const radius = total > 1 ? 0.2 : 0;
      body.position.set(px + Math.cos(angle) * radius, 0.28, pz + Math.sin(angle) * radius);
      body.userData = { playerId: p.index, baseY: 0.28, baseX: px + Math.cos(angle) * radius, baseZ: pz + Math.sin(angle) * radius };

      scene.add(body);
      pieces.push(body);

      // Point light for glow
      const light = new THREE.PointLight(col, p.index === currentPlayerIndex ? 1.5 : 0, 2.5);
      light.position.set(px, 1.2, pz);
      scene.add(light);
      pieceLights.push(light);
    });

    // ── Animate ──
    const clock = new THREE.Clock();
    let animId = 0;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Subtle camera orbit
      const orbitSpeed = 0.04;
      camera.position.x = Math.sin(t * orbitSpeed) * 3;
      camera.position.z = 9 + Math.cos(t * orbitSpeed) * 1.5;
      camera.position.y = 13 + Math.sin(t * 0.15) * 0.5;
      camera.lookAt(0, 0.5, 0);

      // Animate pieces
      pieces.forEach((piece, i) => {
        const pid = piece.userData.playerId as number;
        const isActive = pid === currentPlayerIndex;
        const bob = Math.sin(t * 2 + i * 1.3) * 0.05;
        piece.position.y = piece.userData.baseY + (isActive ? 0.18 : 0) + bob;
        piece.rotation.y = t * 0.8 * (isActive ? 1.5 : 0.5);
        // Scale active piece
        const targetScale = isActive ? 1.25 : 1;
        piece.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
      });

      // Pulse lights
      pieceLights.forEach((light, i) => {
        const pid = players.filter(p => p.isAlive)[i]?.index;
        if (pid === currentPlayerIndex) {
          light.intensity = 1.2 + Math.sin(t * 3) * 0.4;
        }
      });

      renderer.render(scene, camera);
    }
    animate();

    sceneRef.current = { renderer, scene, camera, pieces, pieceLights, animId, clock };

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      scene.clear();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.map(p => p.position).join(','), players.map(p => p.isAlive).join(','), currentPlayerIndex]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={520}
        style={{
          borderRadius: 8,
          display: 'block',
          filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.7))',
        }}
      />
      {/* Legend below */}
      <div style={{
        display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
        padding: '8px 16px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {players.map(p => {
          const col = PROVIDER_COLOR_CSS[p.provider] || '#888';
          const active = p.index === currentPlayerIndex;
          return (
            <div key={p.index} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              opacity: p.isAlive ? 1 : 0.3,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: col,
                boxShadow: active ? `0 0 10px ${col}, 0 0 20px ${col}88` : 'none',
                border: active ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                animation: active ? 'legendPulse 1.5s ease-in-out infinite' : 'none',
              }} />
              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: '0.7rem',
                color: active ? col : 'rgba(255,255,255,0.65)',
                fontWeight: active ? 700 : 400,
                textShadow: active ? `0 0 10px ${col}` : 'none',
              }}>
                {p.agentName || `Player ${p.index + 1}`}
                {!p.isAlive && ' ✗'}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes legendPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
