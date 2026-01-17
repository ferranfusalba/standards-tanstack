import { createServerFn } from '@tanstack/react-start'

export interface Timezone {
  id: string
  name: string
  offset: string
  region: string
}

// Option A: Get timezones from JavaScript Intl API (built-in, always up-to-date)
export const getTimezonesFromIntl = createServerFn({
  method: 'GET',
}).handler(async () => {
  const tzIds = Intl.supportedValuesOf('timeZone')

  const timezones: Timezone[] = tzIds.map(id => {
    // Extract region from timezone ID (e.g., "America/New_York" -> "America")
    const parts = id.split('/')
    const region = parts.length > 1 ? parts[0] : 'UTC'
    const name = parts.length > 1 ? parts.slice(1).join('/').replace(/_/g, ' ') : id

    // Get current offset for this timezone
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

    return {
      id,
      name,
      offset,
      region
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

    const timezones: Timezone[] = []

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) continue

      // Parse tab-separated values
      const parts = line.split('\t')
      if (parts.length < 3) continue

      const id = parts[2] // Timezone ID (e.g., "America/New_York")

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
          region
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
