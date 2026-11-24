# StowList: spec & wireframes

**One line:** stick a QR label on any box, scan it with your phone, and see or
change what's inside. Search every box at once.

**First version (this week):** email + password sign-in · boxes · items (add / edit /
delete) · QR labels (auto-created or pre-printed blank) · search · print labels.
Mobile-first, because it gets used standing in a garage holding a phone.

**Later:** item photos · rooms/locations filter · shared households · in-app
scanner · move item between boxes · offline / installable (PWA).

---

## Data model

```
storage_units (shown as "boxes")       items                          labels (QR codes)
───────────────────────────────        ─────────────────────────      ───────────────────────────
id           uuid  PK                  id              uuid PK        code            text PK  "ab3k9xqp"
user_id      uuid  → you               user_id         uuid           user_id         uuid
name         text  required            storage_unit_id uuid → box     storage_unit_id uuid → box | null (blank)
location     text  "Garage, shelf 2"   name            text required  created_at
description  text                      description     text
created_at / updated_at                quantity        int ≥ 0, def 1
                                       created_at / updated_at
```

- A box has **one** label; a label belongs to **at most one** box.
- Deleting a box deletes its items and makes its label **blank** again (reusable).
- Row-level security: every query only ever returns your own rows.
- The QR code encodes `https://<your-site>/q/<code>`, a link, so any phone
  camera can scan it. No scanner needed in the app.

## How you get around

```
                ┌──────────── scan a QR label ────────────┐
                ▼                                         │
  /q/:code ── has a box? ──yes──► /boxes/:id ◄── tap a box ── /  (home + search)
     │                               ▲                      │
     no (blank)                      │ created              ├──► /boxes/new
     ▼                               │                      └──► /labels (print blanks)
  "New label" ──► /boxes/new?label=code
```

Signed out? Any page sends you to `/login` and back to where you were going.

---

## Wireframes (phone first; desktop = same layout, centered, max 760px)

### 0. Sign in — `LoginPage` + `SignUpPage` ✅ done

```
┌────────────────────────────────┐
│                                │
│  StowList                      │
│  Label your boxes with QR      │
│  codes. Scan one to see, and   │
│  change, what's inside.        │
│                                │
│  Email     [               ]   │
│  Password  [               ]   │
│  [x] Show password             │
│  [ Sign in ]                   │
│  New here? Create an account   │
│                                │
└────────────────────────────────┘
```

### 1. Home — `HomePage`

```
┌────────────────────────────────┐   ┌────────────────────────────────┐
│ StowList     Boxes Labels Out  │   │ StowList     Boxes Labels Out  │
├────────────────────────────────┤   ├────────────────────────────────┤
│ Your boxes          [New box]  │   │ Your boxes          [New box]  │
│                                │   │                                │
│ Find an item                   │   │ Find an item                   │
│ [🔍 extension cord         ✕]  │   │ [🔍                         ]  │
│                                │   │                                │
│ 2 results                      │   │ ┌────────────────────────────┐ │
│ ┌────────────────────────────┐ │   │ │ Holiday decorations        │ │
│ │ Extension cord, 25 ft   ×2 │ │   │ │ Garage, top shelf · 14 items│ │
│ │ in Garage tools ·          │ │   │ └────────────────────────────┘ │
│ │    Garage, shelf 2       → │ │   │ ┌────────────────────────────┐ │
│ └────────────────────────────┘ │   │ │ Kitchen overflow           │ │
│ ┌────────────────────────────┐ │   │ │ Basement · 6 items         │ │
│ │ Extension cord, short   ×1 │ │   │ └────────────────────────────┘ │
│ │ in Office bin          →   │ │   │ ┌────────────────────────────┐ │
│ └────────────────────────────┘ │   │ │ Office bin · 0 items       │ │
│                                │   │ └────────────────────────────┘ │
└────────────────────────────────┘   └────────────────────────────────┘
     searching                              default

Empty (no boxes yet):
│        No boxes yet            │
│  Create a box, or print blank  │
│  labels to stick on first.     │
│  [New box] [Print blank labels]│
```

### 2. Box — `BoxPage` (+ `ItemForm`)

```
┌────────────────────────────────┐   ┌────────────────────────────────┐
│ ← Boxes                        │   │ ← Boxes                        │
│ Garage tools        [Edit] [⋯] │   │ Office bin          [Edit] [⋯] │
│ Garage, shelf 2                │   │                                │
│ Power tools and cords          │   │ Nothing in this box yet.       │
│                                │   │                                │
│ Items (3)          [+ Add item]│   │ ┌ Add item ──────────────────┐ │
│ ┌────────────────────────────┐ │   │ │ Name                       │ │
│ │ Drill                   ×1 │ │   │ │ [                        ] │ │
│ │ Cordless, 18V   [Edit][Del]│ │   │ │ Quantity  [ − ][ 1 ][ + ]  │ │
│ ├────────────────────────────┤ │   │ │ Description (optional)     │ │
│ │ Extension cord, 25 ft   ×2 │ │   │ │ [                        ] │ │
│ │                 [Edit][Del]│ │   │ │ [Add item]  [Cancel]       │ │
│ ├────────────────────────────┤ │   │ └────────────────────────────┘ │
│ │ Zip ties               ×50 │ │   │                                │
│ │                 [Edit][Del]│ │   │ ┌ Label ─────────────────────┐ │
│ └────────────────────────────┘ │   │ │  ▓▓▓▓▓▓   ab3k9xqp         │ │
│                                │   │ │  ▓▓▓▓▓▓   [Print label]    │ │
│ ┌ Label ─────────────────────┐ │   │ └────────────────────────────┘ │
│ │  ▓▓▓▓▓▓   ab3k9xqp         │ │   └────────────────────────────────┘
│ │  ▓▓▓▓▓▓   [Print label]    │ │        empty: add form open
│ └────────────────────────────┘ │
└────────────────────────────────┘
     with items

[⋯] = Delete box (confirm first).
```

### 2b. Add / edit item — `ItemForm`

- **Edit** replaces that row with the form, pre-filled.
- **Add** stays open after saving and puts the cursor back in Name, so you
  can unpack a box quickly.
- Errors appear above the buttons; what you typed is kept.

### 3. New box — `NewBoxPage`

```
┌────────────────────────────────┐
│ Set up this label              │   ← "New box" when not from a scan
│ This box will use label        │
│ ab3k9xqp.                      │
│                                │
│ Name *                         │
│ [ Garage tools               ] │
│ Location                       │
│ [ Garage, shelf 2            ] │
│ Description                    │
│ [                            ] │
│                                │
│ [Create box]  [Cancel]         │
└────────────────────────────────┘
→ on success: go to the new box (replace history)
```

### 4. Scanned a label — `ScanPage`

```
 blank label                         not found
┌────────────────────────────────┐  ┌────────────────────────────────┐
│ New label                      │  │ Label not found                │
│ ab3k9xqp                       │  │ "zz99zz99" isn't in your       │
│                                │  │ account. Check the code, or    │
│ This label isn't on a box yet. │  │ sign in with the account that  │
│ Set it up to start listing     │  │ printed it.                    │
│ what's inside.                 │  │                                │
│                                │  │ [Back to your boxes]           │
│ [ Set up this box ]            │  └────────────────────────────────┘
└────────────────────────────────┘
 label on a box → straight to /boxes/:id (no screen)
```

### 5. Print labels — `LabelsPage`

```
 screen                               printed page (Letter, 4 across)
┌────────────────────────────────┐   ┌────────────────────────────────┐
│ Print labels                   │   │ ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓         │
│ Stick these on boxes now; scan │   │ ab3k  q7mz  ...   ...          │
│ one later to set it up.        │   │                                │
│                                │   │ ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  ▓▓▓▓         │
│ How many?  [ 12 ] [Create]     │   │ ...                            │
│ [Print]                        │   │                                │
│                                │   └────────────────────────────────┘
│ ▓▓▓▓  ▓▓▓▓  ▓▓▓▓               │   header + controls hidden (.no-print)
│ ▓▓▓▓  ▓▓▓▓  ▓▓▓▓  (12 blank)   │
└────────────────────────────────┘
```

---

## What's done vs. yours

| File | Status |
|---|---|
| `supabase/schema.sql`, `src/lib/*` (database functions), `src/auth/*` | ✅ done |
| `App.jsx` routes, `Layout`, `Spinner`, `ErrorMessage`, `QrCode`, `LoginPage`, `NotFoundPage`, `styles.css` | ✅ done |
| `HomePage` | 🟡 data loading done; search + list + empty state are yours |
| `NewBoxPage`, `BoxPage`, `ItemForm`, `ScanPage`, `LabelsPage` | ⬜ yours (TODO steps in each file) |

Suggested order: **NewBoxPage → BoxPage + ItemForm → HomePage → ScanPage → LabelsPage**.
That gets the core loop (create a box, add items) working first.

## Done when

**Works**
- [X] Create an account, sign in and sign out on laptop and phone (no email confirmation: demo)
- [X] Create a box → it gets a QR label automatically
- [X] Add, edit and delete items; quantity can't go below 0
- [X] Edit and delete a box (with confirmation)
- [X] Search finds items by name or description and links to the right box
- [X] Print 12 blank labels → scan one with your phone → "Set up this box" → it opens that box from then on
- [X] Scanning while signed out → sign in → lands on the scanned box
- [X] Unknown label code shows "Label not found", not a crash

**Quality**
- [X] Every screen has loading, empty and error states
- [X] Everything works with the keyboard alone; every input has a visible label
- [X] Usable on a 360px-wide phone with no sideways scrolling
- [X] Lighthouse: Accessibility 95+, Performance 90+ (mobile)
- [X] Printed labels scan reliably (test on plain paper first)

**Portfolio-ready**
- [X] Deployed on Netlify with its own URL; README with screenshots, a GIF of scan → box, and what you'd build next
- [ ] Demo account or short video, so agencies can see it without signing in
