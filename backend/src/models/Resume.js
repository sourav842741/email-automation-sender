import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: [true, 'File name is required'],
  },
  originalName: {
    type: String,
    required: [true, 'Original name is required'],
  },
  path: {
    type: String,
    required: [true, 'File path is required'],
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Resume', resumeSchema);
