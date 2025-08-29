import { format } from "date-fns";

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
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dayOfWeek = format(date, 'EEEE');
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
    `Export Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`,
    ''
  ].join('\n');

  return summary;
};