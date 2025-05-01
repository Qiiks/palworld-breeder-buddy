
import { BreedingPath } from "@/types/pal";
import { Badge } from "@/components/ui/badge";

interface BreedingTreeVisualizerProps {
  breedingPath: BreedingPath;
}

export function BreedingTreeVisualizer({ breedingPath }: BreedingTreeVisualizerProps) {
  const { steps } = breedingPath;
  
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
    <div className="w-full overflow-x-auto">
      <div className="breeding-path min-w-[600px]">
        {/* For simplification, we're representing a linear breeding path */}
        {/* In a real implementation, this would be a tree structure */}
        
        {steps.map((step, stepIndex) => (
          <div key={stepIndex} className="mb-8">
            <div className="flex justify-between items-start relative">
              {/* Parent 1 */}
              <div className="w-[45%]">
                <div className="tree-node p-3 bg-palblue bg-opacity-40 rounded-lg border border-palblue">
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-muted mr-2"></div>
                    <div>
                      <h5 className="text-sm font-medium text-white">{step.mother.name}</h5>
                      <p className="text-xs text-muted-foreground">
                        {step.mother.owner ? `Owner: ${step.mother.guildMember}` : "Bred Pal"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Passives:</p>
                    <div className="flex flex-wrap gap-1">
                      {step.mother.passives.map((passive) => (
                        <Badge key={passive.id} className={`text-xs px-1 py-0 ${getRarityColor(passive.rarity)}`}>
                          {passive.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Parent 2 */}
              <div className="w-[45%]">
                <div className="tree-node p-3 bg-palblue bg-opacity-40 rounded-lg border border-palblue">
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-muted mr-2"></div>
                    <div>
                      <h5 className="text-sm font-medium text-white">{step.father.name}</h5>
                      <p className="text-xs text-muted-foreground">
                        {step.father.owner ? `Owner: ${step.father.guildMember}` : "Bred Pal"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Passives:</p>
                    <div className="flex flex-wrap gap-1">
                      {step.father.passives.map((passive) => (
                        <Badge key={passive.id} className={`text-xs px-1 py-0 ${getRarityColor(passive.rarity)}`}>
                          {passive.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Connecting lines */}
              <div className="tree-connector left-[22.5%] top-[40px] -translate-x-1/2 rotate-45"></div>
              <div className="tree-connector right-[22.5%] top-[40px] translate-x-1/2 -rotate-45"></div>
            </div>
            
            {/* Offspring */}
            <div className="flex justify-center mt-8">
              <div className="w-[45%]">
                <div className="tree-node p-3 bg-palaccent bg-opacity-20 rounded-lg border border-palaccent animate-pulse-light">
                  <div className="flex items-center mb-1">
                    <div className="w-6 h-6 rounded-full bg-muted mr-2"></div>
                    <div>
                      <h5 className="text-sm font-medium text-white">
                        {step.possibleOffspring[0].name}
                      </h5>
                      <div className="flex items-center">
                        <span className="text-xs bg-palaccent bg-opacity-40 text-white rounded px-1 py-0.5">
                          Offspring
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">
                          {Math.round(step.probabilityForDesired * 100)}% chance
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Passives:</p>
                    <div className="flex flex-wrap gap-1">
                      {step.possibleOffspring[0].passives.map((passive) => (
                        <Badge key={passive.id} className={`text-xs px-1 py-0 ${getRarityColor(passive.rarity)}`}>
                          {passive.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Final Result */}
        <div className="flex justify-center">
          <div className="w-[45%]">
            <div className="tree-node p-3 bg-green-500 bg-opacity-20 rounded-lg border border-green-500">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-green-500 bg-opacity-30 mr-2 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-white">{breedingPath.finalPal.name}</h5>
                  <div className="flex items-center">
                    <span className="text-xs bg-green-500 bg-opacity-40 text-white rounded px-1 py-0.5">
                      Final Result
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Target Passives:</p>
                <div className="flex flex-wrap gap-1">
                  {breedingPath.finalPal.passives.map((passive) => (
                    <Badge key={passive.id} className={`text-xs px-1 py-0 ${getRarityColor(passive.rarity)}`}>
                      {passive.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BreedingTreeVisualizer;
