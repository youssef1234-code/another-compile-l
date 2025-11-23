/**
 * Export Service
 * 
 * Handles Excel export functionality for registrations
 * Requirement #49: Export registered users to .xlsx
 */

import ExcelJS from 'exceljs';
import { registrationRepository } from '../repositories/registration.repository';
import { Event } from '../models/event.model';
import { ServiceError } from '../errors/errors';

export class ExportService {
  /**
   * Export event registrations to Excel file
   * Requirement #49: Export names of those registered for any event (except conferences) in .xlsx
   */
  async exportRegistrationsToExcel(
    eventId: string,
    registrationIds?: string[]
  ): Promise<ExcelJS.Buffer> {
    // Get event details
    const event = await Event.findById(eventId).lean();
    if (!event) {
      throw new ServiceError('NOT_FOUND', 'Event not found', 404);
    }

    // Block export for conferences (as per requirement)
    if (event.type === 'CONFERENCE') {
      throw new ServiceError(
        'FORBIDDEN',
        'Exporting registrations is not allowed for conferences',
        403
      );
    }

    // Get registrations - either specific IDs or all for the event
    let registrations;
    if (registrationIds && registrationIds.length > 0) {
      // Bulk export of selected registrations
      registrations = await registrationRepository.findAll(
        {
          _id: { $in: registrationIds },
          event: eventId,
          isActive: true,
        } as any,
        {}
      );
    } else {
      // Export all registrations for the event
      const result = await registrationRepository.getByEventId(eventId, {
        page: 1,
        limit: 10000, // Large limit to get all
      });
      registrations = result.registrations;
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Another Compile L';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Registrations');

    // Define columns
    worksheet.columns = [
      { header: 'Event Name', key: 'eventName', width: 30 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'GUC ID', key: 'gucId', width: 15 },
      { header: 'Registration Date', key: 'registrationDate', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Payment Amount', key: 'paymentAmount', width: 15 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // Indigo background
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 25;

    // Add data rows
    registrations.forEach((registration: any) => {
      const user = registration.user;
      worksheet.addRow({
        eventName: event.name,
        firstName: user?.firstName || 'N/A',
        lastName: user?.lastName || 'N/A',
        email: user?.email || 'N/A',
        gucId: user?.studentId || user?.gucId || 'N/A',
        registrationDate: registration.registeredAt
          ? new Date(registration.registeredAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : 'N/A',
        status: registration.status || 'PENDING',
        paymentStatus: registration.paymentStatus || 'PENDING',
        paymentAmount: registration.paymentAmount
          ? `${registration.paymentAmount} EGP`
          : '0 EGP',
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: 'I1',
    };

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Add borders to all cells
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
        };

        // Alternate row colors
        if (rowNumber > 1 && rowNumber % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
      });
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

export const exportService = new ExportService();
