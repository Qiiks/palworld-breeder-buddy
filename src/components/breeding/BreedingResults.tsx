
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BreedingPath } from "@/types/pal";
import BreedingTreeVisualizer from "@/components/breeding/BreedingTreeVisualizer";
import { ArrowRight, User } from "lucide-react";

interface BreedingResultsProps {
  breedingPaths: BreedingPath[];
}

export function BreedingResults({ breedingPaths }: BreedingResultsProps) {
  if (!breedingPaths.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No breeding paths found</p>
      </div>
    );
  }

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

  return (
    <div className="mt-4 space-y-8">
      {breedingPaths.map((path, index) => (
        <Card key={index} className="pal-card overflow-visible">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center">
                Route #{index + 1} - {path.finalPal.name}
              </h3>
              <Badge 
                className={`${
                  path.probabilityOfSuccess > 0.2 
                    ? 'bg-green-500' 
                    : path.probabilityOfSuccess > 0.1 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                }`}
              >
                {Math.round(path.probabilityOfSuccess * 100)}% Success Rate
              </Badge>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Target Passives:</h4>
              <div className="flex flex-wrap gap-1">
                {path.finalPal.passives.map((passive) => (
                  <Badge key={passive.id} className={getRarityColor(passive.rarity)}>
                    {passive.name}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Breeding Steps:</h4>
              <BreedingTreeVisualizer breedingPath={path} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-palblue bg-opacity-30 rounded-md p-3">
                <h4 className="text-sm font-medium text-white mb-1">Required Eggs</h4>
                <p className="text-2xl font-bold text-palaccent">~{path.totalEggsRequired}</p>
                <p className="text-xs text-muted-foreground">
                  Estimated incubations for desired outcome
                </p>
              </div>
              
              <div className="bg-palblue bg-opacity-30 rounded-md p-3">
                <h4 className="text-sm font-medium text-white mb-1">Guild Members Needed</h4>
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {path.steps.flatMap(step => [step.mother, step.father])
                      .filter((pal, i, arr) => 
                        pal.guildMember && arr.findIndex(p => p.guildMember === pal.guildMember) === i
                      )
                      .slice(0, 3)
                      .map((pal, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-palblue">
                          <User className="h-4 w-4 text-palaccent" />
                        </div>
                      ))}
                  </div>
                  <p className="ml-3 text-muted-foreground text-xs">
                    {path.steps.flatMap(step => [step.mother, step.father])
                      .filter((pal, i, arr) => 
                        pal.guildMember && arr.findIndex(p => p.guildMember === pal.guildMember) === i
                      )
                      .map(pal => pal.guildMember)
                      .join(', ')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <Button className="w-full bg-palaccent hover:bg-palaccent-light">
                Select This Breeding Route
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
