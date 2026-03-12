import { describe, it, expect } from 'vitest'
import { rankItem, rankings } from '@tanstack/match-sorter-utils'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import type { Row, FilterMeta } from '@tanstack/react-table'
import { createFuzzyFilter, fuzzyFilter, fuzzyFilterAcronym } from '../fuzzy-filter'

type TestRow = Row<Record<string, unknown>>

// Minimal row stub - only getValue is used by the filter
function makeRow(value: string): TestRow {
  return { getValue: () => value } as unknown as TestRow
}

function makeMeta(): { itemRank: RankingInfo | null } {
  return { itemRank: null }
}

describe('createFuzzyFilter', () => {
  it('creates a filter function', () => {
    const filter = createFuzzyFilter(rankings.CONTAINS)
    expect(typeof filter).toBe('function')
  })

  it('returns true when value contains search term', () => {
    const meta = makeMeta()
    const result = fuzzyFilter(makeRow('United States'), 'code', 'united', (m) => { Object.assign(meta, m) })
    expect(result).toBe(true)
  })

  it('returns false when value does not match', () => {
    const meta = makeMeta()
    const result = fuzzyFilter(makeRow('Japan'), 'code', 'xyz', (m) => { Object.assign(meta, m) })
    expect(result).toBe(false)
  })

  it('adds itemRank to meta', () => {
    let savedMeta: Record<string, unknown> | null = null
    fuzzyFilter(makeRow('Euro'), 'code', 'eur', (m: FilterMeta) => { savedMeta = m as unknown as Record<string, unknown> })
    expect(savedMeta).not.toBeNull()
    const itemRank = savedMeta!.itemRank as RankingInfo
    expect(itemRank).toBeDefined()
    expect(itemRank.passed).toBe(true)
  })
})

describe('fuzzyFilter (CONTAINS threshold)', () => {
  it('matches substring', () => {
    const result = fuzzyFilter(makeRow('US Dollar'), 'col', 'dollar', () => {})
    expect(result).toBe(true)
  })

  it('does not match scattered characters', () => {
    // "bitcoin" should NOT match "Bond Markets Unit European Composite Unit (EURCO)"
    // because CONTAINS requires actual substring matching
    const result = fuzzyFilter(
      makeRow('Bond Markets Unit European Composite Unit (EURCO)'),
      'col',
      'bitcoin',
      () => {}
    )
    expect(result).toBe(false)
  })

  it('matches case-insensitively', () => {
    const result = fuzzyFilter(makeRow('Japanese Yen'), 'col', 'YEN', () => {})
    expect(result).toBe(true)
  })

  it('matches exact values', () => {
    const result = fuzzyFilter(makeRow('USD'), 'col', 'USD', () => {})
    expect(result).toBe(true)
  })
})

describe('fuzzyFilterAcronym (ACRONYM threshold)', () => {
  it('matches acronyms', () => {
    const result = fuzzyFilterAcronym(makeRow('United States'), 'col', 'us', () => {})
    expect(result).toBe(true)
  })

  it('matches substring (higher rank passes too)', () => {
    const result = fuzzyFilterAcronym(makeRow('English'), 'col', 'eng', () => {})
    expect(result).toBe(true)
  })

  it('matches short language codes', () => {
    const result = fuzzyFilterAcronym(makeRow('en'), 'col', 'en', () => {})
    expect(result).toBe(true)
  })

  it('does not match completely unrelated strings', () => {
    const result = fuzzyFilterAcronym(makeRow('French'), 'col', 'zz', () => {})
    expect(result).toBe(false)
  })
})

describe('rankItem integration', () => {
  it('ranks exact match higher than contains', () => {
    const exact = rankItem('USD', 'USD')
    const contains = rankItem('US Dollar', 'USD')
    expect(exact.rank).toBeGreaterThan(contains.rank)
  })

  it('ranks starts_with higher than contains', () => {
    const startsWith = rankItem('Euro', 'eur')
    const contains = rankItem('New Euro', 'eur')
    expect(startsWith.rank).toBeGreaterThanOrEqual(contains.rank)
  })

  it('threshold filters out low-quality matches', () => {
    // 'us' matches 'United States' as ACRONYM but not as CONTAINS
    const withContains = rankItem('United States', 'us', { threshold: rankings.CONTAINS })
    const withAcronym = rankItem('United States', 'us', { threshold: rankings.ACRONYM })
    expect(withContains.passed).toBe(false)
    expect(withAcronym.passed).toBe(true)
  })
})
