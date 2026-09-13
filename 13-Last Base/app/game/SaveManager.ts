import { DEFAULT_SETTINGS } from './config';
import type { GameSettings, OperatorId, WeaponMode } from './types';

export interface SaveData {
  highestDay: number;
  bestKills: number;
  runs: number;
  tutorialSeen: boolean;
  equippedWeapon: WeaponMode;
  selectedOperator: OperatorId;
}

const KEY = 'last-base-save-v1';
const SETTINGS_KEY = 'last-base-settings-v1';
const FALLBACK: SaveData = { highestDay: 0, bestKills: 0, runs: 0, tutorialSeen: false, equippedWeapon: 'rifle', selectedOperator: 'vanguard' };

export class SaveManager {
  static load(): SaveData {
    if (typeof window === 'undefined') return { ...FALLBACK };
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { ...FALLBACK, ...value };
    } catch {
      return { ...FALLBACK };
    }
  }

  static finishRun(day: number, kills: number) {
    const previous = this.load();
    const next = {
      ...previous,
      highestDay: Math.max(previous.highestDay, day),
      bestKills: Math.max(previous.bestKills, kills),
      runs: previous.runs + 1,
      tutorialSeen: true,
    };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  static markTutorialSeen() {
    const current = this.load();
    localStorage.setItem(KEY, JSON.stringify({ ...current, tutorialSeen: true }));
  }

  static equipWeapon(weapon: WeaponMode) {
    const current = this.load();
    const next = { ...current, equippedWeapon: weapon };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  static selectOperator(operator: OperatorId) {
    const current = this.load();
    const next = { ...current, selectedOperator: operator };
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  }

  static loadSettings(): GameSettings {
    if (typeof window === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { ...DEFAULT_SETTINGS, ...value };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  static saveSettings(settings: GameSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
