import BaseRepository from './BaseRepository.js';
import RecipientHistory from '../models/RecipientHistory.js';

class RecipientHistoryRepository extends BaseRepository {
  constructor() {
    super(RecipientHistory);
  }

  async getLogs(filter = {}, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.findMany(filter, { sort: { sentAt: -1 }, skip, limit }),
        this.countDocuments(filter),
      ]);
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new Error(`RecipientHistoryRepository.getLogs: ${error.message}`);
    }
  }

  async getTodayCount() {
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return await this.countDocuments({ sentAt: { $gte: start, $lte: end } });
    } catch (error) {
      throw new Error(`RecipientHistoryRepository.getTodayCount: ${error.message}`);
    }
  }

  async getSuccessRate() {
    try {
      const result = await this.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      const total = result.reduce((acc, r) => acc + r.count, 0);
      const success = result.find((r) => r._id === 'success')?.count || 0;
      const failed = result.find((r) => r._id === 'failed')?.count || 0;
      return {
        total,
        success,
        failed,
        successRate: total > 0 ? Math.round((success / total) * 100) : 0,
        failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      };
    } catch (error) {
      throw new Error(`RecipientHistoryRepository.getSuccessRate: ${error.message}`);
    }
  }

  async getTopDomains(limit = 5) {
    try {
      return await this.aggregate([
        {
          $addFields: {
            domain: {
              $arrayElemAt: [{ $split: ['$email', '@'] }, 1],
            },
          },
        },
        {
          $group: {
            _id: '$domain',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: limit },
      ]);
    } catch (error) {
      throw new Error(`RecipientHistoryRepository.getTopDomains: ${error.message}`);
    }
  }

  async deleteAll() {
    try {
      return await this.model.deleteMany({});
    } catch (error) {
      throw new Error(`RecipientHistoryRepository.deleteAll: ${error.message}`);
    }
  }

  async getWeeklyStats() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      const result = await this.aggregate([
        {
          $match: { sentAt: { $gte: sevenDaysAgo } },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$sentAt' },
            },
            total: { $sum: 1 },
            success: {
              $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]);
      return result;
    } catch (error) {
      throw new Error(`RecipientHistoryRepository.getWeeklyStats: ${error.message}`);
    }
  }
}

export default RecipientHistoryRepository;
