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
npx tsc --noEmit # typecheck (TypeScript 7, native Go compiler)
npx tsx test.ts  # regression tests against recorded HAR fixtures
```

There is no test runner or linter configured. Before finishing a change, run **both**
`npx tsc --noEmit` and `npx tsx test.ts`. `test.ts` exits non-zero on failure and accepts a
substring filter (`npx tsx test.ts test2`). It replays the HAR fixtures and then a set of
`runCase` unit assertions — add new cases there rather than starting a framework.

## Architecture

```
App.tsx                  # Layout, 3-tab switching, result cards, detail tables
├── components/
│   ├── InputForm.tsx           # Salary, dependents, insurance base, region, NĐ 253 exemptions,
│   │                           #   plus year-mode inputs (số tháng làm việc + danh sách thưởng)
│   ├── ComparisonChart.tsx     # Old vs new bar chart (takes a `period` prop for labels)
│   ├── BracketTable.tsx        # 7-bracket vs 5-bracket comparison (static)
│   ├── DeductionDetailTable.tsx # Rates, deductions, exemption caps; `period` scales the figures
│   ├── AnnualSummary.tsx       # Year mode: hoàn thuế / nộp thêm card + year-total table
│   ├── MonthlyBreakdownTable.tsx # Year mode: 12-month withholding table, flags spiky months
│   ├── TaxReductionChart.tsx   # Gross salary vs tax reduction curve (drives off calculateComparison)
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
   prorated by the period), then the progressive brackets.

### Kỳ tính thuế (monthly vs annual)

`TaxConfig` stores brackets and deductions **per month**. The annual mode does not use a second
bracket table — `scaleConfigToPeriod()` multiplies the monthly config by a `PeriodSpec`, because the
progressive function is linear under scaling:

```
f(n·B)(n·x) = Σ (min(n·x, n·max) − n·min)⁺ · rate = n · f(B)(x)
```

So there is exactly one bracket loop. `PeriodSpec` carries two counts, and they differ for a
partial year:

- `deductionMonths` — scales brackets + giảm trừ gia cảnh. Always **12** in year mode: a cá nhân cư
  trú gets the full 12-month personal deduction even when they worked fewer months
  (điểm c.1.1 khoản 1 Điều 9 TT 111/2013/TT-BTC). This is what produces a refund for a mid-year joiner.
- `incomeMonths` — scales the meal-allowance cap and overtime, which only accrue in months worked.

The annual y tế / giáo dục caps are **not** scaled (they are already per-year); they are prorated by
`deductionMonths / 12`, which reduces to the old `/ 12` in monthly mode.

`calculateAnnual()` runs two passes and compares them: a month-by-month withholding simulation
(monthly brackets, per-month insurance cap) and the year-total finalization. `settlement =
annual.taxAmount − totalWithheld`; negative means hoàn thuế. Two modelling choices worth knowing:
one-off bonuses default to **not** subject to BHXH, and y tế/giáo dục are **not** withheld monthly
(they are only claimed at quyết toán) — both are real sources of refunds.

**The insurance cap is a monthly ceiling**, so `calculateAnnual` caps each month then sums. Capping
an annual total would give a different answer whenever months differ.

Load-bearing invariant, asserted in `test.ts`: with a flat 12-month salary and no extras, the annual
result equals **exactly** 12 × the monthly result, and `settlement` is 0. If you touch the scaling,
that test is the one that catches you.

### Tabs

Three tabs: `calculator` (theo tháng), `annual` (quyết toán năm), `changelog`. `App` renders them
but hides the inactive one with a `hidden` class rather than unmounting, so switching preserves the
user's inputs and results.

`calculator` and `annual` **share one panel and one `InputForm` instance** — `CALCULATOR_TABS` /
`isCalculatorTab` gate the same `<div>`, so `InputForm` keeps its position in the React tree and is
never unmounted when switching between them. Everything the user typed survives the switch. Only the
right-hand results column changes.

`period` is **derived** from `activeTab` (`activeTab === 'annual' ? 'year' : 'month'`), not stored.
Do not add a separate period state — two sources of truth for the same thing will drift.

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
BHTN capped at 20 × lương tối thiểu vùng. Three selectable wage sets in `MIN_WAGE_OPTIONS` (App.tsx):
`legacy` (pre-2026), `current2026` (NĐ 293/2025/NĐ-CP) and `draft2027` (dự thảo, Bộ Nội vụ 20/7/2026 —
not yet issued, so always label it as a draft in the UI). `getDefaultMinWageSet()` picks the set in
force on the current date, so the default rolls over on its own; keep `MIN_WAGE_OPTIONS` at module
scope — an in-component object would give `handleCalculate` a new dependency every render and loop.

Sanity check used when touching deduction logic: gross 28,6tr with 1 dependent and the full
23tr + 24tr medical/education deductions must produce **0 tax** under the new rules.

## Conventions

- TypeScript 7 everywhere, React function components with hooks. `noImplicitAny` is on by default in
  TS 7, so new code must be explicitly typed.
- TailwindCSS via CDN (see `index.html`) — no Tailwind build step, no CSS files.
- Currency always rendered through `formatCurrency()`.
- Vietnamese for user-facing strings; cite the article/decree (e.g. "Điều 26 NĐ 253/2026/NĐ-CP")
  in comments and UI notes when encoding a legal rule.

## When the law changes

1. Add or update the constant in `types.ts` with a comment naming the văn bản.
2. Adjust `OLD_CONFIG` / `NEW_CONFIG` in `utils/taxCalculator.ts`.
3. Update the static tables (`BracketTable`, `DeductionDetailTable`) and add a timeline entry to
   `components/LawChangelog.tsx`, including a `url` pointing at the full text on thuvienphapluat.vn.
4. Refresh `README.md` (feature table + tax law reference) and the screenshots in `assets/`.
