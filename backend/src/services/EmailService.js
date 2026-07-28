import nodemailer from 'nodemailer';
import SettingsRepository from '../repositories/SettingsRepository.js';
import ResumeRepository from '../repositories/ResumeRepository.js';
import CoverLetterRepository from '../repositories/CoverLetterRepository.js';
import RecipientHistoryRepository from '../repositories/RecipientHistoryRepository.js';
import { renderTemplate } from '../helpers/templateEngine.js';

const settingsRepo = new SettingsRepository();
const resumeRepo = new ResumeRepository();
const coverLetterRepo = new CoverLetterRepository();
const historyRepo = new RecipientHistoryRepository();

const state = {
  paused: false,
  cancelled: false,
};

class EmailService {
  constructor() {
    this.state = state;
  }

  resetState() {
    state.paused = false;
    state.cancelled = false;
  }

  pause() {
    state.paused = true;
  }

  resume() {
    state.paused = false;
  }

  cancel() {
    state.cancelled = true;
    state.paused = false;
  }

  async sendEmails(recipients, jobTitle, company, options = {}) {
    this.resetState();

    const {
      delay = 10000,
      onProgress = () => {},
      subject: customSubject,
    } = options;

    const summary = {
      total: recipients.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      const settings = await settingsRepo.getSettings();
      if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
        throw new Error('SMTP settings are not configured');
      }

      const resume = await resumeRepo.getLatest();
      const coverLetter = await coverLetterRepo.getActive();

      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure || false,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
      });

      const myName = settings.myName || '';
      const fallbackGreeting = settings.fallbackGreeting || 'Dear Hiring Team';
      const subjectTemplate = customSubject || settings.defaultSubject || 'Application';
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      for (let i = 0; i < recipients.length; i++) {
        if (state.cancelled) {
          onProgress(i + 1, recipients.length, 'cancelled', null);
          break;
        }

        while (state.paused && !state.cancelled) {
          await new Promise((r) => setTimeout(r, 500));
        }

        if (state.cancelled) break;

        const recipient = recipients[i];

        const variables = {
          name: fallbackGreeting,
          jobTitle,
          company,
          myName,
          date: today,
        };

        const subject = renderTemplate(subjectTemplate, variables);

        let body = '';
        if (coverLetter) {
          if (coverLetter.type === 'text') {
            body = renderTemplate(coverLetter.templateText, variables);
          }
        }

        if (!body) {
          body = renderTemplate(fallbackGreeting, variables);
        }

        const attachments = [];

        if (resume && resume.path) {
          attachments.push({
            filename: resume.originalName,
            path: resume.path,
          });
        }

        if (
          coverLetter &&
          coverLetter.type === 'file' &&
          coverLetter.uploadedFile?.path
        ) {
          attachments.push({
            filename: coverLetter.uploadedFile.originalName,
            path: coverLetter.uploadedFile.path,
          });
        }

        const mailOptions = {
          from: `"${settings.senderName || myName}" <${settings.email}>`,
          to: recipient.email,
          subject,
          text: body,
        };

        if (attachments.length > 0) {
          mailOptions.attachments = attachments;
        }

        try {
          await transporter.sendMail(mailOptions);
          summary.success++;

          await historyRepo.create({
            name: recipient.email,
            email: recipient.email,
            subject,
            body,
            status: 'success',
          });

          onProgress(i + 1, recipients.length, 'success', { name: recipient.email, email: recipient.email });
        } catch (sendError) {
          summary.failed++;
          summary.errors.push({
            email: recipient.email,
            error: sendError.message,
          });

          await historyRepo.create({
            name: recipient.email,
            email: recipient.email,
            subject,
            body,
            status: 'failed',
            errorMessage: sendError.message,
          });

          onProgress(i + 1, recipients.length, 'failed', {
            name,
            email: recipient.email,
            error: sendError.message,
          });
        }

        if (i < recipients.length - 1) {
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    } catch (error) {
      throw new Error(`EmailService.sendEmails: ${error.message}`);
    }

    return summary;
  }

  async testSmtp(settings) {
    try {
      const transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure || false,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
      });

      const verification = await transporter.verify();
      return {
        success: true,
        message: 'SMTP connection verified successfully',
        details: verification,
      };
    } catch (error) {
      return {
        success: false,
        message: 'SMTP connection failed',
        error: error.message,
      };
    }
  }
}

export default new EmailService();
