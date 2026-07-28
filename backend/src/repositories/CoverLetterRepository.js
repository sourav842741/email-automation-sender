import BaseRepository from './BaseRepository.js';
import CoverLetter from '../models/CoverLetter.js';

class CoverLetterRepository extends BaseRepository {
  constructor() {
    super(CoverLetter);
  }

  async getAll() {
    try {
      return await this.findMany({}, { sort: { uploadedAt: -1 } });
    } catch (error) {
      throw new Error(`CoverLetterRepository.getAll: ${error.message}`);
    }
  }

  async getActive() {
    try {
      return await this.findOne({ active: true });
    } catch (error) {
      throw new Error(`CoverLetterRepository.getActive: ${error.message}`);
    }
  }

  async setActiveNone() {
    try {
      await this.model.updateMany({}, { active: false });
    } catch (error) {
      throw new Error(`CoverLetterRepository.setActiveNone: ${error.message}`);
    }
  }

  async setActive(id) {
    try {
      await this.setActiveNone();
      return await this.updateOne({ _id: id }, { active: true });
    } catch (error) {
      throw new Error(`CoverLetterRepository.setActive: ${error.message}`);
    }
  }

  async deleteById(id) {
    try {
      const doc = await this.findById(id);
      if (!doc) return null;
      await this.deleteOne({ _id: id });
      return doc;
    } catch (error) {
      throw new Error(`CoverLetterRepository.deleteById: ${error.message}`);
    }
  }
}

export default CoverLetterRepository;
