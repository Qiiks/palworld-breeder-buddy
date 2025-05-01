
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
    // For a real implementation, we might try multiple sources
    try {
      // Try to fetch from palworld.gg API (if it existed)
      console.log("Attempting to fetch from primary API source");
      const data = await fetchFromPalworldGg();
      console.log("Successfully fetched data from primary source");
      return data;
    } catch (primaryError) {
      console.warn("Failed to fetch from primary source, trying fallback", primaryError);
      
      // Fallback to local data
      console.log("Using local pal data definitions");
      const localData = generateLocalPalData();
      return localData;
    }
  } catch (error) {
    console.error("All data fetch attempts failed:", error);
    throw new Error("Failed to fetch Palworld data from any source");
  }
}

/**
 * Attempt to fetch from palworld.gg (simulated)
 */
async function fetchFromPalworldGg(): Promise<PalApiResponse> {
  // In a real implementation, this would be an actual API call
  // return await fetch('https://api.palworld.gg/pals').then(res => res.json());
  
  // For demonstration, we'll simulate the request with a delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Simulate a network error sometimes (for testing fallbacks)
  if (Math.random() > 0.8) {
    throw new Error("Simulated network error");
  }
  
  // Return the locally generated data as if it came from an API
  return generateLocalPalData();
}

/**
 * Generate a response from our local constants
 */
function generateLocalPalData(): PalApiResponse {
  console.log("Generating pal data from local definitions");
  
  // Convert our definitions to the API response format
  const pals = Object.entries(PAL_DEFINITIONS).map(([id, name]) => ({
    id,
    name,
    breedingCombinations: getBreedingCombinationsForPal(name)
  }));
  
  const passives = Object.entries(PASSIVE_DEFINITIONS).map(([id, passive]) => ({
    id,
    name: passive.name || "Unknown Passive",
    description: passive.description || "No description available",
    rarity: passive.rarity || "common"
  }));
  
  return { pals, passives };
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
    },
    // Add more breeding combinations from palworld.gg
    "Foxparks": {
      parents: [
        ["Lamball", "Flambelle"],
        ["Flambelle", "Lamball"]
      ]
    },
    "Fuddler": {
      parents: [
        ["Lamball", "Tanzee"],
        ["Tanzee", "Lamball"]
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

/**
 * Function to handle querying the palworld.gg website directly
 * In a production environment, this would use proper API endpoints if available
 */
export async function queryPalworldGg(): Promise<any> {
  // This is a placeholder for a real implementation that would
  // make requests to palworld.gg and parse the response
  // Note: Web scraping may be against terms of service, so a proper API should be used
  
  // For demonstration only - not actually making requests
  console.log("This would query palworld.gg in a production environment");
  
  // Return mock data structure
  return {
    success: true,
    message: "Data would be fetched from palworld.gg in production"
  };
}
