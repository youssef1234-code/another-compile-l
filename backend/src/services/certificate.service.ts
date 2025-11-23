/**
 * Certificate Service
 * 
 * Generates professional certificates of attendance for workshops
 * Requirement #30: Students receive certificates upon workshop completion
 * 
 * Features:
 * - Beautiful PDF certificate with GUC branding
 * - Uses design system colors and fonts
 * - Includes workshop details, attendee name, dates
 * - Professional layout with decorative elements
 * - Email delivery to attendee
 * 
 * @module services/certificate.service
 */

import PDFDocument from 'pdfkit';
import { ServiceError } from '../errors/errors';
import { User } from '../models/user.model';
import { EventRegistration } from '../models/registration.model';
import { registrationService } from './registration.service';
import path from 'path';
import fs from 'fs';

class CertificateService {
  /**
   * Generate a professional certificate of attendance PDF
   * 
   * Design follows GUC Event Manager design system:
   * - Primary Color: #6366f1 (Indigo-500) oklch(0.50 0.20 264)
   * - Font: Inter
   * - Professional layout with decorative border
   * - Logo placement
   * - Formal typography
   */
  async generateCertificate(
    registrationId: string,
    userId: string
  ): Promise<Buffer> {
    // Fetch registration with populated data
    const registration: any = await EventRegistration.findById(registrationId)
      .populate('event')
      .populate('user')
      .lean();

    if (!registration) {
      throw new ServiceError('NOT_FOUND', 'Registration not found', 404);
    }

    // Verify ownership
    if (String(registration.user._id) !== userId) {
      throw new ServiceError(
        'FORBIDDEN',
        'You can only generate certificates for your own registrations',
        403
      );
    }

    // Verify registration is confirmed and attended
    if (registration.status !== 'CONFIRMED') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Only confirmed registrations can receive certificates',
        400
      );
    }

    if (!registration.attended) {
      throw new ServiceError(
        'BAD_REQUEST',
        'Certificate can only be issued for attended events',
        400
      );
    }

    const event = registration.event;
    const user = registration.user;

    // Only workshops get certificates
    if (event.type !== 'WORKSHOP') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Certificates are only available for workshops',
        400
      );
    }

    // Verify event has ended
    const now = new Date();
    const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    if (eventEndDate > now) {
      throw new ServiceError(
        'BAD_REQUEST',
        'Certificates can only be generated after the workshop has ended',
        400
      );
    }

    // Create PDF certificate
    const pdfBuffer = await this.createCertificatePDF({
      attendeeName: `${user.firstName} ${user.lastName}`,
      attendeeEmail: user.email,
      attendeeGucId: user.studentId || user.gucId || 'N/A',
      workshopTitle: event.name,
      workshopDescription: event.description,
      professorName: event.professor || 'Event Team',
      startDate: event.startDate,
      endDate: event.endDate,
      issueDate: new Date(),
      registrationId,
    });

    // Mark certificate as issued
    await registrationService.issueCertificate(registrationId);

    return pdfBuffer;
  }

  /**
   * Create the actual PDF certificate with professional design
   */
  private async createCertificatePDF(data: {
    attendeeName: string;
    attendeeEmail: string;
    attendeeGucId: string;
    workshopTitle: string;
    workshopDescription?: string;
    professorName: string;
    startDate: Date;
    endDate?: Date;
    issueDate: Date;
    registrationId: string;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // A4 landscape for certificate (842 x 595 points)
        const doc = new PDFDocument({
          size: [842, 595],
          margins: { top: 40, bottom: 40, left: 60, right: 60 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Design System Colors (converted from OKLCH to RGB approximations)
        const colors = {
          primary: '#6366f1',       // Indigo-500
          primaryDark: '#4f46e5',   // Indigo-600
          primaryLight: '#a5b4fc',  // Indigo-300
          textDark: '#1e293b',      // Slate-800
          textMuted: '#64748b',     // Slate-500
          border: '#e2e8f0',        // Slate-200
          accent: '#f1f5f9',        // Slate-50
          gold: '#f59e0b',          // Amber-500
        };

        const centerX = 842 / 2;
        const width = 842;
        const height = 595;

        // ============= DECORATIVE BORDER =============
        // Outer border - primary color
        doc
          .strokeColor(colors.primary)
          .lineWidth(4)
          .rect(30, 30, width - 60, height - 60)
          .stroke();

        // Inner border - lighter
        doc
          .strokeColor(colors.primaryLight)
          .lineWidth(1)
          .rect(40, 40, width - 80, height - 80)
          .stroke();

        // Corner decorations (small squares)
        const cornerSize = 12;
        const corners = [
          { x: 45, y: 45 },
          { x: width - 45 - cornerSize, y: 45 },
          { x: 45, y: height - 45 - cornerSize },
          { x: width - 45 - cornerSize, y: height - 45 - cornerSize },
        ];
        
        corners.forEach(corner => {
          doc
            .fillColor(colors.primary)
            .rect(corner.x, corner.y, cornerSize, cornerSize)
            .fill();
        });

        // ============= BACKGROUND =============
        // Fill entire page with white to ensure logo visibility
        doc
          .rect(0, 0, width, height)
          .fill('#FFFFFF');

        // ============= LOGO AREA =============
        // Use logo from static folder
        const logoPath = path.join(__dirname, '../../static/guc_logo.png');
        const logoExists = fs.existsSync(logoPath);

        if (logoExists) {
          try {
            // Add white background circle behind logo for better visibility
            doc
              .circle(centerX, 110, 50)
              .fill('#FFFFFF')
              .stroke();
            
            doc.image(logoPath, centerX - 40, 70, { width: 80, height: 80 });
          } catch (error) {
            // Fallback if logo can't be loaded
            this.drawLogoPlaceholder(doc, centerX, 110, colors.primary);
          }
        } else {
          this.drawLogoPlaceholder(doc, centerX, 110, colors.primary);
        }

        // ============= HEADER =============
        let yPos = 170;

        doc
          .fontSize(14)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text('GERMAN UNIVERSITY IN CAIRO', 60, yPos, {
            width: width - 120,
            align: 'center',
          });

        yPos += 25;

        doc
          .fontSize(32)
          .font('Helvetica-Bold')
          .fillColor(colors.primary)
          .text('CERTIFICATE OF ATTENDANCE', 60, yPos, {
            width: width - 120,
            align: 'center',
            characterSpacing: 2,
          });

        yPos += 50;

        // ============= DECORATIVE LINE =============
        doc
          .strokeColor(colors.gold)
          .lineWidth(2)
          .moveTo(centerX - 100, yPos)
          .lineTo(centerX + 100, yPos)
          .stroke();

        yPos += 30;

        // ============= MAIN CONTENT =============
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor(colors.textDark)
          .text('This is to certify that', 60, yPos, {
            width: width - 120,
            align: 'center',
          });

        yPos += 30;

        // Attendee name - prominent
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .fillColor(colors.primaryDark)
          .text(data.attendeeName.toUpperCase(), 60, yPos, {
            width: width - 120,
            align: 'center',
          });

        yPos += 35;

        // GUC ID
        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text(`GUC ID: ${data.attendeeGucId}`, 60, yPos, {
            width: width - 120,
            align: 'center',
          });

        yPos += 30;

        // Participation text
        doc
          .fontSize(12)
          .fillColor(colors.textDark)
          .text('has successfully attended and completed', 60, yPos, {
            width: width - 120,
            align: 'center',
          });

        yPos += 30;

        // Workshop title - prominent
        doc
          .fontSize(18)
          .font('Helvetica-Bold')
          .fillColor(colors.primary)
          .text(data.workshopTitle, 100, yPos, {
            width: width - 200,
            align: 'center',
          });

        yPos += 35;

        // Workshop details
        const startDateStr = new Date(data.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const endDateStr = data.endDate
          ? new Date(data.endDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : startDateStr;

        const dateRange = data.endDate && data.startDate !== data.endDate
          ? `${startDateStr} - ${endDateStr}`
          : startDateStr;

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text(dateRange, 60, yPos, {
            width: width - 120,
            align: 'center',
          });

        yPos += 25;

        doc
          .fontSize(11)
          .text(`Instructor: ${data.professorName}`, 60, yPos, {
            width: width - 120,
            align: 'center',
          });

        // ============= FOOTER SECTION =============
        const footerY = height - 120;

        // Issue date
        const issueDateStr = data.issueDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc
          .fontSize(10)
          .fillColor(colors.textMuted)
          .text(`Issued on: ${issueDateStr}`, 60, footerY, {
            width: width - 120,
            align: 'center',
          });

        // Certificate ID (for verification)
        doc
          .fontSize(8)
          .fillColor(colors.textMuted)
          .text(`Certificate ID: ${data.registrationId.substring(0, 12).toUpperCase()}`, 60, footerY + 15, {
            width: width - 120,
            align: 'center',
          });

        // Signature line placeholder
        const sigY = footerY - 40;
        const sigWidth = 150;

        doc
          .strokeColor(colors.textMuted)
          .lineWidth(1)
          .moveTo(centerX - sigWidth / 2, sigY)
          .lineTo(centerX + sigWidth / 2, sigY)
          .stroke();

        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text('Events Office', centerX - sigWidth / 2, sigY + 5, {
            width: sigWidth,
            align: 'center',
          });

        // Watermark/seal effect
        doc
          .save()
          .opacity(0.05)
          .fontSize(120)
          .font('Helvetica-Bold')
          .fillColor(colors.primary)
          .text('GUC', 0, height / 2 - 60, {
            width: width,
            align: 'center',
          })
          .restore();

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw a simple logo placeholder if logo file doesn't exist
   */
  private drawLogoPlaceholder(
    doc: PDFKit.PDFDocument,
    centerX: number,
    centerY: number,
    color: string
  ): void {
    // Draw a simple circular placeholder with "GUC"
    doc
      .circle(centerX, centerY, 35)
      .strokeColor(color)
      .lineWidth(3)
      .stroke();

    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text('GUC', centerX - 20, centerY - 8, {
        width: 40,
        align: 'center',
      });
  }

  /**
   * Send certificate via email
   * Implemented with Mailgun integration
   */
  async sendCertificateEmail(
    userId: string,
    registrationId: string
  ): Promise<void> {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new ServiceError('NOT_FOUND', 'User not found', 404);
    }

    // Generate certificate PDF
    const pdfBuffer = await this.generateCertificate(registrationId, userId);

    // Get registration to extract workshop title
    const registration: any = await EventRegistration.findById(registrationId)
      .populate('event')
      .lean();

    if (!registration?.event) {
      throw new ServiceError('NOT_FOUND', 'Event not found', 404);
    }

    // Import mail service dynamically to avoid circular dependency
    const { mailService } = await import('./mail.service.js');

    // Send email with PDF attachment
    await mailService.sendCertificateEmail(user.email, {
      attendeeName: `${user.firstName} ${user.lastName}`,
      workshopTitle: registration.event.name,
      pdfBuffer,
    });

    console.log(`📧 ✓ Certificate email sent to ${user.email}`);
  }
}

export const certificateService = new CertificateService();
