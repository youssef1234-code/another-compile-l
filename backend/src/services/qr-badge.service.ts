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

    // Generate QR code as data URL with primary blue color
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1D4ED8', // Primary Blue-700 for better contrast
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

    // Get vendor info
    const vendor = await User.findById(vendorId).lean();
    if (!vendor) {
      throw new ServiceError('NOT_FOUND', 'Vendor not found', 404);
    }

    // For BAZAAR type, get event info. For PLATFORM type, use platform info
    let eventName = 'Platform Booth';
    let eventDate = application.startDate || new Date();
    let eventLocation = 'Campus Platform';
    let eventId = 'platform';

    if (application.type === 'BAZAAR' && application.bazaarId) {
      const event = await Event.findById(application.bazaarId).lean();
      if (event) {
        eventName = event.name;
        eventDate = event.startDate;
        eventLocation = event.location || 'TBD';
        eventId = String(event._id);
      }
    } else if (application.type === 'PLATFORM') {
      // For platform applications, use booth info
      eventName = application.boothLabel ? `Platform Booth ${application.boothLabel}` : 'Platform Booth';
      eventLocation = 'GUC Campus Platform';
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
        eventId: eventId,
        eventName: eventName,
        eventDate: eventDate,
        applicationId,
      });

      // Draw badge on page
      this.drawBadgeOnPage(doc, {
        visitorName,
        visitorEmail,
        vendorName: vendor.companyName || `${vendor.firstName} ${vendor.lastName}`,
        eventName: eventName,
        eventDate: eventDate,
        eventLocation: eventLocation,
        qrCodeDataUrl,
        badgeType: application.type === 'BAZAAR' ? 'Bazaar Participant' : 'Platform Booth',
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

    // Primary blue color from the design system
    const primaryBlue = '#2563EB'; // Blue-600
    const primaryBlueDark = '#1D4ED8'; // Blue-700
    const primaryBlueLight = '#DBEAFE'; // Blue-100

    // Badge dimensions (centered on page)
    const badgeWidth = 380;
    const badgeHeight = 550;
    const badgeX = (pageWidth - badgeWidth) / 2;
    const badgeY = (pageHeight - badgeHeight) / 2;

    // Outer border - Primary Blue
    doc.roundedRect(badgeX - 4, badgeY - 4, badgeWidth + 8, badgeHeight + 8, 12)
      .fill(primaryBlue);

    // Badge background with rounded corners
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 10)
      .fill('#FFFFFF');

    // Header - Primary Blue gradient effect (solid for PDF)
    doc.roundedRect(badgeX, badgeY, badgeWidth, 90, 10)
      .fill(primaryBlue);
    // Cover bottom corners to make header connect smoothly
    doc.rect(badgeX, badgeY + 70, badgeWidth, 20)
      .fill(primaryBlue);

    // Event Logo/Title - White on blue
    doc.fillColor('#FFFFFF')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('Another Compile L', badgeX, badgeY + 18, {
        width: badgeWidth,
        align: 'center',
      });

    // Badge type with styled background
    doc.fontSize(11)
      .font('Helvetica-Bold')
      .text(data.badgeType.toUpperCase(), badgeX, badgeY + 55, {
        width: badgeWidth,
        align: 'center',
      });

    // Decorative line under header
    doc.rect(badgeX + 40, badgeY + 95, badgeWidth - 80, 3)
      .fill(primaryBlueLight);

    // QR Code section with border
    const qrSize = 180;
    const qrX = badgeX + (badgeWidth - qrSize) / 2;
    const qrY = badgeY + 115;

    // QR code background/border
    doc.roundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 8)
      .fill(primaryBlueLight);
    doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 6)
      .fill('#FFFFFF');

    // Add QR code image
    const base64Data = data.qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    doc.image(Buffer.from(base64Data, 'base64'), qrX, qrY, {
      width: qrSize,
      height: qrSize,
    });

    // Visitor name section
    const infoY = qrY + qrSize + 30;
    
    // Name label
    doc.fillColor(primaryBlue)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('ATTENDEE', badgeX + 20, infoY, {
        width: badgeWidth - 40,
        align: 'center',
      });

    // Visitor name
    doc.fillColor('#1F2937')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text(data.visitorName, badgeX + 20, infoY + 15, {
        width: badgeWidth - 40,
        align: 'center',
      });

    // Divider line
    doc.rect(badgeX + 60, infoY + 50, badgeWidth - 120, 1)
      .fill('#E5E7EB');

    // Vendor Info
    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(primaryBlue)
      .text('VENDOR', badgeX + 20, infoY + 65, {
        width: badgeWidth - 40,
        align: 'center',
      });

    doc.fontSize(14)
      .font('Helvetica')
      .fillColor('#374151')
      .text(data.vendorName, badgeX + 20, infoY + 80, {
        width: badgeWidth - 40,
        align: 'center',
      });

    // Event Info box
    const eventBoxY = infoY + 115;
    doc.roundedRect(badgeX + 30, eventBoxY, badgeWidth - 60, 55, 6)
      .fill(primaryBlueLight);

    doc.fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(primaryBlueDark)
      .text(data.eventName, badgeX + 35, eventBoxY + 10, {
        width: badgeWidth - 70,
        align: 'center',
      });

    const dateStr = new Date(data.eventDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    doc.fontSize(11)
      .font('Helvetica')
      .fillColor('#4B5563')
      .text(dateStr, badgeX + 35, eventBoxY + 26, {
        width: badgeWidth - 70,
        align: 'center',
      });

    if (data.eventLocation) {
      doc.fontSize(9)
        .text(data.eventLocation, badgeX + 35, eventBoxY + 40, {
          width: badgeWidth - 70,
          align: 'center',
        });
    }

    // Footer
    doc.fontSize(9)
      .fillColor('#9CA3AF')
      .font('Helvetica')
      .text('Scan QR code for verification', badgeX + 20, badgeY + badgeHeight - 35, {
        width: badgeWidth - 40,
        align: 'center',
      });

    // Small decorative dots at bottom
    const dotY = badgeY + badgeHeight - 15;
    doc.circle(badgeX + badgeWidth/2 - 15, dotY, 3).fill(primaryBlue);
    doc.circle(badgeX + badgeWidth/2, dotY, 3).fill(primaryBlue);
    doc.circle(badgeX + badgeWidth/2 + 15, dotY, 3).fill(primaryBlue);
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
   * Force send QR codes to ALL confirmed registrations for an event
   * Requirement #51: Events Office can force send QR codes to all participants
   * Generates QR codes if not already generated, and sends emails regardless of previous send status
   */
  async forceSendAllQRsForEvent(eventId: string): Promise<{ sent: number; failed: number }> {
    const registrations = await EventRegistration.find({
      event: eventId,
      status: 'CONFIRMED',
    }).populate('event').populate('user');

    const { mailService } = await import('./mail.service.js');
    
    let sent = 0;
    let failed = 0;

    for (const registration of registrations) {
      try {
        const reg: any = registration;
        const event = reg.event;
        const user = reg.user;

        if (!user || !user.email) {
          failed++;
          continue;
        }

        // Generate QR if not already generated
        let qrCode = reg.qrCode;
        if (!qrCode) {
          qrCode = await this.generateAndSaveVisitorQR(String(registration._id));
        }

        // Send email (force send regardless of previous send status)
        await mailService.sendVisitorQREmail(user.email, {
          visitorName: `${user.firstName} ${user.lastName}`,
          eventName: event.name,
          eventDate: event.startDate,
          eventLocation: event.location,
          qrCodeDataUrl: qrCode,
        });

        // Update sent timestamp
        await EventRegistration.findByIdAndUpdate(registration._id, {
          qrCodeSentAt: new Date(),
        });

        sent++;
        console.log(`📧 ✓ Force sent QR to ${user.email}`);
      } catch (error) {
        console.error(`📧 ✗ Failed to send QR to registration ${registration._id}:`, error);
        failed++;
      }
    }

    console.log(`📧 Force sent ${sent} QR codes for event ${eventId}, ${failed} failed`);
    return { sent, failed };
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

  /**
   * Force send QR codes to ALL visitors of a vendor application
   * Sends to each visitor AND sends a summary to the vendor
   * Requirement: Vendor receives QR code for all registered visitors coming to bazaar/booth
   */
  async forceSendAllVendorVisitorQRs(applicationId: string): Promise<{ sent: number; failed: number }> {
    const application: any = await VendorApplication.findById(applicationId)
      .populate('bazaarId')
      .lean();

    if (!application) {
      throw new ServiceError('NOT_FOUND', 'Application not found', 404);
    }

    const names = application.names || [];
    const emails = application.emails || [];

    // Generate QR codes if not already generated
    let qrCodes = application.qrCodes || [];
    if (qrCodes.length === 0 || qrCodes.length < names.length) {
      qrCodes = await this.generateAndSaveVendorVisitorQRs(applicationId);
    }

    const vendor = await User.findById(application.createdBy).lean();
    const event = application.bazaarId;
    const { mailService } = await import('./mail.service.js');

    let sent = 0;
    let failed = 0;
    const qrCodesSentAt = application.qrCodesSentAt || [];

    // Send QR code to each visitor
    for (let i = 0; i < names.length; i++) {
      const visitorName = names[i];
      const visitorEmail = emails[i];
      const qrCode = qrCodes[i];

      if (!visitorEmail || !qrCode) {
        failed++;
        continue;
      }

      try {
        // Send to visitor
        await mailService.sendVisitorQREmail(visitorEmail, {
          visitorName,
          eventName: event?.name || application.bazaarName || 'Event',
          eventDate: event?.startDate || application.startDate,
          eventLocation: event?.location || 'TBD',
          qrCodeDataUrl: qrCode,
        });

        // Also send copy to vendor for each visitor
        if (vendor?.email) {
          await mailService.sendVisitorQRToVendor(vendor.email, {
            visitorName,
            visitorEmail,
            eventName: event?.name || application.bazaarName || 'Event',
            eventDate: event?.startDate || application.startDate,
            qrCodeDataUrl: qrCode,
          });
        }

        qrCodesSentAt[i] = new Date();
        sent++;
        console.log(`📧 ✓ Force sent QR to visitor ${visitorEmail}`);
      } catch (error) {
        console.error(`📧 ✗ Failed to send QR to visitor ${visitorEmail}:`, error);
        failed++;
      }
    }

    // Update all sent timestamps
    await VendorApplication.findByIdAndUpdate(applicationId, {
      qrCodesSentAt,
    });

    console.log(`📧 Force sent ${sent} vendor visitor QR codes for application ${applicationId}, ${failed} failed`);
    return { sent, failed };
  }
}

export const qrBadgeService = new QRBadgeService();
