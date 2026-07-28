import RecipientHistoryRepository from '../repositories/RecipientHistoryRepository.js';

const historyRepo = new RecipientHistoryRepository();

class AnalyticsService {
  async getAnalytics() {
    try {
      const [todayCount, successRateResult, topDomains] = await Promise.all([
        historyRepo.getTodayCount(),
        historyRepo.getSuccessRate(),
        historyRepo.getTopDomains(5),
      ]);

      const weekStats = await historyRepo.getWeeklyStats();
      const weekCount = weekStats.reduce((sum, day) => sum + day.total, 0);

      return {
        todayCount,
        weekCount,
        total: successRateResult.total,
        success: successRateResult.success,
        failed: successRateResult.failed,
        successRate: successRateResult.successRate,
        failureRate: successRateResult.failureRate,
        topDomains,
        weekStats,
      };
    } catch (error) {
      throw new Error(`AnalyticsService.getAnalytics: ${error.message}`);
    }
  }
}

export default new AnalyticsService();
