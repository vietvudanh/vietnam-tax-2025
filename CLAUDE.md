# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Vietnam Tax Calculator** — a single-page React app that compares Vietnamese Personal Income Tax
(TNCN) between the old rules and the new rules from **Luật Thuế TNCN 2025 (109/2025/QH15)** plus
**Nghị định 253/2026/NĐ-CP**, both effective **1/7/2026**.

Live: https://vietvudanh.github.io/vietnam-tax-2025/ (repo name keeps the `2025` slug for URL stability).

UI language is Vietnamese. Legal terminology stays in Vietnamese in both UI strings and code comments.

## Commands

```bash
npm install
npm run dev      # Vite dev server on http://localhost:3000/vietnam-tax-2025/
npm run build    # production build to dist/
npm run preview
npx tsc --noEmit # typecheck
npx tsx test.ts  # regression tests against recorded HAR fixtures
```

There is no test runner or linter configured. Before finishing a change, run **both**
`npx tsc --noEmit` and `npx tsx test.ts`.

## Architecture

```
App.tsx                  # Layout, tab switching, result cards, detail tables
├── components/
│   ├── InputForm.tsx           # Salary, dependents, insurance base, region, NĐ 253 exemptions
│   ├── ComparisonChart.tsx     # Old vs new bar chart
│   ├── BracketTable.tsx        # 7-bracket vs 5-bracket comparison (static)
│   ├── DeductionDetailTable.tsx # Rates, deductions, exemption caps (static)
│   ├── TaxReductionChart.tsx   # Gross salary vs tax reduction curve
│   └── LawChangelog.tsx        # Tab 2: law history timeline (static data in-file)
├── utils/taxCalculator.ts  # All tax math; OLD_CONFIG / NEW_CONFIG live here
└── types.ts                # Types + every legal constant (deductions, caps, thresholds)
```

**Key rule: legal constants live in `types.ts`, tax math lives in `utils/taxCalculator.ts`.**
Components import constants; they never hardcode amounts. Two configs (`OLD_CONFIG`, `NEW_CONFIG`)
drive the whole comparison — a rule that differs between old and new law belongs on `TaxConfig`,
not in a branch inside the calculation.

### Calculation flow

1. `InputForm` owns all input state and calls `onCalculate(gross, dependents, insurance, region, extra)`
   from a `useEffect`. `App.handleCalculate` **must stay wrapped in `useCallback`** — an unstable
   reference causes an infinite update loop.
2. `calculateComparison()` computes insurance once (identical for both laws), then runs
   `calculateTaxForConfig()` for each config.
3. Per config: `incomeBeforeTax = gross - insurance`, minus exempt income (meal allowance within cap
   + overtime if the config exempts it), minus deductions (personal + dependents + medical/education
   divided by 12), then the progressive brackets.

### Tabs

`App` renders both tabs but hides the inactive one with a `hidden` class rather than unmounting, so
switching tabs preserves the user's inputs and results.

## Current legal parameters

| | Cũ | Mới (1/7/2026) |
|---|---|---|
| Brackets | 7 (5%-35%) | 5 (5, 10, 20, 30, 35%) |
| Giảm trừ bản thân | 11tr | 15,5tr |
| Giảm trừ người phụ thuộc | 4,4tr | 6,2tr |
| Tiền ăn giữa ca miễn thuế | 730k/tháng | 1,2tr/tháng |
| Làm thêm giờ / ban đêm | Không miễn toàn bộ | Miễn toàn bộ |
| Chi phí y tế | — | 23tr/năm |
| Chi phí giáo dục | — | 24tr/năm |

Insurance: BHXH 8% + BHYT 1,5% + BHTN 1%. BHXH/BHYT capped at 20 × mức tham chiếu (2.340.000 ₫);
BHTN capped at 20 × lương tối thiểu vùng, with a toggle for the 2026 rates (NĐ 293/2025/NĐ-CP).

Sanity check used when touching deduction logic: gross 28,6tr with 1 dependent and the full
23tr + 24tr medical/education deductions must produce **0 tax** under the new rules.

## Conventions

- TypeScript everywhere, React function components with hooks.
- TailwindCSS via CDN (see `index.html`) — no Tailwind build step, no CSS files.
- Currency always rendered through `formatCurrency()`.
- Vietnamese for user-facing strings; cite the article/decree (e.g. "Điều 26 NĐ 253/2026/NĐ-CP")
  in comments and UI notes when encoding a legal rule.

## When the law changes

1. Add or update the constant in `types.ts` with a comment naming the văn bản.
2. Adjust `OLD_CONFIG` / `NEW_CONFIG` in `utils/taxCalculator.ts`.
3. Update the static tables (`BracketTable`, `DeductionDetailTable`) and add a timeline entry to
   `components/LawChangelog.tsx`.
4. Refresh `README.md` (feature table + tax law reference) and the screenshots in `assets/`.
