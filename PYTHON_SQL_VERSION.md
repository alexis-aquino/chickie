# Chickie — Pure Python + MySQL Version

This branch (`python-sql-version`) is a from-scratch rebuild of the same application (Chickie: supply-chain + CRM management for a chicken restaurant) with **no JavaScript, TypeScript, Node.js, or HTTP API layer anywhere** — the entire system, front to back, is Python talking directly to MySQL. It exists alongside two other branches for comparison: `master` (the original React + Supabase version) and `local-version` (React frontend + a FastAPI/Python backend + local MySQL). This document explains this branch specifically.

## 1. The stack, in one sentence

**Streamlit** (Python) renders every page and handles every click; **SQLAlchemy** (Python) is the only thing that ever touches the database; **MySQL** stores the data. There is no separate frontend build, no REST API, no JSON contract to keep in sync, no JWT — one Python process does everything.

```
Browser  <--(Streamlit's own WebSocket protocol)-->  Python process (Streamlit)  --SQL-->  MySQL
```

Compare this to `local-version`, where the browser runs compiled TypeScript that calls a separate FastAPI process over HTTP with JSON + JWT auth, which *then* talks to MySQL. Here, there is no browser-side application code at all — Streamlit generates the HTML/JS the browser receives, but nobody on this project writes or maintains that code; the entire UI is authored as plain Python function calls (`st.button(...)`, `st.dataframe(...)`, etc.).

## 2. Why this is possible at all — how Streamlit works

Streamlit's model: each Python script (or "page") is re-run top-to-bottom every time the user interacts with a widget. `st.session_state` is a dict that survives across those re-runs for a given browser session, which is what replaces the JWT/localStorage session-persistence mechanism the other branches need — there is no token to issue or verify, because the server process itself remembers who's logged in for the duration of that browser tab's connection. This is also why there's no separate `auth.py` JWT logic in this branch: `app/auth.py` here only does password hashing and a plain `register()`/`login()` function call that returns a dict, which the caller stores in `st.session_state.user`.

## 3. Project layout

```
main.py                 Entrypoint. Builds the sidebar navigation with st.navigation()
                         and gates it behind st.session_state.user being set.
app/
  db.py                 SQLAlchemy engine + session factory (MySQL).
  models.py             ORM table definitions — identical schema to local-version.
  auth.py               Password hashing (bcrypt) + register/login/update_profile/
                         change_password, each opening its own DB session.
  store.py              All business-data CRUD + the order/inventory business rule
                         (see §5). Every function takes organization_id explicitly.
  analytics.py           Inventory-by-category chart, rendered with matplotlib.
  seed.py                Demo-data generation for new signups.
  theme.py               Injects CSS for the user's chosen accent color.
  utils.py               Formatting + business-rule helpers (stock status, tiers,
                         totals) — pure functions, no I/O.
  pages/
    login.py              Sign in / sign up.
    inventory.py           Inventory CRUD (list, add, edit, delete via st.dialog).
    suppliers.py           Read-only supplier directory.
    deliveries.py          Delivery schedule + "Mark Delivered" (owner-only).
    purchases.py           Purchase history + "New Purchase Order" (owner-only).
    transactions.py        Paginated transaction ledger (owner-only).
    analytics.py            Displays the matplotlib chart (owner-only).
    crm_dashboard.py        Revenue/repeat-rate/satisfaction stats, top spenders.
    customers.py             Customer directory + detail view.
    feedback.py              Review log + rating distribution.
    loyalty.py                Tier cards + points leaderboard.
    promotions.py             Promotion cards + "Activate" (Draft → Active).
    profile.py                 Edit profile, change password, choose theme.
schema.sql               MySQL DDL (same shape as local-version's).
requirements.txt         streamlit, sqlalchemy, pymysql, bcrypt, matplotlib, python-dotenv.
start.bat                 Bootstraps MySQL + venv + schema, launches `streamlit run main.py`.
```

Twelve pages, matching the twelve screens/tabs of the original React app one-for-one (SCM: Inventory, Suppliers, Deliveries, Purchases, Transactions, Analytics; CRM: Dashboard, Customers, Feedback, Loyalty, Promotions; plus Profile).

## 4. Multi-tenancy and auth, without a token

Every business-data table still has an `organization_id` column, and every function in `store.py` takes `org_id` as an explicit parameter and filters on it — the *mechanism* of tenant isolation didn't change from the other branches. What changed is *where the org_id comes from*: instead of decoding it out of a verified JWT on every HTTP request, it's read straight from `st.session_state.user["organization_id"]`, which was only ever populated by a successful `auth.login()`/`auth.register()` call earlier in the same session. Since Streamlit's session state lives entirely on the server and isn't something the browser can forge a value into, this is a legitimate trust boundary — just a simpler one, because there's no network hop between "prove who you are" and "use that identity" the way there is in a client/server API split.

Passwords are still hashed with `bcrypt` (never stored or compared in plaintext), same as the other branches — moving off JWTs didn't change how credentials themselves are protected.

## 5. Business logic — ported exactly, not reinvented

`app/store.py` is a direct Python-to-Python port of `local-version`'s `server/app/routers/store.py`, with the HTTP-specific parts (FastAPI decorators, Pydantic schemas, status codes) stripped out and plain dict returns in their place. The one rule worth being able to explain on demand:

> **Submitting a purchase order bumps inventory on-hand immediately, at order time — not at delivery time.** `submit_order()` inserts one row per line item, then aggregates the just-inserted lines by `item_id` (summing quantity, taking the *last* line's price/supplier per item) and updates that `InventoryItem`'s `quantity`, `unit_cost`, and `supplier_id` accordingly, all in one transaction. `mark_delivered()` — used on the Deliveries page — only flips a `delivered` boolean; it doesn't touch stock, because stock was already accounted for when the order was placed.

This rule exists in the original React+Supabase version, was carried into `local-version`'s FastAPI backend, and is carried into this branch unchanged — it's a property of the business domain, not of any particular tech stack, which is exactly why it lives in `store.py` and nowhere near the UI layer.

## 6. What's structurally different from `local-version`

| | `local-version` | `python-sql-version` |
|---|---|---|
| UI | React/TypeScript, compiled by Vite | Streamlit, plain Python functions |
| Client ↔ server | HTTP + JSON (`api-client.ts`) | None — one process |
| Auth token | Self-issued JWT, sent as `Authorization` header | None — `st.session_state`, server-side only |
| Data contract | Pydantic schemas (`schemas.py`) mirrored by hand-written TS interfaces | None needed — Python dicts passed directly to Python UI code |
| Deployment surface | Two processes (`uvicorn` + `vite`/static build) | One process (`streamlit run`) |
| Styling / theming | Tailwind CSS + CSS custom properties | Injected `<style>` block (`app/theme.py`) |

The database schema (`schema.sql`) and the business rules (`app/store.py`) are essentially unchanged between the two branches — what moved is *how the UI is built and how it talks to the backend logic*, not what the backend logic does.

## 7. Anticipated questions

**Q: If there's no API, how would this scale to a mobile app or a second frontend?**
It wouldn't, as built — that's the real trade-off of this architecture. `local-version`'s FastAPI backend is consumable by any client that can speak HTTP/JSON (a mobile app, a CLI, another web frontend); this branch's business logic is only reachable by importing the Python modules directly into another Streamlit/Python process. This branch optimizes for "one Python codebase, nothing else to install or keep in sync" over "reusable by multiple clients."

**Q: Isn't re-running the whole script on every click wasteful?**
It re-runs Python, not the database — every `st.*` call is cheap, and `app/store.py`'s functions open a fresh, short-lived SQLAlchemy session per call rather than holding one open, so a rerun just means a handful of fast, indexed `SELECT`s. For an app this size, running on one MySQL instance on the same machine, this hasn't been a bottleneck in testing.

**Q: Why does `st.dialog` matter here (Add Item, New Purchase Order)?**
It's Streamlit's modal primitive — a Python function decorated with `@st.dialog(...)` runs in a floating overlay and can hold its own widgets/form state, which is what makes it possible to replicate the original app's "Add Inventory Item" and "Create Purchase Order" popups without writing any custom JavaScript for modal behavior.

**Q: Where would you add automated tests?**
`app/store.py`, `app/auth.py`, and `app/utils.py` are plain functions with no Streamlit dependency — they're straightforward to unit-test in isolation (e.g. pytest against a throwaway SQLite/MySQL database) exactly the way `local-version`'s FastAPI routes were verified with a scripted smoke test during development. The `app/pages/*.py` files are the one layer that's harder to unit-test directly, since they call `st.*` functions that expect a running Streamlit session — that layer is best covered by browser-level testing (e.g. Playwright driving the rendered page), which is how this branch was verified end-to-end before merging.
