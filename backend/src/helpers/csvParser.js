import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import { isValidEmail } from './emailParser.js';

export const extractEmailsFromFile = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const emails = new Set();

  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const cells = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
      for (const cell of cells) {
        if (isValidEmail(cell)) emails.add(cell);
      }
    }
  } else if (ext === '.xlsx') {
    const workbook = xlsx.readFile(filePath);
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      for (const row of json) {
        if (!Array.isArray(row)) continue;
        for (const cell of row) {
          if (typeof cell === 'string') {
            const cleaned = cell.trim();
            if (isValidEmail(cleaned)) emails.add(cleaned);
          }
        }
      }
    }
  }

  return Array.from(emails);
};
