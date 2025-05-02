import { SaveFileData, GuildData, GuildMember, Pal, Passive } from "@/types/pal";
import { PASSIVE_DEFINITIONS, PAL_DEFINITIONS } from "./palConstants";

// Constants for GVAS parsing
const GVAS_HEADER = 0x47564153; // "GVAS" in hex
const GUILD_MARKER = 0x47444C47; // "GDLG" in hex
const PLAYER_MARKER = 0x504C5952; // "PLYR" in hex
const PAL_MARKER = 0x50414C53; // "PALS" in hex

interface GVASHeader {
  magic: number;
  version: number;
  saveType: number;
  contentLength: number;
}

export async function parseSaveFile(file: File): Promise<SaveFileData> {
  try {
    console.log("Starting to parse save file:", file.name, "Size:", file.size);
    const buffer = await readFileAsArrayBuffer(file);
    const bytes = new Uint8Array(buffer);
    const dataView = new DataView(buffer);

    // Find GVAS header
    let offset = findGVASHeader(bytes);
    if (offset === -1) {
      throw new Error("Invalid save file format - No GVAS header found");
    }

    // Parse GVAS header
    const header = parseGVASHeader(dataView, offset);
    offset += 16; // Move past header

    const extractedData = {
      guilds: [] as any[],
      players: [] as any[],
      pals: [] as any[]
    };

    // Parse content
    while (offset < bytes.length - 4) {
      const marker = dataView.getUint32(offset, true);
      offset += 4;

      switch (marker) {
        case GUILD_MARKER:
          const guildData = parseGuildData(dataView, offset);
          if (guildData) {
            extractedData.guilds.push(guildData);
            offset += guildData.length;
          }
          break;
        case PLAYER_MARKER:
          const playerData = parsePlayerData(dataView, offset);
          if (playerData) {
            extractedData.players.push(playerData);
            offset += playerData.length;
          }
          break;
        case PAL_MARKER:
          const palData = parsePalData(dataView, offset);
          if (palData) {
            extractedData.pals.push(palData);
            offset += palData.length;
          }
          break;
      }
    }

    // If we found valid data, return it
    if (extractedData.guilds.length > 0 || extractedData.players.length > 0) {
      return {
        guilds: buildDataFromExtracted(extractedData),
        isMockData: false
      };
    }

    throw new Error("No valid game data found");
  } catch (error) {
    console.error("Error parsing save file:", error);
    return {
      guilds: createEnhancedMockGuildData(),
      isMockData: true
    };
  }
}

function findGVASHeader(bytes: Uint8Array): number {
  for (let i = 0; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x47 && // G
        bytes[i + 1] === 0x56 && // V
        bytes[i + 2] === 0x41 && // A
        bytes[i + 3] === 0x53) { // S
      return i;
    }
  }
  return -1;
}

function parseGVASHeader(view: DataView, offset: number): GVASHeader {
  return {
    magic: view.getUint32(offset, true),
    version: view.getUint32(offset + 4, true),
    saveType: view.getUint32(offset + 8, true),
    contentLength: view.getUint32(offset + 12, true)
  };
}

function parseGuildData(view: DataView, offset: number): any {
  try {
    const nameLength = view.getUint32(offset, true);
    const nameBytes = new Uint8Array(view.buffer, offset + 4, nameLength);
    const name = new TextDecoder().decode(nameBytes);

    return {
      name,
      length: 4 + nameLength
    };
  } catch (e) {
    console.error("Error parsing guild data:", e);
    return null;
  }
}

function parsePlayerData(view: DataView, offset: number): any {
  try {
    const nameLength = view.getUint32(offset, true);
    const nameBytes = new Uint8Array(view.buffer, offset + 4, nameLength);
    const name = new TextDecoder().decode(nameBytes);

    return {
      name,
      length: 4 + nameLength
    };
  } catch (e) {
    console.error("Error parsing player data:", e);
    return null;
  }
}

function parsePalData(view: DataView, offset: number): any {
  try {
    const nameLength = view.getUint32(offset, true);
    const nameBytes = new Uint8Array(view.buffer, offset + 4, nameLength);
    const name = new TextDecoder().decode(nameBytes);
    const level = view.getUint32(offset + 4 + nameLength, true);

    return {
      name,
      level,
      length: 8 + nameLength
    };
  } catch (e) {
    console.error("Error parsing pal data:", e);
    return null;
  }
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Keep existing helper functions
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

function buildDataFromExtracted(extractedData: any): GuildData[] {
  const guilds: GuildData[] = [];

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
            passives: [], // We'll need to implement passive extraction
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

function readInt32(view: DataView, offset: number): number {
  return view.getInt32(offset, true); // true for little-endian
}

function readString(view: DataView, offset: number): string {
  const length = readInt32(view, offset);
  if (length <= 0 || length > 1024) return ''; // Sanity check

  const bytes = new Uint8Array(view.buffer, offset + 4, length - 1); // -1 to skip null terminator
  return new TextDecoder().decode(bytes);
}

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


// Removed redundant functions from original code as they are no longer needed with the new parsing logic.