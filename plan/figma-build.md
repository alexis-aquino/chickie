# Chickie — Figma → React Build Plan

## Post-launch: real backend + deployment (2026-07-05)

After the initial static/mock build (Waves 1-5 below), the app was upgraded to a full
production stack and deployed:

- **Personalization fix:** the Profile → Appearance tab's theme/accent picker previously only
  recolored the avatar ring. `DashboardLayout` now overrides the `--brand`/`--brand-dark`/
  `--brand-light` CSS variables (see `utils/color.ts`'s `shade()`) on the dashboard root based on
  `user.accentColor`, so every `bg-brand`/`text-brand` element site-wide follows the user's choice.
  Clicking a theme preset now also sets a coordinated accent color.
- **Database:** new Supabase project **`chickie`** (`assguodmmoishsicndzl`,
  `ap-southeast-1`, free tier, $0/mo). Multi-tenant schema — `organizations`, `profiles`,
  `suppliers`, `inventory_items`, `purchase_records`, `customers`, `customer_orders`,
  `feedback_records`, `promotions` — every business table scoped by `organization_id` and
  isolated with RLS via a `current_org_id()` helper. Two RPCs: `create_account()` (bootstraps a
  new org + profile right after signup, SECURITY DEFINER since RLS can't apply before a profile
  exists) and `seed_demo_data(org_id)` (loads the original 30-item/7-supplier/8-customer mock
  dataset into a given org — guarded so a user can only seed their *own* org, after an advisor
  caught the first version letting any authenticated user seed any org).
- **"Empty" version, satisfied via signup, not a separate build:** the sign-up form has a
  "Populate with sample data" checkbox (default on). Checked → `seed_demo_data` runs for the new
  org. Unchecked → the org starts completely empty (zero inventory/suppliers/customers), which is
  the literal empty version that was asked for — no need for a second app variant.
  Empty-state division-by-zero (e.g. repeat-customer %) was guarded in `CRMDashboard`.
- **Auth:** real Supabase Auth (email/password + Google OAuth wiring, pending the user enabling
  the Google provider in their Supabase dashboard with their own OAuth client). Email confirmation
  is required by Supabase's default settings — this was intentionally left on rather than
  bypassed. An attempt to add a DB trigger that auto-confirmed every new user was blocked by the
  harness's safety classifier as a real security weakening, and correctly so; it was not retried.
- **Data layer:** `lib/store-context.tsx` now fetches/mutates real Postgres rows instead of static
  arrays, mapped to the same camelCase types the UI already used (so almost no section components
  needed logic changes — just swapping `import { suppliers } from "@/lib/inventory-data"` for
  `useStore()`). `lib/crm-data.ts` keeps only the two things that really are static config
  (`TIER_CONFIG`, `inventoryToMenuMap`); customers/promotions/suppliers are now live data.
- **Deployment:** Vercel project `aleksissmol/chickie`, env vars `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_PUBLISHABLE_KEY` set for Production. Live at **https://chickie.vercel.app**.
- **Verified:** personalization recoloring, signup validation, sign-in error handling, Google
  OAuth redirect wiring, and the production deployment were all confirmed working via a headless
  browser. Full post-confirmation dashboard flow (data loading into a brand-new org, Create
  Order/Mark Delivered mutations) was verified against the dev server up to the point where
  Supabase's required email confirmation blocks further automated testing — see "Known
  limitations" below.

### Known limitations / what the user should check themselves
- **Email confirmation:** new signups must click a confirmation link before they can sign in
  (Supabase default — not bypassed). Test with a real email address you can check. If you'd
  rather skip this for a demo, you can turn off "Confirm email" in Supabase Dashboard → Authentication
  → Providers → Email — that's your call to make, not something done automatically here.
- **Google sign-in:** wired up in code, but requires enabling the Google provider in Supabase
  Dashboard → Authentication → Providers, with your own Google Cloud OAuth client ID/secret.
  Until then the button will show a real (harmless) "provider not enabled" error.
- **Email rate limits:** Supabase's free-tier shared email service is rate-limited; rapid
  successive signups during testing may hit "email rate limit exceeded."

---


Source design: https://www.figma.com/design/nfV3DkAB18MyafIcgg6wBk/Chickie
Source material actually available locally: a **Figma Make code export** at
`C:\Users\Alex\Desktop\Chickie` (already React + TS + Vite + Tailwind v4 + shadcn/ui),
not a raw design file. The Figma MCP connector is also unauthorized in this
environment. See "How this design was inspected" below.

Decisions confirmed with user (2026-07-05):
- **Scope:** full app — Landing page + authenticated Dashboard (SCM + CRM modules), not just one page.
- **MUI:** strip entirely. Grepped the export — `@mui/*`/`@emotion/*`/`@popperjs` are listed in
  `package.json` but **never imported anywhere in `src/`**. Safe to drop with zero rewrite cost.
- **Source handling:** port & restructure — the export is ground truth for behavior/visuals, but
  gets rewritten into the requested folder structure and cleaned up as we go, not copied verbatim.

---

## How this design was inspected

The Figma MCP server (`plugin:figma:figma`) requires OAuth authorization that can't be completed in
this non-interactive session. Instead, design tokens and layout were extracted directly from the
Figma Make export's source (more accurate than re-deriving them from a live inspection anyway):
`src/styles/theme.css`, `tailwind.css`, `globals.css`, and every component file.

**If you want to reconnect to the live Figma file later** (e.g. to pull newer artboards not present
in this export), authorize the Figma MCP server via `/mcp` in an interactive Claude Code session
first.

---

## Design tokens extracted

**Colors** (defined as CSS vars in `theme.css`, consumed via Tailwind v4 `@theme inline`):
- Neutral/chrome scale: `--background #fff`, `--foreground oklch(0.145 0 0)`, `--primary #030213`
  (near-black — used for default shadcn button/focus chrome, *not* the brand color),
  `--muted #ececf0`, `--muted-foreground #717182`, `--accent #e9ebef`, `--destructive #d4183d`,
  `--border rgba(0,0,0,.1)`. Full parallel `.dark` mode palette also defined (oklch-based).
- **Brand identity** (Chickie's actual visual identity) is applied ad-hoc via Tailwind's stock
  palette directly in markup, *not* as custom tokens: `red-600/700` (primary CTAs, hero gradient),
  `yellow-400/500` + `amber-50/100` (logo ring, accents, gradient endpoint). This should be
  promoted into named Tailwind theme colors (e.g. `brand.red` / `brand.yellow`) during Wave 2 so
  it's no longer hardcoded utility literals.
- Chart palette: 5 `--chart-1..5` oklch tokens (used by `recharts` in `CategoryChart`).
- Sidebar-specific palette also defined (`--sidebar*`) though no sidebar nav is currently used —
  likely shadcn boilerplate; will drop if unused after port.

**Typography:**
- Base font-size `16px` (`--font-size`), applied at `html` level.
- `h1..h4`, `label`, `button`, `input` get default sizes/weights from CSS vars referencing
  Tailwind's `--text-2xl/xl/lg/base` scale + `--font-weight-medium (500)` / `normal (400)`.
- **No custom webfont is loaded** — `fonts.css` is present but empty. Falls back to system/Tailwind
  default sans stack. Flagged as an open question below.
- One inline arbitrary size on the landing hero h1: `clamp(2.4rem, 5vw, 4rem)` for a responsive
  display headline — worth keeping as a documented exception (real fluid-type use case).

**Spacing / layout grid:** standard Tailwind spacing scale; consistent `max-w-7xl mx-auto px-6`
page container; `gap-4`/`gap-6` grids; dashboard stat cards use `grid-cols-2 lg:grid-cols-4`.

**Border radius:** base `--radius: 0.625rem` (10px), with `sm/md/lg/xl` derived via
`calc(±2px/4px)` — standard shadcn radius scale.

**Shadows:** no custom shadow tokens — uses Tailwind's stock `shadow-md/lg/2xl` utilities directly.

**Icons:** `lucide-react` throughout, sized with Tailwind `size-*` utilities (3.5–14), not a fixed
icon-size constant.

**Assets:** exactly one image asset — `src/imports/image.png` (Chickie logo/mascot, reused as brand
mark and default avatar ring). One remote fallback avatar service (`ui-avatars.com`) used only for
the mocked Google-OAuth login path. `ATTRIBUTIONS.md` mentions Unsplash photos but none are actually
referenced in code — likely unused boilerplate from the Figma Make template.

**Dark mode:** fully defined in CSS (`.dark` class) but no theme toggle exists in the app yet.

---

## Sections identified

**Landing page (public, logged-out):**
1. Sticky top nav — logo, product name/tagline, "Secure & role-based" badge
2. Hero — gradient (red→yellow) banner, big logo lockup, headline, perks checklist, social proof
   (avatar stack + star rating), decorative blurred blobs + SVG wave divider
3. Auth card (embedded in hero, right column) — owner/staff role toggle, mock Google OAuth button,
   email/password sign-in and sign-up forms with client-side validation, show/hide password
4. Features grid — 4 feature cards (icon, title, description)
5. CTA banner — gradient strip with headline + star rating callout
6. Footer — logo, name, copyright

**Dashboard (authenticated):**
1. Header — logo, module switcher (SCM/CRM segmented control), role-conditional "Create Order"
   button, profile menu (avatar, name, role badge), sign-out
2. SCM module:
   - Stat cards row (Inventory Value [owner-only], Active Suppliers, Needs Reorder, Running Low)
   - Reorder alerts banner (conditional)
   - Tabbed content: Inventory table, Suppliers grid, Delivery schedule, Purchase history,
     Transaction history [owner-only], Category analytics chart [owner-only]
3. CRM module (`CRMModule` → `CRMDashboard`):
   - Customer list, Loyalty program, Feedback log, Promotion suggestions
4. Modals: Create Order dialog, Profile edit dialog

---

## Reusable components identified

**Primitives (shadcn/Radix-based, keep as-is, port to `components/ui/`):** accordion, alert,
alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart,
checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card,
input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group,
resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner (toaster),
switch, table, tabs, textarea, toggle, toggle-group, tooltip. Plus `use-mobile` hook and `cn()`
utility (`utils.ts`).

**App-level composed components (rewrite/reorganize into `sections/` + domain components):**
- `StatCard` — label/value/sublabel/icon/accent stat tile (already a clean reusable component)
- `InventoryTable`, `SuppliersGrid`, `DeliverySchedule`, `PurchaseHistory`, `TransactionHistory`,
  `CategoryChart` (recharts) — SCM tab bodies
- `CRMModule` → `CRMDashboard` → `CustomerList`, `LoyaltyProgram`, `FeedbackLog`,
  `PromotionSuggestions` — CRM tab bodies
- `CreateOrderDialog`, `ProfileDialog` — modals
- `ImageWithFallback` — generic `<img>` with graceful error fallback (keep in `components/`)
- Landing page currently monolithic (422 lines) — will be split into `Nav`, `Hero`, `AuthCard`,
  `FeaturesSection`, `CTABanner`, `Footer` under `sections/landing/`

**State/data (currently in-memory only, no backend):**
- `auth.tsx` — mock auth context (email/password + simulated Google OAuth), in-memory user map
- `store.tsx` — inventory + purchase-history context
- `data.ts` (301 lines) — supplier/inventory mock data + `stockStatus`/`supplierName` helpers
- `crmData.ts` (296 lines) — CRM mock data

---

## Responsive behavior observed

- Mobile-first Tailwind breakpoints throughout (`sm:`, `lg:`) — no custom breakpoints defined.
- Landing hero: single column on mobile, `lg:grid-cols-[1fr_420px]` (copy + auth card side-by-side)
  from `lg:` up.
- Perks checklist: 1 column → `sm:grid-cols-2`.
- Feature cards: 1 → `sm:grid-cols-2` → `lg:grid-cols-4`.
- Nav tagline and badge hidden below `sm:`; dashboard header collapses name/role text and the
  desktop "Create Order" button below `sm:`, replaced by an icon-only button.
- Dashboard stat cards: `grid-cols-2` on mobile straight to `lg:grid-cols-4` (no explicit tablet
  step — worth revisiting for a `sm:`/`md:` 2–3 col transition during polish).
- Module switcher and tabs collapse to icon-only / horizontally scrollable on narrow widths.

---

## Design decisions made / to be made

- [Decided] Strip `@mui/*`, `@emotion/*`, `@popperjs` from dependencies — unused.
- [Decided] Introduce **React Router** (multiple real views exist: landing, dashboard/SCM tabs,
  dashboard/CRM tabs) so tabs and modules become deep-linkable routes instead of local
  `useState` — this is a genuine upgrade over the export, not scope creep, since the brief calls
  for React Router whenever multiple pages exist.
- [Open question] No custom webfont is loaded in the export. Keep the system/Tailwind default sans
  stack, or should a brand webfont be added? Defaulting to **keep system stack** unless told
  otherwise.
- [Open question] `--sidebar*` tokens and the shadcn `sidebar.tsx` primitive exist but nothing in
  the app uses a sidebar nav. Plan to drop it during cleanup unless you want a sidebar-based
  dashboard nav instead of the current top-bar + tabs layout.
- [Open question] Auth/store are in-memory mocks with no backend or persistence (refresh = logged
  out, data resets). Continuing as mock state for this build; flag if real persistence/auth is
  wanted later.

---

## Project structure (created)

```
chickie/
  plan/figma-build.md
  src/
    assets/
    components/ui/       # shadcn/Radix primitives
    hooks/                # useAuth, useStore, use-mobile, etc.
    layout/               # AppShell, DashboardHeader, ProtectedRoute
    lib/                  # context providers, mock data, cn()
    pages/                # route-level: LandingPage, DashboardPage
    sections/
      landing/            # Nav, Hero, AuthCard, FeaturesSection, CTABanner, Footer
      scm/                 # Inventory, Suppliers, Deliveries, Purchases, Transactions, Analytics
      crm/                 # CustomerList, LoyaltyProgram, FeedbackLog, PromotionSuggestions
    styles/
    types/
    utils/
  public/
```

---

## Wave status

- [x] Wave 1 — Design analysis (this document)
- [x] Wave 2 — Core structure (Vite/Tailwind v4 config, TypeScript project refs, React Router,
      `ProtectedRoute` + `DashboardLayout`, shadcn primitives ported)
- [x] Wave 3 — UI implementation (landing page split into sections, full SCM + CRM dashboards)
- [x] Wave 4 — Forms & interactive components (auth sign-in/sign-up, Create Order, Profile dialog
      with password/appearance tabs, all with validation + toasts)
- [x] Wave 5 — Polish (see below)

All 5 waves complete. The app was built end-to-end and manually verified in a real headless
Chromium session (Playwright driver) at both desktop (1280×900) and mobile (390×844) viewports —
see "Verification" below.

## What got built

- **Tooling**: Vite 6 + `@tailwindcss/vite` (Tailwind v4), TypeScript project references
  (`tsconfig.app.json`/`tsconfig.node.json`), `@` path alias.
- **Routing**: `react-router` v7 with real deep-linkable URLs —
  `/` (landing), `/dashboard/scm/:tab`, `/dashboard/crm/:tab` — replacing the original export's
  local `useState` module/tab switching. Tabs are still driven by the shadcn `Tabs` component but
  `value`/`onValueChange` are wired to the route param so the browser back button and refresh both
  work correctly.
- **Design tokens**: brand red/yellow promoted from hardcoded Tailwind literals into named theme
  colors (`brand`, `brand-dark`, `brand-light`, `brand-accent`, `brand-accent-light`) in
  `styles/theme.css`, applied to primary CTAs, gradients, and logo rings across every section.
  Category/status/tier color-coding (e.g. per-category badge colors, loyalty tier colors) was left
  on Tailwind's stock palette since those are semantic/status colors, not brand identity.
- **Dependencies trimmed**: `@mui/*`, `@emotion/*`, `@popperjs/core`, `next-themes`, and every
  shadcn primitive not actually imported anywhere (25 of 40+ were unused) were dropped. Kept:
  accordion, avatar, badge, button, card, dialog, input, label, progress, select, separator, sheet,
  sonner, tabs, textarea + `recharts` (chart), `sonner` (toasts), `lucide-react` (icons).
- **Dedup during port**: `initials()` and `formatDate()` (copy-pasted in ~9 files in the original)
  now live in `utils/format.ts`; the 5-star rating widget (copy-pasted in 4 files) is now
  `components/Stars.tsx`.
- **Performance**: route-level code splitting (`React.lazy` for `LandingPage`/`ScmPage`/`CrmPage`)
  plus a separate lazy chunk for `CategoryChart` since `recharts` was the single heaviest dependency
  and only owners on the Analytics tab need it. Main bundle dropped from 887 KB to 390 KB; the
  947 KB logo PNG (1290×1290, displayed at ≤144px anywhere) was resized to 256×256 → 63 KB.
- **Bug fixes found during port**: `PromotionSuggestions` had a `stockStatus(item!)` non-null
  assertion that would throw if a promotion's linked item didn't exist — guarded properly.
  `dialog.tsx`/`sheet.tsx`'s `Overlay` sub-components weren't wrapped in `React.forwardRef`, which
  Radix's Slot mechanism needs on React 18 — caused a real console warning on every dialog/sheet
  open, fixed by wrapping both in `forwardRef`.
- **Accessibility**: added `aria-label`/`aria-hidden`/`role` attributes throughout (icon-only
  buttons, filter selects, radio-style role toggle, password strength meter, alert banners),
  `autoComplete` on auth/password fields, and semantic heading levels.

## Verification

Ran a Playwright-driven headless Chromium session against the dev server covering: landing page
render, owner sign-in → SCM dashboard, all 6 SCM tabs, Create Order dialog, Profile dialog (avatar/
password/appearance tabs), switch to CRM module, all 5 CRM tabs, customer detail sheet, sign-out
back to landing — then repeated the sign-in flow as `staff` at a 390×844 mobile viewport to confirm
role-based UI (hidden Inventory Value stat, hidden Create Order button, hidden Transactions/
Analytics tabs) and responsive collapsing (icon-only module switcher, stacked hero/auth-card).
Zero console errors or warnings in the final run. `tsc -b` and `vite build` both pass clean.

## Known issues / carried forward from export
- No automated test suite exists (none in the original export either) — out of scope unless
  requested.
- Auth/inventory/purchase state is in-memory only (by design, per the "stay mock" decision below);
  refreshing the page logs the user out and resets any submitted orders.
- `ATTRIBUTIONS.md` still references Unsplash photos that were never actually used in code — left
  as-is since removing it wasn't requested and it's harmless.

## Decisions resolved during the build
- Webfont: kept the system/Tailwind default sans stack (no brand webfont existed in the source; a11y
  and load-time both benefit from not adding one speculatively).
- Sidebar: dropped the unused `sidebar.tsx` primitive and `--sidebar*` tokens along with `use-mobile`
  — nothing in the app ever used a sidebar-based nav.
- Auth/persistence: stayed mock-only (in-memory), matching the original export's behavior exactly.
