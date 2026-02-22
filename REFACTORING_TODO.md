# Codebase Refactoring — Remaining Tasks

Tasks 1–4 are complete. Tasks 5–6 remain.

## Completed

1. **Shared test mock factory** — `src/test/mocks/recharts.tsx` + `src/test/mocks/factories.ts`; 5 test files updated
2. **Stats consolidation** — `calculateTeamStats`/`filterTeamStatsBySource` moved to `utils/countryStats.ts`; `getAvailableSources` renamed
3. **`useSourceSelection` hook** — `src/hooks/useSourceSelection.ts` + `src/components/SourceTabs.tsx`; CountryIndividual & CountryComparison updated
4. **`useSortedTable` hook** — `src/hooks/useSortedTable.ts`; 7 pages (10 useReactTable calls) updated

## Remaining

### Task 5: Sub-component Extraction (Team vs Individual)

Extract team/individual content into separate sub-components so parent pages become: data fetching + computation + `{isTeam ? <TeamContent .../> : <IndividualContent .../>}`.

**Competition page (`pages/Competition/`):**
- Create `TeamContent.tsx` — team score distribution chart + team results table (~60 lines JSX)
- Create `IndividualContent.tsx` — individual score distribution chart + tabs with individual/country views (~180 lines JSX)
- Props receive pre-computed data (tables, chart data, styles). All `useMemo` stays in parent.

**CountryIndividual page (`pages/CountryIndividual/`):**
- Create `TeamContent.tsx` — team stats cards + score-over-time chart + team results table
- Create `IndividualContent.tsx` — medal stats cards + medal progression chart + individual results table

**CountryComparison page (`pages/CountryComparison/`):**
- Create `TeamSection.tsx` — team performance summary + team charts (score, rank)
- Create `IndividualSection.tsx` — medal summary + individual charts (medals, avg score, total points, team rank)

### Task 6: CountryComparison Chart Wrapper

Create `pages/CountryComparison/ComparisonLineChart.tsx` — local component for the 6 nearly-identical two-country LineCharts:

```tsx
interface ComparisonLineChartProps {
  chartData: Record<string, unknown>[];
  dataKey1: string;
  dataKey2: string;
  yAxisProps?: { reversed?: boolean; domain?: [number, number]; allowDecimals?: boolean };
  isDark: boolean;
}
```

Each chart goes from ~30 lines to ~5 lines. This is specific to CountryComparison (two-country pattern), not a generic chart wrapper.

## Verification

After completing all tasks:
1. `cd apps/web && npx vitest run` — all tests pass
2. `npm run lint && npm run format:check` — clean
3. Manual: open IMO competition page — no visual regression
4. Manual: open Baltic Way competition — compact layout still works
5. Manual: open a country page with multiple sources — tab switching works
6. Manual: open country comparison — charts render correctly
