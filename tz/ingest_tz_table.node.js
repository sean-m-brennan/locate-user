#!/usr/bin/env node
import path from "path"
import download from "download"
import * as fs from "node:fs";
import parseTzdataCoordinate from "parse-tzdata-coordinate";


const baseDir = import.meta.dirname
const tabFile = path.join(baseDir, 'zone1970.tab')
const generatedFile = path.join(baseDir, 'tz_table.ts')

const DMStoDD = (sign, degrees, minutes, seconds = 0) => {
    let dd = degrees + minutes / 60 + seconds / 3600
    if (sign === '-')
        dd = -dd
    return dd
}

const parseTab = (force = false) => {
    if (force || !fs.existsSync(tabFile)) {
        //from the Time Zone Database project
        const url = 'https://raw.githubusercontent.com/eggert/tz/refs/heads/main/zone1970.tab';
        (async () => { await download(url, baseDir) })()
    }
    const zone2location = {}
    try {
        fs.readFileSync(tabFile, 'utf8')
            .split('\n').filter((line) => !line.startsWith('#') && line.length > 0)
            .forEach((line) => {
                const fields = line.split('\t')
                const isoLoc = parseTzdataCoordinate(fields[1])
                const lat = DMStoDD(isoLoc.latitude.sign, isoLoc.latitude.degree, isoLoc.latitude.minute, isoLoc.latitude.second)
                const lon = DMStoDD(isoLoc.longitude.sign, isoLoc.longitude.degree, isoLoc.longitude.minute, isoLoc.longitude.second)
                zone2location[fields[2]] = {code: fields[0], latitude: lat, longitude: lon, timezone: fields[2]}
            })
    } catch(err) {
        console.error(err)
        process.exit()
    }
    return zone2location
}


const zoneLocationToTypescript = (zone2location) => {
    let content = 'const tzTable: {[key: string]: [number, number]} = {\n'
    for (const zone in zone2location) {
        const loc = zone2location[zone]
        content += `    "${zone.trim()}": [${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}],\n`
    }
    content += '}\n'
    content += '\n'
    content += 'export function timezoneToLocation(tz: string): [number, number] {\n'
    content +='    if (tz in tzTable)\n'
    content += '        return tzTable[tz]\n'
    content += '    throw new Error(`Bad/unknown timezone: $tz`)\n'
    content += '}\n'
    content += '\n'
    try {
        fs.writeFileSync(generatedFile, content) // FIXME
    } catch (err) {
        console.error(err)
    }
}

const force = process.argv.includes("--force")
const zone2location = parseTab(force)
zoneLocationToTypescript(zone2location)
