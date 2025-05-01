// Define types for Palworld data

export interface Pal {
  id: string;
  name: string;
  level: number;
  passives: Passive[];
  owner: string;
  guildMember: string;
  imageUrl?: string; // For future use with actual images
}

export interface Passive {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface BreedingPair {
  mother: Pal;
  father: Pal;
  possibleOffspring: Pal[];
  probabilityForDesired: number;
}

export interface BreedingPath {
  steps: BreedingPair[];
  finalPal: Pal;
  totalEggsRequired: number;
  probabilityOfSuccess: number;
}

export interface GuildData {
  guildName: string;
  members: GuildMember[];
}

export interface GuildMember {
  id: string;
  name: string;
  pals: Pal[];
}

// Mock data types for demonstration
export interface SaveFileData {
  guilds: GuildData[];
  // Other data from Level.sav
}
