"use client";

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExportData {
  [key: string]: any;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData[], filename: string, columns?: string[]) {
  if (data.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  // Determine columns
  const headers = columns || Object.keys(data[0]);

  // Create CSV content
  const csvRows: string[] = [];

  // Add headers
  csvRows.push(headers.map(escapeCSVValue).join(','));

  // Add data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCSVValue(formatValue(value));
    });
    csvRows.push(values.join(','));
  });

  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: ExportData[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Export data to Excel-compatible format (actually CSV with .xls extension)
 */
export function exportToExcel(data: ExportData[], filename: string, columns?: string[]) {
  exportToCSV(data, filename, columns);
}

/**
 * Export table to PDF (requires html2canvas and jspdf - to be installed)
 */
export async function exportTableToPDF(
  tableElement: HTMLElement,
  filename: string,
  title?: string
) {
  try {
    // Dynamic import to avoid bundling if not used
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const canvas = await html2canvas(tableElement);
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });

    if (title) {
      pdf.setFontSize(16);
      pdf.text(title, 20, 20);
    }

    pdf.addImage(imgData, 'PNG', 0, title ? 40 : 0, canvas.width, canvas.height);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Error al exportar a PDF. Asegúrate de tener html2canvas y jspdf instalados.');
  }
}

/**
 * Generate a printable report
 */
export function printReport(content: string, title?: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('No se pudo abrir la ventana de impresión');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title || 'Reporte'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #0EA5E9;
            border-bottom: 2px solid #0EA5E9;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #0EA5E9;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        ${title ? `<h1>${title}</h1>` : ''}
        ${content}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Create a statistics report from appointments
 */
export function createAppointmentReport(appointments: any[], dateRange?: { start: Date; end: Date }) {
  const total = appointments.length;
  const completed = appointments.filter(a => a.status === 'completado').length;
  const cancelled = appointments.filter(a => a.status === 'cancelado').length;
  const noShow = appointments.filter(a => a.status === 'no-asistio').length;

  const totalRevenue = appointments.reduce((sum, a) => {
    return sum + ((a.paid || 0) + (a.deposit || 0));
  }, 0);

  const pendingPayments = appointments.reduce((sum, a) => {
    const totalPaid = (a.paid || 0) + (a.deposit || 0);
    const pending = Math.max(0, (a.fee || 0) - totalPaid);
    return sum + pending;
  }, 0);

  let dateRangeText = '';
  if (dateRange) {
    dateRangeText = `del ${format(dateRange.start, "d 'de' MMMM, yyyy", { locale: es })} al ${format(dateRange.end, "d 'de' MMMM, yyyy", { locale: es })}`;
  }

  return `
    <div>
      <h2>Resumen de Turnos ${dateRangeText}</h2>
      <table>
        <tr>
          <th>Métrica</th>
          <th>Valor</th>
        </tr>
        <tr>
          <td>Total de turnos</td>
          <td>${total}</td>
        </tr>
        <tr>
          <td>Turnos completados</td>
          <td>${completed} (${total > 0 ? Math.round((completed / total) * 100) : 0}%)</td>
        </tr>
        <tr>
          <td>Turnos cancelados</td>
          <td>${cancelled} (${total > 0 ? Math.round((cancelled / total) * 100) : 0}%)</td>
        </tr>
        <tr>
          <td>No asistieron</td>
          <td>${noShow} (${total > 0 ? Math.round((noShow / total) * 100) : 0}%)</td>
        </tr>
        <tr>
          <td><strong>Ingresos totales</strong></td>
          <td><strong>$${totalRevenue.toLocaleString()}</strong></td>
        </tr>
        <tr>
          <td><strong>Pagos pendientes</strong></td>
          <td><strong>$${pendingPayments.toLocaleString()}</strong></td>
        </tr>
      </table>
    </div>
  `;
}

// Helper functions

function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return format(value, 'dd/MM/yyyy HH:mm', { locale: es });
  }
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
