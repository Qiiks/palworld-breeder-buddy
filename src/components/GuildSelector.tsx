
import { useState } from 'react';
import { GuildData } from '@/types/pal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Users } from 'lucide-react';

interface GuildSelectorProps {
  guilds: GuildData[];
  onGuildSelect: (guild: GuildData) => void;
}

export function GuildSelector({ guilds, onGuildSelect }: GuildSelectorProps) {
  const [selectedGuild, setSelectedGuild] = useState<GuildData | null>(guilds.length ? guilds[0] : null);
  
  const handleSelect = (guildName: string) => {
    const guild = guilds.find(g => g.guildName === guildName);
    if (guild) {
      setSelectedGuild(guild);
      onGuildSelect(guild);
    }
  };

  if (!guilds.length) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No guild data available</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">Select Your Guild</h2>
        <Select onValueChange={handleSelect} defaultValue={selectedGuild?.guildName}>
          <SelectTrigger className="bg-muted border-palblue text-white">
            <SelectValue placeholder="Select a guild" />
          </SelectTrigger>
          <SelectContent className="bg-palblue border-palaccent">
            {guilds.map((guild) => (
              <SelectItem key={guild.guildName} value={guild.guildName}
                className="hover:bg-muted focus:bg-muted text-white">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-palaccent" />
                  {guild.guildName} ({guild.members.length} members)
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedGuild && (
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Users className="mr-2 h-5 w-5 text-palaccent" />
              {selectedGuild.guildName}
            </h3>
            <Badge className="bg-palaccent hover:bg-palaccent-light">
              {selectedGuild.members.length} Members
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedGuild.members.map((member) => (
              <Card key={member.id} className="pal-card">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-palaccent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {member.pals.length} Pals available
                    </p>
                  </div>
                  <div className="ml-auto">
                    <Button variant="ghost" className="text-xs text-muted-foreground hover:text-white">
                      View Pals
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="mt-6">
            <Button className="w-full bg-palaccent hover:bg-palaccent-light">
              Calculate Breeding Options
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuildSelector;
