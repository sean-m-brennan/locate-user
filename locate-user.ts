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
            throw Error(`No timeZoneName in DateTimeFormat`)
        const start = offset.search(/[+-]/)
        const sign = offset.charAt(start) === "+" ? 1 : -1
        const mid = offset.indexOf(":", start)
        const hours = parseInt(offset.slice(start + 1), 10)
        let minutes = 0
        if (mid > 0)
            minutes = parseInt(offset.slice(mid + 1), 10)
        return sign * (hours * 60 + minutes)
    } catch(err) {
        console.debug(err)
        const date = new Date()
        return date.getTimezoneOffset()
    }
}

export function getApproximateBrowserLocation(overrideTimezone?: string): [number, number, number] {
    const tz = overrideTimezone || getBrowserTimeZone()
    try {
        const loc = timezoneToLocation(tz)
        return [loc[0], loc[1], 10.0]  // sea-level-ish
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch(err) {
        console.debug(err)
        let offset
        try {
            offset = getBrowserTimeZoneOffset()
        } catch(err) {
            console.error(err)
            return [0, 0, 0]
        }
        const lon = (180.0 / (12 * 60.0)) * offset
        return [0.0, lon, 10.0]  // equator at sea-level
    }
}

export function getBrowserLocation(overrideTimezone?: string): [number, number, number] {
    let latLonAlt: [number, number, number] = [0,0,0]
    if ("geolocation" in navigator) {
        const getCoords = () => new Promise(
            (resolve: PositionCallback, reject: PositionErrorCallback) => {
                navigator.geolocation.getCurrentPosition(resolve, reject)
            })

        getCoords()
            .then((geoPos: GeolocationPosition) => {
                const lat = geoPos.coords.latitude
                const lon = geoPos.coords.longitude
                const alt = geoPos.coords.altitude || 0
                latLonAlt = [lat, lon, alt]
            })
            .catch((err: GeolocationPositionError) => {
                console.debug(err)
                latLonAlt = getApproximateBrowserLocation(overrideTimezone)
            })
    } else
        latLonAlt = getApproximateBrowserLocation(overrideTimezone)
    return latLonAlt
}