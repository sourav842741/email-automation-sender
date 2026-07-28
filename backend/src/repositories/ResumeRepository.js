import BaseRepository from './BaseRepository.js';
import Resume from '../models/Resume.js';

class ResumeRepository extends BaseRepository {
  constructor() {
    super(Resume);
  }

  async getLatest() {
    try {
      const resumes = await this.findMany({}, { sort: { uploadedAt: -1 }, limit: 1 });
      return resumes.length > 0 ? resumes[0] : null;
    } catch (error) {
      throw new Error(`ResumeRepository.getLatest: ${error.message}`);
    }
  }

  async replaceResume(fileData) {
    try {
      await this.deleteAll();
      return await this.create(fileData);
    } catch (error) {
      throw new Error(`ResumeRepository.replaceResume: ${error.message}`);
    }
  }

  async deleteAll() {
    try {
      return await this.model.deleteMany({});
    } catch (error) {
      throw new Error(`ResumeRepository.deleteAll: ${error.message}`);
    }
  }
}

export default ResumeRepository;
