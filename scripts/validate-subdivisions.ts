/**
 * Cross-checks our local ISO 3166-2 subdivision data against the iso3166-2 API
 * (which mirrors the ISO OBP data).
 *
 * Usage: npx tsx scripts/validate-subdivisions.ts
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const API_BASE = 'https://iso3166-2-api.vercel.app/api/alpha'
const SUBDIVISIONS_DIR = join(import.meta.dirname, '../src/data/countries/reference/subdivisions')

interface LocalEntry {
  code: string
  type?: string
  names: Record<string, string>
  iso1?: string
  flag?: string
}

interface ApiSubdivision {
  code: string
  name: string
  type: string
  localOtherName: string | null
  parentCode: string | null
}

interface ApiCountryData {
  [subdivisionCode: string]: ApiSubdivision
}

interface ApiResponse {
  [countryCode: string]: ApiCountryData
}


function loadLocalData(countryCode: string): LocalEntry[] {
  const filePath = join(SUBDIVISIONS_DIR, `${countryCode}.json`)
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

function normalizeType(type: string): string {
  return type.toLowerCase().replace(/[^a-z ]/g, '').trim()
}

// Batch country codes into groups
function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

async function main() {
  // Get all local country files
  const files = readdirSync(SUBDIVISIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort()

  console.log(`Found ${files.length} local subdivision files\n`)

  const issues: string[] = []
  const batches = chunk(files, 5) // 5 countries per API call

  for (const batch of batches) {
    let apiData: ApiResponse
    try {
      apiData = await fetch(`${API_BASE}/${batch.join(',')}`)
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`)
          return r.json()
        })
    } catch (err) {
      issues.push(`[FETCH ERROR] ${batch.join(',')}: ${err}`)
      continue
    }

    for (const code of batch) {
      const local = loadLocalData(code)
      const apiCountry = apiData[code]

      if (!apiCountry) {
        issues.push(`[NO API DATA] ${code}: API returned no data`)
        continue
      }

      const apiCodes = new Set(Object.keys(apiCountry))
      const localCodes = new Set(local.map(e => e.code))

      // Check for codes in API but not local
      for (const apiCode of apiCodes) {
        if (!localCodes.has(apiCode)) {
          const sub = apiCountry[apiCode]
          issues.push(`[MISSING LOCAL] ${code}: ${apiCode} "${sub.name}" (${sub.type}) — exists in API but not in our data`)
        }
      }

      // Check for codes in local but not API
      for (const entry of local) {
        if (!apiCodes.has(entry.code)) {
          const name = Object.values(entry.names)[0]
          issues.push(`[EXTRA LOCAL] ${code}: ${entry.code} "${name}" (${entry.type}) — exists in our data but not in API`)
        }
      }

      // Check type mismatches for matching codes
      for (const entry of local) {
        const apiSub = apiCountry[entry.code]
        if (!apiSub || !entry.type) continue

        const localType = normalizeType(entry.type)
        const apiType = normalizeType(apiSub.type)

        if (localType !== apiType) {
          issues.push(`[TYPE MISMATCH] ${entry.code}: local="${entry.type}" vs api="${apiSub.type}"`)
        }
      }

      // Count summary
      const matching = [...localCodes].filter(c => apiCodes.has(c)).length
      const missing = [...apiCodes].filter(c => !localCodes.has(c)).length
      const extra = [...localCodes].filter(c => !apiCodes.has(c)).length

      if (missing > 0 || extra > 0) {
        console.log(`${code}: ${matching} match, ${missing} missing, ${extra} extra`)
      } else {
        console.log(`${code}: ✓ ${matching} codes match`)
      }
    }

    // Rate limit: small delay between batches
    await new Promise(r => setTimeout(r, 500))
  }

  // Print all issues
  if (issues.length > 0) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`ISSUES FOUND: ${issues.length}`)
    console.log('='.repeat(60))
    for (const issue of issues) {
      console.log(issue)
    }
  } else {
    console.log('\n✓ All subdivision data matches the API!')
  }
}

main().catch(console.error)
