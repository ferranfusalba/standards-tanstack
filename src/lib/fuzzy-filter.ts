import { rankItem, rankings } from '@tanstack/match-sorter-utils'
import type { Ranking } from '@tanstack/match-sorter-utils'
import type { FilterFn } from '@tanstack/react-table'

export function createFuzzyFilter(threshold: Ranking): FilterFn<any> {
  return (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value, { threshold })
    addMeta({ itemRank })
    return itemRank.passed
  }
}

export const fuzzyFilter = createFuzzyFilter(rankings.CONTAINS)
export const fuzzyFilterAcronym = createFuzzyFilter(rankings.ACRONYM)
