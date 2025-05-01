
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { BreedingPath, GuildData, Pal, Passive } from "@/types/pal";
import BreedingTreeVisualizer from "./BreedingTreeVisualizer";
import { Plus, ArrowRight, User } from "lucide-react";

interface BreedingCalculatorProps {
  guild: GuildData;
}

export function BreedingCalculator({ guild }: BreedingCalculatorProps) {
  const [desiredPalType, setDesiredPalType] = useState<string>("");
  const [selectedPassives, setSelectedPassives] = useState<Passive[]>([]);
  const [availablePalTypes, setAvailablePalTypes] = useState<string[]>([]);
  const [availablePassives, setAvailablePassives] = useState<Passive[]>([]);
  const [calculatedPaths, setCalculatedPaths] = useState<BreedingPath[]>([]);
  const [prioritizeSpeed, setPrioritizeSpeed] = useState<number>(50);
  
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
    setDesiredPalType("");
    setSelectedPassives([]);
    setCalculatedPaths([]);
  }, [guild]);

  const togglePassive = (passive: Passive) => {
    const exists = selectedPassives.find(p => p.id === passive.id);
    if (exists) {
      setSelectedPassives(selectedPassives.filter(p => p.id !== passive.id));
    } else {
      setSelectedPassives([...selectedPassives, passive]);
    }
  };
  
  const calculateBreeding = () => {
    if (!desiredPalType || selectedPassives.length === 0) {
      return;
    }
    
    // This would be a complex algorithm in a real implementation
    // For now, we'll create mock breeding paths for demonstration
    
    // Simulate calculation delay
    setTimeout(() => {
      const mockPaths: BreedingPath[] = [
        {
          steps: [
            {
              mother: {
                id: "pal1",
                name: "Lamball",
                level: 15,
                passives: [{ id: "p1", name: "Quick", description: "Faster movement speed", rarity: "common" }],
                owner: "player1",
                guildMember: "Trainer1"
              },
              father: {
                id: "pal2",
                name: "Foxparks",
                level: 22,
                passives: [
                  { id: "p2", name: "Fire Affinity", description: "Increased fire damage", rarity: "uncommon" }
                ],
                owner: "player1",
                guildMember: "Trainer1"
              },
              possibleOffspring: [
                {
                  id: "offspring1",
                  name: "Lamball",
                  level: 1,
                  passives: [
                    { id: "p1", name: "Quick", description: "Faster movement speed", rarity: "common" },
                    { id: "p2", name: "Fire Affinity", description: "Increased fire damage", rarity: "uncommon" }
                  ],
                  owner: "",
                  guildMember: ""
                }
              ],
              probabilityForDesired: 0.25
            },
            {
              mother: {
                id: "offspring1",
                name: "Lamball",
                level: 1,
                passives: [
                  { id: "p1", name: "Quick", description: "Faster movement speed", rarity: "common" },
                  { id: "p2", name: "Fire Affinity", description: "Increased fire damage", rarity: "uncommon" }
                ],
                owner: "",
                guildMember: ""
              },
              father: {
                id: "pal3",
                name: "Pengullet",
                level: 18,
                passives: [
                  { id: "p3", name: "Ice Affinity", description: "Increased ice resistance", rarity: "uncommon" }
                ],
                owner: "player2",
                guildMember: "Trainer2"
              },
              possibleOffspring: [
                {
                  id: "finalOffspring",
                  name: desiredPalType,
                  level: 1,
                  passives: selectedPassives,
                  owner: "",
                  guildMember: ""
                }
              ],
              probabilityForDesired: 0.15
            }
          ],
          finalPal: {
            id: "finalPal",
            name: desiredPalType,
            level: 1,
            passives: selectedPassives,
            owner: "",
            guildMember: ""
          },
          totalEggsRequired: 10,
          probabilityOfSuccess: 0.15
        },
        {
          steps: [
            {
              mother: {
                id: "pal4",
                name: "Direhowl",
                level: 30,
                passives: [
                  { id: "p4", name: "Night Hunter", description: "Increased attack at night", rarity: "rare" }
                ],
                owner: "player3",
                guildMember: "Trainer3"
              },
              father: {
                id: "pal2",
                name: "Foxparks",
                level: 22,
                passives: [
                  { id: "p2", name: "Fire Affinity", description: "Increased fire damage", rarity: "uncommon" }
                ],
                owner: "player1",
                guildMember: "Trainer1"
              },
              possibleOffspring: [
                {
                  id: "finalOffspring2",
                  name: desiredPalType,
                  level: 1,
                  passives: selectedPassives.slice(0, 1),
                  owner: "",
                  guildMember: ""
                }
              ],
              probabilityForDesired: 0.08
            }
          ],
          finalPal: {
            id: "finalPal2",
            name: desiredPalType,
            level: 1,
            passives: selectedPassives.slice(0, 1),
            owner: "",
            guildMember: ""
          },
          totalEggsRequired: 15,
          probabilityOfSuccess: 0.08
        }
      ];
      
      setCalculatedPaths(mockPaths);
    }, 1000);
  };

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-500';
      case 'uncommon':
        return 'bg-green-500';
      case 'rare':
        return 'bg-blue-500';
      case 'epic':
        return 'bg-purple-500';
      case 'legendary':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Breeding Calculator</h2>
      
      <Tabs defaultValue="select" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-palblue border border-palblue-light">
          <TabsTrigger value="select" className="data-[state=active]:bg-palaccent">
            Select Pals
          </TabsTrigger>
          <TabsTrigger value="calculate" className="data-[state=active]:bg-palaccent">
            Calculate Routes
          </TabsTrigger>
          <TabsTrigger value="results" 
            disabled={calculatedPaths.length === 0}
            className="data-[state=active]:bg-palaccent">
            Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="select">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
          
          <div className="mt-6 space-y-4">
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
              onClick={calculateBreeding}
            >
              Calculate Breeding Routes <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="calculate">
          <div className="text-center py-12">
            {calculatedPaths.length === 0 ? (
              <div className="space-y-4">
                <div className="animate-spin mx-auto w-12 h-12 border-4 border-palaccent border-t-transparent rounded-full"></div>
                <p className="text-muted-foreground">Calculating optimal breeding routes...</p>
              </div>
            ) : (
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Calculation Complete!</h3>
                <p className="text-muted-foreground mb-6">
                  {calculatedPaths.length} possible breeding routes found
                </p>
                <Button 
                  className="bg-palaccent hover:bg-palaccent-light"
                  onClick={() => {
                    const resultsTab = document.querySelector('[data-value="results"]') as HTMLButtonElement;
                    if (resultsTab) {
                      resultsTab.click();
                    }
                  }}
                >
                  View Results <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="results">
          <div className="mt-4 space-y-8">
            {calculatedPaths.map((path, index) => (
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
                        {/* This would show icons for each guild member in a real implementation */}
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-palblue">
                            <User className="h-4 w-4 text-palaccent" />
                          </div>
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-palblue">
                            <User className="h-4 w-4 text-palaccent" />
                          </div>
                        </div>
                        <p className="ml-3 text-muted-foreground text-xs">
                          Trainer1, Trainer2
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BreedingCalculator;
