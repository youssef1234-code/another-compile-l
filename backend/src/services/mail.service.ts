/**
 * Mail Service Interface
 * 
 * Abstract mail service for sending emails
 * Supports multiple providers (Mailgun, SMTP, SendGrid, etc.)
 * 
 * @module services/mail.service
 */

import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { config } from '../config/env.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import types from mailgun.js internal structure
type IMailgunClient = ReturnType<InstanceType<typeof Mailgun>['client']>;

/**
 * Email options interface
 */
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

/**
 * Email template data for common emails
 */
export interface VerificationEmailData {
  name: string;
  verificationUrl: string;
  expiresIn?: string;
}

export interface WelcomeEmailData {
  name: string;
  loginUrl: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
  expiresIn?: string;
}

export interface EventReminderEmailData {
  name: string;
  eventName: string;
  eventDate: Date;
  eventLocation: string;
  eventUrl: string;
}

export interface PaymentReceiptEmailData {
  name: string;
  eventName: string;
  amount: number;
  currency: string;
  receiptId: string;
  paymentDate: Date;
}

export interface CommentDeletedWarningEmailData {
  name: string;
  comment: string;
  eventName: string;
  deletedAt: string;
}

export interface GymSessionUpdateEmailData {
  userName: string;
  sessionTitle: string;
  updateType: 'CANCELLED' | 'EDITED';
  details?: string;
  sessionDate?: string;
}

/**
 * Abstract Mail Service Class
 */
export abstract class BaseMailService {
  protected from: string;
  protected logsDir: string;

  constructor(from?: string) {
    this.from = from || config.emailFrom;
    
    // Setup logs directory
    this.logsDir = path.join(__dirname, '../../logs/emails');
    this.ensureLogsDirectory();
  }

  /**
   * Ensure logs directory exists
   */
  private ensureLogsDirectory(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
      console.log(`📁 Created email logs directory: ${this.logsDir}`);
    }
  }

  /**
   * Save email HTML to logs folder
   */
  protected saveEmailToLogs(
    type: string,
    recipient: string,
    subject: string,
    html: string
  ): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedRecipient = recipient.replace(/[^a-z0-9]/gi, '_');
      const filename = `${timestamp}_${type}_${sanitizedRecipient}.html`;
      const filepath = path.join(this.logsDir, filename);

      // Create a complete HTML document with metadata
      const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    .email-metadata {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      font-family: monospace;
      font-size: 13px;
    }
    .email-metadata h3 {
      margin-top: 0;
      color: #2456d3;
    }
    .email-metadata p {
      margin: 8px 0;
    }
    .email-content {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background-color: #ffffff;
    }
  </style>
</head>
<body style="background-color: #fafafa; padding: 20px;">
  <div class="email-metadata">
    <h3>📧 Email Metadata</h3>
    <p><strong>Type:</strong> ${type}</p>
    <p><strong>To:</strong> ${recipient}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
    <p><strong>Log File:</strong> ${filename}</p>
  </div>
  
  <div class="email-content">
    ${html}
  </div>
</body>
</html>
      `.trim();

      fs.writeFileSync(filepath, fullHtml, 'utf-8');
      console.log(`💾 Email saved to logs: ${filename}`);
    } catch (error: any) {
      console.error('⚠️  Failed to save email to logs:', error.message);
    }
  }

  /**
   * Send email (must be implemented by provider)
   */
  abstract sendMail(options: EmailOptions): Promise<void>;

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    email: string,
    data: VerificationEmailData
  ): Promise<void> {
    console.log(`📧 Sending verification email to: ${email}`);
    const html = this.generateVerificationEmailHTML(data);
    const subject = 'Verify Your Email - Another Compile L';
    
    this.saveEmailToLogs('verification', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(
    email: string,
    data: WelcomeEmailData
  ): Promise<void> {
    console.log(`📧 Sending welcome email to: ${email}`);
    const html = this.generateWelcomeEmailHTML(data);
    const subject = 'Welcome to Another Compile L!';
    
    this.saveEmailToLogs('welcome', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    data: PasswordResetEmailData
  ): Promise<void> {
    console.log(`📧 Sending password reset email to: ${email}`);
    const html = this.generatePasswordResetEmailHTML(data);
    const subject = 'Reset Your Password - Another Compile L';
    
    this.saveEmailToLogs('password-reset', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send event reminder email
   */
  async sendEventReminderEmail(
    email: string,
    data: EventReminderEmailData
  ): Promise<void> {
    console.log(`📧 Sending event reminder email to: ${email}`);
    const html = this.generateEventReminderEmailHTML(data);
    const subject = `Reminder: ${data.eventName}`;
    
    this.saveEmailToLogs('event-reminder', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceiptEmail(
    email: string,
    data: PaymentReceiptEmailData
  ): Promise<void> {
    console.log(`📧 Sending payment receipt email to: ${email}`);
    const html = this.generatePaymentReceiptEmailHTML(data);
    const subject = `Payment Receipt - ${data.eventName}`;
    
    this.saveEmailToLogs('payment-receipt', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send custom email with HTML template
   */
  async sendCustomEmail(
    email: string,
    subject: string,
    html: string
  ): Promise<void> {
    console.log(`📧 Sending custom email to: ${email}`);
    
    this.saveEmailToLogs('custom', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send comment deleted warning email (Story #21)
   * Notifies user when their comment was deleted by admin for being inappropriate
   */
  async sendCommentDeletedWarningEmail(
    email: string,
    data: CommentDeletedWarningEmailData
  ): Promise<void> {
    console.log(`📧 Sending comment deletion warning email to: ${email}`);
    const html = this.generateCommentDeletedWarningEmailHTML(data);
    const subject = 'Comment Removed - Another Compile L';
    
    this.saveEmailToLogs('comment-deleted-warning', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send gym session update email (Story #87)
   * Notifies registered users when gym session is cancelled or edited
   */
  async sendGymSessionUpdateEmail(
    email: string,
    data: GymSessionUpdateEmailData
  ): Promise<void> {
    console.log(`📧 Sending gym session update email to: ${email}`);
    const html = this.generateGymSessionUpdateEmailHTML(data);
    const subject = data.updateType === 'CANCELLED' 
      ? '❌ Gym Session Cancelled - Another Compile L'
      : '📝 Gym Session Updated - Another Compile L';
    
    this.saveEmailToLogs('gym-session-update', email, subject, html);
    
    await this.sendMail({
      to: email,
      subject,
      html,
    });
  }

  // ============================================================================
  // HTML TEMPLATE GENERATORS
  // ============================================================================

  protected generateVerificationEmailHTML(data: VerificationEmailData): string {
    const { name, verificationUrl, expiresIn = '24 hours' } = data;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Verify your email</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Hi ${name},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">Thanks for signing up. Click the button below to verify your email address and get started.</p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2456d3; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Verify Email</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 8px; font-size: 14px; color: #737373;">Or copy this link:</p>
                      <p style="margin: 0; padding: 12px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 13px; color: #525252; word-break: break-all;">${verificationUrl}</p>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #fef9c3; border-left: 3px solid #eab308; border-radius: 4px; font-size: 14px; color: #713f12;">This link expires in ${expiresIn}.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">If you didn't sign up, you can safely ignore this email.</p>
                      <p style="margin: 8px 0 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  protected generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    const { name, loginUrl } = data;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #2456d3;">Welcome to Another Compile L</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Hi ${name},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">Your email has been verified. You're all set to start managing and discovering events.</p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${loginUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2456d3; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Get Started</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  protected generatePasswordResetEmailHTML(data: PasswordResetEmailData): string {
    const { name, resetUrl, expiresIn = '1 hour' } = data;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Reset your password</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Hi ${name},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">We received a request to reset your password. Click the button below to create a new one.</p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2456d3; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Reset Password</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 8px; font-size: 14px; color: #737373;">Or copy this link:</p>
                      <p style="margin: 0; padding: 12px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 13px; color: #525252; word-break: break-all;">${resetUrl}</p>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #fef9c3; border-left: 3px solid #eab308; border-radius: 4px; font-size: 14px; color: #713f12;">This link expires in ${expiresIn}.</p>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #fef2f2; border-left: 3px solid #ef4444; border-radius: 4px; font-size: 14px; color: #7f1d1d;">If you didn't request this, please ignore this email or contact support if you're concerned about your account security.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  protected generateEventReminderEmailHTML(data: EventReminderEmailData): string {
    const { name, eventName, eventDate, eventLocation, eventUrl } = data;
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Event Reminder</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Hi ${name},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">This is a friendly reminder about your upcoming event.</p>
                      
                      <!-- Event Details Card -->
                      <div style="margin: 24px 0; padding: 20px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px;">
                        <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #2456d3;">${eventName}</h3>
                        <p style="margin: 0 0 8px; font-size: 14px; color: #525252;"><strong>Date:</strong> ${formattedDate}</p>
                        <p style="margin: 0 0 8px; font-size: 14px; color: #525252;"><strong>Time:</strong> ${formattedTime}</p>
                        <p style="margin: 0; font-size: 14px; color: #525252;"><strong>Location:</strong> ${eventLocation}</p>
                      </div>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${eventUrl}" style="display: inline-block; padding: 12px 32px; background-color: #2456d3; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">View Event Details</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 24px 0 0; font-size: 14px; color: #737373;">We look forward to seeing you there!</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  protected generatePaymentReceiptEmailHTML(data: PaymentReceiptEmailData): string {
    const { name, eventName, amount, currency, receiptId, paymentDate } = data;
    const formattedDate = paymentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Payment Receipt</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Hi ${name},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">Your payment has been processed successfully. Here are the details:</p>
                      
                      <!-- Payment Details Card -->
                      <div style="margin: 24px 0; padding: 20px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px;">
                        <table style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #737373;">Event</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right; font-weight: 500;">${eventName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #737373;">Amount</td>
                            <td style="padding: 8px 0; font-size: 16px; color: #171717; text-align: right; font-weight: 600;">${amount} ${currency}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #737373;">Receipt ID</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right; font-family: monospace;">${receiptId}</td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0; font-size: 14px; color: #737373;">Date</td>
                            <td style="padding: 8px 0; font-size: 14px; color: #171717; text-align: right;">${formattedDate}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 0 0; border-top: 1px solid #e5e5e5; font-size: 14px; color: #737373;">Status</td>
                            <td style="padding: 12px 0 0; border-top: 1px solid #e5e5e5; text-align: right;">
                              <span style="display: inline-block; padding: 4px 12px; background-color: #dcfce7; color: #166534; border-radius: 4px; font-size: 13px; font-weight: 500;">Paid</span>
                            </td>
                          </tr>
                        </table>
                      </div>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #eff6ff; border-left: 3px solid #2456d3; border-radius: 4px; font-size: 14px; color: #1e40af;">Your registration is confirmed. You'll receive event details and reminders via email.</p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">Keep this email for your records.</p>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  protected generateCommentDeletedWarningEmailHTML(data: CommentDeletedWarningEmailData): string {
    const { name, comment, eventName, deletedAt } = data;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5; background-color: #fef2f2;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #991b1b;">⚠️ Comment Removed</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Hi ${name},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                        Your comment on "<strong>${eventName}</strong>" has been removed by our moderation team for violating our community guidelines.
                      </p>
                      
                      <!-- Deleted Comment Box -->
                      <div style="margin: 24px 0; padding: 16px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
                        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #991b1b; text-transform: uppercase;">Deleted Comment:</p>
                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #525252; font-style: italic;">"${comment}"</p>
                      </div>
                      
                      <!-- Warning Notice -->
                      <div style="margin: 24px 0; padding: 16px; background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px;">
                        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #92400e;">⚠️ Why was my comment removed?</p>
                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #78350f;">
                          Comments are removed when they contain inappropriate content, including but not limited to:
                        </p>
                        <ul style="margin: 12px 0 0; padding-left: 20px; font-size: 14px; line-height: 20px; color: #78350f;">
                          <li>Offensive or abusive language</li>
                          <li>Personal attacks or harassment</li>
                          <li>Spam or promotional content</li>
                          <li>Discriminatory or hateful speech</li>
                        </ul>
                      </div>
                      
                      <!-- Deletion Details -->
                      <div style="margin: 24px 0; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
                        <p style="margin: 0; font-size: 13px; color: #6b7280;">
                          <strong>Event:</strong> ${eventName}<br>
                          <strong>Deleted At:</strong> ${deletedAt}
                        </p>
                      </div>
                      
                      <!-- Community Guidelines -->
                      <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #525252;">
                        Please review our community guidelines to ensure your future comments comply with our standards. 
                        We appreciate your cooperation in maintaining a respectful and positive environment for all users.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5; background-color: #f9fafb;">
                      <p style="margin: 0; font-size: 13px; color: #6b7280;">
                        If you believe this was a mistake, please contact our support team.
                      </p>
                      <p style="margin: 12px 0 0; font-size: 13px; color: #a3a3a3;">
                        &copy; ${new Date().getFullYear()} Another Compile L
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  protected generateGymSessionUpdateEmailHTML(data: GymSessionUpdateEmailData): string {
    const { userName, sessionTitle, updateType, details, sessionDate } = data;
    const isCancelled = updateType === 'CANCELLED';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5; background-color: ${isCancelled ? '#fef2f2' : '#eff6ff'};">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: ${isCancelled ? '#991b1b' : '#1e40af'};">
                        ${isCancelled ? '❌ Gym Session Cancelled' : '📝 Gym Session Updated'}
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Hi ${userName},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                        ${isCancelled 
                          ? `We regret to inform you that the gym session "<strong>${sessionTitle}</strong>" you registered for has been <strong>cancelled</strong>.`
                          : `The gym session "<strong>${sessionTitle}</strong>" you registered for has been <strong>updated</strong>.`
                        }
                      </p>
                      
                      <!-- Session Details Box -->
                      <div style="margin: 24px 0; padding: 16px; background-color: ${isCancelled ? '#fef2f2' : '#eff6ff'}; border-left: 4px solid ${isCancelled ? '#dc2626' : '#3b82f6'}; border-radius: 4px;">
                        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: ${isCancelled ? '#991b1b' : '#1e40af'}; text-transform: uppercase;">Session Details:</p>
                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #525252;">
                          <strong>Session:</strong> ${sessionTitle}<br>
                          ${sessionDate ? `<strong>Original Date:</strong> ${sessionDate}<br>` : ''}
                          ${details ? `<strong>Changes:</strong> ${details}` : ''}
                        </p>
                      </div>
                      
                      ${isCancelled ? `
                      <!-- Cancellation Notice -->
                      <div style="margin: 24px 0; padding: 16px; background-color: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px;">
                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #78350f;">
                          <strong>What does this mean?</strong><br>
                          Your registration for this session has been automatically cancelled. 
                          ${sessionDate ? 'You can browse other available gym sessions in the schedule.' : ''}
                        </p>
                      </div>
                      ` : `
                      <!-- Update Notice -->
                      <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 6px;">
                        <p style="margin: 0; font-size: 14px; line-height: 20px; color: #14532d;">
                          <strong>Your registration is still active!</strong><br>
                          You're still registered for this session. Please note the changes above and plan accordingly.
                        </p>
                      </div>
                      `}
                      
                      <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #525252;">
                        ${isCancelled 
                          ? 'We apologize for any inconvenience this may cause. Please check the gym schedule for alternative sessions.'
                          : 'If you have any questions about these changes, please contact the Events Office.'
                        }
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5; background-color: #f9fafb;">
                      <p style="margin: 0; font-size: 13px; color: #6b7280;">
                        Thank you for using Another Compile L gym facilities!
                      </p>
                      <p style="margin: 12px 0 0; font-size: 13px; color: #a3a3a3;">
                        &copy; ${new Date().getFullYear()} Another Compile L
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }
}

/**
 * Mailgun Mail Service Implementation
 */
export class MailgunService extends BaseMailService {
  private mailgun: IMailgunClient;
  private domain: string;

  constructor() {
    super();
    
    if (!config.mailgun.apiKey || !config.mailgun.domain) {
      throw new Error('Mailgun API key and domain are required. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN in .env');
    }

    const mg = new Mailgun(formData);
    this.mailgun = mg.client({
      username: 'api',
      key: config.mailgun.apiKey,
      url: 'https://api.eu.mailgun.net'
    });
    
    this.domain = config.mailgun.domain;
  }

  /**
   * Send email using Mailgun
   */
  async sendMail(options: EmailOptions): Promise<void> {
    try {
      const messageData: any = {
        from: options.from || this.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      // Add optional fields
      if (options.cc) {
        messageData.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
      }
      if (options.bcc) {
        messageData.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
      }
      if (options.replyTo) {
        messageData['h:Reply-To'] = options.replyTo;
      }

      // Add attachments
      if (options.attachments && options.attachments.length > 0) {
        messageData.attachment = options.attachments.map((att) => ({
          filename: att.filename,
          data: att.content,
          contentType: att.contentType,
        }));
      }

      await this.mailgun.messages.create(this.domain, messageData);
      
      console.log(`📧 ✓ Email sent successfully to ${options.to}`);
    } catch (error: any) {
      console.error('📧 ✗ Failed to send email:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send certificate of attendance email with PDF attachment
   * Requirement #30
   */
  async sendCertificateEmail(
    to: string,
    data: {
      attendeeName: string;
      workshopTitle: string;
      pdfBuffer: Buffer;
    }
  ): Promise<void> {
    const subject = `Certificate of Attendance - ${data.workshopTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #2456d3;">Certificate of Attendance</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Dear ${data.attendeeName},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                        Congratulations on successfully completing <strong style="color: #2456d3;">${data.workshopTitle}</strong>!
                      </p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                        Your certificate of attendance is attached to this email. This certificate recognizes your participation and successful completion of the workshop.
                      </p>
                      
                      <p style="margin: 24px 0; padding: 12px; background-color: #eff6ff; border-left: 3px solid #2456d3; border-radius: 4px; font-size: 14px; color: #1e40af;">
                        Your certificate is attached as a PDF document. Keep this certificate for your records.
                      </p>
                      
                      <p style="margin: 24px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        We hope you found the workshop valuable and look forward to seeing you at future events!
                      </p>
                      <p style="margin: 16px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        Best regards,<br>
                        <strong>Another Compile L Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">This is an automated email. Please do not reply.</p>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      attachments: [
        {
          filename: `certificate-${data.workshopTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`,
          content: data.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`📧 ✓ Certificate email sent to ${to}`);
  }

  /**
   * Send vendor QR badges email with PDF attachment
   * For approved vendor applications
   */
  async sendVendorBadgesEmail(
    to: string,
    data: {
      vendorName: string;
      applicationId: string;
      pdfBuffer: Buffer;
    }
  ): Promise<void> {
    const subject = `Your Vendor QR Badges - Application ${data.applicationId}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #2456d3;">Vendor QR Badges</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Dear ${data.vendorName},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                        Your vendor application has been <strong style="color: #166534;">approved</strong>! Attached are your personalized QR code badges for your booth.
                      </p>
                      
                      <div style="margin: 24px 0; padding: 12px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px;">
                        <p style="margin: 0; font-size: 14px; color: #525252;"><strong>Application ID:</strong> ${data.applicationId}</p>
                      </div>
                      
                      <h3 style="margin: 24px 0 12px; font-size: 16px; font-weight: 600; color: #171717;">How to use your QR badges:</h3>
                      <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; line-height: 24px; color: #525252;">
                        <li>Print the attached PDF on standard A4 paper</li>
                        <li>Cut out the individual QR badges</li>
                        <li>Display them prominently at your booth</li>
                        <li>Attendees can scan to get your vendor information</li>
                      </ul>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #eff6ff; border-left: 3px solid #2456d3; border-radius: 4px; font-size: 14px; color: #1e40af;">
                        Tip: Laminate your QR badges for durability and professional appearance.
                      </p>
                      
                      <p style="margin: 24px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        We look forward to seeing your booth at the event!
                      </p>
                      <p style="margin: 16px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        Best regards,<br>
                        <strong>Another Compile L Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">For support, please contact the events team.</p>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      attachments: [
        {
          filename: `vendor-qr-badges-${data.applicationId}.pdf`,
          content: data.pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    console.log(`📧 ✓ Vendor badges email sent to ${to}`);
  }

  /**
   * Send bulk emails (up to 1000 recipients)
   */
  async sendBulkMail(
    recipients: string[],
    subject: string,
    html: string
  ): Promise<void> {
    console.log(`📧 Sending bulk email to ${recipients.length} recipients`);
    if (recipients.length > 1000) {
      throw new Error('Mailgun supports up to 1000 recipients per batch');
    }

    // Save a sample email to logs
    this.saveEmailToLogs('bulk', recipients.join(', '), subject, html);

    await this.sendMail({
      to: recipients,
      subject,
      html,
    });
  }

  /**
   * Verify email address (Mailgun validation API)
   */
  async verifyEmail(email: string): Promise<boolean> {
    try {
      const result = await this.mailgun.validate.get(email);
      return result.result === 'deliverable';
    } catch (error) {
      console.error('Email verification failed:', error);
      return false;
    }
  }



  async sendVendorApplicationStatusEmail(
    to: string,
    data: {
      vendorName: string;
      status: "approved" | "rejected";
      eventName: string;
      applicationId: string;
      rejectionReason?: string;
    }
  ): Promise<void> {
    const isApproved = data.status === "approved";
    const subject = `Vendor Application ${
      isApproved ? "Approved" : "Rejected"
    } - ${data.eventName}`;

    const html = isApproved
      ? this.generateVendorApprovalEmailHTML(data)
      : this.generateVendorRejectionEmailHTML(data);

    this.saveEmailToLogs(
      `vendor-application-${data.status}`,
      to,
      subject,
      html
    );

    await this.sendMail({
      to,
      subject,
      html,
    });

    console.log(`📧 ✓ Vendor ${data.status} email sent to ${to}`);
  }

  /**
   * Generate vendor application approval email HTML
   */
  protected generateVendorApprovalEmailHTML(data: {
    vendorName: string;
    eventName: string;
    applicationId: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #166534;">Application Approved</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Dear ${data.vendorName},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                        Congratulations! Your vendor application for <strong style="color: #2456d3;">${data.eventName}</strong> has been approved.
                      </p>
                      
                      <div style="margin: 24px 0; padding: 12px; background-color: #dcfce7; border-left: 3px solid #166534; border-radius: 4px;">
                        <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Application ID:</strong> ${data.applicationId}</p>
                      </div>
                      
                      <h3 style="margin: 24px 0 12px; font-size: 16px; font-weight: 600; color: #171717;">Next Steps:</h3>
                      <ul style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; line-height: 24px; color: #525252;">
                        <li>You will receive your vendor QR badges in a separate email</li>
                        <li>Print and display the QR codes at your booth</li>
                        <li>Set up your booth according to the event guidelines</li>
                        <li>Arrive early on event day for setup</li>
                      </ul>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #fef9c3; border-left: 3px solid #eab308; border-radius: 4px; font-size: 14px; color: #713f12;">
                        Please review the vendor guidelines and event schedule. Contact the events team if you have any questions.
                      </p>
                      
                      <p style="margin: 24px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        We're excited to have you as part of this event!
                      </p>
                      <p style="margin: 16px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        Best regards,<br>
                        <strong>Another Compile L Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">For support, please contact the events team.</p>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Generate vendor application rejection email HTML
   */
  protected generateVendorRejectionEmailHTML(data: {
    vendorName: string;
    eventName: string;
    applicationId: string;
    rejectionReason?: string;
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Application Status Update</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">Dear ${data.vendorName},</p>
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252;">
                        Thank you for your interest in participating as a vendor for <strong>${data.eventName}</strong>.
                      </p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252;">
                        After careful consideration, we regret to inform you that your vendor application has not been approved at this time.
                      </p>
                      
                      <div style="margin: 24px 0; padding: 12px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px;">
                        <p style="margin: 0 0 4px; font-size: 14px; color: #525252;"><strong>Application ID:</strong> ${data.applicationId}</p>
                        <p style="margin: 0; font-size: 14px; color: #525252;"><strong>Event:</strong> ${data.eventName}</p>
                      </div>
                      
                      ${data.rejectionReason ? `
                      <div style="margin: 24px 0; padding: 12px; background-color: #fef9c3; border-left: 3px solid #eab308; border-radius: 4px;">
                        <p style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #713f12;">Reason for Decision</p>
                        <p style="margin: 0; font-size: 14px; color: #713f12;">${data.rejectionReason}</p>
                      </div>
                      ` : ""}
                      
                      <h3 style="margin: 24px 0 12px; font-size: 16px; font-weight: 600; color: #171717;">Future Opportunities</h3>
                      <p style="margin: 0 0 24px; font-size: 14px; line-height: 22px; color: #525252;">
                        We encourage you to apply for future events. Each application is evaluated independently based on the specific event requirements and available space.
                      </p>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #eff6ff; border-left: 3px solid #2456d3; border-radius: 4px; font-size: 14px; color: #1e40af;">
                        If you have any questions about this decision, please feel free to contact our events team.
                      </p>
                      
                      <p style="margin: 24px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        Thank you for your interest, and we hope to work with you in the future.
                      </p>
                      <p style="margin: 16px 0 0; font-size: 16px; line-height: 24px; color: #525252;">
                        Best regards,<br>
                        <strong>Another Compile L Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">For support, please contact the events team.</p>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Send visitor QR code email (Requirement #51)
   * Used by Events Office to send QR codes to event visitors
   */
  async sendVisitorQREmail(
    to: string,
    data: {
      visitorName: string;
      eventName: string;
      eventDate: Date;
      eventLocation: string;
      qrCodeDataUrl: string;
    }
  ): Promise<void> {
    const eventDateStr = new Date(data.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Your Event QR Code - ${data.eventName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Your Event QR Code</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px; text-align: center;">
                      <p style="margin: 0 0 16px; font-size: 16px; line-height: 24px; color: #525252; text-align: left;">Dear ${data.visitorName},</p>
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252; text-align: left;">
                        Here is your QR code for <strong style="color: #2456d3;">${data.eventName}</strong>. Please present this at the entrance for quick check-in.
                      </p>
                      
                      <!-- QR Code -->
                      <div style="margin: 24px auto; padding: 24px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; display: inline-block;">
                        <img src="${data.qrCodeDataUrl}" alt="Event QR Code" style="width: 200px; height: 200px; display: block;" />
                      </div>
                      
                      <!-- Event Details -->
                      <div style="margin: 24px 0; padding: 16px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; text-align: left;">
                        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #171717;">Event Details</p>
                        <p style="margin: 0 0 8px; font-size: 14px; color: #525252;"><strong>Event:</strong> ${data.eventName}</p>
                        <p style="margin: 0 0 8px; font-size: 14px; color: #525252;"><strong>Date:</strong> ${eventDateStr}</p>
                        <p style="margin: 0; font-size: 14px; color: #525252;"><strong>Location:</strong> ${data.eventLocation}</p>
                      </div>
                      
                      <p style="margin: 24px 0; padding: 12px; background-color: #eff6ff; border-left: 3px solid #2456d3; border-radius: 4px; font-size: 14px; color: #1e40af; text-align: left;">
                        Save or screenshot this QR code for easy access at the event.
                      </p>
                      
                      <p style="margin: 0; font-size: 16px; line-height: 24px; color: #525252; text-align: left;">
                        See you there!<br>
                        <strong>Another Compile L Team</strong>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5; text-align: center;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">This is an automated email from the GUC Event Management System.</p>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    this.saveEmailToLogs('visitor-qr', to, subject, html);

    await this.sendMail({
      to,
      subject,
      html,
    });

    console.log(`📧 ✓ Visitor QR code email sent to ${to}`);
  }

  /**
   * Send visitor QR code copy to vendor (Requirement #51)
   */
  async sendVisitorQRToVendor(
    to: string,
    data: {
      visitorName: string;
      visitorEmail: string;
      eventName: string;
      eventDate: Date;
      qrCodeDataUrl: string;
    }
  ): Promise<void> {
    const eventDateStr = new Date(data.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `Visitor QR Code Sent - ${data.visitorName} for ${data.eventName}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 8px;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 32px 32px 24px; border-bottom: 1px solid #e5e5e5;">
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Visitor QR Code Notification</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 32px; text-align: center;">
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #525252; text-align: left;">
                        A QR code has been sent to the following visitor for your booth/event:
                      </p>
                      
                      <!-- Visitor Details -->
                      <div style="margin: 24px 0; padding: 16px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 6px; text-align: left;">
                        <p style="margin: 0 0 8px; font-size: 14px; color: #525252;"><strong>Visitor Name:</strong> ${data.visitorName}</p>
                        <p style="margin: 0 0 8px; font-size: 14px; color: #525252;"><strong>Visitor Email:</strong> ${data.visitorEmail}</p>
                        <p style="margin: 0; font-size: 14px; color: #525252;"><strong>Event:</strong> ${data.eventName} on ${eventDateStr}</p>
                      </div>
                      
                      <!-- QR Code Copy -->
                      <div style="margin: 24px auto; padding: 24px; background-color: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; display: inline-block;">
                        <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #525252;">Visitor's QR Code (for your records):</p>
                        <img src="${data.qrCodeDataUrl}" alt="Visitor QR Code" style="width: 150px; height: 150px; display: block; margin: 0 auto;" />
                      </div>
                      
                      <p style="margin: 24px 0 0; padding: 12px; background-color: #eff6ff; border-left: 3px solid #2456d3; border-radius: 4px; font-size: 14px; color: #1e40af; text-align: left;">
                        This visitor will present this QR code at the event for verification.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5; text-align: center;">
                      <p style="margin: 0 0 8px; font-size: 13px; color: #a3a3a3;">This is an automated notification from the GUC Event Management System.</p>
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Another Compile L</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    this.saveEmailToLogs('visitor-qr-vendor-copy', to, subject, html);

    await this.sendMail({
      to,
      subject,
      html,
    });

    console.log(`📧 ✓ Visitor QR code copy sent to vendor ${to}`);
  }
  
}

/**
 * Export singleton instance
 */
export const mailService = new MailgunService();
