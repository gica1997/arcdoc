// ============================================
// ArcDoc Enterprise - Document Generation Service
// ============================================

import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import ExcelJS from 'exceljs';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// ─── PDF Generation ──────────────────────

export interface PdfOptions {
  title: string;
  content: string;
  variables?: Record<string, string>;
  includeQr?: boolean;
  qrData?: string;
  logoUrl?: string;
}

export async function generatePdf(options: PdfOptions): Promise<Buffer> {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(options.title, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Separator line
  doc.setDrawColor(26, 115, 232);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Content
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  let content = options.content;
  if (options.variables) {
    for (const [key, value] of Object.entries(options.variables)) {
      content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
    }
  }

  const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
  doc.text(lines, margin, y);
  y += lines.length * 6 + 10;

  // QR Code
  if (options.includeQr && options.qrData) {
    const qrDataUrl = await QRCode.toDataURL(options.qrData, { width: 200, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 15, y, 30, 30);
    y += 40;
    doc.setFontSize(8);
    doc.text('Verificare autenticitate: ' + options.qrData, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  // Footer
  y = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(`Generat: ${new Date().toLocaleString('ro')} | ArcDoc Enterprise`, pageWidth / 2, y, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

// ─── Word Generation ──────────────────────

export interface WordOptions {
  title: string;
  paragraphs: string[];
  tableData?: { headers: string[]; rows: string[][] };
  variables?: Record<string, string>;
}

export async function generateWord(options: WordOptions): Promise<Buffer> {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: options.title,
      heading: HeadingLevel.TITLE,
      alignment: 'center',
      spacing: { after: 300 },
    })
  );

  // Paragraphs
  for (const p of options.paragraphs) {
    let text = p;
    if (options.variables) {
      for (const [key, value] of Object.entries(options.variables)) {
        text = text.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value);
      }
    }
    children.push(
      new Paragraph({
        children: [new TextRun({ text, size: 22 })],
        spacing: { after: 200 },
      })
    );
  }

  // Table
  if (options.tableData) {
    const { headers, rows } = options.tableData;
    const tableRows = [
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20 })] })],
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
            })
        ),
      }),
      ...rows.map(
        (row) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20 })] })],
                  borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
                })
            ),
          })
      ),
    ];

    children.push(
      new Table({
        rows: tableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return await Packer.toBuffer(doc);
}

// ─── Excel Generation ─────────────────────

export interface ExcelOptions {
  sheetName: string;
  headers: string[];
  rows: unknown[][];
  title?: string;
}

export async function generateExcel(options: ExcelOptions): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(options.sheetName);

  // Title row
  if (options.title) {
    sheet.mergeCells(1, 1, 1, options.headers.length);
    const titleCell = sheet.getCell('A1');
    titleCell.value = options.title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };
  }

  const startRow = options.title ? 3 : 1;

  // Headers
  const headerRow = sheet.getRow(startRow);
  options.headers.forEach((h, i) => {
    headerRow.getCell(i + 1).value = h;
    headerRow.getCell(i + 1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.getCell(i + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A73E8' } };
    headerRow.getCell(i + 1).alignment = { horizontal: 'center' };
  });

  // Data rows
  options.rows.forEach((row, ri) => {
    const dataRow = sheet.getRow(startRow + 1 + ri);
    row.forEach((cell: unknown, ci: number) => {
      dataRow.getCell(ci + 1).value = cell as ExcelJS.CellValue;
    });
  });

  // Auto-fit columns
  sheet.columns.forEach((col) => {
    if (col.values) {
      const lengths = col.values.filter(Boolean).map((v: any) => String(v).length);
      const maxLen = Math.max(...lengths, 10);
      col.width = Math.min(maxLen + 2, 50);
    }
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ─── QR Code Generation ───────────────────

export async function generateQrCode(data: string): Promise<string> {
  return QRCode.toDataURL(data, { width: 300, margin: 2 });
}

// ─── Template Variable Replacement ────────

export function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), value || '');
  }
  return result;
}

export default { generatePdf, generateWord, generateExcel, generateQrCode, replaceVariables };