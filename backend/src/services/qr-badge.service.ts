/**
 * QR Badge Service
 * 
 * Generates QR codes and professional event badges for vendors
 * Requirement #66: Vendor receive QR code for all registered visitors
 */

import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { vendorApplicationRepository } from '../repositories/vendor-application.repository';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
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
}

export const qrBadgeService = new QRBadgeService();
