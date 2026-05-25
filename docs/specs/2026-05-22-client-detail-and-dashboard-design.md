# Client Detail Page & Dashboard — Design Spec
**Date:** 2026-05-22  
**Status:** Approved

---

## Problem

1. **404 after client creation**: `clients/[id]/page.tsx` filters `.eq('status', 'approved')` but profiles created via scraping/chat are saved as `'draft'`. Redirect after creation hits 404.
2. **No navigation to profiles**: Dashboard list rows have no `<Link>`, so created profiles can't be visited.
3. **No draft profile view**: No UI to review/approve a newly created draft profile.

---

## Scope

Three targeted changes:

1. Remove the `status` filter from `clients/[id]/page.tsx`
2. Add dual-state rendering (draft vs approved) to `clients/[id]/page.tsx`
3. Make dashboard list rows clickable

---

## Design

### 1. Fix: Remove status filter

**File:** `src/app/(dashboard)/clients/[id]/page.tsx`

Remove `.eq('status', 'approved')` from the Supabase query. The `agency_id` filter already enforces multi-tenancy. Both `draft` and `approved` profiles are fetched.

### 2. Dual-state client detail page

The page renders differently based on `profile.status`:

#### Draft state
- **Header**: `clientName`, `industry`, status badge "Borrador" (amber)
- **Captured data section**: website (as link), social media links (chips), tone of voice, content pillars (chips)
- **Primary action**: `ApproveButton` — prominent "Aprobar perfil de marca" button
- **Secondary action**: Link "Editar / completar campos" → `/clients/new/manual`

#### Approved state
- Existing layout: header + `BrandProfileCard` + Pipeline (no changes)

#### `ApproveButton` component

A small `'use client'` component at `src/components/clients/approve-button.tsx`:
- Props: `{ profileId: string }`
- On click: calls `supabase.from('brand_profiles').update({ status: 'approved' }).eq('id', profileId).eq('agency_id', user.id)`
- On success: `router.refresh()` (page re-renders server-side with approved state)
- Shows loading state while updating

### 3. Dashboard — clickable rows

**File:** `src/app/(dashboard)/dashboard/page.tsx`

Wrap each `<li>` list item with `<Link href={/clients/${p.id}}>`. The hover style already exists (`hover:bg-muted`), so the click target is clear.

---

## Data flow

```
Draft profile created (scraping/chat/manual)
    ↓
Redirect → /clients/[id]   (no longer 404)
    ↓
Draft view: captured data + "Aprobar" button
    ↓
User clicks "Aprobar"
    ↓
ApproveButton: UPDATE brand_profiles SET status='approved' WHERE id=? AND agency_id=?
    ↓
router.refresh() → same page re-renders
    ↓
Approved view: BrandProfileCard + Pipeline
```

---

## What is NOT in scope

- Edit-in-place for draft profiles (user goes to `/clients/new/manual` for that)
- Pre-filling the manual form from draft data
- A separate `/clients` route (dashboard at `/dashboard` already serves this purpose)
- Pagination or filtering on the dashboard list
