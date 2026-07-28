import mongoose from 'mongoose';

const jobTemplateSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
    },
    subjectTemplate: {
      type: String,
      default: '',
    },
    coverLetterTemplate: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.model('JobTemplate', jobTemplateSchema);
