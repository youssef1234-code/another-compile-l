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

/**
 * Abstract Mail Service Class
 */
export abstract class BaseMailService {
  protected from: string;

  constructor(from?: string) {
    this.from = from || config.emailFrom;
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
    const html = this.generateVerificationEmailHTML(data);
    
    await this.sendMail({
      to: email,
      subject: 'Verify Your Email - Event Manager',
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
    const html = this.generateWelcomeEmailHTML(data);
    
    await this.sendMail({
      to: email,
      subject: 'Welcome to Event Manager!',
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
    const html = this.generatePasswordResetEmailHTML(data);
    
    await this.sendMail({
      to: email,
      subject: 'Reset Your Password - Event Manager',
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
    const html = this.generateEventReminderEmailHTML(data);
    
    await this.sendMail({
      to: email,
      subject: `Reminder: ${data.eventName}`,
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
    const html = this.generatePaymentReceiptEmailHTML(data);
    
    await this.sendMail({
      to: email,
      subject: `Payment Receipt - ${data.eventName}`,
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
                            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 32px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Verify Email</a>
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
                      <p style="margin: 8px 0 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Event Manager</p>
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
                      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #171717;">Welcome to Event Manager</h1>
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
                            <a href="${loginUrl}" style="display: inline-block; padding: 12px 32px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Get Started</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; border-top: 1px solid #e5e5e5;">
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Event Manager</p>
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
                            <a href="${resetUrl}" style="display: inline-block; padding: 12px 32px; background-color: #171717; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Reset Password</a>
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
                      <p style="margin: 0; font-size: 13px; color: #a3a3a3;">&copy; ${new Date().getFullYear()} Event Manager</p>
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">📅 Event Reminder</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}!</h2>
            <p style="font-size: 16px; color: #4b5563;">This is a friendly reminder about your upcoming event:</p>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 30px 0; border: 2px solid #10b981;">
              <h3 style="color: #10b981; margin-top: 0;">${eventName}</h3>
              <div style="color: #4b5563; font-size: 15px;">
                <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${formattedTime}</p>
                <p style="margin: 10px 0;"><strong>📍 Location:</strong> ${eventLocation}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${eventUrl}" 
                 style="background-color: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                View Event Details
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">Looking forward to seeing you there! 🎉</p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Event Manager. All rights reserved.</p>
          </div>
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
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #059669; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">💳 Payment Receipt</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Hi ${name}!</h2>
            <p style="font-size: 16px; color: #4b5563;">Your payment has been processed successfully. Here are the details:</p>
            
            <div style="background-color: white; padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #e5e7eb;">
              <h3 style="color: #059669; margin-top: 0;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Event:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${eventName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Amount:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right; font-size: 18px; font-weight: 700;">${amount} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Receipt ID:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right; font-family: monospace;">${receiptId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600;">Date:</td>
                  <td style="padding: 10px 0; color: #1f2937; text-align: right;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-weight: 600; border-top: 2px solid #e5e7eb;">Status:</td>
                  <td style="padding: 10px 0; text-align: right; border-top: 2px solid #e5e7eb;">
                    <span style="background-color: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600;">✓ Paid</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #ecfdf5; padding: 20px; border-radius: 6px; border-left: 4px solid #059669; margin-top: 30px;">
              <p style="margin: 0; color: #065f46; font-size: 14px;">
                <strong>✓ Your registration is confirmed!</strong> You'll receive event details and reminders via email.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>Keep this email for your records.</p>
            <p style="margin-top: 10px;">&copy; ${new Date().getFullYear()} Event Manager. All rights reserved.</p>
          </div>
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
      
      console.log(`✓ Email sent successfully to ${options.to}`);
    } catch (error: any) {
      console.error('Failed to send email:', error.message);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk emails (up to 1000 recipients)
   */
  async sendBulkMail(
    recipients: string[],
    subject: string,
    html: string
  ): Promise<void> {
    if (recipients.length > 1000) {
      throw new Error('Mailgun supports up to 1000 recipients per batch');
    }

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
}

/**
 * Export singleton instance
 */
export const mailService = new MailgunService();
