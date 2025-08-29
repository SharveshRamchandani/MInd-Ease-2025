import { format as formatDate } from "date-fns";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface MoodEntry {
  id: string;
  date: string;
  mood: string;
  emoji: string;
  journal?: string;
  timestamp: Date;
  user_id: string;
}

export interface ExportOptions {
  dateRange: 'all' | 'last30' | 'last90' | 'custom';
  startDate?: Date;
  endDate?: Date;
  includeJournal: boolean;
  format: 'csv' | 'pdf';
}

// Mood scoring for trend analysis
const moodScores: Record<string, number> = {
  joy: 5,
  calm: 4,
  neutral: 3,
  anxious: 2,
  sad: 2,
  angry: 1,
};

export const filterMoodDataByDateRange = (
  moodData: MoodEntry[],
  options: ExportOptions
): MoodEntry[] => {
  if (options.dateRange === 'all') {
    return moodData;
  }

  const now = new Date();
  let startDate: Date;
  let endDate = now;

  switch (options.dateRange) {
    case 'last30':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);
      break;
    case 'last90':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 90);
      break;
    case 'custom':
      if (!options.startDate || !options.endDate) {
        return moodData;
      }
      startDate = options.startDate;
      endDate = options.endDate;
      break;
    default:
      return moodData;
  }

  return moodData.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startDate && entryDate <= endDate;
  });
};

export const generateCSV = (
  moodData: MoodEntry[],
  options: ExportOptions
): string => {
  const filteredData = filterMoodDataByDateRange(moodData, options);
  
  // Sort by date (newest first)
  const sortedData = filteredData.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // CSV headers
  const headers = [
    'Date',
    'Day of Week',
    'Mood',
    'Emoji',
    'Mood Score (1-5)',
    ...(options.includeJournal ? ['Journal Entry'] : [])
  ];

  // Generate CSV rows
  const rows = sortedData.map(entry => {
    const date = new Date(entry.timestamp);
    const formattedDate = formatDate(date, 'yyyy-MM-dd');
    const dayOfWeek = formatDate(date, 'EEEE');
    const moodScore = moodScores[entry.mood] || 3;
    
    const row = [
      formattedDate,
      dayOfWeek,
      entry.mood,
      entry.emoji,
      moodScore.toString()
    ];

    if (options.includeJournal) {
      // Escape quotes and line breaks for CSV
      const journalEntry = (entry.journal || '')
        .replace(/"/g, '""')
        .replace(/\r?\n/g, ' ');
      row.push(`"${journalEntry}"`);
    }

    return row.join(',');
  });

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n');
  
  return csvContent;
};

export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const generateMoodSummary = (moodData: MoodEntry[]): string => {
  if (moodData.length === 0) return '';
  
  const moodCounts = moodData.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEntries = moodData.length;
  const averageScore = moodData.reduce((sum, entry) => 
    sum + (moodScores[entry.mood] || 3), 0) / totalEntries;

  const mostCommonMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0];

  const summary = [
    '',
    '--- MOOD SUMMARY ---',
    `Total Entries: ${totalEntries}`,
    `Average Mood Score: ${averageScore.toFixed(1)}/5`,
    `Most Common Mood: ${mostCommonMood[0]} (${mostCommonMood[1]} times)`,
    `Export Date: ${formatDate(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
    ''
  ].join('\n');

  return summary;
};

export const generatePDF = (
  moodData: MoodEntry[],
  options: ExportOptions
): void => {
  const filteredData = filterMoodDataByDateRange(moodData, options);
  
  // Sort by date (newest first)
  const sortedData = filteredData.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Create new PDF document
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  
  // Title and header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Mind-Ease Mood Report', pageWidth / 2, 20, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated on: ${formatDate(new Date(), 'MMMM dd, yyyy')}`, pageWidth / 2, 30, { align: 'center' });
  
  // Date range info
  let dateRangeText = '';
  if (options.dateRange === 'all') {
    dateRangeText = 'All Time';
  } else if (options.dateRange === 'custom' && options.startDate && options.endDate) {
    dateRangeText = `${formatDate(options.startDate, 'MMM dd, yyyy')} - ${formatDate(options.endDate, 'MMM dd, yyyy')}`;
  } else {
    dateRangeText = options.dateRange === 'last30' ? 'Last 30 Days' : 'Last 90 Days';
  }
  
  pdf.text(`Period: ${dateRangeText}`, pageWidth / 2, 40, { align: 'center' });
  
  // Summary statistics
  const moodCounts = sortedData.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const totalEntries = sortedData.length;
  const averageScore = totalEntries > 0 ? sortedData.reduce((sum, entry) => 
    sum + (moodScores[entry.mood] || 3), 0) / totalEntries : 0;
  
  const mostCommonMood = Object.entries(moodCounts)
    .sort(([,a], [,b]) => b - a)[0];
  
  // Summary box
  pdf.setFillColor(248, 250, 252); // Light gray background
  pdf.rect(20, 50, pageWidth - 40, 30, 'F');
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Summary', 25, 60);
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total Entries: ${totalEntries}`, 25, 68);
  pdf.text(`Average Mood Score: ${averageScore.toFixed(1)}/5`, 25, 74);
  if (mostCommonMood) {
    pdf.text(`Most Common Mood: ${mostCommonMood[0]} (${mostCommonMood[1]} times)`, 100, 68);
  }
  
  // Prepare table data
  const tableData = sortedData.map(entry => {
    const date = new Date(entry.timestamp);
    const formattedDate = formatDate(date, 'MMM dd, yyyy');
    const dayOfWeek = formatDate(date, 'EEE');
    const moodScore = moodScores[entry.mood] || 3;
    
    const row = [
      formattedDate,
      dayOfWeek,
      entry.emoji, // Emoji will be rendered
      entry.mood,
      moodScore.toString()
    ];
    
    if (options.includeJournal && entry.journal) {
      // Truncate long journal entries for PDF
      const truncatedJournal = entry.journal.length > 100 
        ? entry.journal.substring(0, 100) + '...' 
        : entry.journal;
      row.push(truncatedJournal);
    }
    
    return row;
  });
  
  // Table headers
  const headers = [
    'Date',
    'Day',
    'Mood',
    'Feeling',
    'Score'
  ];
  
  if (options.includeJournal) {
    headers.push('Journal Entry');
  }
  
  // Generate table
  pdf.autoTable({
    head: [headers],
    body: tableData,
    startY: 90,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [79, 70, 229], // Primary color
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 25 }, // Date
      1: { cellWidth: 15 }, // Day
      2: { cellWidth: 15, halign: 'center' }, // Emoji
      3: { cellWidth: 20 }, // Mood
      4: { cellWidth: 15, halign: 'center' }, // Score
      ...(options.includeJournal ? { 5: { cellWidth: 'auto' } } : {})
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 20, right: 20 }
  });
  
  // Footer
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Mind-Ease Mood Report - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pdf.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Generate filename
  const dateStr = formatDate(new Date(), 'yyyy-MM-dd');
  const rangeStr = options.dateRange === 'custom' && options.startDate && options.endDate
    ? `${formatDate(options.startDate, 'yyyy-MM-dd')}_to_${formatDate(options.endDate, 'yyyy-MM-dd')}`
    : options.dateRange;
  const filename = `mindease_mood_report_${rangeStr}_${dateStr}.pdf`;
  
  // Save the PDF
  pdf.save(filename);
};

export const generateExport = (
  moodData: MoodEntry[],
  options: ExportOptions
): string | void => {
  if (options.format === 'csv') {
    const csvContent = generateCSV(moodData, options);
    const summary = generateMoodSummary(
      filterMoodDataByDateRange(moodData, options)
    );
    return csvContent + summary;
  } else if (options.format === 'pdf') {
    generatePDF(moodData, options);
    return; // PDF is directly downloaded
  }
};

export const downloadFile = (
  content: string | void,
  filename: string,
  format: 'csv' | 'pdf'
): void => {
  if (format === 'csv' && typeof content === 'string') {
    downloadCSV(content, filename);
  }
  // PDF download is handled directly in generatePDF
};