import * as XLSX from 'xlsx';
import RecipientHistoryRepository from '../repositories/RecipientHistoryRepository.js';

const historyRepo = new RecipientHistoryRepository();

class LogService {
  async getLogs(page = 1, limit = 20, filters = {}) {
    try {
      const query = {};

      if (filters.search) {
        const regex = new RegExp(filters.search, 'i');
        query.$or = [
          { name: regex },
          { email: regex },
        ];
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.dateFrom || filters.dateTo) {
        query.sentAt = {};
        if (filters.dateFrom) {
          query.sentAt.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          const end = new Date(filters.dateTo);
          end.setHours(23, 59, 59, 999);
          query.sentAt.$lte = end;
        }
      }

      return await historyRepo.getLogs(query, page, limit);
    } catch (error) {
      throw new Error(`LogService.getLogs: ${error.message}`);
    }
  }

  async deleteLogs(ids = []) {
    try {
      if (ids.length === 0) {
        await historyRepo.deleteAll();
        return { message: 'All logs deleted successfully' };
      }
      const result = await historyRepo.model.deleteMany({ _id: { $in: ids } });
      return { message: `${result.deletedCount} log(s) deleted successfully` };
    } catch (error) {
      throw new Error(`LogService.deleteLogs: ${error.message}`);
    }
  }

  async exportCSV() {
    try {
      const { data } = await historyRepo.getLogs({}, 1, 100000);
      const headers = ['Name', 'Email', 'Subject', 'Status', 'Error', 'Sent At'];
      const rows = data.map((log) => [
        escapeCsvField(log.name),
        escapeCsvField(log.email),
        escapeCsvField(log.subject),
        log.status,
        escapeCsvField(log.errorMessage || ''),
        log.sentAt ? new Date(log.sentAt).toISOString() : '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\r\n');

      return csv;
    } catch (error) {
      throw new Error(`LogService.exportCSV: ${error.message}`);
    }
  }

  async exportExcel() {
    try {
      const { data } = await historyRepo.getLogs({}, 1, 100000);
      const rows = data.map((log) => ({
        Name: log.name,
        Email: log.email,
        Subject: log.subject,
        Greeting: log.greeting,
        Status: log.status,
        'Error Message': log.errorMessage || '',
        'Sent At': log.sentAt ? new Date(log.sentAt).toISOString() : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const columns = [
        { wch: 25 },
        { wch: 35 },
        { wch: 50 },
        { wch: 30 },
        { wch: 10 },
        { wch: 40 },
        { wch: 25 },
      ];
      worksheet['!cols'] = columns;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Email Logs');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return buffer;
    } catch (error) {
      throw new Error(`LogService.exportExcel: ${error.message}`);
    }
  }
}

function escapeCsvField(value) {
  if (typeof value !== 'string') return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default new LogService();
