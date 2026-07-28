import JobTemplateRepository from '../repositories/JobTemplateRepository.js';

const templateRepo = new JobTemplateRepository();

class TemplateService {
  async create(data) {
    try {
      if (!data.jobTitle) {
        throw new Error('Job title is required');
      }
      return await templateRepo.create(data);
    } catch (error) {
      throw new Error(`TemplateService.create: ${error.message}`);
    }
  }

  async getAll() {
    try {
      return await templateRepo.findMany({}, { sort: { createdAt: -1 } });
    } catch (error) {
      throw new Error(`TemplateService.getAll: ${error.message}`);
    }
  }

  async update(id, data) {
    try {
      const updated = await templateRepo.updateOne({ _id: id }, data);
      if (!updated) {
        throw new Error('Template not found');
      }
      return updated;
    } catch (error) {
      throw new Error(`TemplateService.update: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const result = await templateRepo.deleteOne({ _id: id });
      if (result.deletedCount === 0) {
        throw new Error('Template not found');
      }
      return { message: 'Template deleted successfully' };
    } catch (error) {
      throw new Error(`TemplateService.delete: ${error.message}`);
    }
  }
}

export default new TemplateService();
