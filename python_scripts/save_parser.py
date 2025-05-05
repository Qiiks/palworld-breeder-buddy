import json
from json import JSONEncoder

import copy
import uuid
from palworld_pal_editor.core.pal_objects import PalObjects
import sys
import os
import zlib
import struct
from collections import defaultdict
from palworld_save_tools.raw_data import PALWORLD_CUSTOM_PROPERTIES



MAIN_SKIP_PROPERTIES = copy.deepcopy(PALWORLD_CUSTOM_PROPERTIES)
MAIN_SKIP_PROPERTIES.add("Pal.SaveParameter")


def load_character_save_parameter_map(properties):
    """
    Loads character save parameters from properties.
    """
    player_mapping = {}  # Store player data by PlayerUId
    dangling_pals = {}  # Store pals without owners by InstanceId

    baseworker_mapping = {}  # Store pals with owners by InstanceId
    player_info = []
    working_pal_info = []
    dangling_pal_info = []

    character_save_parameter_map = properties.get(
        "worldSaveData", {}
    ).get("value", {}).get("CharacterSaveParameterMap", {}).get("value", [])

    if not character_save_parameter_map:
        print("load_character_save_parameter_map: No CharacterSaveParameterMap found")
        return [], [], []

    for pal_obj in character_save_parameter_map:

        key = pal_obj.get("key")
        value = pal_obj.get("value")

        if not key or not value:
            print(
                "load_character_save_parameter_map: Skipping pal as the key or value is missing"
            )
            continue
        
        character_type = PalObjects.get_BaseType(
            value.get("RawData", {}).get("value", {}).get("CharacterType", {})
        )

        if character_type == "EPalCharacterType::Player":
            player_uid = PalObjects.get_BaseType(key.get("PlayerUId", {}))
            if player_uid is None:
                print("load_character_save_parameter_map: player_uid is none, skipping")
                continue

            player_mapping[str(player_uid)] = value  # Store player data
            player_info.append(player_uid)  # Append player_uid for tracking
            print(f"load_character_save_parameter_map: Added player {player_uid} to player mapping")

        elif character_type != "EPalCharacterType::Player" and character_type is not None:
            instance_id = PalObjects.get_BaseType(key.get("InstanceId", {}))  # Pal Instance ID
            owner_player_uid = PalObjects.get_BaseType(
                value.get("RawData", {}).get("value", {}).get("OwnerPlayerUId", {})
            )  # Pal Owner
            
            if owner_player_uid is None or str(owner_player_uid) == str(uuid.UUID(int=0)):  # No Owner
                dangling_pals[str(instance_id)] = value
                print(f"load_character_save_parameter_map: Added pal {instance_id} to dangling pals")

                dangling_pal_info.append(instance_id)
            else:
                baseworker_mapping[str(instance_id)] = value
                print(f"Added pal {instance_id} to baseworker mapping")
                working_pal_info.append(instance_id)
        else:
            print(f"load_character_save_parameter_map: Invalid character_type {character_type}")
            continue

    return player_info, working_pal_info, dangling_pal_info

MAIN_SKIP_PROPERTIES.add("Pal.CharacterSaveParameterMap")


def skip_decode(reader, type_name, size, path):
    """
    Skip decode
    Args:
        reader: BytesIO
        type_name: Type of the property
        size: size of the property
        path: Location of the property

    Returns:
        None
    """
    print(f"Skipping {type_name} of size {size} at {path}")
    reader.seek(size, 1)


def skip_encode(writer, property_type, properties):
    """
    Skip encode
    Args:
        writer: BytesIO
        property_type: Type of the property
        properties: Property object

    Returns:
        None
    """
    if properties:
        writer.write(property_type.encode())
        if isinstance(properties, bytes):
            writer.write(properties)
    return


def read_file(file_path, text = False):
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(file_path, "rb") as f:
            data = f.read()
            if text : return data.decode("utf-8")

            return data
    except Exception as e:
        print(e)
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


def read_string(data: bytes, offset: int) -> tuple[str, int]:
    try:
        length = struct.unpack("<I", data[offset : offset + 4])[0]
        offset += 4
        if length == 0:
            return "", offset
        is_utf16 = length < 0
        text_length = abs(length)
        if text_length > 0 and not is_utf16:
            offset += 4
        if offset + text_length > len(data):
            raise ValueError("String read would exceed buffer bounds")
        if is_utf16:
            string: str = data[offset : offset + text_length].decode(

                "utf-16le", errors="ignore"
            ).rstrip("\000")
        else:
            string = data[offset : offset + text_length].decode("utf-8", errors="ignore").rstrip("\000")
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

    properties = {}

    while offset < len(data):

        try:
            property_name, offset = read_string(data, offset)
            if not property_name or property_name == "None":
                break

            property_type, offset = read_string(data, offset)
        except Exception as e :
            print("failed to read string, skipping")


            continue
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
            try:
                struct_type, offset = read_string(data, offset)
                struct_guid, offset = read_guid(data, offset)
                value, offset = parse_gvas_properties(data, offset)
                value = {"type": struct_type, "guid": struct_guid, "value": value}
            except:

                print(f"parse_gvas_properties: failed to read StructProperty, skipping {property_name}")
                offset += property_size
                continue
        elif property_type == "ArrayProperty":
            try:
                array_type, offset = read_string(data, offset)
                array_length = struct.unpack("<i", data[offset : offset + 4])[0]
                offset += 4
                value = []
                for _ in range(array_length):
                    item_value, offset = parse_gvas_properties(data, offset)
                    value.append(item_value)
            except:

                print(f"parse_gvas_properties: failed to read ArrayProperty, skipping {property_name}")
                offset += property_size
                continue
        elif property_type == "MapProperty":
            try:
                key_type, offset = read_string(data, offset)
                value_type, offset = read_string(data, offset)
                map_length = struct.unpack("<i", data[offset : offset + 4])[0]
                offset += 4
                value = {}
                for _ in range(map_length):
                    key, offset = read_string(data, offset)
                    map_value, offset = parse_gvas_properties(data, offset)
                    value[key] = map_value
            except:

                print(f"parse_gvas_properties: failed to read MapProperty, skipping {property_name}")
                offset += property_size
                continue

        elif property_type == "IntProperty":
            value = struct.unpack("<i", data[offset : offset + 4])[0]
            offset += 4

        elif property_type == "Int64Property":
            value = struct.unpack("<Q", data[offset : offset + 8])[0]
            offset += 8

        elif property_type == "FloatProperty":
            value = struct.unpack("<f", data[offset : offset + 4])[0]
            offset += 4

        elif property_type == "BoolProperty":
            value = data[offset] != 0
            offset += 1

        elif property_type in ["NameProperty", "StrProperty", "EnumProperty",]:

            value, offset = read_string(data, offset)
        else:
            print(f"parse_gvas_properties: Unknown property type: {property_type}")
            if property_size > 0:
                offset += property_size
                continue

        properties[property_name] = {"type": property_type, "value": value}

    return properties, offset


def try_decompress(data):
    decompressed = zlib.decompress(data)
    return decompressed

    
    

    
def decompress_gvas(data,file_path):

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

        # Loop through chunk sizes and look for GVAS header
        for start in range(0, len(current_data), 4096):
            end = min(start + 4096, len(current_data))
            chunk = current_data[start:end]
            for i in range(len(chunk) - 4):
                if chunk[i : i + 4].decode("latin-1") == "GVAS":
                    gvas_offset = start + i
                    return current_data[gvas_offset:], compression_count
        raise ValueError("Could not find GVAS header in decompressed data")
    except Exception as e :
        raise Exception(f"Error in decompress_gvas: {e}")


def parse_guild_data(properties):


    print(
        "parse_guild_data: Starting to parse guild data and player data using load_character_save_parameter_map."
    )

    try:
        player_info, working_pal_info, dangling_pal_info = load_character_save_parameter_map(
            properties
        )

        print(f"parse_guild_data: player info {player_info}")
        print(f"parse_guild_data: working_pal_info {working_pal_info}")
        print(f"parse_guild_data: dangling_pal_info {dangling_pal_info}")
        world_save_data = properties.get("worldSaveData", {}).get("value", {})
        
        if not world_save_data or not world_save_data.get("GroupSaveDataMap", {}).get("value"):
            print("parse_guild_data: No GroupSaveDataMap found")
            return {}
        player_data_by_uid = {}
        for player_uid in player_info:

            for group in world_save_data.get("GroupSaveDataMap", {}).get(
                "value", []
            ):
                raw_data = (
                    group.get("value", {})
                    .get("RawData", {})
                    .get("value", {})
                )
                if not raw_data:
                    print("parse_guild_data: skipping group as no raw data")
                    continue
                players = raw_data.get("players", {}).get("value", [])
                for player in players:
                    player_data = player.get("player_info", {}).get(
                        "value", {}
                    )
                    try:
                        if str(player.get("player_uid", {}).get("value", "")) == str(
                            player_uid
                        ):
                            player_data_by_uid[str(player_uid)] = {
                                "name": str(
                                    PalObjects.get_BaseType(
                                        player_data.get("player_name", {})
                                    )
                                ),
                                "last_online_real_time": str(
                                    PalObjects.get_BaseType(
                                        player_data.get(
                                            "last_online_real_time", {}
                                        )
                                    )
                                ),
                                "last_online_time": str(
                                    PalObjects.get_BaseType(
                                        player_data.get("last_online_time", {})
                                    )
                                ),
                            }
                    except Exception as e:
                        print(f"parse_guild_data: failed to read player {e}")
                        continue
        return player_data_by_uid
    except Exception as e:
        raise Exception(f"parse_guild_data: Error in parse_guild_data: {e}") from e


def parse_save_file(file_content, file_path):
    try:
        data, compression_count = decompress_gvas(file_content, file_path)
        parse_gvas_header(data)        
    except Exception as e:
        print(f"parse_save_file: Error parsing gvas_header: {e}")
        return [], {}
    properties, _ = parse_gvas_properties(data, 28)
    player_data = parse_guild_data(properties)
    return {}, player_data
    except Exception as e:
        print(f"parse_save_file: Error parsing file: {e}")
        return [], {}




if __name__ == "__main__":
    if len(sys.argv) != 2 :
        print("Usage: python save_parser.py <file_path>")
        sys.exit(1)
    file_path = sys.argv[1]
    print(f"Python Script: File path received - {file_path}")
    file_content = None
    try:
        file_content = read_file(file_path, text=False)
    except Exception as e:
        print(f"Error in __main__ read_file: {e}")
        file_content = None
    if file_content is not None:
        guilds, player_data = parse_save_file(file_content, file_path)
    else : 
        guilds, player_data = None, None
    try:
        print(json.dumps(guilds))
    except:
        print(json.dumps([]))
    try:
        print(json.dumps(player_data))
    except:
        print(json.dumps([]))