/**
 * Email Utilities
 * 
 * Nodemailer setup and email sending functions
 * 
 * @module utils/email
 */

import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.password,
  },
});

/**
 * Send verification email
 */
export const sendVerificationEmail = async (
  email: string,
  verificationToken: string,
  name: string
): Promise<void> => {
  const verificationUrl = `${config.clientUrl}/verify-email?token=${verificationToken}`;
  
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: 'Verify Your Email - Event Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Event Manager, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `,
  };
  
  await transporter.sendMail(mailOptions);
};

/**
 * Send payment receipt email
 */
export const sendPaymentReceiptEmail = async (
  email: string,
  firstName: string,
  eventName: string,
  amount: number,
  receiptId: string
): Promise<void> => {
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: `Payment Receipt - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Payment Confirmation</h2>
        <p>Dear ${firstName},</p>
        <p>Your payment for <strong>${eventName}</strong> has been processed successfully.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Amount Paid:</strong> ${amount} EGP</p>
          <p><strong>Receipt ID:</strong> ${receiptId}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Thank you for your registration!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };
  
  await transporter.sendMail(mailOptions);
};

/**
 * Send event reminder email
 */
export const sendEventReminderEmail = async (
  email: string,
  firstName: string,
  eventName: string,
  eventDate: Date,
  location: string
): Promise<void> => {
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: `Reminder: ${eventName} is Coming Soon!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Event Reminder</h2>
        <p>Dear ${firstName},</p>
        <p>This is a reminder that you're registered for:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${eventName}</h3>
          <p><strong>Date:</strong> ${eventDate.toLocaleString()}</p>
          <p><strong>Location:</strong> ${location}</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };
  
  await transporter.sendMail(mailOptions);
};

/**
 * Send warning email for deleted comment
 */
export const sendCommentDeletedWarningEmail = async (
  email: string,
  firstName: string,
  eventName: string
): Promise<void> => {
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: 'Warning: Comment Removed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626;">Warning</h2>
        <p>Dear ${firstName},</p>
        <p>Your comment on <strong>${eventName}</strong> has been removed due to inappropriate content.</p>
        <p>Please ensure all future comments comply with our community guidelines.</p>
        <p>Repeated violations may result in account suspension.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };
  
  await transporter.sendMail(mailOptions);
};

/**
 * Send certificate of attendance
 */
export const sendCertificateEmail = async (
  email: string,
  firstName: string,
  lastName: string,
  eventName: string,
  certificateUrl: string
): Promise<void> => {
  const mailOptions = {
    from: config.emailFrom,
    to: email,
    subject: `Certificate of Attendance - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Certificate of Attendance</h2>
        <p>Dear ${firstName} ${lastName},</p>
        <p>Congratulations on completing <strong>${eventName}</strong>!</p>
        <p>Your certificate of attendance is now available.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${certificateUrl}" 
             style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Download Certificate
          </a>
        </div>
        <p>We hope you found the workshop valuable!</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #999; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `,
  };
  
  await transporter.sendMail(mailOptions);
};
