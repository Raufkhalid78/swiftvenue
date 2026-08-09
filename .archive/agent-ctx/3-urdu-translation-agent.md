# Task 3 - Urdu Translation Agent

## Task
Add AI-powered Urdu translation when Urdu language is selected in the InvitationViewer component.

## Work Completed

### 1. Created Translation API Route
- **File**: `/home/z/my-project/src/app/api/translate/route.ts`
- POST endpoint that accepts `{ texts: Record<string, string> }` and returns `{ translations: Record<string, string> }`
- Uses `z-ai-web-dev-sdk` with a specialized system prompt for Pakistani wedding invitation translation
- Parses JSON from AI response with regex extraction and fallback to original text on failure

### 2. Modified InvitationViewer Component
- **File**: `/home/z/my-project/src/components/viewer/invitation-viewer.tsx`
- Added `translations`, `isTranslating` state variables
- Created `translateToUrdu()` callback with 40+ translatable text keys
- Added `useEffect` to auto-trigger translation when switching to Urdu (cached, only once)
- Created `t(key, fallback)` helper function
- Created `getEventDescription()` helper for event-specific translations
- Created `translatedWelcomeMsg` computed value
- Added `dir="rtl"` on root div when language is 'ur'
- Updated language toggle button with Loader2 spinner during translation
- Updated CountdownTimer to accept `translations` prop
- Replaced all hardcoded English text with `t()` calls throughout the component

### 3. Fixed Pre-existing Lint Error
- Created missing `DoorSvgPattern` component with 10 SVG pattern variants (arch, floral, mandala, paisley, minimal, diamond, star, dome, geometric/lantern)

### 4. What Was NOT Changed
- ScratchCard component — untouched as required
- Partner names (Ahmed, Fatima) — not translated
- Venue names — not translated
- Event names (Mehndi, Baraat, Nikkah, Walima) — not translated (proper nouns)
- Dates and times — not translated
- Door opening animation system — untouched

## Lint Status
✅ Zero errors, zero warnings
