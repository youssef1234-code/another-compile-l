/**
 * Export Event Calendar to PDF and Excel
 * Generates PDF document (screenshot or table) and Excel spreadsheet of the calendar view
 */

import jsPDF from 'jspdf';
import type { Event } from '@event-manager/shared';
import { format } from 'date-fns';
import { domToPng } from 'modern-screenshot';
import * as XLSX from 'xlsx';

interface ExportCalendarScreenshotOptions {
  element: HTMLElement;
  month: Date;
  title?: string;
}

interface ExportCalendarExcelOptions {
  events: Event[];
  month: Date;
  title?: string;
}

/**
 * Export calendar as a screenshot to PDF
 * Uses modern-screenshot which supports modern CSS including oklch/oklab colors
 * This preserves the exact visual layout of the calendar as seen in the app
 */
export async function exportCalendarScreenshot({ element, month, title }: ExportCalendarScreenshotOptions) {
  // Capture the calendar element as PNG using modern-screenshot
  // It properly handles modern CSS color functions like oklch and oklab
  const dataUrl = await domToPng(element, {
    backgroundColor: '#ffffff',
    scale: 2, // Higher quality
  });
  
  // Create an image to get dimensions
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });
  
  // Create PDF in landscape mode
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Calculate dimensions to fit the image
  const imgWidth = img.width;
  const imgHeight = img.height;
  const ratio = Math.min((pageWidth - 20) / imgWidth, (pageHeight - 40) / imgHeight);
  
  const scaledWidth = imgWidth * ratio;
  const scaledHeight = imgHeight * ratio;
  
  // Center the image
  const x = (pageWidth - scaledWidth) / 2;
  const y = 25; // Leave space for title
  
  // Add title
  const monthYear = format(month, 'MMMM yyyy');
  const pdfTitle = title || `Event Calendar - ${monthYear}`;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfTitle, pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported on ${format(new Date(), 'PPP')}`, pageWidth / 2, 18, { align: 'center' });
  
  // Add the screenshot
  doc.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight);
  
  // Add footer
  doc.setFontSize(8);
  doc.text(
    `Page 1 of 1`,
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  );
  
  // Save the PDF
  const filename = `event-calendar-${format(month, 'yyyy-MM')}.pdf`;
  doc.save(filename);
}

/**
 * Export calendar events to Excel
 * Provides detailed spreadsheet with all event information
 */
export function exportCalendarToExcel({ events, month, title }: ExportCalendarExcelOptions) {
  // Prepare data for Excel
  const data = events.map(event => ({
    'Date': event.startDate ? format(new Date(event.startDate), 'EEE, MMM d, yyyy') : 
            event.date ? format(new Date(event.date), 'EEE, MMM d, yyyy') : '-',
    'Event Name': event.name,
    'Type': (event.type || 'OTHER').replace(/_/g, ' '),
    'Start Time': event.startDate ? format(new Date(event.startDate), 'HH:mm') : 
                  event.date ? format(new Date(event.date), 'HH:mm') : '-',
    'End Time': event.endDate ? format(new Date(event.endDate), 'HH:mm') : '-',
    'Location': event.locationDetails || event.location || '-',
    'Capacity': event.capacity || '-',
    'Registered': event.registeredCount || 0,
    'Price': event.price ? `${event.price} EGP` : 'Free',
    'Status': event.isArchived ? 'Archived' : 'Active',
    'Registration Deadline': event.registrationDeadline ? 
      format(new Date(event.registrationDeadline), 'MMM d, yyyy') : '-',
  }));
  
  // Sort by date
  data.sort((a, b) => {
    if (a['Date'] === '-') return 1;
    if (b['Date'] === '-') return -1;
    return a['Date'].localeCompare(b['Date']);
  });
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 },  // Date
    { wch: 35 },  // Event Name
    { wch: 15 },  // Type
    { wch: 12 },  // Start Time
    { wch: 12 },  // End Time
    { wch: 25 },  // Location
    { wch: 10 },  // Capacity
    { wch: 12 },  // Registered
    { wch: 15 },  // Price
    { wch: 12 },  // Status
    { wch: 20 },  // Registration Deadline
  ];
  
  const sheetTitle = title || `Event Calendar`;
  
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31)); // Sheet name max 31 chars
  
  // Save the file
  const filename = `event-calendar-${format(month, 'yyyy-MM')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
