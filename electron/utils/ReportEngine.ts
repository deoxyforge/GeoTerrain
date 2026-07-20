import { jsPDF } from 'jspdf';
import type { Project } from '../../src/types/project';
import type { Coordinate } from '../../src/types/coordinate';
import type { MeasurementResult } from '../../src/types/measurement';

export interface ReportPayload {
  project: Project;
  coordinates: Coordinate[];
  measurements: MeasurementResult | null;
  mapImageBase64?: string; // base64 PNG data URL
  version: string;
}

export class ReportEngine {
  static generatePDF(payload: ReportPayload): Buffer {
    const { project, coordinates, measurements, mapImageBase64, version } = payload;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    const nowStr = new Date().toLocaleString();

    // Helper for footer on all pages
    const drawFooter = (pageNum: number, totalPages: number) => {
      doc.setPage(pageNum);
      doc.setDrawColor(220, 224, 230);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 130, 140);
      doc.text('GeoTerrain Analyzer', margin, pageHeight - 10);
      doc.text(`Version ${version}`, margin + 50, pageHeight - 10);
      doc.text(`Generated: ${nowStr}`, margin + 95, pageHeight - 10);
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 10, {
        align: 'right',
      });
    };

    // PAGE 1: COVER & OVERVIEW
    let y = margin;

    // Header Logo/App Branding
    doc.setFillColor(34, 197, 94); // geo-green/accent highlight
    doc.rect(margin, y, 4, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('GEOTERRAIN ANALYZER', margin + 6, y + 8);
    y += 18;

    // Report Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('PROJECT GEOSPATIAL ANALYSIS REPORT', margin, y);
    y += 12;

    // Divider Line
    doc.setDrawColor(200, 204, 210);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Section: Project Information
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('PROJECT INFORMATION', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600

    const infoRows = [
      ['Project Name:', project.name],
      ['Description:', project.description || 'No description provided.'],
      ['Created Date:', new Date(project.createdAt).toLocaleString()],
      ['Last Modified:', new Date(project.updatedAt).toLocaleString()],
    ];

    infoRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, y);

      doc.setFont('helvetica', 'normal');
      // Wrap description text if it is too long
      const textLines = doc.splitTextToSize(value, contentWidth - 40);
      doc.text(textLines, margin + 35, y);
      y += textLines.length * 5 + 1;
    });
    y += 4;

    // Embed Map Visualizer Snapshot (If present)
    if (mapImageBase64) {
      try {
        const imgWidth = 100;
        const imgHeight = 65;
        const imgX = margin + (contentWidth - imgWidth) / 2;
        doc.setFillColor(248, 250, 252); // light background panel border
        doc.rect(imgX - 2, y - 2, imgWidth + 4, imgHeight + 4, 'F');
        doc.addImage(mapImageBase64, 'PNG', imgX, y, imgWidth, imgHeight);
        y += imgHeight + 10;
      } catch (err) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(239, 68, 68);
        doc.text('Failed to embed visualizer snapshot.', margin, y);
        y += 10;
      }
    }

    // Section: Geometry & Measurements Summary
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('GEOMETRY & CALCULATIONS', margin, y);
    y += 6;

    if (measurements) {
      const centroid = measurements.centroid;
      const bounds = measurements.boundingBox;
      const zone = Math.floor((centroid.longitude + 180) / 6) + 1;

      const measData = [
        [
          'Calculated Area:',
          `${measurements.areaSqMeters.toLocaleString(undefined, { maximumFractionDigits: 2 })} m²  |  ${measurements.areaSqKilometers.toFixed(4)} km²  |  ${measurements.areaHectares.toFixed(3)} ha  |  ${measurements.areaAcres.toFixed(3)} ac`,
        ],
        [
          'Total Perimeter:',
          `${measurements.perimeterMeters.toLocaleString(undefined, { maximumFractionDigits: 2 })} m  |  ${measurements.perimeterKilometers.toFixed(4)} km`,
        ],
        [
          'Geometric Centroid:',
          `Lat: ${centroid.latitude.toFixed(6)}°, Lon: ${centroid.longitude.toFixed(6)}°`,
        ],
        [
          'Bounding Box Limits:',
          `Min Lat: ${bounds.minLat.toFixed(5)}°, Max Lat: ${bounds.maxLat.toFixed(5)}° \nMin Lon: ${bounds.minLon.toFixed(5)}°, Max Lon: ${bounds.maxLon.toFixed(5)}°`,
        ],
        [
          'Coordinate System:',
          `UTM Zone ${zone}${centroid.latitude >= 0 ? 'N' : 'S'}  (WGS84 EPSG:4326 Datum)`,
        ],
      ];

      doc.setFontSize(9.5);
      measData.forEach(([lbl, val]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(lbl, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(val, margin + 42, y);
        // Add additional spacing for multi-line bounds text
        y += lbl === 'Bounding Box Limits:' ? 10 : 6.5;
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(220, 100, 100);
      doc.text(
        'No valid polygon geometry calculations found. Please provide at least 3 valid coordinate points.',
        margin,
        y
      );
    }

    // PAGE 2: VERTICES INDEX TABLE
    doc.addPage();
    let pageNum = 2;
    y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('COORDINATE VERTICES LIST', margin, y);
    y += 8;

    // Draw Table Header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text('Order Index', margin + 5, y + 5.5);
    doc.text('Latitude (WGS84)', margin + 40, y + 5.5);
    doc.text('Longitude (WGS84)', margin + 95, y + 5.5);
    doc.text('Status', margin + 145, y + 5.5);
    y += 8;

    // Draw Table Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    coordinates.forEach((pt, index) => {
      // Check if we need to wrap page
      if (y > pageHeight - 30) {
        doc.addPage();
        pageNum++;
        y = margin;

        // Re-draw Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('Order Index', margin + 5, y + 5.5);
        doc.text('Latitude (WGS84)', margin + 40, y + 5.5);
        doc.text('Longitude (WGS84)', margin + 95, y + 5.5);
        doc.text('Status', margin + 145, y + 5.5);
        y += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
      }

      // Alternate row backgrounds
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin, y, contentWidth, 7, 'F');
      }

      doc.text(`${pt.pointOrder}`, margin + 5, y + 5);
      doc.text(`${pt.latitude.toFixed(7)}°`, margin + 40, y + 5);
      doc.text(`${pt.longitude.toFixed(7)}°`, margin + 95, y + 5);
      doc.text('Valid Vertex', margin + 145, y + 5);

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 7, pageWidth - margin, y + 7);
      y += 7;
    });

    const totalPages = pageNum;
    for (let i = 1; i <= totalPages; i++) {
      drawFooter(i, totalPages);
    }

    const arrayBuffer = doc.output('arraybuffer');
    return Buffer.from(arrayBuffer);
  }
}
