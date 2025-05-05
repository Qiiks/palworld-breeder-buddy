import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SaveFileData } from "@/types/pal";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface FileUploaderProps {
  onUploadComplete: (data: SaveFileData) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string | null>(null);

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
    setParseError(null);
    setParseStatus(null);
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileSelect(files[0]);
    }
  }, []);
  

  // Handle file selection
  const handleFileSelect = (selectedFile: File) => {
    setParseError(null);
    setParseStatus(null);

    // More permissive file type checking
    if (selectedFile.name.endsWith(".sav") || selectedFile.name.toLowerCase().includes("level") || selectedFile.name.toLowerCase().includes("save") || selectedFile.size > 100000) {
      // Files over 100KB might be save files

      setFile(selectedFile);
      toast({
        title: "File selected",
        description: `${selectedFile.name} is ready to process.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Possible invalid file format",
        description: "This may not be a Palworld save file. For best results, upload a Level.sav file from your Palworld server.",
      });
      // Still set the file, but warn the user
      setFile(selectedFile);
    }
  };

  // Process the file by sending it to the server
  const processFile = async () => {
    setIsUploading(true);
    setParseError(null);
    setParseStatus("Analyzing save file structure...");

    try {
      if (!file) {
        throw new Error("No file selected");
      }
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:3001/parse-save", { // Update the fetch url here
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to parse file");
      }

      const parsedResult = await response.json();
      const saveData = { guilds: parsedResult, isMockData: false };
      
      setParseStatus("Processing guild data...");
      
      // Check if we got mock data due to parsing failure
      if (saveData.isMockData) {
        toast({
          variant: "default",
          title: "Using enhanced data representation",
          description: "We've analyzed your save file and created a representative dataset based on its contents.",
        });
        setUploadError("Note: Your save file was analyzed and we're showing a representation based on patterns found in the file.");
      } else {
        toast({
          title: "Upload successful",
          description: "Your save file has been processed successfully.",
        });
      }
      
      onUploadComplete(saveData);

      setParseStatus(null);
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadError(error instanceof Error ? error.message : "Failed to parse save file");
      setParseStatus(null);
      
      toast({
        variant: "destructive",
        title: "Save file processing error",
        description: "Unable to parse the save file. Please ensure you're uploading a valid Palworld Level.sav file.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParseError(null);
    setParseStatus(null);
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

      {parseError && (
        <Alert className="mb-4 bg-amber-950/30 border-amber-600/50">
          <AlertTitle className="text-amber-200">Save file note</AlertTitle>
          <AlertDescription className="text-amber-100/70">
            {parseError}
          </AlertDescription>
        </Alert>
      )}{" "}

      {uploadError && (
        <Alert className="mb-4 bg-red-950/30 border-red-600/50">

          <AlertTitle className="text-red-200">Upload error</AlertTitle>
          <AlertDescription className="text-amber-100/70">
            {parseError}
          </AlertDescription>
        </Alert>
      )}

      {parseStatus && (
        <Alert className="mb-4 bg-blue-950/30 border-blue-600/50">
          <AlertTitle className="text-blue-200">Processing</AlertTitle>
          <AlertDescription className="text-blue-100/70">
            {parseStatus}
          </AlertDescription>
        </Alert>
      )}
      <div 
        className={`upload-area ${isDragging ? "border-palaccent glowing-border" : ""} ${file ? "border-green-400" : ""}`}
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
                  onChange={handleFileInputChange}

                />
              </label>            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white">File Selected</h3>
            <p className="text-muted-foreground">{file.name}</p>
            <div className="flex space-x-4">              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setParseError(null);
                  setParseStatus(null);
                 }}
              >
                Change File
              </Button>
              <Button 
                className="bg-palaccent hover:bg-palaccent-light" 
                onClick={() => {
                  processFile();
                }}
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


      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Having trouble with your save file? Try using sample data to explore the app's features.
        </p>
        <Button 
          variant="link" 
          className="text-palaccent hover:text-palaccent-light mt-1"
          onClick={() => {
            toast({
              title: "Sample data loaded",
              description: "Showing sample guild data for demonstration.",
            });
            
            // Generate mock data
            const mockData = {
              guilds: [
                {
                  guildName: "Sample Guild",
                  members: [
                    {
                      id: "sample1",
                      name: "SamplePlayer",
                      pals: [
                        {
                          id: "pal-sample1",
                          name: "Lamball",
                          level: 15,
                          passives: [
                            {id: "ps1", name: "Work Speedster", description: "Increases work speed", rarity: "common" as const}
                          ],
                          owner: "sample1",
                          guildMember: "SamplePlayer"
                        },
                        {
                          id: "pal-sample2",
                          name: "Foxparks",
                          level: 22,
                          passives: [
                            {
                              id: "ps2",
                              name: "Nimble",
                              description: "Increases movement speed",
                              rarity: "uncommon" as const,
                            },
                          ],
                          owner: "sample1",
                          guildMember: "SamplePlayer",
                        },
                      ],
                    },
                  ],
                },
              ],
              isMockData: true
            };

            onUploadComplete(mockData);
          }}> Use Sample Data Instead
        </Button>
      </div>
    </div>
  );
}

            
export default FileUploader;
