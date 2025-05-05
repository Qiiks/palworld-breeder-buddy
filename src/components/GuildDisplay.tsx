import { SaveFileData } from "@/types/pal";

interface GuildDisplayProps {
  saveData: SaveFileData;
}

export default function GuildDisplay({ saveData }: GuildDisplayProps) {
  return (
    <div className="glass-panel p-8">
      {saveData.guilds.length > 0 ? (
        saveData.guilds.map((guild, guildIndex) => (
          <div key={guildIndex} className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              Guild: {guild.guildName}
            </h2>
            {guild.members.length > 0 ? (
              guild.members.map((member, memberIndex) => (
                <div key={memberIndex} className="mb-4 p-4 border rounded-lg">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Member: {member.name}
                  </h3>
                  {member.pals.length > 0 ? (
                    <ul className="list-disc list-inside text-muted-foreground">
                      {member.pals.map((pal, palIndex) => (
                        <li key={palIndex}>{pal.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No pals found for this member.</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No members found in this guild.</p>
            )}
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">No guilds found in this save file.</p>
      )}
    </div>
  );
}