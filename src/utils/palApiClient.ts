
/**
 * Client for fetching Palworld data from external APIs/sources
 */

import { Pal, Passive } from "@/types/pal";

interface PalApiResponse {
  pals: {
    id: string;
    name: string;
    breedingCombinations?: {
      pal1: string;
      pal2: string;
      result: string;
    }[];
    possiblePassives?: {
      name: string;
      rarity: string;
      description: string;
    }[];
  }[];
  passives: {
    id: string;
    name: string;
    description: string;
    rarity: string;
  }[];
}

/**
 * Fetches Pal data from external sources
 * This function could be connected to an actual API in the future
 */
export async function fetchPalData(): Promise<PalApiResponse> {
  try {
    // In a real implementation, this would fetch from an actual API:
    // return await fetch('https://api.palworld.gg/pals').then(res => res.json());
    
    // For now, we'll simulate the API response
    console.log("Fetching Palworld data from API (simulation)");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    return {
      pals: [
        // These would be filled with complete data from the API
        { id: "1", name: "Lamball" },
        { id: "2", name: "Cattiva" },
        { id: "3", name: "Lifmunk" },
        { id: "4", name: "Foxparks" },
        { id: "5", name: "Fuack" },
      ],
      passives: [
        { 
          id: "1", 
          name: "Work Speedster", 
          description: "Increases work speed", 
          rarity: "common" 
        },
        { 
          id: "2", 
          name: "Suntan Lover", 
          description: "Higher efficiency during daytime", 
          rarity: "common" 
        },
        { 
          id: "3", 
          name: "Artisan", 
          description: "Improves product quality", 
          rarity: "uncommon" 
        },
      ]
    };
  } catch (error) {
    console.error("Error fetching Palworld data:", error);
    throw new Error("Failed to fetch Palworld data");
  }
}

/**
 * Retrieves compatible breeding pairs for a specific Pal
 * @param palName The name of the Pal
 * @returns Array of compatible breeding pairs
 */
export async function getCompatibleBreedingPairs(palName: string): Promise<{pal1: string, pal2: string, result: string}[]> {
  // This would query an API or parse data from palworld.gg
  // For now we'll return static data
  
  // This would be based on data scraped from palworld.gg or other sources
  const mockData: Record<string, {pal1: string, pal2: string, result: string}[]> = {
    "Mozzarina": [
      { pal1: "Lamball", pal2: "Cattiva", result: "Mozzarina" },
      { pal1: "Cattiva", pal2: "Lamball", result: "Mozzarina" }
    ],
    "Kingpaca": [
      { pal1: "Pengullet", pal2: "Chillet", result: "Kingpaca" },
      { pal1: "Chillet", pal2: "Pengullet", result: "Kingpaca" }
    ]
  };
  
  return mockData[palName] || [];
}
