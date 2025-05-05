import json
from json import JSONEncoder
import sys
import os
import zlib
import struct
from collections import defaultdict


def read_file(file_path):
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(file_path, "rb") as f:
            return f.read()
    except Exception as e:
        raise Exception(f"Error in read_file: {e}") from e


class GuildDataEncoder(JSONEncoder):
    def default(self, o):
        return o.__dict__


class GuildMember:
    def __init__(self, id: str, name: str, pals: list):
        self.id = id
        self.name = name
        self.pals = pals


class Pal:
    def __init__(
        self, id: str, name: str, level: int, passives: list, owner: str, guildMember: str
    ):
        self.id = id
        self.name = name
        self.level = level
        self.passives = passives
        self.owner = owner
        self.guildMember = guildMember


def read_string(data, offset):
    print("Starting to read string")
    try:
        length = struct.unpack("<i", data[offset : offset + 4])[0]
        offset += 4
        if length == 0:
            return "", offset

        is_utf16 = length < 0
        text_length = abs(length)
        if text_length > 0:
            offset += 4

        if offset + text_length > len(data):
            raise ValueError("String read would exceed buffer bounds")
        if is_utf16:
            string = data[offset : offset + text_length].decode("utf-16le", errors="ignore").rstrip("\000")
        else:
            string = data[offset : offset + text_length].decode("utf-8", errors="ignore").rstrip("\000")
        print(f"string read: {string}")
        return string, offset + text_length
    except Exception as e:
        raise Exception(f"Error in read_string: {e}")


def read_guid(data, offset):
    guid = data[offset : offset + 16].hex()
    return guid, offset + 16


def parse_gvas_header(data):
    try:
        magic = struct.unpack("<I", data[0:4])[0]
        magic_str = data[0:4].decode("latin-1")
        if magic_str != "GVAS":
            raise ValueError(f"Invalid GVAS header: {magic_str}")

        version = struct.unpack("<I", data[4:8])[0]
        package_flags = struct.unpack("<I", data[8:12])[0]
        engine_version_major = struct.unpack("<H", data[12:14])[0]
        engine_version_minor = struct.unpack("<H", data[14:16])[0]
        engine_version_patch = struct.unpack("<H", data[16:18])[0]
        custom_version = struct.unpack("<I", data[20:24])[0]
        save_game_version = struct.unpack("<I", data[24:28])[0]

        return {
            "magic_str": magic_str,
            "version": version,
            "package_flags": package_flags,
            "engine_version": {
                "major": engine_version_major,
                "minor": engine_version_minor,
                "patch": engine_version_patch,
            },
            "custom_version": custom_version,
            "save_game_version": save_game_version,
        }
    except Exception as e:
        raise Exception(f"Error in parse_gvas_header: {e}")


def parse_gvas_properties(data, offset):
    print("parsing gvas properties")
    properties = {}
    print("Starting to loop through properties")
    while offset < len(data):
        print(f"Offset: {offset}, data length: {len(data)}")
        property_name, offset = read_string(data, offset)
        if not property_name or property_name == "None":
            print(f"property name: {property_name}")
            break
        property_type, offset = read_string(data, offset)
        property_size = 0
        if property_type in [
            "StrProperty",
            "ArrayProperty",
            "MapProperty",
            "StructProperty",
        ]:
            property_size = struct.unpack("<i", data[offset : offset + 4])[0]
            print(f"property_size: {property_size}")

            offset += 4
        value = None
        if property_type == "StructProperty":
            struct_type, offset = read_string(data, offset)
            struct_guid, offset = read_guid(data, offset)
            value, offset = parse_gvas_properties(data, offset)
            value = {"type": struct_type, "guid": struct_guid, "value": value}
        elif property_type == "ArrayProperty":
            array_type, offset = read_string(data, offset)
            array_length = struct.unpack("<i", data[offset : offset + 4])[0]
            offset += 4
            value = []
            for _ in range(array_length):
                item_value, offset = parse_gvas_properties(data, offset)
                value.append(item_value)
        elif property_type == "MapProperty":
            key_type, offset = read_string(data, offset)
            value_type, offset = read_string(data, offset)
            map_length = struct.unpack("<i", data[offset : offset + 4])[0]
            offset += 4
            value = {}
            for _ in range(map_length):
                key, offset = read_string(data, offset)
                map_value, offset = parse_gvas_properties(data, offset)
                value[key] = map_value
        elif property_type == "IntProperty":
            value = struct.unpack("<i", data[offset : offset + 4])[0]
            offset += 4
        elif property_type == "Int64Property":
            low, high = struct.unpack("<II", data[offset : offset + 8])
            value = high * (2**32) + low
            offset += 8
        elif property_type == "FloatProperty":
            value = struct.unpack("<f", data[offset : offset + 4])[0]
            offset += 4
        elif property_type == "BoolProperty":
            value = data[offset] != 0
            offset += 1
        elif property_type in ["NameProperty", "StrProperty"]:
            value, offset = read_string(data, offset)
        elif property_type == "EnumProperty":
            value, offset = read_string(data, offset)
        else:
            print(f"Unknown property type: {property_type}")
            if property_size > 0:
                offset += property_size
        
        print(f"property type: {property_type}")
            continue
        properties[property_name] = {"type": property_type, "value": value}
    print(f"properties: {properties}")

    return properties, offset


def try_decompress(data):
    print("Starting try decompress.")
    try:        
        decompressed = zlib.decompress(data)
        return decompressed
    except zlib.error as e:
        print(f"Failed to decompress. Error: {e}. Returning original data.")
        return data
    except Exception as e:
        raise Exception(f"Error in try_decompress: {e}") from e


def decompress_gvas(data,file_path):
    print("Starting to decompress gvas")
    try:
        magic = struct.unpack("<I", data[0:4])[0]
        if magic != 0x014B0622:
            raise ValueError(f"Invalid save file magic: {hex(magic)}")
        total_size = struct.unpack("<I", data[4:8])[0]
        offset = 8
        chunk_magic = struct.unpack("<I", data[offset : offset + 4])[0]
        offset += 4
        current_data = data[offset:]
        compression_count = 0
        while True:
            decompressed = try_decompress(current_data)

            if not decompressed:
                break
            current_data = decompressed
            compression_count += 1
            if current_data[0:4].decode("latin-1") == "GVAS":
              
              
              return current_data, compression_count
        for start in range(0, len(current_data), 4096):
            end = min(start + 4096, len(current_data))
            chunk = current_data[start:end]
            for i in range(len(chunk) - 4):
                if chunk[i : i + 4].decode("latin-1") == "GVAS":
                    gvas_offset = start + i
                    return current_data[gvas_offset:], compression_count
        raise ValueError("Could not find GVAS header in decompressed data")
    except Exception as e:
        print(f"Exception in decompress gvas: {e}")
        raise Exception(f"Error in decompress_gvas: {e}")


def parse_guild_data(properties):
    print("Starting to parse guild data.")


    try:
        world_save_data = properties.get("worldSaveData", {}).get("value", {})
        if not world_save_data or not world_save_data.get("GroupSaveDataMap", {}).get("value"):
            print("No GroupSaveDataMap found")
            return []
        guilds = []
        for group in world_save_data["GroupSaveDataMap"]["value"]:
            group_type = group.get("value", {}).get("GroupType", {}).get("value")
            if group_type != "EPalGroupType::Guild":
                continue
            raw_data = group.get("value", {}).get("RawData", {}).get("value")
            if not raw_data:
                continue
            guild_name = raw_data.get("guild_name", {}).get("value", "Unknown Guild")
            players = raw_data.get("players", {}).get("value", [])
            guild_members = []
            for player in players:
                player_uid = player.get("player_uid", {}).get("value")
                player_name = player.get("player_info", {}).get("value", {}).get("player_name", {}).get("value", "Unknown Player")
                pals = []
                for char in world_save_data.get("CharacterSaveParameterMap", {}).get("value", []):
                    is_player = char.get("value", {}).get("RawData", {}).get("value", {}).get("IsPlayer", {}).get("value")
                    owner_uid = char.get("value", {}).get("RawData", {}).get("value", {}).get("OwnerPlayerUId", {}).get("value")
                    if not is_player and owner_uid == player_uid:
                        char_data = char.get("value", {}).get("RawData", {}).get("value")
                        pal = {
                                "id": char.get("key", {}).get("InstanceId", {}).get("value", ""),
                                "name": char_data.get("NickName", {}).get("value", "Unnamed Pal"),
                                "level": char_data.get("Level", {}).get("value", 1),
                                "passives": [
                                    {
                                        "id": passive.get("value", {}).get("id", {}).get("value", "0x00"),
                                        "name": passive.get("value", {}).get("name", {}).get("value", "Unknown Passive"), 
                                        "description": passive.get("value", {}).get("description", {}).get("value", ""),
                                        "rarity": passive.get("value", {}).get("rarity", {}).get("value", "common"),
                                    }
                                    for passive in char_data.get("PassiveSkillList", {}).get("value", [])
                                ],
                            
                            
                            "owner": player_name,
                            "guildMember": player_name,
                        }
                        pals.append(pal)
                guild_members.append(
                    {"id": player_uid or "", "name": player_name, "pals": pals}
                )
            guilds.append({"guildName": guild_name, "members": guild_members})
        print(f"World Save Data: {world_save_data}")
        print(f"Guilds: {guilds}")
        return guilds

    except Exception as e:
        print(f"Exception in parse_guild_data: {e}")
        raise Exception(f"Error in parse_guild_data: {e}")


def parse_save_file(file_content, file_path):
    print("Starting to parse save file.")
    try:
        data, compression_count = decompress_gvas(file_content, file_path)
        header = parse_gvas_header(data)
        properties, _ = parse_gvas_properties(data, 28)
        guilds = parse_guild_data(properties)
        print(f"gvas header {header}")
        if not guilds:
            raise Exception("No guild data found")
        print(f"Python Log: guild data found {guilds}")
        return guilds
        print("Done parsing file.")
    except Exception as e:
        print(f"Error parsing save file: {e}")
        return []


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python save_parser.py <file_path>")
        sys.exit(1)
    file_path = sys.argv[1]
    print(f"Python Script: File path received - {file_path}")
    try:
        file_content = read_file(file_path)
        result = parse_save_file(file_content, file_path)
        print(json.dumps(result, cls=GuildDataEncoder))
    except FileNotFoundError:
        print(json.dumps([]))
    except Exception as e:
        print(f"Error in __main__: {e}")
        print(json.dumps([]))
        print(json.dumps([]))