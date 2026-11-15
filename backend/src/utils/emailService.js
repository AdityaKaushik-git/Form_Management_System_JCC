import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from './logger.js';

let transporter = null;
let isEmailConfigured = false;

if (config.email.user && config.email.pass) {
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });

  transporter.verify()
    .then(() => {
      isEmailConfigured = true;
      logger.info('Email service: ready');
    })
    .catch((err) => {
      logger.warn({ err: err.message }, 'Email service: SMTP verification failed, emails will not be sent');
    });
} else {
  logger.warn('Email service: credentials not configured, emails will not be sent');
}

/**
 * JCC branded email layout
 */
function wrapInTemplate(bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:#F47B20;padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;">JCC Reappear Examination</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${bodyHtml}
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#fafafa;padding:16px 32px;text-align:center;font-size:12px;color:#888;">
          <p style="margin:0;">This is an automated email from the JCC Reappear Examination System.</p>
          <p style="margin:4px 0 0;">Please do not reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Send a verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 * @param {string} name - Recipient name
 */
export async function sendVerificationEmail(email, token, name) {
  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  const html = wrapInTemplate(`
    <h2 style="color:#333;margin:0 0 16px;">Hello ${name || 'Student'},</h2>
    <p style="color:#555;line-height:1.6;">Thank you for registering with the JCC Reappear Examination System. Please verify your email address by clicking the button below:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:#F47B20;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:16px;font-weight:bold;">Verify Email</a>
    </div>
    <p style="color:#888;font-size:13px;">If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${verifyUrl}" style="color:#F47B20;word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="color:#888;font-size:13px;">This link will expire in 24 hours.</p>
  `);

  return sendGenericEmail(email, 'Verify Your Email - JCC Reappear Examination', html);
}

/**
 * Send a password reset email
 * @param {string} email - Recipient email
 * @param {string} token - Reset token
 * @param {string} name - Recipient name
 */
export async function sendPasswordResetEmail(email, token, name) {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  const html = wrapInTemplate(`
    <h2 style="color:#333;margin:0 0 16px;">Hello ${name || 'User'},</h2>
    <p style="color:#555;line-height:1.6;">We received a request to reset the password for your account. Click the button below to set a new password:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#F47B20;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:16px;font-weight:bold;">Reset Password</a>
    </div>
    <p style="color:#888;font-size:13px;">If you did not request a password reset, please ignore this email. Your password will not be changed.</p>
    <p style="color:#888;font-size:13px;">This link will expire in 1 hour.</p>
  `);

  return sendGenericEmail(email, 'Reset Your Password - JCC Reappear Examination', html);
}

/**
 * Send a generic email
 * @param {string} to - Recipient
 * @param {string} subject - Subject line
 * @param {string} html - HTML body
 */
export async function sendGenericEmail(to, subject, html) {
  if (!transporter || !isEmailConfigured) {
    logger.warn({ to, subject }, 'Email not sent: email service is not configured');
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });
    logger.info({ messageId: info.messageId, to }, 'Email sent successfully');
    return info;
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    throw err;
  }
}
