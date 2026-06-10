# Polish Iteration Plan

## 1. Longer tap highlight (SkillTree)
**File:** `src/components/skill-tree.tsx`
- Line 151: change `300` → `700`

## 2. Description on node tap (SkillTree)
**File:** `src/components/skill-tree.tsx`

1. Add `description: string` to the `PosNode` interface (line 13–18)
2. In `layout()` function, when pushing to `outNodes`, add `description: task.description`
3. In the node rendering (after the `<text>` for title at ~line 228), conditionally render a description label above the circle when highlighted:

```tsx
{isHighlighted && node.description && (
  <text
    x={cx}
    y={cy - CIRCLE_R - 8}
    textAnchor="middle"
    fontSize="8"
    fill="rgba(255,255,255,0.5)"
    style={{ pointerEvents: 'none' }}
  >
    {node.description.length > 18 ? node.description.slice(0, 17) + '\u2026' : node.description}
  </text>
)}
```

## 3. Add category to ReferenceLink
**File:** `src/lib/types.ts`
- Add `category: 'video' | 'text' | 'book' | 'other'` to `ReferenceLink`

**File:** `src/lib/demo-data.ts`
- Add `category: 'book'` to the Atomic Habits entry
- Add `category: 'text'` to the Meditation Guide entry

## 4. Category picker in link form
**File:** `src/components/library/link-form.tsx`
- Add `category?: 'video' | 'text' | 'book' | 'other'` to the form state (default `'other'`)
- Add a 4-option segmented category picker between the tags field and the action buttons
- Styled like the Main/Builder toggle: a row of buttons inside a `border-white/10` container
- Pass category through to `onSubmit`

Also update the `LinkFormProps` `initial` type to include `category`.
Update the `onSubmit` type to include `category: string`.

## 5. Library sections + DnD
**File:** `src/components/library/icon-grid.tsx`
- Add optional props: `draggable?: boolean`, `onDragStart?: (e: React.DragEvent, linkId: string) => void`
- Pass `draggable` and `onDragStart` to each card's container div

**File:** `src/app/library/page.tsx`
- Define `CATEGORIES` constant: `[{ key: 'video', label: 'Videos' }, { key: 'text', label: 'Text' }, { key: 'book', label: 'Books' }, { key: 'other', label: 'Other' }]`
- Replace the flat grid with per-section rendering
- Each section: header label + count + grid of cards + "Drop links here" when empty
- Each section acts as a drop zone with `onDragOver` / `onDrop` handlers
- On drop: find link by ID from `dataTransfer`, update its `category`, persist
- Cards are `draggable` via `IconGrid`'s new props
- Keep the existing bottom-sheet detail panel and ⋮ menu behavior
- Keep the "+ Add Link" button and dialog

Empty section placeholder:
```tsx
<p className="text-xs text-white/15 text-center py-4">Drop links here</p>
```

## 6. Drag-and-drop flow
- `handleDragStart`: store `linkId` in `e.dataTransfer.setData('text/plain', linkId)`
- `handleDragOver`: `e.preventDefault()` to allow drop
- `handleDrop`: read linkId, find link, update category, persist via `setLinks` + `saveData`

## 7. Template reward button
**File:** `src/app/rewards/page.tsx`
- Add `handleSeedTemplates()`: writes `demoRewards` (3 entries) to the rewards store
- Add a "Load Templates" button in the header, next to "+ New Reward", red-tinted
- Use a `confirm()` dialog before overwriting

## 8. Inject template rewards into library too (nice-to-have)
Not requested, skip.

## Order of edits
1. `src/lib/types.ts` — type change first
2. `src/lib/demo-data.ts` — update demo data
3. `src/components/skill-tree.tsx` — highlight + description
4. `src/components/library/link-form.tsx` — category picker
5. `src/components/library/icon-grid.tsx` — drag props
6. `src/app/library/page.tsx` — sections + DnD
7. `src/app/rewards/page.tsx` — template button
8. `npm run build` — verify
