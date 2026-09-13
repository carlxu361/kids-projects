'use client';

import { useEffect, useRef } from 'react';
import type { EnemyIntroInfo } from '../game/types';

interface EnemyDossierImageProps {
  enemy: EnemyIntroInfo;
}

const TAU = Math.PI * 2;

function polygon(ctx: CanvasRenderingContext2D, points: Array<[number, number]>) {
  ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function radialPolygon(ctx: CanvasRenderingContext2D, sides: number, inner: number, outer: number, offset = 0) {
  ctx.beginPath();
  for (let i = 0; i < sides * 2; i += 1) {
    const angle = offset + i / (sides * 2) * TAU;
    const radius = i % 2 ? inner : outer;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

function drawEyes(ctx: CanvasRenderingContext2D, color: string, x = 38, spread = 15, size = 5) {
  ctx.save();
  ctx.fillStyle = '#fff4c2';
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  for (const y of [-spread, spread]) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawEnemySilhouette(ctx: CanvasRenderingContext2D, key: string, color: string) {
  const isBoss = key.startsWith('boss-');
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = color;
  ctx.strokeStyle = '#160d13';
  ctx.lineWidth = isBoss ? 8 : 5;
  ctx.shadowColor = color;
  ctx.shadowBlur = isBoss ? 28 : 18;

  if (key === 'charger') {
    polygon(ctx, [[78, 0], [12, -42], [-71, -61], [-48, 0], [-71, 61], [12, 42]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#38202a'; ctx.fillRect(-46, -9, 105, 18);
    ctx.fillStyle = '#ffcf78'; ctx.fillRect(52, -5, 19, 10);
    drawEyes(ctx, color, 30, 19);
  } else if (key === 'armored') {
    radialPolygon(ctx, 8, 71, 71, Math.PI / 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#223744'; ctx.beginPath(); ctx.ellipse(-12, 0, 48, 59, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c9e5ef'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(9, 0, 55, -.92, .92); ctx.stroke();
    ctx.fillStyle = '#78d9f0'; ctx.fillRect(28, -8, 18, 16);
    drawEyes(ctx, color, 33, 22, 5);
  } else if (key === 'ranged') {
    polygon(ctx, [[74, 0], [7, -50], [-70, -34], [-70, 34], [7, 50]]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#f38fe6'; ctx.lineWidth = 7;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-25, side * 15); ctx.lineTo(-70, side * 68); ctx.moveTo(8, side * 19); ctx.lineTo(39, side * 66); ctx.stroke(); }
    ctx.fillStyle = '#2c1b31'; ctx.fillRect(-7, -9, 93, 18); ctx.fillStyle = '#ffb2f1'; ctx.fillRect(73, -5, 19, 10);
    drawEyes(ctx, color, 29, 21);
  } else if (key === 'bomber') {
    radialPolygon(ctx, 10, 55, 78); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#242027'; ctx.beginPath(); ctx.arc(0, 0, 47, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff075'; ctx.shadowColor = '#ffbd42'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(12, 0, 18, 0, TAU); ctx.fill();
    drawEyes(ctx, color, 27, 24, 4);
  } else if (key === 'leaper') {
    ctx.beginPath(); ctx.ellipse(-7, 0, 67, 39, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#e4a0ff'; ctx.lineWidth = 8;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-24, side * 17); ctx.lineTo(72, side * 72); ctx.lineTo(58, side * 9); ctx.stroke(); }
    ctx.fillStyle = '#f1c8ff'; polygon(ctx, [[76, 0], [19, -16], [19, 16]]); ctx.fill();
    drawEyes(ctx, color, 26, 18);
  } else if (key === 'stalker') {
    polygon(ctx, [[87, 0], [0, -43], [-77, -13], [-92, 0], [-77, 13], [0, 43]]); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9dffe9'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(-72, -66); ctx.moveTo(-20, 18); ctx.lineTo(-72, 66); ctx.stroke();
    ctx.fillStyle = '#d8fff5'; polygon(ctx, [[77, 0], [39, -12], [39, 12]]); ctx.fill();
    drawEyes(ctx, color, 32, 18, 4);
  } else if (key === 'medic') {
    ctx.beginPath(); ctx.arc(0, 0, 61, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#9dffba'; ctx.lineWidth = 8;
    for (let i = 0; i < 3; i += 1) { const a = i / 3 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 25, Math.sin(a) * 25); ctx.lineTo(Math.cos(a) * 85, Math.sin(a) * 85); ctx.stroke(); }
    ctx.fillStyle = '#c4ffd5'; ctx.fillRect(-8, -27, 16, 54); ctx.fillRect(-27, -8, 54, 16);
    drawEyes(ctx, color, 35, 21);
  } else if (key === 'crusher') {
    polygon(ctx, [[89, 0], [22, -66], [-72, -53], [-72, 53], [22, 66]]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#352328'; ctx.fillRect(-50, -43, 78, 86);
    ctx.strokeStyle = '#ffc0a0'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(14, -45); ctx.lineTo(90, 0); ctx.lineTo(14, 45); ctx.stroke();
    drawEyes(ctx, color, 29, 20);
  } else if (key === 'phase') {
    ctx.globalAlpha = .86;
    for (const offset of [-18, 18]) { polygon(ctx, [[82 + offset, 0], [offset, -64], [-70 + offset, 0], [offset, 64]]); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = '#d4ceff'; ctx.lineWidth = 5; ctx.setLineDash([9, 8]); ctx.beginPath(); ctx.arc(0, 0, 83, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    drawEyes(ctx, color, 32, 22, 5);
  } else if (key === 'siphon') {
    ctx.beginPath(); ctx.arc(0, 0, 68, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#302b18'; ctx.beginPath(); ctx.arc(-17, 0, 46, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff18a'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(13, 0, 42, -.95, .95); ctx.stroke();
    ctx.fillStyle = '#fff5ac'; polygon(ctx, [[8, -35], [-13, 3], [2, 3], [-7, 36], [34, -11], [14, -11]]); ctx.fill();
    drawEyes(ctx, color, 34, 22, 5);
  } else if (key === 'jammer') {
    radialPolygon(ctx, 8, 75, 75, Math.PI / 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#112d3b'; ctx.fillRect(-48, -48, 96, 96);
    ctx.strokeStyle = '#9cecff'; ctx.lineWidth = 7; for (const radius of [20, 39]) { ctx.beginPath(); ctx.arc(11, 0, radius, -.9, .9); ctx.stroke(); }
    ctx.fillStyle = '#d4f8ff'; ctx.beginPath(); ctx.arc(12, 0, 8, 0, TAU); ctx.fill();
    drawEyes(ctx, color, 28, 30, 6);
  } else if (key === 'boss-hive') {
    radialPolygon(ctx, 9, 64, 90); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#28132f'; ctx.beginPath(); ctx.ellipse(-10, 0, 57, 69, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < 6; i += 1) { const a = i / 6 * TAU; ctx.fillStyle = i % 2 ? '#f19aff' : '#8b48a5'; ctx.beginPath(); ctx.arc(Math.cos(a) * 57, Math.sin(a) * 57, 17, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#f8c9ff'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(28, 0, 23, 0, TAU); ctx.fill();
    drawEyes(ctx, color, 27, 32, 7);
  } else if (key === 'boss-tempest') {
    radialPolygon(ctx, 8, 78, 78, Math.PI / 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#112832'; ctx.beginPath(); ctx.arc(0, 0, 53, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b6f7ff'; ctx.lineWidth = 7; ctx.setLineDash([15, 10]); ctx.beginPath(); ctx.arc(0, 0, 66, -.5, TAU - .5); ctx.stroke(); ctx.setLineDash([]);
    for (const side of [-1, 1]) { ctx.fillStyle = '#2c6370'; polygon(ctx, [[-25, side * 31], [13, side * 85], [42, side * 37]]); ctx.fill(); }
    ctx.fillStyle = '#e3fdff'; polygon(ctx, [[78, 0], [42, -23], [20, 0], [42, 23]]); ctx.fill();
    drawEyes(ctx, color, 28, 28, 6);
  } else {
    radialPolygon(ctx, 8, 74, 91); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#25171d'; ctx.fillRect(-56, -68, 96, 136);
    ctx.strokeStyle = '#d25c5d'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-35, -61); ctx.lineTo(28, -89); ctx.moveTo(-35, 61); ctx.lineTo(28, 89); ctx.stroke();
    for (const side of [-1, 1]) { ctx.fillStyle = '#48212a'; ctx.fillRect(-76, side * 58 - 14, 93, 28); ctx.fillStyle = '#93434a'; for (let x = -67; x < 9; x += 21) ctx.fillRect(x, side * 58 - 10, 11, 20); }
    ctx.fillStyle = '#ff8966'; ctx.shadowBlur = 30; ctx.fillRect(27, -17, 32, 34);
    drawEyes(ctx, color, 24, 27, 7);
  }
  ctx.restore();
}

export function EnemyDossierImage({ enemy }: EnemyDossierImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const background = ctx.createRadialGradient(width * .53, height * .5, 12, width * .53, height * .5, width * .65);
    background.addColorStop(0, '#18252c');
    background.addColorStop(1, '#05090e');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#9fe6dc12';
    ctx.lineWidth = 1;
    for (let x = 20; x < width; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 18; y < height; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

    ctx.save();
    ctx.translate(width * .52, height * .53);
    ctx.scale(enemy.key.startsWith('boss-') ? 1.03 : .93, enemy.key.startsWith('boss-') ? 1.03 : .93);
    ctx.fillStyle = '#0008'; ctx.beginPath(); ctx.ellipse(-8, 68, 103, 26, 0, 0, TAU); ctx.fill();
    drawEnemySilhouette(ctx, enemy.key, enemy.color);
    ctx.restore();

    ctx.fillStyle = enemy.color;
    ctx.font = '700 12px ui-monospace, monospace';
    ctx.fillText(`BIO-SCAN // ${enemy.key.toUpperCase()}`, 18, 25);
    ctx.fillStyle = '#93a5a5';
    ctx.font = '600 10px ui-monospace, monospace';
    ctx.fillText('HOSTILE SILHOUETTE IDENTIFIED', 18, height - 17);
    ctx.strokeStyle = enemy.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 8, width - 16, height - 16);
  }, [enemy]);

  return <canvas ref={canvasRef} className="enemy-dossier-image" width={420} height={250} role="img" aria-label={`${enemy.name}战术扫描图`} />;
}
