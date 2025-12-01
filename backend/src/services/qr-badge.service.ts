/**
 * QR Badge Service
 * 
 * Generates QR codes and professional event badges for vendors and event visitors
 * Requirement #66: Vendor receive QR code for all registered visitors
 * Requirement #51: Events Office generate QR codes for external visitors to bazaars
 */

import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { vendorApplicationRepository } from '../repositories/vendor-application.repository';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
import { EventRegistration } from '../models/registration.model';
import { VendorApplication } from '../models/vendor-application.model';
import { ServiceError } from '../errors/errors';

export class QRBadgeService {
  /**
   * Generate QR code data URL containing visitor + vendor + event info
   */
  async generateQRCode(data: {
    visitorId: string;
    visitorName: string;
    vendorId: string;
    vendorName: string;
    eventId: string;
    eventName: string;
    eventDate: Date;
    applicationId: string;
  }): Promise<string> {
    const qrData = JSON.stringify({
      visitor: {
        id: data.visitorId,
        name: data.visitorName,
      },
      vendor: {
        id: data.vendorId,
        name: data.vendorName,
      },
      event: {
        id: data.eventId,
        name: data.eventName,
        date: data.eventDate.toISOString(),
      },
      application: data.applicationId,
      generatedAt: new Date().toISOString(),
      type: 'VENDOR_VISITOR_BADGE',
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  }

  /**
   * Generate professional event badge PDF for a single visitor
   */
  async generateVisitorBadge(
    visitorId: string,
    vendorId: string,
    applicationId: string
  ): Promise<Buffer> {
    // Get application details
    const vendorApp: any = await vendorApplicationRepository.findById(applicationId);
    if (!vendorApp) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    // Get visitor, vendor, and event details
    const [visitor, vendor, event] = await Promise.all([
      User.findById(visitorId).lean(),
      User.findById(vendorId).lean(),
      Event.findById(vendorApp.bazaarId).lean(),
    ]);

    if (!visitor || !vendor || !event) {
      throw new ServiceError('NOT_FOUND', 'Required data not found', 404);
    }

    // Generate QR code
    const qrCodeDataUrl = await this.generateQRCode({
      visitorId: String(visitor._id),
      visitorName: `${visitor.firstName} ${visitor.lastName}`,
      vendorId: String(vendor._id),
      vendorName: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
      eventId: String(event._id),
      eventName: event.name,
      eventDate: event.startDate,
      applicationId,
    });

    // Create PDF badge
    return this.createBadgePDF({
      visitorName: `${visitor.firstName} ${visitor.lastName}`,
      visitorEmail: visitor.email,
      vendorName: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
      eventName: event.name,
      eventDate: event.startDate,
      eventLocation: event.location,
      qrCodeDataUrl,
      badgeType: vendorApp.type === 'BAZAAR' ? 'Bazaar Participant' : 'Booth Setup',
    });
  }

  /**
   * Generate badges for all registered visitors of a vendor application
   * Uses the names and emails arrays from the application
   */
  async generateAllBadgesForVendor(
    applicationId: string,
    vendorId: string
  ): Promise<Buffer> {
    const application: any = await vendorApplicationRepository.findById(applicationId);
    
    if (!application) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    // Verify ownership
    if (String(application.createdBy) !== vendorId) {
      throw new ServiceError(
        'FORBIDDEN',
        'You can only generate badges for your own applications',
        403
      );
    }

    // Check if approved
    if (application.status !== 'APPROVED') {
      throw new ServiceError(
        'FORBIDDEN',
        'Badges can only be generated for approved applications',
        403
      );
    }

    // Get visitor information from names and emails arrays (Requirement #62)
    const names = application.names || [];
    const emails = application.emails || [];
    
    if (names.length === 0 || emails.length === 0) {
      throw new ServiceError(
        'BAD_REQUEST',
        'No visitors registered for this application. Please ensure names and emails are provided.',
        400
      );
    }

    const [vendor, event] = await Promise.all([
      User.findById(vendorId).lean(),
      Event.findById(application.bazaarId).lean(),
    ]);

    if (!vendor || !event) {
      throw new ServiceError('NOT_FOUND', 'Required data not found', 404);
    }

    // Create multi-page PDF with all visitor badges
    const doc = new PDFDocument({ size: 'LETTER', margin: 0 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    // Generate badge for each registered visitor
    for (let i = 0; i < names.length; i++) {
      const visitorName = names[i];
      const visitorEmail = emails[i] || 'N/A';

      if (i > 0) doc.addPage();

      // Generate QR code for this visitor
      const qrCodeDataUrl = await this.generateQRCode({
        visitorId: `visitor-${i}`, // Temporary ID since we don't have actual visitor user IDs
        visitorName,
        vendorId: String(vendor._id),
        vendorName: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
        eventId: String(event._id),
        eventName: event.name,
        eventDate: event.startDate,
        applicationId,
      });

      // Draw badge on page
      this.drawBadgeOnPage(doc, {
        visitorName,
        visitorEmail,
        vendorName: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
        eventName: event.name,
        eventDate: event.startDate,
        eventLocation: event.location,
        qrCodeDataUrl,
        badgeType: application.type === 'BAZAAR' ? 'Bazaar Participant' : 'Booth Setup',
      });
    }

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      doc.on('error', reject);
    });
  }

  /**
   * Create a single-page badge PDF
   */
  private createBadgePDF(badgeData: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 0 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      this.drawBadgeOnPage(doc, badgeData);
      doc.end();
    });
  }

  /**
   * Draw badge design on PDF page
   */
  private drawBadgeOnPage(doc: PDFKit.PDFDocument, data: any): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Badge dimensions (centered on page)
    const badgeWidth = 350;
    const badgeHeight = 500;
    const badgeX = (pageWidth - badgeWidth) / 2;
    const badgeY = (pageHeight - badgeHeight) / 2;

    // Background
    doc.rect(badgeX, badgeY, badgeWidth, badgeHeight)
      .fill('#FFFFFF')
      .stroke('#E5E7EB');

    // Header - Brand Color
    doc.rect(badgeX, badgeY, badgeWidth, 80)
      .fill('#4F46E5'); // Indigo

    // Event Logo/Title
    doc.fillColor('#FFFFFF')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('Another Compile L', badgeX, badgeY + 20, {
        width: badgeWidth,
        align: 'center',
      });

    doc.fontSize(12)
      .font('Helvetica')
      .text(data.badgeType, badgeX, badgeY + 50, {
        width: badgeWidth,
        align: 'center',
      });

    // QR Code (centered)
    const qrSize = 200;
    const qrX = badgeX + (badgeWidth - qrSize) / 2;
    const qrY = badgeY + 100;

    // Remove data URL prefix and add image
    const base64Data = data.qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    doc.image(Buffer.from(base64Data, 'base64'), qrX, qrY, {
      width: qrSize,
      height: qrSize,
    });

    // Visitor Info
    doc.fillColor('#000000')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(data.visitorName, badgeX + 20, qrY + qrSize + 20, {
        width: badgeWidth - 40,
        align: 'center',
      });

    // Vendor Info
    doc.fontSize(12)
      .font('Helvetica')
      .fillColor('#6B7280')
      .text(`Vendor: ${data.vendorName}`, badgeX + 20, qrY + qrSize + 50, {
        width: badgeWidth - 40,
        align: 'center',
      });

    // Event Info
    doc.fontSize(10)
      .text(data.eventName, badgeX + 20, qrY + qrSize + 75, {
        width: badgeWidth - 40,
        align: 'center',
      });

    const dateStr = new Date(data.eventDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    doc.text(dateStr, badgeX + 20, qrY + qrSize + 90, {
      width: badgeWidth - 40,
      align: 'center',
    });

    // Footer
    doc.fontSize(8)
      .fillColor('#9CA3AF')
      .text('Scan QR code for verification', badgeX + 20, badgeY + badgeHeight - 30, {
        width: badgeWidth - 40,
        align: 'center',
      });
  }

  /**
   * Send badges via email to vendor (Requirement #66)
   * Implemented with Mailgun integration
   */
  async sendBadgesToVendor(applicationId: string, vendorId: string): Promise<void> {
    const vendor = await User.findById(vendorId).lean();
    if (!vendor || !vendor.email) {
      throw new ServiceError('NOT_FOUND', 'Vendor not found or no email', 404);
    }

    // Generate badges PDF
    const pdfBuffer = await this.generateAllBadgesForVendor(applicationId, vendorId);

    // Import mail service dynamically to avoid circular dependency
    const { mailService } = await import('./mail.service.js');

    // Send email with PDF attachment
    await mailService.sendVendorBadgesEmail(vendor.email, {
      vendorName: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
      applicationId,
      pdfBuffer,
    });
    
    console.log(`📧 ✓ Badges email sent to ${vendor.email}`);
  }

  // ============================================
  // EVENTS OFFICE QR CODE MANAGEMENT (Requirement #51)
  // ============================================

  /**
   * Generate and SAVE QR code for a single event registration (visitor)
   * Called by Events Office when viewing event participants
   */
  async generateAndSaveVisitorQR(registrationId: string): Promise<string> {
    const registration: any = await EventRegistration.findById(registrationId)
      .populate('event')
      .populate('user')
      .lean();

    if (!registration) {
      throw new ServiceError('NOT_FOUND', 'Registration not found', 404);
    }

    const event = registration.event;
    const user = registration.user;

    // Generate QR code data
    const qrData = JSON.stringify({
      type: 'EVENT_VISITOR',
      registrationId,
      visitor: {
        id: String(user._id),
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        gucId: user.studentId || user.gucId || 'N/A',
      },
      event: {
        id: String(event._id),
        name: event.name,
        type: event.type,
        date: event.startDate.toISOString(),
        location: event.location,
      },
      generatedAt: new Date().toISOString(),
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Save QR code to registration
    await EventRegistration.findByIdAndUpdate(registrationId, {
      qrCode: qrCodeDataUrl,
      qrCodeGeneratedAt: new Date(),
    });

    console.log(`🔲 QR code generated and saved for registration ${registrationId}`);
    return qrCodeDataUrl;
  }

  /**
   * Generate QR codes for ALL registrations of an event
   * Only generates for those who don't already have a QR code
   */
  async generateAllVisitorQRsForEvent(eventId: string): Promise<{ generated: number; skipped: number }> {
    const registrations = await EventRegistration.find({
      event: eventId,
      status: { $in: ['CONFIRMED', 'PENDING'] },
    }).populate('event').populate('user');

    let generated = 0;
    let skipped = 0;

    for (const registration of registrations) {
      if (registration.qrCode) {
        skipped++;
        continue;
      }

      await this.generateAndSaveVisitorQR(String(registration._id));
      generated++;
    }

    console.log(`🔲 Generated ${generated} QR codes for event ${eventId}, skipped ${skipped} existing`);
    return { generated, skipped };
  }

  /**
   * Send QR code email to a visitor (and optionally to vendor)
   * Requirement #51: Email sent to visitor AND vendor
   */
  async sendVisitorQREmail(
    registrationId: string,
    vendorEmail?: string
  ): Promise<void> {
    const registration: any = await EventRegistration.findById(registrationId)
      .populate('event')
      .populate('user')
      .lean();

    if (!registration) {
      throw new ServiceError('NOT_FOUND', 'Registration not found', 404);
    }

    // Generate QR if not already generated
    let qrCode = registration.qrCode;
    if (!qrCode) {
      qrCode = await this.generateAndSaveVisitorQR(registrationId);
    }

    const event = registration.event;
    const user = registration.user;

    // Import mail service dynamically
    const { mailService } = await import('./mail.service.js');

    // Send to visitor
    await mailService.sendVisitorQREmail(user.email, {
      visitorName: `${user.firstName} ${user.lastName}`,
      eventName: event.name,
      eventDate: event.startDate,
      eventLocation: event.location,
      qrCodeDataUrl: qrCode,
    });

    // Update sent timestamp
    await EventRegistration.findByIdAndUpdate(registrationId, {
      qrCodeSentAt: new Date(),
    });

    console.log(`📧 ✓ QR code email sent to visitor ${user.email}`);

    // Also send to vendor if provided
    if (vendorEmail) {
      await mailService.sendVisitorQRToVendor(vendorEmail, {
        visitorName: `${user.firstName} ${user.lastName}`,
        visitorEmail: user.email,
        eventName: event.name,
        eventDate: event.startDate,
        qrCodeDataUrl: qrCode,
      });
      console.log(`📧 ✓ QR code copy sent to vendor ${vendorEmail}`);
    }
  }

  /**
   * Generate and save QR codes for vendor application visitors
   * Called by Events Office
   */
  async generateAndSaveVendorVisitorQRs(applicationId: string): Promise<string[]> {
    const application: any = await VendorApplication.findById(applicationId)
      .populate('bazaarId')
      .lean();

    if (!application) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    const vendor = await User.findById(application.createdBy).lean();
    const event = application.bazaarId;

    const names = application.names || [];
    const emails = application.emails || [];
    const qrCodes: string[] = [];

    for (let i = 0; i < names.length; i++) {
      const visitorName = names[i];
      const visitorEmail = emails[i] || 'N/A';

      const qrData = JSON.stringify({
        type: 'VENDOR_VISITOR',
        applicationId,
        visitorIndex: i,
        visitor: {
          name: visitorName,
          email: visitorEmail,
        },
        vendor: {
          id: String(application.createdBy),
          companyName: application.companyName,
          name: vendor ? `${vendor.firstName} ${vendor.lastName}` : 'N/A',
        },
        event: event ? {
          id: String(event._id),
          name: event.name,
          date: event.startDate?.toISOString(),
        } : null,
        generatedAt: new Date().toISOString(),
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      qrCodes.push(qrCodeDataUrl);
    }

    // Save all QR codes to application
    await VendorApplication.findByIdAndUpdate(applicationId, {
      qrCodes,
      qrCodesGeneratedAt: new Date(),
    });

    console.log(`🔲 Generated ${qrCodes.length} QR codes for vendor application ${applicationId}`);
    return qrCodes;
  }

  /**
   * Send QR code email to a specific vendor visitor
   * Also sends copy to vendor
   */
  async sendVendorVisitorQREmail(
    applicationId: string,
    visitorIndex: number
  ): Promise<void> {
    const application: any = await VendorApplication.findById(applicationId)
      .populate('bazaarId')
      .lean();

    if (!application) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    const names = application.names || [];
    const emails = application.emails || [];

    if (visitorIndex < 0 || visitorIndex >= names.length) {
      throw new ServiceError('BAD_REQUEST', 'Invalid visitor index', 400);
    }

    // Generate QR codes if not already generated
    let qrCodes = application.qrCodes || [];
    if (qrCodes.length === 0) {
      qrCodes = await this.generateAndSaveVendorVisitorQRs(applicationId);
    }

    const visitorName = names[visitorIndex];
    const visitorEmail = emails[visitorIndex];
    const qrCode = qrCodes[visitorIndex];

    if (!visitorEmail) {
      throw new ServiceError('BAD_REQUEST', 'Visitor email not available', 400);
    }

    const vendor = await User.findById(application.createdBy).lean();
    const event = application.bazaarId;

    // Import mail service
    const { mailService } = await import('./mail.service.js');

    // Send to visitor
    await mailService.sendVisitorQREmail(visitorEmail, {
      visitorName,
      eventName: event?.name || application.bazaarName || 'Event',
      eventDate: event?.startDate || application.startDate,
      eventLocation: event?.location || 'TBD',
      qrCodeDataUrl: qrCode,
    });

    // Update sent timestamp for this visitor
    const qrCodesSentAt = application.qrCodesSentAt || [];
    qrCodesSentAt[visitorIndex] = new Date();
    await VendorApplication.findByIdAndUpdate(applicationId, {
      qrCodesSentAt,
    });

    console.log(`📧 ✓ QR code email sent to vendor visitor ${visitorEmail}`);

    // Also send copy to vendor
    if (vendor?.email) {
      await mailService.sendVisitorQRToVendor(vendor.email, {
        visitorName,
        visitorEmail,
        eventName: event?.name || application.bazaarName || 'Event',
        eventDate: event?.startDate || application.startDate,
        qrCodeDataUrl: qrCode,
      });
      console.log(`📧 ✓ QR code copy sent to vendor ${vendor.email}`);
    }
  }
}

export const qrBadgeService = new QRBadgeService();
