import { SaveFileData, GuildData, GuildMember, Pal, Passive } from "@/types/pal";
import { inflate } from 'pako';

// Save file format constants
const SAV_MAGIC = 0x014B0622;  // First 4 bytes of a .sav file
const GVAS_MAGIC = 0x53415647; // "GVAS" in hex - Note: Stored as little-endian

// GVAS Property Types
const PROPERTY_TYPES = {
  StructProperty: "StructProperty",
  ArrayProperty: "ArrayProperty",
  MapProperty: "MapProperty",
  NameProperty: "NameProperty",
  StrProperty: "StrProperty",
  BoolProperty: "BoolProperty",
  EnumProperty: "EnumProperty",
  IntProperty: "IntProperty",
  Int64Property: "Int64Property",
  FloatProperty: "FloatProperty",
  ObjectProperty: "ObjectProperty"
};

interface GvasProperty {
  type: string;
  name: string;
  value: any;
}

interface GvasHeader {
  magic: number;
  version: number;
  packageFlags: number;
  engineVersion: { major: number, minor: number, patch: number };
  customVersion: number;
  saveGameVersion: number;
}

// Helper functions for reading GVAS data
function readString(view: DataView, offset: number): { str: string, newOffset: number } {
  try {
    const length = view.getInt32(offset, true);
    offset += 4;
    
    if (length === 0) {
      return { str: "", newOffset: offset };
    }

    // Check if string is UTF-16 encoded
    const isUtf16 = length < 0;
    const textLength = Math.abs(length);

    // Skip encoding flag for non-empty strings
    if (textLength > 0) {
      offset += 4;
    }

    // Ensure we don't try to read past the buffer
    if (offset + textLength > view.byteLength) {
      console.warn(`String read would exceed buffer bounds: ${offset} + ${textLength} > ${view.byteLength}`);
      return { str: "", newOffset: offset };
    }

    const bytes = new Uint8Array(view.buffer.slice(view.byteOffset + offset, view.byteOffset + offset + textLength));
    const decoder = new TextDecoder(isUtf16 ? "utf-16le" : "utf-8");
    
    return {
      str: decoder.decode(bytes).replace(/\0$/, ""),
      newOffset: offset + textLength
    };
  } catch (e) {
    console.warn("Error reading string at offset", offset, e);
    return { str: "", newOffset: offset };
  }
}

function readGuid(view: DataView, offset: number): { guid: string, newOffset: number } {
  const guid = Array.from({ length: 16 }, (_, i) => 
    view.getUint8(offset + i).toString(16).padStart(2, '0')
  ).join('');
  return { guid, newOffset: offset + 16 };
}

function parseGvasHeader(view: DataView): GvasHeader {
  const gvasMagic = view.getUint32(0, true); // Read as little-endian
  console.log("GVAS Magic found:", gvasMagic.toString(16));
  
  // Convert to string to check - this is more reliable than comparing numbers
  const magicStr = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (magicStr !== 'GVAS') {
    throw new Error(`Invalid GVAS header: ${magicStr}`);
  }

  // Read version info
  const version = view.getUint32(4, true);
  const packageFlags = view.getUint32(8, true);
  
  // Read engine version (6 bytes)
  const engineVersion = {
    major: view.getUint16(12, true),
    minor: view.getUint16(14, true),
    patch: view.getUint16(16, true)
  };

  // Skip 2 bytes padding after engine version
  const customVersion = view.getUint32(20, true);
  const saveGameVersion = view.getUint32(24, true);

  console.log("GVAS Header:", {
    magicStr,
    version,
    packageFlags,
    engineVersion,
    customVersion,
    saveGameVersion
  });

  return {
    magic: gvasMagic,
    version,
    packageFlags,
    engineVersion,
    customVersion,
    saveGameVersion
  };
}

function parseGvasProperties(view: DataView, startOffset: number): { properties: { [key: string]: any }, newOffset: number } {
  let offset = startOffset;
  const properties: { [key: string]: any } = {};
  
  try {
    while (offset < view.byteLength - 8) { // Need at least 8 bytes for property name length + null terminator
      // Read property name
      const { str: propertyName, newOffset: afterName } = readString(view, offset);
      offset = afterName;

      if (!propertyName || propertyName === "None") {
        break;
      }

      // Read property type
      const { str: propertyType, newOffset: afterType } = readString(view, offset);
      offset = afterType;

      console.log("Parsing property:", { propertyName, propertyType, offset });

      // Read property size for some types
      let propertySize = 0;
      if ([PROPERTY_TYPES.StrProperty, PROPERTY_TYPES.ArrayProperty, 
           PROPERTY_TYPES.MapProperty, PROPERTY_TYPES.StructProperty].includes(propertyType)) {
        propertySize = view.getInt32(offset, true);
        offset += 4;
      }

      let value: any;
      
      switch (propertyType) {
        case PROPERTY_TYPES.StructProperty: {
          // Read struct type name
          const { str: structType, newOffset: afterStructType } = readString(view, offset);
          offset = afterStructType;
          
          // Skip struct GUID (16 bytes)
          const { guid: structId, newOffset: afterGuid } = readGuid(view, offset);
          offset = afterGuid;

          // Read struct contents
          const { properties: structValue, newOffset: afterStruct } = parseGvasProperties(view, offset);
          value = { type: structType, guid: structId, value: structValue };
          offset = afterStruct;
          break;
        }

        case PROPERTY_TYPES.ArrayProperty: {
          const { str: arrayType, newOffset: afterArrayType } = readString(view, offset);
          offset = afterArrayType;

          // Get array length
          const arrayLength = view.getInt32(offset, true);
          offset += 4;

          value = [];
          for (let i = 0; i < arrayLength && offset < view.byteLength - 4; i++) {
            const { properties: itemValue, newOffset: afterItem } = parseGvasProperties(view, offset);
            value.push(itemValue);
            offset = afterItem;
          }
          break;
        }

        case PROPERTY_TYPES.MapProperty: {
          const { str: keyType, newOffset: afterKeyType } = readString(view, offset);
          const { str: valueType, newOffset: afterValueType } = readString(view, afterKeyType);
          offset = afterValueType;

          // Get map length
          const mapLength = view.getInt32(offset, true);
          offset += 4;

          value = {};
          for (let i = 0; i < mapLength && offset < view.byteLength - 4; i++) {
            const { str: key, newOffset: afterKey } = readString(view, offset);
            const { properties: mapValue, newOffset: afterValue } = parseGvasProperties(view, afterKey);
            value[key] = mapValue;
            offset = afterValue;
          }
          break;
        }

        case PROPERTY_TYPES.IntProperty:
          value = view.getInt32(offset, true);
          offset += 4;
          break;

        case PROPERTY_TYPES.Int64Property:
          // Read as two 32-bit integers since JS doesn't have 64-bit integers
          const low = view.getUint32(offset, true);
          const high = view.getUint32(offset + 4, true);
          value = high * Math.pow(2, 32) + low;
          offset += 8;
          break;

        case PROPERTY_TYPES.FloatProperty:
          value = view.getFloat32(offset, true);
          offset += 4;
          break;

        case PROPERTY_TYPES.BoolProperty:
          value = view.getUint8(offset) !== 0;
          offset += 1;
          break;

        case PROPERTY_TYPES.NameProperty:
        case PROPERTY_TYPES.StrProperty:
          const { str, newOffset } = readString(view, offset);
          value = str;
          offset = newOffset;
          break;

        case PROPERTY_TYPES.EnumProperty:
          const { str: enumValue, newOffset: afterEnum } = readString(view, offset);
          value = enumValue;
          offset = afterEnum;
          break;

        default:
          console.warn("Unknown property type:", propertyType);
          // Skip unknown properties to avoid corruption
          if (propertySize > 0) {
            offset += propertySize;
          }
          continue;
      }

      properties[propertyName] = { type: propertyType, value };
    }

    return { properties, newOffset: offset };
  } catch (e) {
    console.error("Error parsing GVAS properties at offset", offset, e);
    return { properties, newOffset: offset };
  }
}

function parseGuildData(properties: { [key: string]: any }): GuildData[] {
  const worldSaveData = properties.worldSaveData?.value;
  if (!worldSaveData?.GroupSaveDataMap?.value) {
    console.log("No GroupSaveDataMap found");
    return [];
  }

  const guilds: GuildData[] = [];
  
  for (const group of worldSaveData.GroupSaveDataMap.value) {
    // Check if it's a guild group
    const groupType = group.value?.GroupType?.value;
    if (groupType !== "EPalGroupType::Guild") {
      continue;
    }

    const rawData = group.value?.RawData?.value;
    if (!rawData) continue;

    const guildName = rawData.guild_name?.value || "Unknown Guild";
    const players = rawData.players?.value || [];
    
    const guildMembers: GuildMember[] = players.map((player: any) => {
      const playerUid = player.player_uid?.value;
      const playerName = player.player_info?.value?.player_name?.value || "Unknown Player";
      
      // Get pals for this player from CharacterSaveParameterMap
      const pals: Pal[] = (worldSaveData.CharacterSaveParameterMap?.value || [])
        .filter((char: any) => {
          const isPlayer = char.value?.RawData?.value?.IsPlayer?.value;
          const ownerUid = char.value?.RawData?.value?.OwnerPlayerUId?.value;
          return !isPlayer && ownerUid === playerUid;
        })
        .map((char: any) => {
          const charData = char.value?.RawData?.value;
          return {
            id: char.key?.InstanceId?.value || "",
            name: charData?.NickName?.value || "Unnamed Pal",
            level: charData?.Level?.value || 1,
            passives: (charData?.PassiveSkillList?.value || []).map((passive: any) => ({
              id: passive.value?.id?.value || "0x00",
              name: passive.value?.name?.value || "Unknown Passive",
              description: passive.value?.description?.value || "",
              rarity: passive.value?.rarity?.value || "common"
            })),
            owner: playerName,
            guildMember: playerName
          };
        });

      return {
        id: playerUid || "",
        name: playerName,
        pals
      };
    });

    guilds.push({
      guildName,
      members: guildMembers
    });
  }

  return guilds;
}

function tryDecompress(data: Uint8Array): Uint8Array | null {
  // Check for zlib header
  if (data[0] === 0x78 && data[1] === 0x9C) {
    try {
      return inflate(data);
    } catch (e) {
      console.log("Not a valid zlib stream:", e);
      return null;
    }
  }
  return null;
}

async function decompressGvas(data: ArrayBuffer): Promise<{gvasData: ArrayBuffer, compressionCount: number}> {
  const view = new DataView(data);
  
  // First validate SAV header
  const magic = view.getUint32(0, true);
  if (magic !== SAV_MAGIC) {
    throw new Error(`Invalid save file magic: ${magic.toString(16)}`);
  }

  // Parse header info
  const totalSize = view.getUint32(4, true);
  let offset = 8;

  console.log("Save file header:", {
    magic: magic.toString(16),
    totalSize,
    firstBytes: Array.from(new Uint8Array(data, 0, Math.min(32, data.byteLength)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
  });

  try {
    // First chunk should be our GVAS data
    const chunkMagic = view.getUint32(offset, true);
    console.log("Chunk magic:", chunkMagic.toString(16));
    
    // Move past chunk header
    offset += 4;

    // Read compressed data starting after chunk header
    let currentData = new Uint8Array(data, offset);
    let compressionCount = 0;

    // Keep trying to decompress as long as we find zlib headers
    while (true) {
      console.log(`Layer ${compressionCount} data starts with:`, 
        Array.from(currentData.slice(0, 32))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
      );

      const decompressed = tryDecompress(currentData);
      if (!decompressed) {
        break;
      }

      currentData = decompressed;
      compressionCount++;

      console.log(`Decompressed layer ${compressionCount}: ${currentData.length} bytes`);

      // Check if this layer contains GVAS data
      const isGvas = currentData[0] === 0x47 && // G
                    currentData[1] === 0x56 && // V
                    currentData[2] === 0x41 && // A
                    currentData[3] === 0x53;   // S

      if (isGvas) {
        console.log("Found GVAS header at layer", compressionCount);
        return {
          gvasData: currentData.buffer,
          compressionCount
        };
      }
    }

    // If we get here, search the final decompressed data for GVAS header
    console.log("Searching final decompressed data for GVAS header...");
    
    // Search in chunks for better performance with large files
    const chunkSize = 4096;
    for (let start = 0; start < currentData.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, currentData.length);
      const chunk = currentData.slice(start, end);
      
      for (let i = 0; i < chunk.length - 4; i++) {
        if (chunk[i] === 0x47 && // G
            chunk[i + 1] === 0x56 && // V
            chunk[i + 2] === 0x41 && // A
            chunk[i + 3] === 0x53) { // S
          
          const gvasOffset = start + i;
          console.log("Found GVAS header at offset:", gvasOffset);
          
          return {
            gvasData: currentData.buffer.slice(gvasOffset),
            compressionCount
          };
        }
      }
    }

    throw new Error("Could not find GVAS header in decompressed data");
  } catch (e) {
    console.error("Failed to decompress save file:", e);
    throw e;
  }
}

export async function parseSaveFile(file: File): Promise<SaveFileData> {
  try {
    console.log("Starting to parse save file:", file.name, "Size:", file.size);
    const buffer = await readFileAsArrayBuffer(file);
    
    console.log("Decompressing save file...");
    const { gvasData, compressionCount } = await decompressGvas(buffer);
    console.log(`Save file decompressed (${compressionCount} layers)`);

    // Parse the GVAS data
    const view = new DataView(gvasData);
    const header = parseGvasHeader(view);
    console.log("GVAS Header:", header);

    // Parse properties starting after header
    const { properties } = parseGvasProperties(view, 26);
    console.log("Found properties:", Object.keys(properties));

    // Extract guild data
    const guilds = parseGuildData(properties);
    console.log(`Found ${guilds.length} guilds`);

    return {
      guilds,
      isMockData: false
    };
  } catch (error) {
    console.error("Error parsing save file:", error);
    throw new Error("Unable to parse save file. Please ensure you're uploading a valid Palworld Level.sav file.");
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