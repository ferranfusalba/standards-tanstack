import { createServerFn } from '@tanstack/react-start'

export interface Timezone {
  id: string
  name: string
  offset: string
  region: string
}

export interface TimezoneIANA extends Timezone {
  countryCodes: string[]
  coordinates: string
  comment: string | null
}

export interface TimezoneIntl extends Timezone {
  longName: string
  shortName: string
  longGeneric: string
  shortGeneric: string
  isDST: boolean
  dstOffset: string | null
  standardOffset: string
}

function formatOffset(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  })
  const match = formatter.format(date).match(/GMT([+-]\d{1,2}):?(\d{2})?/)
  if (!match) return 'UTC+0'
  const hours = match[1]
  const minutes = match[2] || '00'
  return minutes === '00' ? `UTC${hours}` : `UTC${hours}:${minutes}`
}

function getTimezoneName(date: Date, timeZone: string, style: 'long' | 'short' | 'longGeneric' | 'shortGeneric'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: style,
    })
    const parts = formatter.formatToParts(date)
    return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

// Option A: Get timezones from JavaScript Intl API (built-in, always up-to-date)
export const getTimezonesFromIntl = createServerFn({
  method: 'GET',
}).handler(async () => {
  const tzIds = Intl.supportedValuesOf('timeZone')

  // Use January and July to detect DST
  const now = new Date()
  const jan = new Date(now.getFullYear(), 0, 15)
  const jul = new Date(now.getFullYear(), 6, 15)

  const timezones: TimezoneIntl[] = tzIds.map(id => {
    const parts = id.split('/')
    const region = parts.length > 1 ? parts[0] : 'UTC'
    const name = parts.length > 1 ? parts.slice(1).join('/').replace(/_/g, ' ') : id

    const offset = formatOffset(now, id)
    const janOffset = formatOffset(jan, id)
    const julOffset = formatOffset(jul, id)
    const isDST = janOffset !== julOffset
    const standardOffset = isDST
      ? (janOffset < julOffset ? janOffset : julOffset)
      : offset
    const dstOffset = isDST
      ? (janOffset < julOffset ? julOffset : janOffset)
      : null

    return {
      id,
      name,
      offset,
      region,
      longName: getTimezoneName(now, id, 'long'),
      shortName: getTimezoneName(now, id, 'short'),
      longGeneric: getTimezoneName(now, id, 'longGeneric'),
      shortGeneric: getTimezoneName(now, id, 'shortGeneric'),
      isDST,
      dstOffset,
      standardOffset,
    }
  })

  return timezones
})

// Option B: Fetch and parse IANA tzdata directly from official source
export const getTimezonesFromIANA = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    // Fetch zone1970.tab from IANA's official repository
    const response = await fetch('https://raw.githubusercontent.com/eggert/tz/main/zone1970.tab')

    if (!response.ok) {
      throw new Error('Failed to fetch IANA timezone data')
    }

    const data = await response.text()
    const lines = data.split('\n')

    const timezones: TimezoneIANA[] = []

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) continue

      // Parse tab-separated values: countries, coordinates, id, comment
      const parts = line.split('\t')
      if (parts.length < 3) continue

      const countryCodes = parts[0].split(',')
      const coordinates = parts[1]
      const id = parts[2]
      const comment = parts[3] || null

      // Extract region from timezone ID
      const idParts = id.split('/')
      const region = idParts.length > 1 ? idParts[0] : 'UTC'
      const name = idParts.length > 1 ? idParts.slice(1).join('/').replace(/_/g, ' ') : id

      // Get current offset for this timezone
      try {
        const now = new Date()
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: id,
          timeZoneName: 'longOffset'
        })

        const offsetMatch = formatter.format(now).match(/GMT([+-]\d{1,2}):?(\d{2})?/)
        let offset = 'UTC+0'
        if (offsetMatch) {
          const hours = offsetMatch[1]
          const minutes = offsetMatch[2] || '00'
          offset = minutes === '00' ? `UTC${hours}` : `UTC${hours}:${minutes}`
        }

        timezones.push({
          id,
          name,
          offset,
          region,
          countryCodes,
          coordinates,
          comment,
        })
      } catch (error) {
        // Skip timezones not supported by this Node.js version
        console.warn(`Skipping timezone ${id}: not supported by this runtime`)
      }
    }

    return timezones
  } catch (error) {
    console.error('Error fetching IANA timezones:', error)
    // Return empty array on error
    return []
  }
})
