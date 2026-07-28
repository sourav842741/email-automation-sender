import fs from 'fs';
import CoverLetterRepository from '../repositories/CoverLetterRepository.js';
import { isAllowedFileType } from '../helpers/fileHelper.js';

const coverLetterRepo = new CoverLetterRepository();

class CoverLetterService {
  async getAll() {
    try {
      return await coverLetterRepo.getAll();
    } catch (error) {
      throw new Error(`CoverLetterService.getAll: ${error.message}`);
    }
  }

  async getActive() {
    try {
      return await coverLetterRepo.getActive();
    } catch (error) {
      throw new Error(`CoverLetterService.getActive: ${error.message}`);
    }
  }

  async getById(id) {
    try {
      return await coverLetterRepo.findById(id);
    } catch (error) {
      throw new Error(`CoverLetterService.getById: ${error.message}`);
    }
  }

  async saveText(title, templateText) {
    try {
      if (!templateText || typeof templateText !== 'string') {
        throw new Error('Template text is required');
      }
      const doc = await coverLetterRepo.create({
        title: title || 'Untitled Cover Letter',
        type: 'text',
        templateText,
        active: false,
      });
      return doc;
    } catch (error) {
      throw new Error(`CoverLetterService.saveText: ${error.message}`);
    }
  }

  async saveFile(title, file) {
    try {
      if (!file) throw new Error('No file provided');
      if (!isAllowedFileType(file.mimetype)) throw new Error('Invalid file type. Allowed types: PDF, DOC, DOCX');
      if (file.size > 10 * 1024 * 1024) throw new Error('File size exceeds 10MB limit');

      const doc = await coverLetterRepo.create({
        title: title || 'Untitled Cover Letter',
        type: 'file',
        uploadedFile: {
          fileName: file.filename,
          originalName: file.originalname,
          path: file.path,
          size: file.size,
        },
        active: false,
      });
      return doc;
    } catch (error) {
      throw new Error(`CoverLetterService.saveFile: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const existing = await coverLetterRepo.findById(id);
      if (!existing) throw new Error('Cover letter not found');

      const updateData = {};
      if (data.title) updateData.title = data.title;
      if (data.templateText !== undefined) updateData.templateText = data.templateText;

      if (data.type === 'file' && data.uploadedFile) {
        updateData.type = 'file';
        updateData.uploadedFile = data.uploadedFile;
      }

      return await coverLetterRepo.updateOne({ _id: id }, updateData);
    } catch (error) {
      throw new Error(`CoverLetterService.update: ${error.message}`);
    }
  }

  async setActive(id) {
    try {
      return await coverLetterRepo.setActive(id);
    } catch (error) {
      throw new Error(`CoverLetterService.setActive: ${error.message}`);
    }
  }

  async deleteCoverLetter(id) {
    try {
      const doc = await coverLetterRepo.deleteById(id);
      if (!doc) throw new Error('Cover letter not found');

      if (doc.type === 'file' && doc.uploadedFile?.path && fs.existsSync(doc.uploadedFile.path)) {
        fs.unlinkSync(doc.uploadedFile.path);
      }
      return { message: 'Cover letter deleted successfully' };
    } catch (error) {
      throw new Error(`CoverLetterService.deleteCoverLetter: ${error.message}`);
    }
  }
}

export default new CoverLetterService();
