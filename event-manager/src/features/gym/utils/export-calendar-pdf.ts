/**
 * Export Calendar to PDF
 * Generates a PDF document of the calendar view with all events
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Event } from '@event-manager/shared';
import { format } from 'date-fns';

interface ExportCalendarPDFOptions {
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
  const tableData: any[][] = [];
  
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
  const pageCount = (doc as any).internal.getNumberOfPages();
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
