# AGENTS.md

This file provides guidance for AI agents working on the **Vietnam Tax Calculator** codebase.

> See [CLAUDE.md](CLAUDE.md) for the detailed architecture notes and conventions.

## Project Overview

A Vietnam Personal Income Tax Calculator that compares the old tax rules with Luật Thuế TNCN 2025
(109/2025/QH15) and Nghị định 253/2026/NĐ-CP, both effective July 1, 2026. Users enter salary,
dependents, insurance base, minimum wage region and the new exemptions (meal allowance, overtime,
medical and education expenses) to see insurance and PIT computed under both rule sets.

**Live Demo**: https://vietvudanh.github.io/vietnam-tax-2025/

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS (via CDN)
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

```
├── App.tsx           # Main application component with all tax calculation logic
├── index.tsx         # React entry point
├── index.html        # HTML template with TailwindCSS CDN
├── types.ts          # TypeScript type definitions
├── components/       # Reusable React components (incl. LawChangelog.tsx - law history tab)
├── utils/            # Utility functions
├── assets/           # Static assets (images, screenshots)
├── public/           # Public static files
└── test_requests/    # Test data and request examples
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Features

1. **Tax Calculation**: Calculate personal income tax under both old and new regulations
2. **Insurance Calculation**: Compute mandatory social insurance, health insurance, and unemployment insurance contributions
3. **Comparison View**: Side-by-side comparison of net income under old vs. new tax laws
4. **Progressive Tax Tables**: Display progressive tax brackets and deductions
5. **NĐ 253/2026/NĐ-CP exemptions**: Meal allowance cap (1.2M/month), full overtime and night-shift
   exemption, medical (23M/year) and education (24M/year) deductions
6. **Law Changelog tab**: Timeline of every major PIT change from the 2007 law onwards
7. **Bilingual Support**: Vietnamese language interface

## Important Notes

- Tax calculations follow Vietnamese tax law regulations
- The new tax law (Luật Thuế TNCN 2025 + Nghị định 253/2026/NĐ-CP) takes effect from July 1, 2026;
  rules on salary income apply from tax year 2026, meal allowance rules from July 1, 2026
- Legal constants live in `types.ts`; tax math lives in `utils/taxCalculator.ts`
- Insurance contribution rates are based on official government regulations
- Minimum wage regions affect insurance calculation caps

## Code Style Guidelines

- Use TypeScript for all new code
- Follow React functional component patterns with hooks
- Use descriptive variable names (Vietnamese terms are acceptable for tax-related terminology)
- Keep components focused and reusable
- Add comments for complex tax calculation logic

## Testing

- `npx tsx test.ts` replays the recorded HAR fixtures in `test_requests/` against the calculator
- `npx tsc --noEmit` typechecks the project
- Run both before finishing a change

## Deployment

The app is deployed to GitHub Pages at:
https://vietvudanh.github.io/vietnam-tax-2025/

---

**Maintainer**: [vietvudanh](https://github.com/vietvudanh)
