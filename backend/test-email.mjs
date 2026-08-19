import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function testEmail() {
  console.log('[test] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[test] Connected.');

  const db = mongoose.connection.db;
  const settings = await db.collection('usersettings').findOne();

  if (!settings) {
    console.error('[test] No settings found in DB!');
    process.exit(1);
  }

  console.log('[test] SMTP Config:');
  console.log(`  host:     ${settings.smtpHost}`);
  console.log(`  port:     ${settings.smtpPort}`);
  console.log(`  secure:   ${settings.smtpSecure}`);
  console.log(`  user:     ${settings.smtpUser}`);
  console.log(`  pass:     ${settings.smtpPassword ? '****' + settings.smtpPassword.slice(-4) : 'EMPTY'}`);
  console.log(`  email:    ${settings.email}`);
  console.log(`  senderName: ${settings.senderName}`);
  console.log(`  myName:   ${settings.myName}`);

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort || 587,
    secure: settings.smtpSecure || false,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword,
    },
  });

  console.log('\n[test] Verifying SMTP connection...');
  try {
    const verified = await transporter.verify();
    console.log('[test] SMTP verification:', verified);
  } catch (err) {
    console.error('[test] SMTP verification FAILED:', err.message);
    process.exit(1);
  }

  const testEmail = settings.smtpUser;
  console.log(`\n[test] Sending test email to: ${testEmail}`);

  try {
    const fromAddress = `"${settings.senderName || settings.myName || 'Test'}" <${settings.smtpUser}>`;
    console.log(`[test] From: ${fromAddress}`);

    const info = await transporter.sendMail({
      from: fromAddress,
      replyTo: settings.email || settings.smtpUser,
      to: testEmail,
      subject: 'Test Email - SMTP Verification',
      text: 'This is a test email from your email automation tool. If you received this, SMTP is working correctly.',
      html: '<p>This is a test email from your email automation tool. If you received this, SMTP is working correctly.</p>',
    });

    console.log('[test] Email sent successfully!');
    console.log(`  messageId: ${info.messageId}`);
    console.log(`  response:  ${info.response}`);
    console.log(`  accepted:  ${JSON.stringify(info.accepted)}`);
    console.log(`  rejected:  ${JSON.stringify(info.rejected)}`);
  } catch (err) {
    console.error('[test] Email send FAILED:', err.message);
    console.error(err);
  }

  await mongoose.disconnect();
  console.log('[test] Done.');
}

testEmail().catch(console.error);
