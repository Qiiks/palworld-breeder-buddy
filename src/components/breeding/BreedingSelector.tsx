
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Pal, Passive } from "@/types/pal";
import { ArrowRight } from "lucide-react";

interface BreedingSelectorProps {
  availablePalTypes: string[];
  availablePassives: Passive[];
  onCalculate: (desiredPalType: string, selectedPassives: Passive[], prioritizeSpeed: number) => void;
}

export function BreedingSelector({ 
  availablePalTypes, 
  availablePassives, 
  onCalculate 
}: BreedingSelectorProps) {
  const [desiredPalType, setDesiredPalType] = useState<string>("");
  const [selectedPassives, setSelectedPassives] = useState<Passive[]>([]);
  const [prioritizeSpeed, setPrioritizeSpeed] = useState<number>(50);

  const togglePassive = (passive: Passive) => {
    const exists = selectedPassives.find(p => p.id === passive.id);
    if (exists) {
      setSelectedPassives(selectedPassives.filter(p => p.id !== passive.id));
    } else {
      setSelectedPassives([...selectedPassives, passive]);
    }
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCalculate = () => {
    if (desiredPalType && selectedPassives.length > 0) {
      onCalculate(desiredPalType, selectedPassives, prioritizeSpeed);
    }
  };

  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Desired Pal</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {availablePalTypes.map((pal) => (
              <Button 
                key={pal}
                variant={desiredPalType === pal ? "default" : "outline"}
                className={`h-auto py-2 px-3 justify-start ${
                  desiredPalType === pal 
                    ? "bg-palaccent hover:bg-palaccent-light border-palaccent" 
                    : "border-palblue hover:border-palaccent"
                }`}
                onClick={() => setDesiredPalType(pal)}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 mr-2"></div>
                  <span className="text-sm overflow-hidden text-ellipsis">{pal}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white">Desired Passives</h3>
          <div className="grid grid-cols-1 gap-2">
            {availablePassives.map((passive) => (
              <Button 
                key={passive.id}
                variant={selectedPassives.some(p => p.id === passive.id) ? "default" : "outline"}
                className={`h-auto py-2 px-3 justify-start ${
                  selectedPassives.some(p => p.id === passive.id)
                    ? "bg-palaccent hover:bg-palaccent-light border-palaccent" 
                    : "border-palblue hover:border-palaccent"
                }`}
                onClick={() => togglePassive(passive)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${getRarityColor(passive.rarity)} mr-2`}></div>
                    <span className="font-medium">{passive.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{passive.rarity}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">Breeding Priority</h3>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Speed</span>
            <Slider
              defaultValue={[50]}
              max={100}
              step={1}
              className="w-full"
              onValueChange={(value) => setPrioritizeSpeed(value[0])}
            />
            <span className="text-sm text-muted-foreground">Quality</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Balance between fewer breeding steps (speed) and more desired passives (quality)
          </p>
        </div>
        
        <Button 
          className="w-full bg-palaccent hover:bg-palaccent-light"
          disabled={!desiredPalType || selectedPassives.length === 0}
          onClick={handleCalculate}
        >
          Calculate Breeding Routes <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
