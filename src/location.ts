/*
  Copyright 2024 Sean M. Brennan and contributors

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

import {timezoneToLocation} from "./tz/tz_table"

export function getBrowserTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function getBrowserTimeZoneOffset(): number {
    try {
        const date = new Date()
        const fmt = Intl.DateTimeFormat("ia", { timeZoneName: "shortOffset" }).formatToParts(date)
        const offset = fmt.find((i) => i.type === "timeZoneName")?.value
        if (offset === undefined)
            throw Error('No timeZoneName in DateTimeFormat')
        const sign = offset.charAt(0) === "+" ? 1 : -1
        const hours = parseInt(offset.slice(1, 3), 10)
        const minutes = parseInt(offset.slice(4), 10)
        return sign * (hours * 60 + minutes)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(_err) {
        const date = new Date()
        return date.getTimezoneOffset()
    }
}

export function getApproximateBrowserLocation(): [number, number, number] {
    const tz = getBrowserTimeZone()
    try {
        const loc = timezoneToLocation(tz)
        return [loc[0], loc[1], 10.0]  // sea-level
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(_err) {
        const offset = getBrowserTimeZoneOffset()
        const lon = 180.0 / 12 * offset
        return [0.0, lon, 10.0]  // equator at sea-level
    }
}

export function getBrowserLocation(): [number, number, number] {
    let latLonAlt: [number, number, number] = [0,0,0]
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((geoPos) => {
                const lat = geoPos.coords.latitude
                const lon = geoPos.coords.longitude
                const alt = geoPos.coords.altitude || 0
                latLonAlt = [lat, lon, alt]
            },
            () => {  // fallback
                latLonAlt = getApproximateBrowserLocation()
            })
    } else
        latLonAlt = getApproximateBrowserLocation()
    return latLonAlt
}