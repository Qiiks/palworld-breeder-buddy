
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreedingPath, GuildData, Pal, Passive } from "@/types/pal";
import { BreedingSelector } from "./breeding/BreedingSelector";
import { BreedingCalculationStatus } from "./breeding/BreedingCalculationStatus";
import { BreedingResults } from "./breeding/BreedingResults";
import { calculateBreedingPaths } from "@/utils/breedingCalculator";

interface BreedingCalculatorProps {
  guild: GuildData;
}

export function BreedingCalculator({ guild }: BreedingCalculatorProps) {
  const [availablePalTypes, setAvailablePalTypes] = useState<string[]>([]);
  const [availablePassives, setAvailablePassives] = useState<Passive[]>([]);
  const [calculatedPaths, setCalculatedPaths] = useState<BreedingPath[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("select");
  
  // Extract available pals and passives from guild data
  useEffect(() => {
    if (guild) {
      // Extract unique pal names
      const palTypes = new Set<string>();
      // Extract all passives
      const passives = new Set<Passive>();
      
      guild.members.forEach(member => {
        member.pals.forEach(pal => {
          palTypes.add(pal.name);
          pal.passives.forEach(passive => {
            passives.add(passive);
          });
        });
      });
      
      setAvailablePalTypes(Array.from(palTypes));
      setAvailablePassives(Array.from(passives));
    }
  }, [guild]);
  
  // Clear selection when guild changes
  useEffect(() => {
    setCalculatedPaths([]);
    setActiveTab("select");
  }, [guild]);

  const handleCalculate = (desiredPalType: string, selectedPassives: Passive[], prioritizeSpeed: number) => {
    setIsCalculating(true);
    setActiveTab("calculate");
    
    // Use timeout to simulate calculation time and avoid UI freezing
    setTimeout(() => {
      // Call the actual breeding calculator with guild data
      const paths = calculateBreedingPaths(
        guild,
        desiredPalType,
        selectedPassives,
        prioritizeSpeed
      );
      
      setCalculatedPaths(paths);
      setIsCalculating(false);
    }, 1500);
  };

  const handleViewResults = () => {
    setActiveTab("results");
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Breeding Calculator</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-palblue border border-palblue-light">
          <TabsTrigger value="select" className="data-[state=active]:bg-palaccent">
            Select Pals
          </TabsTrigger>
          <TabsTrigger value="calculate" className="data-[state=active]:bg-palaccent">
            Calculate Routes
          </TabsTrigger>
          <TabsTrigger 
            value="results" 
            disabled={calculatedPaths.length === 0}
            className="data-[state=active]:bg-palaccent"
          >
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="select">
          <BreedingSelector
            availablePalTypes={availablePalTypes}
            availablePassives={availablePassives}
            onCalculate={handleCalculate}
          />
        </TabsContent>
        
        <TabsContent value="calculate">
          <BreedingCalculationStatus 
            isCalculating={isCalculating}
            pathsFound={calculatedPaths.length}
            onViewResults={handleViewResults}
          />
        </TabsContent>
        
        <TabsContent value="results">
          <BreedingResults breedingPaths={calculatedPaths} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BreedingCalculator;
