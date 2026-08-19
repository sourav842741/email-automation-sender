import fs from 'fs';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import EmailService from '../services/EmailService.js';
import SettingsService from '../services/SettingsService.js';
import { parseRecipients } from '../helpers/emailParser.js';
import { extractEmailsFromFile } from '../helpers/csvParser.js';

export const sendEmails = asyncHandler(async (req, res) => {
  const { recipients, jobTitle, company, subject, delay } = req.body;

  console.log(`[controller] sendEmails called | recipients type: ${typeof recipients} | subject: ${subject}`);

  const parsed = parseRecipients(recipients);

  console.log(`[controller] Parsed: ${parsed.counts.valid} valid, ${parsed.counts.invalid} invalid | emails: ${parsed.valid.map(r => r.email).join(', ')}`);

  if (parsed.counts.valid === 0) {
    throw new ApiError('No valid recipients', 400);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  req.on('close', () => {
    EmailService.cancel();
  });

  try {
    await EmailService.sendEmails(parsed.valid, jobTitle || '', company || '', {
      subject,
      delay: delay ? parseInt(delay) : 10000,
      onProgress: (current, total, status, data) => {
        if (!res.writableEnded) {
          const event = { type: 'progress', current, total, status, data };
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
      },
    });

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
      res.end();
    }
  } catch (error) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
      res.end();
    }
  }
});

export const pauseSending = asyncHandler(async (req, res) => {
  EmailService.pause();
  res.status(200).json(new ApiResponse(200, 'Sending paused'));
});

export const resumeSending = asyncHandler(async (req, res) => {
  EmailService.resume();
  res.status(200).json(new ApiResponse(200, 'Sending resumed'));
});

export const cancelSending = asyncHandler(async (req, res) => {
  EmailService.cancel();
  res.status(200).json(new ApiResponse(200, 'Sending cancelled'));
});

export const uploadCsv = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError('No CSV file uploaded', 400);
  }

  const emails = extractEmailsFromFile(req.file.path);

  fs.unlink(req.file.path, () => {});

  if (emails.length === 0) {
    throw new ApiError('No valid email addresses found in CSV', 400);
  }

  res.status(200).json(new ApiResponse(200, 'CSV parsed successfully', { emails, count: emails.length }));
});

export const testSmtp = asyncHandler(async (req, res) => {
  let settings = req.body;

  if (!settings || !settings.smtpHost) {
    const dbSettings = await SettingsService.getSettings();
    if (!dbSettings || !dbSettings.smtpHost) {
      throw new ApiError('SMTP settings not configured. Please update settings first.', 400);
    }
    settings = dbSettings;
  }

  const result = await EmailService.testSmtp(settings);

  if (!result.success) {
    throw new ApiError(result.message, 400);
  }

  res.status(200).json(new ApiResponse(200, 'SMTP connection verified successfully', result));
});
