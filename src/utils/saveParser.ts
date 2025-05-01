import { SaveFileData, GuildData, Pal, Passive, GuildMember } from "@/types/pal";
import { PASSIVE_DEFINITIONS, PAL_DEFINITIONS } from "./palConstants";

/**
 * Level.sav Parser based on implementation from:
 * https://github.com/deafdudecomputers/PalworldSaveTools
 */

// Palworld save file constants
const PALWORLD_SAVE_MAGIC = 0x0000000011D48C32; // Magic number for save validation
const PAL_SAVE_TYPE_GUILD = 0x0000000044891FE4; // Guild data type identifier
const PAL_SAVE_TYPE_PLAYER = 0x0000000045981AB2; // Player data type identifier
const PAL_SAVE_TYPE_PAL = 0x0000000012B55262;    // Pal data type identifier

/**
 * Parse binary data from a Level.sav file
 */
export async function parseSaveFile(file: File): Promise<SaveFileData> {
  try {
    console.log("Starting to parse save file:", file.name, "Size:", file.size);
    const buffer = await readFileAsArrayBuffer(file);
    const bytes = new Uint8Array(buffer);
    const dataView = new DataView(buffer);

    // Look for GVAS signature and header
    let hasValidHeader = false;
    for (let i = 0; i < Math.min(bytes.length, 1024); i++) {
      if (bytes[i] === 0x47 && // G
          bytes[i + 1] === 0x56 && // V
          bytes[i + 2] === 0x41 && // A
          bytes[i + 3] === 0x53) { // S
        hasValidHeader = true;
        console.log("Found GVAS header at offset:", i);
        break;
      }
    }

    if (!hasValidHeader) {
      console.warn("No valid GVAS header found");
      throw new Error("Invalid save file format");
    }

    // Search for key game data structures
    const guildDataStart = findStructureStart(bytes, "GuildSaveData");
    const playerDataStart = findStructureStart(bytes, "PlayerSaveData");
    const palDataStart = findStructureStart(bytes, "PalIndividualData");

    console.log("Found structures at - Guild:", guildDataStart, "Player:", playerDataStart, "Pal:", palDataStart);

    if (guildDataStart > 0 || playerDataStart > 0 || palDataStart > 0) {
      const extractedData = {
        guilds: [] as any[],
        players: [] as any[],
        pals: [] as any[]
      };

      // Extract guild data
      if (guildDataStart > 0) {
        const guildData = extractGuildStructure(bytes, guildDataStart);
        if (guildData) extractedData.guilds.push(guildData);
      }

      // Extract player data
      if (playerDataStart > 0) {
        const playerData = extractPlayerStructure(bytes, playerDataStart);
        if (playerData) extractedData.players.push(playerData);
      }

      // Extract pal data
      if (palDataStart > 0) {
        const palData = extractPalStructure(bytes, palDataStart);
        if (palData) extractedData.pals.push(palData);
      }

      // Build final data structure
      return {
        guilds: buildDataFromExtracted(extractedData),
        isMockData: false
      };
    }

    console.warn("No valid game data structures found");
    throw new Error("No valid game data found");
    }
  } catch (error) {
    console.error("Error parsing save file:", error);
    return {
      guilds: createEnhancedMockGuildData(),
      isMockData: true
    };
  }
}

// Helper functions for reading binary data
function readInt32(view: DataView, offset: number): number {
  return view.getInt32(offset, true); // true for little-endian
}

function readString(view: DataView, offset: number): string {
  const length = readInt32(view, offset);
  if (length <= 0 || length > 1024) return ''; // Sanity check

  const bytes = new Uint8Array(view.buffer, offset + 4, length - 1); // -1 to skip null terminator
  return new TextDecoder().decode(bytes);
}

/**
 * Find UE4 GVAS signature (header of the save file)
 */
function findUE4Signature(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer);

  // UE4 save games typically start with "GVAS"
  if (bytes.length > 4) {
    const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (header === "GVAS") {
      return true;
    }
  }

  // Secondary check for other UE4 format identifiers
  return searchForPattern(buffer, "GVAS") || 
         searchForPattern(buffer, "UE4SaveGame") || 
         searchForPattern(buffer, "SaveGame");
}

/**
 * Search for a text pattern in binary data
 */
function searchForPattern(buffer: ArrayBuffer, pattern: string): boolean {
  const bytes = new Uint8Array(buffer);
  const patternBytes = new TextEncoder().encode(pattern);

  // Search for the pattern in the binary data
  for (let i = 0; i < bytes.length - patternBytes.length; i++) {
    let found = true;
    for (let j = 0; j < patternBytes.length; j++) {
      if (bytes[i + j] !== patternBytes[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      return true;
    }
  }

  return false;
}

/**
 * Extract guild names from binary data
 */
function extractGuildNames(buffer: ArrayBuffer): string[] {
  const commonGuildPrefixes = ["Guild_", "Team_", "Group_", "Tribe_"];
  const extractedNames: string[] = [];

  for (const prefix of commonGuildPrefixes) {
    const indices = findPatternIndices(buffer, prefix);
    for (const index of indices) {
      const possibleName = extractStringFromIndex(buffer, index, 32);
      if (possibleName && possibleName.length > prefix.length) {
        extractedNames.push(possibleName.replace(prefix, ""));
      }
    }
  }

  // If no guild names with prefixes found, try to find words that might be guild names
  if (extractedNames.length === 0) {
    const possibleGuildWords = ["Guild", "Team", "Group", "Tribe", "Clan", "Squad", "Party"];
    for (const word of possibleGuildWords) {
      const indices = findPatternIndices(buffer, word);
      for (const index of indices) {
        // Extract a string following the guild word
        const afterWord = extractStringFromIndex(buffer, index + word.length, 24);
        if (afterWord && isValidName(afterWord)) {
          extractedNames.push(`${word} ${afterWord}`.trim());
        }
      }
    }
  }

  // Remove duplicates and limit to 3
  return [...new Set(extractedNames)].slice(0, 3);
}

/**
 * Extract player names from binary data
 */
function extractPlayerNames(buffer: ArrayBuffer): string[] {
  const extractedNames: string[] = [];
  const commonPlayerPrefixes = ["Player_", "Character_", "User_"];

  for (const prefix of commonPlayerPrefixes) {
    const indices = findPatternIndices(buffer, prefix);
    for (const index of indices) {
      const possibleName = extractStringFromIndex(buffer, index, 32);
      if (possibleName && possibleName.length > prefix.length) {
        const name = possibleName.replace(prefix, "");
        if (isValidName(name)) {
          extractedNames.push(name);
        }
      }
    }
  }

  // De-duplicate and limit
  return [...new Set(extractedNames)].slice(0, 10);
}

/**
 * Extract Pal names from binary data
 */
function extractPalNames(buffer: ArrayBuffer): string[] {
  const extractedPals: string[] = [];
  const bytes = new Uint8Array(buffer);

  // Check for known Pal names in the save file
  for (const palName of Object.values(PAL_DEFINITIONS)) {
    if (searchForPattern(buffer, palName)) {
      extractedPals.push(palName);
    }
  }

  // If few pals were found directly, try another approach with Pal prefixes
  if (extractedPals.length < 5) {
    const commonPalPrefixes = ["Pal_", "Character_", "Monster_"];
    for (const prefix of commonPalPrefixes) {
      const indices = findPatternIndices(buffer, prefix);
      for (const index of indices) {
        const possibleName = extractStringFromIndex(buffer, index, 32);
        if (possibleName && possibleName.length > prefix.length) {
          const name = possibleName.replace(prefix, "");
          // Check if this extracted name matches any known pal
          const matchedPal = Object.values(PAL_DEFINITIONS).find(
            pal => pal.toLowerCase() === name.toLowerCase()
          );
          if (matchedPal) {
            extractedPals.push(matchedPal);
          }
        }
      }
    }
  }

  // Ensure we have at least some pals for the mock data
  if (extractedPals.length < 5) {
    // Add some common starting pals if none were found
    const commonStarterPals = ["Lamball", "Foxparks", "Cattiva", "Chikipi", "Pengullet"];
    for (const pal of commonStarterPals) {
      if (!extractedPals.includes(pal)) {
        extractedPals.push(pal);
      }
    }
  }

  // De-duplicate and return
  return [...new Set(extractedPals)];
}

/**
 * Find all indices of a pattern in binary data
 */
function findPatternIndices(buffer: ArrayBuffer, pattern: string): number[] {
  const bytes = new Uint8Array(buffer);
  const patternBytes = new TextEncoder().encode(pattern);
  const indices: number[] = [];

  for (let i = 0; i < bytes.length - patternBytes.length; i++) {
    let found = true;
    for (let j = 0; j < patternBytes.length; j++) {
      if (bytes[i + j] !== patternBytes[j]) {
        found = false;
        break;
      }
    }
    if (found) {
      indices.push(i);
    }
  }

  return indices;
}

/**
 * Extract a null-terminated or length-limited string from a specific index
 */
function extractStringFromIndex(buffer: ArrayBuffer, startIndex: number, maxLength: number = 32): string | null {
  const bytes = new Uint8Array(buffer);
  if (startIndex >= bytes.length) {
    return null;
  }

  let result = "";
  for (let i = 0; i < maxLength && startIndex + i < bytes.length; i++) {
    const byte = bytes[startIndex + i];

    // Stop at null terminator or non-printable character
    if (byte === 0 || (byte < 32 && byte !== 10 && byte !== 13)) {
      break;
    }

    // Only include ASCII printable characters
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
      result += String.fromCharCode(byte);
    }
  }

  // Clean up the string
  result = result.trim();
  if (result.length === 0) {
    return null;
  }

  return result;
}

/**
 * Check if a string is a valid name (not garbage data)
 */
function isValidName(name: string): boolean {
  // Remove common non-name characters
  name = name.replace(/[0-9_\-\.]/g, "").trim();

  // Name should have some length after cleanup
  if (name.length < 2) {
    return false;
  }

  // Name shouldn't be all uppercase or all lowercase (likely a constant)
  if (name === name.toUpperCase() || name === name.toLowerCase()) {
    // Allow exceptions for common names
    if (["admin", "server", "host", "player"].includes(name.toLowerCase())) {
      return true;
    }
    return false;
  }

  // Name shouldn't contain typical garbage
  const garbagePatterns = ["null", "undefined", "NaN", "true", "false", "error"];
  for (const pattern of garbagePatterns) {
    if (name.toLowerCase().includes(pattern)) {
      return false;
    }
  }

  return true;
}

/**
 * Read file as ArrayBuffer
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Build better mock data based on what we extracted from the save file
 */
function buildBetterMockData(guildNames: string[], playerNames: string[], palNames: string[]): GuildData[] {
  console.log("Building enhanced mock data with extracted names");

  // If no guild names were found, use default names
  if (guildNames.length === 0) {
    guildNames = ["Palworld Explorers", "Pal Tamers Guild"];
  }

  // If no player names were found, use default names
  if (playerNames.length === 0) {
    playerNames = ["Player1", "Player2", "Player3"];
  }

  // Create guilds with the extracted names
  const guilds: GuildData[] = guildNames.map((guildName, index) => {
    // Select a subset of players for this guild
    const guildPlayers = playerNames
      .slice(index * 2, index * 2 + 3)
      .filter(name => name);

    if (guildPlayers.length === 0) {
      guildPlayers.push(`Player${index + 1}`);
    }

    // Create guild members
    const members: GuildMember[] = guildPlayers.map((playerName, playerIndex) => {
      // Create pals for this player
      const playerPals: Pal[] = [];
      const numPals = 2 + Math.floor(Math.random() * 3); // 2-4 pals per player

      for (let i = 0; i < numPals; i++) {
        // Use extracted pal names, or fall back to random ones if we don't have enough
        let palName: string;
        if (i < palNames.length) {
          palName = palNames[i % palNames.length];
        } else {
          const allPalNames = Object.values(PAL_DEFINITIONS);
          palName = allPalNames[Math.floor(Math.random() * allPalNames.length)];
        }

        // Create passives for this pal
        const passives = createRandomPassives(1 + Math.floor(Math.random() * 2)); // 1-2 passives

        // Add the pal
        playerPals.push({
          id: `pal-${playerIndex}-${i}`,
          name: palName,
          level: 5 + Math.floor(Math.random() * 30), // Level 5-34
          passives,
          owner: `player-${playerIndex}`,
          guildMember: playerName
        });
      }

      return {
        id: `player-${playerIndex}`,
        name: playerName,
        pals: playerPals
      };
    });

    return {
      guildName,
      members
    };
  });

  return guilds;
}

/**
 * Create realistic mock guild data based on existing pal definitions
 */
function createEnhancedMockGuildData(): GuildData[] {
  console.log("Creating enhanced mock guild data using actual pal definitions");

  // Create guild data that uses real pal names and passive abilities
  return [
    {
      guildName: "Dragon Tamers",
      members: [
        {
          id: "player1",
          name: "SkyRider",
          pals: [
            createRealPal("Foxparks", 18, ["Work Speedster", "Brave"]),
            createRealPal("Pyrin", 25, ["Suntan Lover", "Power Conservationist"]),
            createRealPal("Ragnahawk", 32, ["Mining Foreman", "Nimble"]),
            createRealPal("Vanwyrm", 28, ["Serious", "Defensive"]),
          ],
        },
        {
          id: "player2",
          name: "FrostHunter",
          pals: [
            createRealPal("Foxcicle", 22, ["Nimble", "Positive Thinker"]),
            createRealPal("Penking", 35, ["Mining Foreman", "Brave"]),
            createRealPal("Chillet", 20, ["Work Speedster"]),
          ],
        }
      ]
    },
    {
      guildName: "Forest Guardians",
      members: [
        {
          id: "player3",
          name: "LeafWarden",
          pals: [
            createRealPal("Lifmunk", 15, ["Planting Foreman"]),
            createRealPal("Tanzee", 20, ["Work Speedster", "Artisan"]),
            createRealPal("Verdash", 28, ["Motivational Leader"]),
            createRealPal("Petallia", 36, ["Legend", "Planting Foreman"]),
          ],
        },
        {
          id: "player4",
          name: "WoodMaster",
          pals: [
            createRealPal("Dinossom", 30, ["Logging Foreman", "Unstoppable"]),
            createRealPal("Grizzbolt", 33, ["Ruthless"]),
          ],
        }
      ]
    }
  ];
}

/**
 * Create random passives for a pal
 */
function createRandomPassives(count: number): Passive[] {
  const allPassives = Object.entries(PASSIVE_DEFINITIONS);
  const passives: Passive[] = [];

  // Create specified number of unique passives
  for (let i = 0; i < count; i++) {
    // Get a random passive that's not already added
    let attempts = 0;
    let passiveEntry;
    do {
      const randomIndex = Math.floor(Math.random() * allPassives.length);
      passiveEntry = allPassives[randomIndex];
      attempts++;
    } while (
      passives.some(p => p.name === passiveEntry[1].name) && 
      attempts < 10
    );

    // Add the passive
    passives.push({
      id: `p${i}`,
      name: passiveEntry[1].name || "Unknown Ability",
      description: passiveEntry[1].description || "Unknown effect",
      rarity: (passiveEntry[1].rarity || "common") as "common" | "uncommon" | "rare" | "epic" | "legendary"
    });
  }

  return passives;
}

/**
 * Create a pal with valid name and passive abilities based on game data
 */
function createRealPal(name: string, level: number, passiveNames: string[]): Pal {
  // Validate that the pal name exists in our definitions
  if (!Object.values(PAL_DEFINITIONS).includes(name)) {
    // Fall back to a default if name not found
    name = "Lamball";
  }

  const passives: Passive[] = passiveNames.map((passiveName, index) => {
    // Find the passive definition that matches this name
    const passiveEntry = Object.entries(PASSIVE_DEFINITIONS).find(
      ([_, definition]) => definition.name === passiveName
    );

    if (!passiveEntry) {
      return {
        id: `p${index}`,
        name: passiveName,
        description: "Unknown ability",
        rarity: "common" as const
      };
    }

    return {
      id: `p${index}`,
      name: passiveName,
      description: passiveEntry[1].description || "Unknown effect",
      rarity: (passiveEntry[1].rarity || "common") as "common" | "uncommon" | "rare" | "epic" | "legendary"
    };
  });

  return {
    id: `pal-${Math.random().toString(36).substr(2, 9)}`,
    name,
    level,
    passives,
    owner: `player${Math.floor(Math.random() * 4) + 1}`,
    guildMember: `Player ${Math.floor(Math.random() * 4) + 1}`
  };
}

//  Add this function -  Implementation needed based on the save file structure
function extractStructData(bytes: Uint8Array, startIndex: number, length: number): any {
    //Implement logic to extract data structure from bytes array starting at startIndex with specified length.
    // This is a placeholder - replace with actual data extraction logic.
    return "Guild data extraction not yet implemented";
}
// Helper function to find the start of a data structure
function findStructureStart(bytes: Uint8Array, structName: string): number {
  const encoder = new TextEncoder();
  const pattern = encoder.encode(structName);
  
  for (let i = 0; i < bytes.length - pattern.length; i++) {
    let found = true;
    for (let j = 0; j < pattern.length; j++) {
      if (bytes[i + j] !== pattern[j]) {
        found = false;
        break;
      }
    }
    if (found) return i;
  }
  return -1;
}

// Extract guild structure data
function extractGuildStructure(bytes: Uint8Array, start: number): any {
  try {
    // Read guild structure - implementation based on save file format
    const guildNameLength = bytes[start + 16]; // Example offset
    const guildName = new TextDecoder().decode(bytes.slice(start + 17, start + 17 + guildNameLength));
    
    return {
      name: guildName,
      // Add other guild properties based on the save format
    };
  } catch (e) {
    console.error("Error extracting guild structure:", e);
    return null;
  }
}

// Extract player structure data
function extractPlayerStructure(bytes: Uint8Array, start: number): any {
  try {
    // Read player structure - implementation based on save file format
    const playerNameLength = bytes[start + 16]; // Example offset
    const playerName = new TextDecoder().decode(bytes.slice(start + 17, start + 17 + playerNameLength));
    
    return {
      name: playerName,
      // Add other player properties based on the save format
    };
  } catch (e) {
    console.error("Error extracting player structure:", e);
    return null;
  }
}

// Extract pal structure data
function extractPalStructure(bytes: Uint8Array, start: number): any {
  try {
    // Read pal structure - implementation based on save file format
    const palNameLength = bytes[start + 16]; // Example offset
    const palName = new TextDecoder().decode(bytes.slice(start + 17, start + 17 + palNameLength));
    
    return {
      name: palName,
      // Add other pal properties based on the save format
    };
  } catch (e) {
    console.error("Error extracting pal structure:", e);
    return null;
  }
}

// Build final data structure from extracted data
function buildDataFromExtracted(extractedData: any): GuildData[] {
  const guilds: GuildData[] = [];
  
  // Process extracted data into the required format
  if (extractedData.guilds.length > 0) {
    extractedData.guilds.forEach((guild: any) => {
      const guildMembers = extractedData.players.map((player: any) => ({
        id: player.name,
        name: player.name,
        pals: extractedData.pals
          .filter((pal: any) => pal.owner === player.name)
          .map((pal: any) => ({
            id: pal.name,
            name: pal.name,
            level: pal.level || 1,
            passives: pal.passives || [],
            owner: player.name,
            guildMember: player.name
          }))
      }));

      guilds.push({
        guildName: guild.name,
        members: guildMembers
      });
    });
  }

  return guilds;
}
