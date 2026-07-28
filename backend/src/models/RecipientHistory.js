import mongoose from 'mongoose';

const recipientHistorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Recipient name is required'],
  },
  email: {
    type: String,
    required: [true, 'Recipient email is required'],
  },
  subject: {
    type: String,
    default: '',
  },
  greeting: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    required: [true, 'Status is required'],
  },
  errorMessage: {
    type: String,
    default: '',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

recipientHistorySchema.index({ email: 1 });
recipientHistorySchema.index({ status: 1 });
recipientHistorySchema.index({ sentAt: 1 });

export default mongoose.model('RecipientHistory', recipientHistorySchema);
