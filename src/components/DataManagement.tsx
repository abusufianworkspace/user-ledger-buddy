import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload } from 'lucide-react';
import { db, ExportData } from '@/lib/database';

interface DataManagementProps {
  onDataImported: () => void;
}

export function DataManagement({ onDataImported }: DataManagementProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await db.exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-balance-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: 'Data exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data: ExportData = JSON.parse(text);
      
      // Validate data structure
      if (!data.users || !data.balances || !Array.isArray(data.users) || !Array.isArray(data.balances)) {
        throw new Error('Invalid file format');
      }

      await db.importData(data);
      onDataImported();
      
      toast({
        title: 'Success',
        description: `Imported ${data.users.length} users and ${data.balances.length} balance entries`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import data. Please check the file format.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Export and import your user and balance data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Export Data</Label>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export to JSON'}
            </Button>
            <p className="text-sm text-muted-foreground">
              Download all users and balances as a JSON file
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="import-file">Import Data</Label>
            <div className="relative">
              <Input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Import data from a previously exported JSON file
            </p>
          </div>
        </div>
        
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
          <p className="text-sm text-warning-foreground">
            <strong>Warning:</strong> Importing data will replace all existing data in the application. 
            Make sure to export your current data before importing if you want to keep it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}