import { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { SaveFileData } from '@/types/pal';
import { parseSaveFile } from '@/utils/saveParser';

interface FileUploaderProps {
  onUploadComplete: (data: SaveFileData) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileSelect(files[0]);
    }
  }, []);

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.name.endsWith('.sav') || selectedFile.name.toLowerCase().includes('level')) {
      setFile(selectedFile);
      toast({
        title: "File selected",
        description: `${selectedFile.name} is ready to process.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload a Level.sav file from Palworld.",
      });
    }
  };

  // Process the file using the saveParser
  const processFile = async () => {
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      // Parse the save file using our utility
      const saveData = await parseSaveFile(file);
      
      onUploadComplete(saveData);
      
      toast({
        title: "Upload successful",
        description: "Your save file has been processed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: "There was a problem processing your save file. Please try again.",
      });
      console.error("Error processing file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="glass-panel p-8 mb-8 w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Upload Your Save File</h2>
        <p className="text-muted-foreground">
          Upload your Palworld Level.sav file to analyze guild data and available Pals
        </p>
      </div>

      <div 
        className={`upload-area ${isDragging ? 'border-palaccent glowing-border' : ''} ${file ? 'border-green-400' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!file ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center animate-pulse-light">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Drag & Drop Your Save File
            </h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Upload your Level.sav file from your Palworld server to analyze owned Pals and calculate optimal breeding routes
            </p>
            <div>
              <label htmlFor="file-upload">
                <Button className="bg-palaccent hover:bg-palaccent-light" size="lg">
                  Select File
                </Button>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".sav"
                  onChange={handleFileInputChange} 
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white">File Selected</h3>
            <p className="text-muted-foreground">{file.name}</p>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={() => setFile(null)}>
                Change File
              </Button>
              <Button 
                className="bg-palaccent hover:bg-palaccent-light" 
                onClick={processFile}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Analyze Save <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUploader;
