import BaseRepository from './BaseRepository.js';
import UserSettings from '../models/UserSettings.js';

class SettingsRepository extends BaseRepository {
  constructor() {
    super(UserSettings);
  }

  async getSettings() {
    try {
      let settings = await this.findOne({});
      if (!settings) {
        settings = await this.create({
          myName: '',
          email: '',
        });
      }
      return settings;
    } catch (error) {
      throw new Error(`SettingsRepository.getSettings: ${error.message}`);
    }
  }

  async updateSettings(data) {
    try {
      let settings = await this.findOne({});
      if (settings) {
        settings = await this.model.findOneAndUpdate(
          { _id: settings._id },
          { $set: data },
          { new: true }
        );
      } else {
        settings = await this.create(data);
      }
      return settings;
    } catch (error) {
      throw new Error(`SettingsRepository.updateSettings: ${error.message}`);
    }
  }
}

export default SettingsRepository;
