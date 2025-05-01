
import { BreedingPath, BreedingPair, Pal, Passive, GuildData } from "@/types/pal";

/**
 * Breeding algorithm based on Palworld mechanics
 * References:
 * - https://palworld.fandom.com/wiki/Breeding
 * - https://github.com/palworld-community/breeding-calculator
 */

// Compatibility chart for determining offspring species
// In a real implementation, this would be a complete compatibility matrix
const BREEDING_COMPATIBILITY: Record<string, Record<string, string>> = {
  "Lamball": {
    "Foxparks": "Cattiva",
    "Pengullet": "Chikipi",
    "Direhowl": "Vixy",
    "Mozzarina": "Woolipop"
  },
  "Foxparks": {
    "Lamball": "Cattiva",
    "Pengullet": "Sparkit",
    "Direhowl": "Nox"
  },
  "Pengullet": {
    "Lamball": "Chikipi",
    "Foxparks": "Sparkit",
    "Direhowl": "Jolthog"
  },
  "Direhowl": {
    "Lamball": "Vixy",
    "Foxparks": "Nox",
    "Pengullet": "Jolthog"
  },
  "Mozzarina": {
    "Lamball": "Woolipop",
    "Foxparks": "Cremis",
    "Pengullet": "Teafant"
  },
  // Many more combinations would be defined here
};

// Base egg requirements based on rarity of desired traits
const BASE_EGG_REQUIREMENTS: Record<string, number> = {
  "common": 3,
  "uncommon": 5,
  "rare": 8,
  "epic": 15,
  "legendary": 25
};

/**
 * Calculate breeding paths to obtain a Pal with desired traits
 * @param guildData Guild data with available Pals
 * @param targetPalType Desired Pal species
 * @param desiredPassives Desired passive abilities
 * @param prioritizeSpeed Balance between speed (fewer steps) and quality (more desired passives)
 * @returns Array of possible breeding paths
 */
export function calculateBreedingPaths(
  guildData: GuildData,
  targetPalType: string,
  desiredPassives: Passive[],
  prioritizeSpeed: number // 0-100, higher means prioritize speed over quality
): BreedingPath[] {
  console.log(`Calculating breeding paths for ${targetPalType} with ${desiredPassives.length} passives`);
  console.log(`Speed priority: ${prioritizeSpeed}`);
  
  // Get all available Pals across guild members
  const availablePals = guildData.members.flatMap(member => member.pals);
  
  // First, try to find direct breeding pairs that could produce the target
  const directPairs = findDirectBreedingPairs(availablePals, targetPalType, desiredPassives);
  
  // Then, try to find multi-step breeding paths
  const multiStepPaths = findMultiStepBreedingPaths(
    availablePals, 
    targetPalType, 
    desiredPassives, 
    prioritizeSpeed
  );
  
  // Combine and sort by probability of success (higher is better)
  const allPaths = [...directPairs, ...multiStepPaths].sort(
    (a, b) => b.probabilityOfSuccess - a.probabilityOfSuccess
  );
  
  // Return the top results (limit to prevent overwhelming the UI)
  return allPaths.slice(0, 5);
}

/**
 * Find direct breeding pairs that could produce the target
 */
function findDirectBreedingPairs(
  availablePals: Pal[],
  targetPalType: string,
  desiredPassives: Passive[]
): BreedingPath[] {
  const paths: BreedingPath[] = [];
  
  // Try all possible pairs of Pals
  for (let i = 0; i < availablePals.length; i++) {
    for (let j = i + 1; j < availablePals.length; j++) {
      const pal1 = availablePals[i];
      const pal2 = availablePals[j];
      
      // Check if this combination can produce the target species
      const offspring = getOffspring(pal1.name, pal2.name);
      if (offspring !== targetPalType) {
        continue;
      }
      
      // Calculate how many of the desired passives would be inherited
      const inheritedPassives = calculateInheritedPassives(pal1, pal2, desiredPassives);
      
      // Calculate probability of getting all desired passives
      const probability = calculatePassiveProbability(pal1, pal2, desiredPassives);
      
      // Create a breeding pair
      const breedingPair: BreedingPair = {
        mother: pal1,
        father: pal2,
        possibleOffspring: [
          {
            id: `offspring-${Math.random().toString(36).substr(2, 9)}`,
            name: targetPalType,
            level: 1,
            passives: inheritedPassives,
            owner: "",
            guildMember: ""
          }
        ],
        probabilityForDesired: probability
      };
      
      // Create a breeding path with this single step
      paths.push({
        steps: [breedingPair],
        finalPal: breedingPair.possibleOffspring[0],
        totalEggsRequired: calculateTotalEggs(desiredPassives, probability),
        probabilityOfSuccess: probability
      });
    }
  }
  
  return paths;
}

/**
 * Find multi-step breeding paths to achieve the desired Pal with passives
 */
function findMultiStepBreedingPaths(
  availablePals: Pal[],
  targetPalType: string,
  desiredPassives: Passive[],
  prioritizeSpeed: number
): BreedingPath[] {
  // For more complex breeding paths, we'd implement a graph search algorithm
  // This is simplified for demonstration purposes
  
  const paths: BreedingPath[] = [];
  
  // Try to find intermediary breeding steps that could lead to the target
  // This is a simplified version focusing on 2-step breeding
  
  // First find all possible first-step breedings
  const possibleFirstSteps: BreedingPair[] = [];
  
  for (let i = 0; i < availablePals.length; i++) {
    for (let j = i + 1; j < availablePals.length; j++) {
      const pal1 = availablePals[i];
      const pal2 = availablePals[j];
      
      const offspring = getOffspring(pal1.name, pal2.name);
      if (!offspring) continue;
      
      // Check if this offspring carries any of the desired passives
      const inheritedPassives = calculateInheritedPassives(pal1, pal2, desiredPassives);
      if (inheritedPassives.length === 0) continue;
      
      const probability = calculatePassiveProbability(pal1, pal2, desiredPassives);
      
      possibleFirstSteps.push({
        mother: pal1,
        father: pal2,
        possibleOffspring: [
          {
            id: `offspring-${Math.random().toString(36).substr(2, 9)}`,
            name: offspring,
            level: 1,
            passives: inheritedPassives,
            owner: "",
            guildMember: ""
          }
        ],
        probabilityForDesired: probability
      });
    }
  }
  
  // Now try to breed the results of the first step with existing Pals to get the target
  for (const firstStep of possibleFirstSteps) {
    const intermediaryOffspring = firstStep.possibleOffspring[0];
    
    for (const existingPal of availablePals) {
      const secondGenOffspring = getOffspring(intermediaryOffspring.name, existingPal.name);
      if (secondGenOffspring !== targetPalType) continue;
      
      // Calculate inheritances for second step
      const finalInheritedPassives = calculateInheritedPassives(
        intermediaryOffspring, 
        existingPal, 
        desiredPassives
      );
      
      // Create the second breeding pair
      const secondStep: BreedingPair = {
        mother: intermediaryOffspring,
        father: existingPal,
        possibleOffspring: [
          {
            id: `final-${Math.random().toString(36).substr(2, 9)}`,
            name: targetPalType,
            level: 1,
            passives: finalInheritedPassives,
            owner: "",
            guildMember: ""
          }
        ],
        probabilityForDesired: calculatePassiveProbability(intermediaryOffspring, existingPal, desiredPassives)
      };
      
      // Calculate overall probability
      const overallProbability = firstStep.probabilityForDesired * secondStep.probabilityForDesired;
      
      const totalEggs = calculateTotalEggs(desiredPassives, overallProbability);
      
      // Create the complete path
      paths.push({
        steps: [firstStep, secondStep],
        finalPal: secondStep.possibleOffspring[0],
        totalEggsRequired: totalEggs,
        probabilityOfSuccess: overallProbability
      });
    }
  }
  
  return paths;
}

/**
 * Get the offspring species from two parent species
 */
function getOffspring(species1: string, species2: string): string | null {
  // Check direct combination
  if (BREEDING_COMPATIBILITY[species1]?.[species2]) {
    return BREEDING_COMPATIBILITY[species1][species2];
  }
  
  // Check reverse combination
  if (BREEDING_COMPATIBILITY[species2]?.[species1]) {
    return BREEDING_COMPATIBILITY[species2][species1];
  }
  
  // No compatible breeding
  return null;
}

/**
 * Calculate which passives would be inherited by offspring
 */
function calculateInheritedPassives(pal1: Pal, pal2: Pal, desiredPassives: Passive[]): Passive[] {
  const inheritedPassives: Passive[] = [];
  
  // In Palworld, offspring can inherit passives from either parent with some probability
  // For simplicity, we'll assume each passive has a 50% chance of being inherited
  
  // Check if any of the desired passives are present in the parents
  for (const desiredPassive of desiredPassives) {
    const pal1HasPassive = pal1.passives.some(p => p.name === desiredPassive.name);
    const pal2HasPassive = pal2.passives.some(p => p.name === desiredPassive.name);
    
    // If both parents have the passive, it's guaranteed to be inherited
    if (pal1HasPassive && pal2HasPassive) {
      inheritedPassives.push(desiredPassive);
    }
    // If only one parent has it, 50% chance
    else if (pal1HasPassive || pal2HasPassive) {
      // We'll be optimistic for UI purposes and assume it gets inherited
      // The actual probability is factored into the overall calculation
      inheritedPassives.push(desiredPassive);
    }
  }
  
  return inheritedPassives;
}

/**
 * Calculate the probability of getting all desired passives
 */
function calculatePassiveProbability(pal1: Pal, pal2: Pal, desiredPassives: Passive[]): number {
  let probability = 1.0;
  
  for (const desiredPassive of desiredPassives) {
    const pal1HasPassive = pal1.passives.some(p => p.name === desiredPassive.name);
    const pal2HasPassive = pal2.passives.some(p => p.name === desiredPassive.name);
    
    if (pal1HasPassive && pal2HasPassive) {
      // Guaranteed inheritance (100%)
      probability *= 1.0;
    } else if (pal1HasPassive || pal2HasPassive) {
      // 50% chance if only one parent has it
      probability *= 0.5;
    } else {
      // No parents have this passive
      probability *= 0.05; // Small chance of mutation (5%)
    }
  }
  
  return probability;
}

/**
 * Calculate total eggs required based on desired traits and probability
 */
function calculateTotalEggs(desiredPassives: Passive[], probability: number): number {
  // Calculate base requirement from passive rarities
  let baseRequirement = desiredPassives.reduce((sum, passive) => {
    return sum + (BASE_EGG_REQUIREMENTS[passive.rarity] || 5);
  }, 10); // Start with a base of 10
  
  // Adjust for probability (lower probability means more eggs needed)
  return Math.round(baseRequirement / probability);
}
