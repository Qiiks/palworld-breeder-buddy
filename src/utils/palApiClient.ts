
/**
 * Client for fetching Palworld data from external APIs/sources
 */

import { Pal, Passive } from "@/types/pal";
import { PAL_DEFINITIONS, PASSIVE_DEFINITIONS } from "./palConstants";

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
    
    // For now, we'll generate a response from our constants
    console.log("Fetching Palworld data from API (simulation)");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    // Convert our definitions to the API response format
    const pals = Object.entries(PAL_DEFINITIONS).map(([id, name]) => ({
      id,
      name,
      // We'll add breeding combinations in a future update
      breedingCombinations: getBreedingCombinationsForPal(name)
    }));
    
    const passives = Object.entries(PASSIVE_DEFINITIONS).map(([id, passive]) => ({
      id,
      name: passive.name || "Unknown Passive",
      description: passive.description || "No description available",
      rarity: passive.rarity || "common"
    }));
    
    return { pals, passives };
  } catch (error) {
    console.error("Error fetching Palworld data:", error);
    throw new Error("Failed to fetch Palworld data");
  }
}

/**
 * Get breeding combinations for a specific pal
 * Based on data from palworld.gg breeding calculator
 */
function getBreedingCombinationsForPal(palName: string): { pal1: string, pal2: string, result: string }[] {
  // Breeding combinations database (based on palworld.gg)
  const BREEDING_COMBINATIONS: Record<string, { parents: [string, string][] }> = {
    "Mozzarina": {
      parents: [
        ["Lamball", "Cattiva"],
        ["Cattiva", "Lamball"]
      ]
    },
    "Kingpaca": {
      parents: [
        ["Pengullet", "Chillet"],
        ["Chillet", "Pengullet"]
      ]
    },
    "Teafant": {
      parents: [
        ["Lamball", "Fuack"],
        ["Fuack", "Lamball"]
      ]
    },
    "Melpaca": {
      parents: [
        ["Lamball", "Lifmunk"],
        ["Lifmunk", "Lamball"],
        ["Cattiva", "Lifmunk"],
        ["Lifmunk", "Cattiva"]
      ]
    }
  };
  
  const combinations: { pal1: string, pal2: string, result: string }[] = [];
  
  // If this pal is the result of breeding, add the combinations
  if (BREEDING_COMBINATIONS[palName]) {
    BREEDING_COMBINATIONS[palName].parents.forEach(([parent1, parent2]) => {
      combinations.push({
        pal1: parent1,
        pal2: parent2,
        result: palName
      });
    });
  }
  
  // Also check if this pal is a parent in any combinations
  Object.entries(BREEDING_COMBINATIONS).forEach(([result, data]) => {
    data.parents.forEach(([parent1, parent2]) => {
      if (parent1 === palName || parent2 === palName) {
        combinations.push({
          pal1: parent1,
          pal2: parent2,
          result
        });
      }
    });
  });
  
  return combinations;
}

/**
 * Retrieves compatible breeding pairs for a specific Pal
 * @param palName The name of the Pal
 * @returns Array of compatible breeding pairs
 */
export async function getCompatibleBreedingPairs(palName: string): Promise<{pal1: string, pal2: string, result: string}[]> {
  try {
    // This would ideally query an API or scrape data from palworld.gg in a production environment
    
    // For demonstration, we'll use our built-in breeding data
    return getBreedingCombinationsForPal(palName);
  } catch (error) {
    console.error(`Error getting breeding pairs for ${palName}:`, error);
    return [];
  }
}

/**
 * Get all available pals as an array
 * Useful for UI components that need a complete list
 */
export function getAllPals(): string[] {
  return Object.values(PAL_DEFINITIONS);
}

/**
 * Get all available passives
 * Useful for UI components that need a complete list
 */
export function getAllPassives(): Partial<Passive>[] {
  return Object.values(PASSIVE_DEFINITIONS);
}

/**
 * Gets comprehensive details for a specific pal
 * @param palName The name of the pal
 */
export async function getPalDetails(palName: string): Promise<{
  name: string;
  compatiblePairs: {pal1: string, pal2: string, result: string}[];
  commonPassives: Partial<Passive>[];
}> {
  const breedingPairs = await getCompatibleBreedingPairs(palName);
  
  // In a real implementation, this would fetch from an API
  // For now, we'll assign random common passives
  const allPassives = Object.values(PASSIVE_DEFINITIONS);
  const commonPassives = allPassives
    .filter(p => p.rarity === 'common' || p.rarity === 'uncommon')
    .sort(() => 0.5 - Math.random()) // Shuffle
    .slice(0, 3); // Take 3 random passives
    
  return {
    name: palName,
    compatiblePairs: breedingPairs,
    commonPassives
  };
}
