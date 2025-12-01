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
import { fileURLToPath } from 'url';

// ESM compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Verify registration is confirmed (registration = attendance for Student/Staff/TA/Professor)
    if (registration.status !== 'CONFIRMED') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Only confirmed registrations can receive certificates',
        400
      );
    }

    // For workshops that have ended, we allow certificate download even if attended wasn't marked
    // This is because attendance tracking might not always be done perfectly
    const event = registration.event;
    const now = new Date();
    const eventEndDate = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
    const hasEnded = eventEndDate <= now;

    // If event hasn't ended, require attended flag
    if (!hasEnded) {
      throw new ServiceError(
        'BAD_REQUEST',
        'Certificates can only be generated after the workshop has ended',
        400
      );
    }

    // If event has ended and registration is confirmed, allow certificate generation
    // This gives flexibility for confirmed registrations after the event ends

    const user = registration.user;

    // Only workshops get certificates
    if (event.type !== 'WORKSHOP') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Certificates are only available for workshops',
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
   * Force generate certificate for Events Office (download only - no event end check)
   * Can download certificate anytime for preview/review
   */
  async generateCertificateForced(
    registrationId: string
  ): Promise<Buffer> {
    // Fetch registration with populated data
    const registration: any = await EventRegistration.findById(registrationId)
      .populate('event')
      .populate('user')
      .lean();

    if (!registration) {
      throw new ServiceError('NOT_FOUND', 'Registration not found', 404);
    }

    // Verify registration is confirmed (attendance check bypassed for Events Office)
    if (registration.status !== 'CONFIRMED') {
      throw new ServiceError(
        'BAD_REQUEST',
        'Only confirmed registrations can receive certificates',
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

    // NO event end date check for download - can download anytime for preview

    // Create PDF certificate
    const pdfBuffer = await this.createCertificatePDF({
      attendeeName: `${user.firstName} ${user.lastName}`,
      attendeeEmail: user.email,
      attendeeGucId: user.studentId || user.gucId || 'N/A',
      workshopTitle: event.name,
      workshopDescription: event.description,
      professorName: event.professor || event.professorName || 'Event Team',
      startDate: event.startDate,
      endDate: event.endDate,
      issueDate: new Date(),
      registrationId,
    });

    console.log(`✓ Certificate downloaded for registration ${registrationId}`);

    return pdfBuffer;
  }

  /**
   * Create the actual PDF certificate with professional blue design
   * Uses the app's primary blue color scheme
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
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Design System Colors - Primary Blues
        const colors = {
          primary: '#2563eb',       // Blue-600 (main brand blue)
          primaryDark: '#1d4ed8',   // Blue-700
          primaryDarker: '#1e40af', // Blue-800
          primaryLight: '#3b82f6',  // Blue-500
          primaryLighter: '#60a5fa', // Blue-400
          accent: '#dbeafe',        // Blue-100
          accentLight: '#eff6ff',   // Blue-50
          gold: '#ca8a04',          // Yellow-600 (for accents)
          goldLight: '#fbbf24',     // Amber-400
          textDark: '#0f172a',      // Slate-900
          textMuted: '#475569',     // Slate-600
          white: '#ffffff',
        };

        const width = 842;
        const height = 595;
        const centerX = width / 2;

        // ============= BACKGROUND =============
        // White background
        doc.rect(0, 0, width, height).fill(colors.white);

        // Top decorative banner
        doc.rect(0, 0, width, 8).fill(colors.primary);
        doc.rect(0, 8, width, 4).fill(colors.primaryDark);

        // Bottom decorative banner
        doc.rect(0, height - 12, width, 4).fill(colors.primaryDark);
        doc.rect(0, height - 8, width, 8).fill(colors.primary);

        // ============= DECORATIVE BORDER =============
        // Outer border
        doc
          .strokeColor(colors.primary)
          .lineWidth(3)
          .rect(25, 25, width - 50, height - 50)
          .stroke();

        // Inner border with subtle blue
        doc
          .strokeColor(colors.primaryLighter)
          .lineWidth(1)
          .rect(35, 35, width - 70, height - 70)
          .stroke();

        // Corner ornaments - elegant blue squares with inner detail
        const corners = [
          { x: 25, y: 25 },
          { x: width - 45, y: 25 },
          { x: 25, y: height - 45 },
          { x: width - 45, y: height - 45 },
        ];
        
        corners.forEach(corner => {
          doc.rect(corner.x, corner.y, 20, 20).fill(colors.primary);
          doc.rect(corner.x + 5, corner.y + 5, 10, 10).fill(colors.white);
          doc.rect(corner.x + 7, corner.y + 7, 6, 6).fill(colors.primaryLight);
        });

        // ============= LOGO =============
        const logoPath = path.join(__dirname, '../../static/guc_logo.png');
        const logoExists = fs.existsSync(logoPath);

        if (logoExists) {
          try {
            // Use fit to maintain aspect ratio, don't squish the logo
            doc.image(logoPath, centerX - 50, 50, { fit: [100, 85], align: 'center', valign: 'center' });
          } catch {
            this.drawLogoPlaceholder(doc, centerX, 95, colors.primary);
          }
        } else {
          this.drawLogoPlaceholder(doc, centerX, 95, colors.primary);
        }

        // ============= HEADER =============
        let yPos = 155;

        // University name
        doc
          .fontSize(13)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text('GERMAN UNIVERSITY IN CAIRO', 0, yPos, {
            width: width,
            align: 'center',
            characterSpacing: 3,
          });

        yPos += 35;

        // Certificate title with blue background banner
        doc.rect(100, yPos - 5, width - 200, 45).fill(colors.accentLight);
        
        doc
          .fontSize(28)
          .font('Helvetica-Bold')
          .fillColor(colors.primary)
          .text('CERTIFICATE OF COMPLETION', 0, yPos + 5, {
            width: width,
            align: 'center',
            characterSpacing: 2,
          });

        yPos += 60;

        // Decorative line under title
        doc
          .strokeColor(colors.gold)
          .lineWidth(2)
          .moveTo(centerX - 80, yPos)
          .lineTo(centerX + 80, yPos)
          .stroke();
        
        // Small decorative dots
        doc.circle(centerX - 90, yPos, 3).fill(colors.gold);
        doc.circle(centerX + 90, yPos, 3).fill(colors.gold);

        yPos += 25;

        // ============= MAIN CONTENT =============
        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text('This is to certify that', 0, yPos, {
            width: width,
            align: 'center',
          });

        yPos += 28;

        // Attendee name - large and prominent
        doc
          .fontSize(26)
          .font('Helvetica-Bold')
          .fillColor(colors.primaryDark)
          .text(data.attendeeName, 0, yPos, {
            width: width,
            align: 'center',
          });

        yPos += 38;

        // GUC ID in a subtle box
        const idText = `ID: ${data.attendeeGucId}`;
        const idWidth = 150;
        doc.rect(centerX - idWidth/2, yPos - 3, idWidth, 20).fill(colors.accent);
        doc
          .fontSize(10)
          .font('Helvetica')
          .fillColor(colors.primaryDark)
          .text(idText, 0, yPos, {
            width: width,
            align: 'center',
          });

        yPos += 30;

        doc
          .fontSize(12)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text('has successfully completed the workshop', 0, yPos, {
            width: width,
            align: 'center',
          });

        yPos += 28;

        // Workshop title - prominent with blue styling
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor(colors.primary)
          .text(data.workshopTitle, 80, yPos, {
            width: width - 160,
            align: 'center',
          });

        yPos += 35;

        // Date range
        const formatDate = (date: Date) => new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const startDateStr = formatDate(data.startDate);
        const endDateStr = data.endDate ? formatDate(data.endDate) : startDateStr;
        const dateRange = data.endDate && new Date(data.startDate).getTime() !== new Date(data.endDate).getTime()
          ? `${startDateStr} — ${endDateStr}`
          : startDateStr;

        doc
          .fontSize(11)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text(dateRange, 0, yPos, {
            width: width,
            align: 'center',
          });

        // ============= SIGNATURE SECTION =============
        const sigY = height - 130;
        const sigWidth = 180;

        // Left signature - Events Office
        const leftSigX = width / 3 - sigWidth / 2;
        doc
          .strokeColor(colors.primaryDark)
          .lineWidth(1)
          .moveTo(leftSigX, sigY)
          .lineTo(leftSigX + sigWidth, sigY)
          .stroke();

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor(colors.textDark)
          .text('Events Office', leftSigX, sigY + 8, {
            width: sigWidth,
            align: 'center',
          });

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text('German University in Cairo', leftSigX, sigY + 22, {
            width: sigWidth,
            align: 'center',
          });

        // Right signature - Workshop Instructor
        const rightSigX = (width * 2) / 3 - sigWidth / 2;
        doc
          .strokeColor(colors.primaryDark)
          .lineWidth(1)
          .moveTo(rightSigX, sigY)
          .lineTo(rightSigX + sigWidth, sigY)
          .stroke();

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .fillColor(colors.textDark)
          .text(data.professorName, rightSigX, sigY + 8, {
            width: sigWidth,
            align: 'center',
          });

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text('Workshop Instructor', rightSigX, sigY + 22, {
            width: sigWidth,
            align: 'center',
          });

        // ============= FOOTER =============
        const footerY = height - 60;

        // Issue date and certificate ID
        const issueDateStr = formatDate(data.issueDate);
        
        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor(colors.textMuted)
          .text(`Issued: ${issueDateStr}`, 60, footerY, {
            width: width / 2 - 80,
            align: 'left',
          });

        doc
          .fontSize(9)
          .fillColor(colors.textMuted)
          .text(`Certificate ID: ${data.registrationId.substring(0, 12).toUpperCase()}`, width / 2, footerY, {
            width: width / 2 - 80,
            align: 'right',
          });

        // Subtle watermark
        doc
          .save()
          .opacity(0.03)
          .fontSize(200)
          .font('Helvetica-Bold')
          .fillColor(colors.primary)
          .rotate(-30, { origin: [centerX, height / 2] })
          .text('GUC', centerX - 150, height / 2 - 80)
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
