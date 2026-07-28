import fs from 'fs';
import path from 'path';
import ResumeRepository from '../repositories/ResumeRepository.js';
import { isAllowedFileType } from '../helpers/fileHelper.js';

const resumeRepo = new ResumeRepository();

class ResumeService {
  async upload(file) {
    try {
      if (!file) {
        throw new Error('No file provided');
      }

      if (!isAllowedFileType(file.mimetype)) {
        throw new Error(
          'Invalid file type. Allowed types: PDF, DOC, DOCX'
        );
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      const oldResume = await resumeRepo.getLatest();
      if (oldResume) {
        const oldPath = oldResume.path;
        if (oldPath && fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const doc = await resumeRepo.replaceResume({
        fileName: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
      });

      return doc;
    } catch (error) {
      throw new Error(`ResumeService.upload: ${error.message}`);
    }
  }

  async getResume() {
    try {
      return await resumeRepo.getLatest();
    } catch (error) {
      throw new Error(`ResumeService.getResume: ${error.message}`);
    }
  }

  async deleteResume() {
    try {
      const existing = await resumeRepo.getLatest();
      if (existing && existing.path && fs.existsSync(existing.path)) {
        fs.unlinkSync(existing.path);
      }
      await resumeRepo.deleteAll();
      return { message: 'Resume deleted successfully' };
    } catch (error) {
      throw new Error(`ResumeService.deleteResume: ${error.message}`);
    }
  }
}

export default new ResumeService();
