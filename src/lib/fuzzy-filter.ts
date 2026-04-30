import { rankItem, rankings } from '@tanstack/match-sorter-utils'
import type { Ranking, RankingInfo } from '@tanstack/match-sorter-utils'
import type { FilterFn } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

export function createFuzzyFilter(threshold: Ranking): FilterFn<Record<string, unknown>> {
  return (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value, { threshold })
    addMeta({ itemRank })
    return itemRank.passed
  }
}

export const fuzzyFilter = createFuzzyFilter(rankings.CONTAINS)
export const fuzzyFilterAcronym = createFuzzyFilter(rankings.ACRONYM)
