
import { useState } from 'react';
import Header from '@/components/Header';
import FileUploader from '@/components/FileUploader';
import GuildSelector from '@/components/GuildSelector';
import BreedingCalculator from '@/components/BreedingCalculator';
import GuildDisplay from '@/components/GuildDisplay';
import { SaveFileData, GuildData } from '@/types/pal';

export default function Index() {
  const [saveFileData, setSaveFileData] = useState<SaveFileData | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<GuildData | null>(null);

  const handleUploadComplete = (data: SaveFileData) => {
    setSaveFileData(data);
    if (data.guilds.length > 0) {
      setSelectedGuild(data.guilds[0]);
    }
  };

  const handleGuildSelect = (guild: GuildData) => {
    setSelectedGuild(guild);
  };

  return (
    <div className="min-h-screen pb-16">
      <Header />

      <main className="container mx-auto px-4">
        <div className="mb-8 text-center max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-float">
            Optimize Your Palworld Breeding Strategy
          </h1>
          <p className="text-muted-foreground mb-6 md:text-lg">
            Upload your server's Level.sav file to analyze your guild's Pals and calculate the most efficient breeding paths
          </p>
        </div>

        {(!saveFileData) ? (
          <FileUploader onUploadComplete={handleUploadComplete} />
        ) : (
          <>
          <GuildDisplay data={saveFileData}/>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <GuildSelector 
                  guilds={saveFileData.guilds} 
                  onGuildSelect={handleGuildSelect} 
                />
              </div>
              
              <div className="lg:col-span-2">
                {selectedGuild && (
                  <BreedingCalculator guild={selectedGuild} />
                )}
              </div>
            </div>
            
          </>
        )}

        <div className="mt-16 text-center">
          <div className="glass-panel p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              About Palworld Breeder Buddy
            </h2>
            <p className="text-muted-foreground mb-4">
              This tool helps Palworld players optimize their breeding strategies by analyzing guild data and calculating the most efficient paths to obtain desired Pals with specific passive abilities.
            </p>
            <p className="text-muted-foreground mb-4">
              Upload your server's Level.sav file to see which Pals are available in your guild, who owns them, and the most efficient breeding routes to get the perfect Pals with your desired passive skills.
            </p>
            <p className="text-xs text-muted-foreground">
              Note: This tool is currently demonstrating functionality with mock data. For a fully functional implementation, the Level.sav parser would need to be implemented.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
