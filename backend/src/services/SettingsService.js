import SettingsRepository from '../repositories/SettingsRepository.js';

const settingsRepo = new SettingsRepository();

class SettingsService {
  async getSettings() {
    try {
      return await settingsRepo.getSettings();
    } catch (error) {
      throw new Error(`SettingsService.getSettings: ${error.message}`);
    }
  }

  async updateSettings(data) {
    try {
      const sanitized = { ...data };
      const sensitiveKeys = ['password', 'secret', 'token', 'key'];
      for (const key of Object.keys(sanitized)) {
        const lower = key.toLowerCase();
        const isPasswordField = lower.includes('smtppassword') || lower.includes('password');
        if (!isPasswordField && sensitiveKeys.some((sk) => lower.includes(sk))) {
          delete sanitized[key];
        }
      }
      return await settingsRepo.updateSettings(sanitized);
    } catch (error) {
      throw new Error(`SettingsService.updateSettings: ${error.message}`);
    }
  }
}

export default new SettingsService();
