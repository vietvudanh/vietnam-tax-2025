# AGENTS.md

This file provides guidance for AI agents working on the **Vietnam Tax Calculator 2025** codebase.

## Project Overview

A Vietnam Personal Income Tax Calculator that compares the old and new tax laws (effective July 1, 2025). The app allows users to input salary, number of dependents, and minimum wage region to automatically calculate insurance and personal income tax.

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
├── components/       # Reusable React components
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
5. **Bilingual Support**: Vietnamese language interface

## Important Notes

- Tax calculations follow Vietnamese tax law regulations
- The new tax law takes effect from July 1, 2025
- Insurance contribution rates are based on official government regulations
- Minimum wage regions affect insurance calculation caps

## Code Style Guidelines

- Use TypeScript for all new code
- Follow React functional component patterns with hooks
- Use descriptive variable names (Vietnamese terms are acceptable for tax-related terminology)
- Keep components focused and reusable
- Add comments for complex tax calculation logic

## Testing

- Test files are located with `.ts` extension in the root directory
- Use `test_requests/` for API request examples

## Deployment

The app is deployed to GitHub Pages at:
https://vietvudanh.github.io/vietnam-tax-2025/

---

**Maintainer**: [vietvudanh](https://github.com/vietvudanh)
