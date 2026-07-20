import type { SettingRepository } from '../repositories/SettingRepository';

export class SettingService {
  constructor(private readonly settingRepo: SettingRepository) {}

  getSetting(key: string): string | null {
    return this.settingRepo.get(key);
  }

  setSetting(key: string, value: string): void {
    this.settingRepo.set(key, value);
  }

  getAllSettings(): Record<string, string> {
    return this.settingRepo.getAll();
  }
}
