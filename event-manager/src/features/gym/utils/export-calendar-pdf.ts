/**
 * Export Calendar to PDF
 * Generates a PDF document of the calendar view with all events
 */


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Event } from '../../../shared';
import { format } from 'date-fns';
import { domToPng } from 'modern-screenshot';
import * as XLSX from 'xlsx';

interface ExportCalendarPDFOptions {
  events: Event[];
  month: Date;
  title?: string;
}

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

const SESSION_TYPE_COLORS: Record<string, [number, number, number]> = {
  YOGA: [147, 51, 234],        // purple
  PILATES: [236, 72, 153],     // pink
  AEROBICS: [249, 115, 22],    // orange
  ZUMBA: [234, 179, 8],        // yellow
  CROSS_CIRCUIT: [239, 68, 68], // red
  KICK_BOXING: [244, 63, 94],  // rose
  CROSSFIT: [245, 158, 11],    // amber
  CARDIO: [59, 130, 246],      // blue
  STRENGTH: [100, 116, 139],   // slate
  DANCE: [217, 70, 239],       // fuchsia
  MARTIAL_ARTS: [107, 114, 128], // gray
  OTHER: [115, 115, 115],      // neutral
};

export function exportCalendarToPDF({ events, month, title }: ExportCalendarPDFOptions) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  
  // Title
  const monthYear = format(month, 'MMMM yyyy');
  const pdfTitle = title || `Gym Schedule - ${monthYear}`;
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfTitle, 148, 15, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${format(new Date(), 'PPP')}`, 148, 22, { align: 'center' });
  
  // Group events by date
  const eventsByDate: Record<string, Event[]> = {};
  events.forEach(event => {
    if (event.startDate) {
      const dateKey = format(new Date(event.startDate), 'yyyy-MM-dd');
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    }
  });
  
  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();
  
  // Prepare table data
  const tableData: string[][] = [];
  
  sortedDates.forEach(dateKey => {
    const dateEvents = eventsByDate[dateKey];
    const dateObj = new Date(dateKey);
    const dateStr = format(dateObj, 'EEE, MMM d, yyyy');
    
    dateEvents.forEach((event, index) => {
      const startTime = event.startDate ? format(new Date(event.startDate), 'HH:mm') : '-';
      const endTime = event.endDate ? format(new Date(event.endDate), 'HH:mm') : '-';
      const sessionType = event.sessionType || 'OTHER';
      const duration = event.duration ? `${event.duration} min` : '-';
      const capacity = event.capacity || '-';
      
      tableData.push([
        index === 0 ? dateStr : '', // Only show date on first event of the day
        event.name,
        sessionType.replace(/_/g, ' '),
        `${startTime} - ${endTime}`,
        duration,
        `${capacity}`,
      ]);
    });
  });
  
  // Create table
  autoTable(doc, {
    startY: 30,
    head: [['Date', 'Session Name', 'Type', 'Time', 'Duration', 'Capacity']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246], // blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 60 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 },
    },
    didParseCell: (data) => {
      // Color code by session type
      if (data.section === 'body' && data.column.index === 2) {
        const sessionType = data.cell.text[0]?.replace(/ /g, '_').toUpperCase();
        if (sessionType && SESSION_TYPE_COLORS[sessionType]) {
          const [r, g, b] = SESSION_TYPE_COLORS[sessionType];
          data.cell.styles.fillColor = [r, g, b];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { top: 30, left: 10, right: 10 },
  });
  
  // Add footer
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      148,
      205,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  const filename = `gym-schedule-${format(month, 'yyyy-MM')}.pdf`;
  doc.save(filename);
}

/**
 * Export calendar as a screenshot to PDF
 * Uses modern-screenshot which supports modern CSS including oklch/oklab colors
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
  const pdfTitle = title || `Gym Schedule - ${monthYear}`;
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(pdfTitle, pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exported on ${format(new Date(), 'PPP')}`, pageWidth / 2, 18, { align: 'center' });
  
  // Add the screenshot
  doc.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight);
  
  // Save the PDF
  const filename = `gym-schedule-${format(month, 'yyyy-MM')}-screenshot.pdf`;
  doc.save(filename);
}

/**
 * Export calendar events to Excel
 */
export function exportCalendarToExcel({ events, month, title }: ExportCalendarExcelOptions) {
  // Prepare data for Excel
  const data = events.map(event => ({
    'Date': event.startDate ? format(new Date(event.startDate), 'EEE, MMM d, yyyy') : '-',
    'Session Name': event.name,
    'Type': (event.sessionType || 'OTHER').replace(/_/g, ' '),
    'Start Time': event.startDate ? format(new Date(event.startDate), 'HH:mm') : '-',
    'End Time': event.endDate ? format(new Date(event.endDate), 'HH:mm') : '-',
    'Duration (min)': event.duration || '-',
    'Capacity': event.capacity || '-',
    'Location': event.location || '-',
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
    { wch: 30 },  // Session Name
    { wch: 15 },  // Type
    { wch: 12 },  // Start Time
    { wch: 12 },  // End Time
    { wch: 15 },  // Duration
    { wch: 10 },  // Capacity
    { wch: 20 },  // Location
  ];
  
  const sheetTitle = title || `Gym Schedule`;
  
  XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31)); // Sheet name max 31 chars
  
  // Save the file
  const filename = `gym-schedule-${format(month, 'yyyy-MM')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
