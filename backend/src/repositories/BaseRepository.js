class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id) {
    try {
      return await this.model.findById(id);
    } catch (error) {
      throw new Error(`BaseRepository.findById: ${error.message}`);
    }
  }

  async findOne(filter) {
    try {
      return await this.model.findOne(filter);
    } catch (error) {
      throw new Error(`BaseRepository.findOne: ${error.message}`);
    }
  }

  async findMany(filter = {}, options = {}) {
    try {
      const { sort, limit, skip } = options;
      let query = this.model.find(filter);
      if (sort) query = query.sort(sort);
      if (limit) query = query.limit(limit);
      if (skip) query = query.skip(skip);
      return await query;
    } catch (error) {
      throw new Error(`BaseRepository.findMany: ${error.message}`);
    }
  }

  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      throw new Error(`BaseRepository.create: ${error.message}`);
    }
  }

  async updateOne(filter, data) {
    try {
      return await this.model.findOneAndUpdate(filter, data, {
        new: true,
        runValidators: true,
      });
    } catch (error) {
      throw new Error(`BaseRepository.updateOne: ${error.message}`);
    }
  }

  async deleteOne(filter) {
    try {
      return await this.model.deleteOne(filter);
    } catch (error) {
      throw new Error(`BaseRepository.deleteOne: ${error.message}`);
    }
  }

  async countDocuments(filter = {}) {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      throw new Error(`BaseRepository.countDocuments: ${error.message}`);
    }
  }

  async aggregate(pipeline) {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      throw new Error(`BaseRepository.aggregate: ${error.message}`);
    }
  }
}

export default BaseRepository;
