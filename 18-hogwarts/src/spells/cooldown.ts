export function isSpellReady(lastCastAt: number | null, now: number, cooldownSeconds: number) {
  return lastCastAt === null || now - lastCastAt >= cooldownSeconds;
}

export function remainingCooldown(lastCastAt: number | null, now: number, cooldownSeconds: number) {
  if (lastCastAt === null) return 0;
  return Math.max(0, cooldownSeconds - (now - lastCastAt));
}
