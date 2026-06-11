# EcoTwin AI

AI-Powered Carbon Footprint Awareness Platform

Built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### Carbon Footprint Calculator
Track daily emissions across four categories with scientifically sourced emission factors:
- **Transport** — Car, bus, train, flight, bicycle, EV (12 activities, EPA/ICAO/IEA sources)
- **Energy** — Electricity, heating, cooling, lighting, standby (10 activities, EIA/DOE sources)
- **Food** — Beef, lamb, pork, vegetarian, vegan, food waste (11 activities, Poore & Nemecek/FAO sources)
- **Shopping** — Clothing, electronics, furniture, deliveries (9 activities, McKinsey/Apple/EPA sources)

### Smart Dashboard
- 7-day emissions trend chart
- Category breakdown pie chart
- Sustainability score (A+ through F) with circular progress indicator
- Monthly goal tracking with progress bar
- Environmental equivalents (trees, flight hours, car km)
- Recent entries list

### AI Sustainability Coach
- Context-aware responses using your actual tracked data
- Personalized reduction plans with specific kg savings estimates
- Covers transport, energy, food, shopping, and goal-setting
- Chat history persisted to Supabase
- Suggested questions for quick interaction

### What-If Simulator
- Compare current lifestyle vs improved lifestyle
- Multiple reduction scenarios per category (transport: 5 options, energy: 4, food: 4, shopping: 4)
- Interactive bar chart comparison
- Annual environmental impact equivalents (trees, flights, CO2 kg/year)
- Sample data mode for new users

### Authentication
- Email/password sign-up and sign-in via Supabase Auth
- Protected routes with loading states
- User profile avatars

### Additional
- **Dark mode** — System preference detection + manual toggle, persisted to localStorage
- **Responsive design** — Mobile-first, 8px spacing system
- **Accessibility** — WCAG 2.1 AA: labeled form fields, ARIA attributes, keyboard navigation, skip-to-content link, screen reader support
- **Performance** — Lazy-loaded routes, code-split bundles (vendor/charts/supabase chunks)

## Architecture

```
src/
  types/           TypeScript interfaces and type definitions
  lib/
    supabase.ts    Supabase client initialization
    emissions.ts   Emission factors, scoring, projection utilities
  context/
    AuthContext.tsx  Authentication state management
    ThemeContext.tsx Dark mode state management
  components/
    Navbar.tsx         Navigation with mobile hamburger menu
    ProtectedRoute.tsx Auth guard for private routes
    ui/
      StatCard.tsx            Dashboard statistic card
      ProgressBar.tsx         Accessible progress bar
      SustainabilityScore.tsx Circular score indicator
      Spinner.tsx             Loading spinner
      EmptyState.tsx          Empty state placeholder
      CategoryTab.tsx         Calculator category tab
  pages/
    Landing.tsx    Hero, features, stats, CTA
    Login.tsx      Sign in form
    Signup.tsx     Account creation form
    Calculator.tsx Carbon footprint entry and tracking
    Dashboard.tsx  Charts, score, goals, analytics
    Coach.tsx      AI chat interface
    Simulator.tsx  What-if lifestyle comparison
  __tests__/
    setup.ts              Test configuration
    emissions.test.ts     Unit tests for emission utilities
    Calculator.test.tsx   Component tests for calculator
    Dashboard.test.tsx    Component tests for dashboard
    Coach.test.tsx        Component tests for AI coach
    ui.test.tsx           Component tests for UI primitives
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS 3 |
| Routing | React Router DOM 7 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Backend | Supabase (Auth, Database, RLS) |
| Build | Vite 5 |
| Testing | Vitest, React Testing Library, jest-dom |
| Linting | ESLint 9, eslint-config-prettier |
| Formatting | Prettier 3 |

## Database Schema

### `profiles`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, references auth.users |
| display_name | text | |
| monthly_goal_kg | numeric | default: 150 |

### `carbon_entries`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| category | text | CHECK: transport, energy, food, shopping |
| description | text | |
| co2_kg | numeric | |
| date | date | default: CURRENT_DATE |

### `coach_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| role | text | CHECK: user, assistant |
| content | text | |

All tables have Row Level Security (RLS) enabled with per-verb policies restricting access to `authenticated` users owning the data.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
npm test              # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # With coverage
```

### Lint & Format
```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Emission Factor Sources

All emission factors are sourced from peer-reviewed research and government databases:
- EPA GHG Equivalencies Calculator
- Poore & Nemecek, *Science* 2018 (food emissions)
- IEA Global EV Data Explorer
- ICAO Carbon Emissions Calculator
- EIA Residential Energy Consumption Survey
- DOE Energy Saver Program
- FAO Food Waste Report
- McKinsey Fashion Index
- Apple/Dell Environmental Reports

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/name`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to the branch (`git push origin feature/name`)
5. Open a Pull Request

## License

MIT
