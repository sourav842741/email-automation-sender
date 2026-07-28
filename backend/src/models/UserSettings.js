import mongoose from 'mongoose';

const userSettingsSchema = new mongoose.Schema(
  {
    myName: {
      type: String,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: Number,
      default: 587,
    },
    smtpSecure: {
      type: Boolean,
      default: false,
    },
    smtpUser: {
      type: String,
      default: '',
    },
    smtpPassword: {
      type: String,
      default: '',
    },
    senderName: {
      type: String,
      default: '',
    },
    fallbackGreeting: {
      type: String,
      default: 'Dear Hiring Team',
    },
    defaultSubject: {
      type: String,
      default: 'Application for position',
    },
  },
  { timestamps: true }
);

export default mongoose.model('UserSettings', userSettingsSchema);
