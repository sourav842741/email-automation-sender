import mongoose from 'mongoose';

const coverLetterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Cover Letter',
  },
  type: {
    type: String,
    enum: ['text', 'file'],
    default: 'text',
  },
  templateText: {
    type: String,
    default: '',
  },
  uploadedFile: {
    type: {
      fileName: { type: String },
      originalName: { type: String },
      path: { type: String },
      size: { type: Number },
    },
    default: {},
  },
  active: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('CoverLetter', coverLetterSchema);
