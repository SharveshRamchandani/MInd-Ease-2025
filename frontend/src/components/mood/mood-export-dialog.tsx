import { useState } from "react";
import { format as formatDate } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Download, 
  Calendar as CalendarIcon, 
  FileSpreadsheet,
  FileText,
  Clock,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  generateExport,
  downloadFile,
  generateMoodSummary,
  type MoodEntry, 
  type ExportOptions 
} from "@/utils/export";

interface MoodExportDialogProps {
  moodHistory: MoodEntry[];
  trigger?: React.ReactNode;
}

export const MoodExportDialog = ({ moodHistory, trigger }: MoodExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [dateRange, setDateRange] = useState<'all' | 'last30' | 'last90' | 'custom'>('all');
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [includeJournal, setIncludeJournal] = useState(true);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  const handleExport = async () => {
    if (moodHistory.length === 0) {
      toast({
        title: "No data to export",
        description: "You need to have mood entries to export data.",
        variant: "destructive",
      });
      return;
    }

    if (dateRange === 'custom' && (!startDate || !endDate)) {
      toast({
        title: "Please select date range",
        description: "Both start and end dates are required for custom range.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const exportOptions: ExportOptions = {
        dateRange,
        startDate,
        endDate,
        includeJournal,
        format,
      };

      const content = generateExport(moodHistory, exportOptions);

      // Generate filename
      const dateStr = format === 'pdf' ? new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const rangeStr = dateRange === 'custom' && startDate && endDate
        ? `${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`
        : dateRange;
      const extension = format === 'pdf' ? 'pdf' : 'csv';
      const filename = `mindease_mood_${format === 'pdf' ? 'report' : 'data'}_${rangeStr}_${dateStr}.${extension}`;

      if (format === 'csv' && typeof content === 'string') {
        downloadFile(content, filename, 'csv');
      }
      // PDF download is handled directly in generatePDF

      toast({
        title: `${format.toUpperCase()} export successful! ${format === 'pdf' ? '📄' : '📊'}`,
        description: `Your mood ${format === 'pdf' ? 'report' : 'data'} has been downloaded as ${filename}`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredCount = () => {
    if (dateRange === 'all') return moodHistory.length;
    
    const now = new Date();
    let filterDate: Date;
    
    switch (dateRange) {
      case 'last30':
        filterDate = new Date(now);
        filterDate.setDate(now.getDate() - 30);
        break;
      case 'last90':
        filterDate = new Date(now);
        filterDate.setDate(now.getDate() - 90);
        break;
      case 'custom':
        if (!startDate || !endDate) return 0;
        return moodHistory.filter(entry => {
          const entryDate = new Date(entry.timestamp);
          return entryDate >= startDate && entryDate <= endDate;
        }).length;
      default:
        return moodHistory.length;
    }
    
    return moodHistory.filter(entry => 
      new Date(entry.timestamp) >= filterDate
    ).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Export Mood Data
          </DialogTitle>
          <DialogDescription>
            Download your mood tracking data as a CSV file for analysis or sharing with healthcare providers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export Format
            </Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  CSV (Spreadsheet)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF (Report with Emojis)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Date Range
            </Label>
            <RadioGroup value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All time ({moodHistory.length} entries)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last30" id="last30" />
                <Label htmlFor="last30">Last 30 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="last90" id="last90" />
                <Label htmlFor="last90">Last 90 days</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom range</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Date Range */}
          {dateRange === 'custom' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? formatDate(startDate, "MMM dd, yyyy") : "Select start"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? formatDate(endDate, "MMM dd, yyyy") : "Select end"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-journal"
                checked={includeJournal}
                onCheckedChange={(checked) => setIncludeJournal(!!checked)}
              />
              <Label htmlFor="include-journal" className="text-sm">
                Include journal entries
              </Label>
            </div>
          </div>

          {/* Preview Info */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Entries to export:</span>
                <span className="font-medium">{getFilteredCount()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium flex items-center gap-1">
                  {format === 'csv' ? (
                    <><FileSpreadsheet className="w-3 h-3" /> CSV</>
                  ) : (
                    <><FileText className="w-3 h-3" /> PDF</>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Includes:</span>
                <span className="font-medium">
                  {format === 'pdf' 
                    ? `Date, Mood, Emojis, Score${includeJournal ? ', Journal' : ''}` 
                    : `Date, Mood, Score${includeJournal ? ', Journal' : ''}`
                  }
                </span>
              </div>
            </div>
          </Card>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting || moodHistory.length === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Generating {format.toUpperCase()}...
              </>
            ) : (
              <>
                {format === 'csv' ? (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                ) : (
                  <FileText className="w-4 h-4 mr-2" />
                )}
                Export {getFilteredCount()} Entries as {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};