import { execSync } from "child_process";
import * as fs from "fs";

interface GuildData {
  guildName: string;
  members: GuildMember[];
}

interface GuildMember {
  id: string;
  name: string;
  pals: Pal[];
}

interface Pal {
  id: string;
  name: string;
  level: number;
  passives: Passive[];
  owner: string;
  guildMember: string;
}

interface Passive {
  id: string;
  name: string;
  description: string;
  rarity: string;
}

export function parseSaveFile(filePath: string): {
  guilds: GuildData[];
  isMockData: boolean;
} {
  try {
    console.log("Starting to parse save file:", filePath);
    const pythonScriptPath = "python_scripts/save_parser.py";
    const command = `python3 ${pythonScriptPath} "${filePath}"`;
    console.log("Executing:", command);
    const result = execSync(command, { encoding: "utf-8" });
    console.log("Python Result:", result);
    const parsedResult = JSON.parse(result);

    return { guilds: parsedResult, isMockData: false };
  } catch (error) {
    console.error("Error parsing save file:", error);
    throw new Error(
      "Unable to parse save file. Please ensure you're uploading a valid Palworld Level.sav file."
    );
  }
}