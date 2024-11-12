#!/bin/env python3
import os.path
from dataclasses import dataclass
from urllib.request import urlretrieve

from iso6709 import Location


@dataclass
class TimezoneLocation:
    code: str
    latitude: float
    longitude: float
    timezone: str

this_dir = os.path.abspath(os.path.dirname(__file__))
tab_file = os.path.join(this_dir, 'zone1970.tab')

def parse_tab() -> tuple[{str, TimezoneLocation}, {Location, TimezoneLocation}]:
    zone_to_location: {str, TimezoneLocation} = {}
    location_to_zone: {tuple, TimezoneLocation} = {}

    if not os.path.exists(tab_file):
        # from the Time Zone Database project
        urlretrieve('https://github.com/eggert/tz/blob/main/zone1970.tab', tab_file)
    with open(tab_file, 'r') as tab:
        for line in tab:
            if line.startswith('#'):
                continue
            print(line)
            fields = line.split('\t')
            iso_loc = Location(fields[1])
            lat = iso_loc.lat.decimal
            lon = iso_loc.lng.decimal
            zone_to_location[fields[2]] = TimezoneLocation(fields[0], lat, lon, fields[2])
            location_to_zone[(lat, lon)] = TimezoneLocation(fields[0], lat, lon, fields[2])

    return zone_to_location, location_to_zone


def zone_location_to_typescript(zone_to_location: {str, TimezoneLocation}):
    with open(os.path.join(this_dir, 'tz_table.ts'), 'w') as tab:
        tab.write('const tzTable: {[key: string]: [number, number]} = {\n')
        for zone, location in zone_to_location.items():
            tab.write('    "%s": [%f, %f],\n' % (zone.strip(), location.latitude, location.longitude))
        tab.write('}\n')
        tab.write('\n')
        tab.write('export function timezoneToLocation(tz: string): [number, number] {\n')
        tab.write('    if (tz in tzTable)\n')
        tab.write('        return tzTable[tz]\n')
        tab.write('    throw new Error(`Bad/unknown timezone: $tz`)\n')
        tab.write('}\n')
        tab.write('\n')


if __name__ == '__main__':
    zone2location, location2zone = parse_tab()
    zone_location_to_typescript(zone2location)
