# Unique Door Scenes Implementation

## Task Summary
Implemented unique door opening experiences for each of the 10 ShaadiLink templates, replacing the identical door-opening scene with template-specific animations, SVG patterns, text, and button styles.

## Files Modified

### `/home/z/my-project/src/app/globals.css`
Added CSS keyframe animations for each door type:
- **Curtain slide**: `curtainOpenLeft` / `curtainOpenRight` with translateX + skewX (fabric drape effect)
- **Petal bloom**: `petalOpenLeft` / `petalOpenRight` with scale + rotate + translate (flower blooming)
- **Split screen**: `splitOpenLeft` / `splitOpenRight` with simple translateX slide
- **Archway open**: `archOpenLeft` / `archOpenRight` with perspective rotateY (arch visible)
- **Scroll unfurl**: `scrollUnfurlLeft` / `scrollUnfurlRight` with scaleX collapse from center
- **Dome lift**: `domeLiftUp` with translateY upward
- **Lantern open**: `lanternOpenLeft` / `lanternOpenRight` with rotateY + translateY
- **Idle animations**: `curtainDrape`, `petalSway`, `scrollShimmer`, `domeFloat`, `lanternGlow`

### `/home/z/my-project/src/components/viewer/invitation-viewer.tsx`

1. **Added `doorStyle` to `TemplateTheme` interface** (lines 56-67)
   - Type: union of 10 door types
   - Properties: type, leftText, rightText, leftTextLang, rightTextLang, svgPattern, centerIcon, animationClass, buttonStyle

2. **Added `doorStyle` config to each of the 10 themes**:
   | Template | Type | SVG Pattern | Center Icon | Button Style | Animation |
   |----------|------|-------------|-------------|--------------|-----------|
   | emerald-noir | classic-doors | arch | ✦ | circle | door-open |
   | crimson-royale | curtains | floral | 👑 | shield | curtain-open |
   | majestic-love | scroll | paisley | 💫 | diamond | scroll-unfurl |
   | garden-romance | petals | floral | 🌸 | circle | petal-open |
   | modern-minimal | split-screen | minimal | ▷ | hexagon | split-open |
   | mughal-emerald | archway | mandala | 🕌 | circle | arch-open |
   | rose-gold-blush | curtains | floral | 🌹 | diamond | curtain-open |
   | ivory-dream | classic-doors | diamond | ◈ | diamond | door-open |
   | royal-imperial | dome | dome | 🏰 | shield | dome-lift |
   | royal-elegance | lantern | star | ⭐ | star | lantern-open |

3. **Created SVG pattern component** (`DoorSvgPattern`) with 10 distinct patterns:
   - arch, floral, minimal, mandala, paisley, diamond, dome, star, geometric, lantern

4. **Created helper components**:
   - `DoorPanelContent` - renders text and ornament per panel
   - `DoorHandle` - different handle styles per door type
   - `CenterButton` - 5 button styles (circle, diamond, shield, hexagon, star)
   - `CurtainEdge`, `DomeCap`, `ArchwayCap`, `ScrollCap` - decorative elements

5. **Created `DoorOverlay` component** that dynamically renders:
   - Different panel layouts (left/right for most, full-screen for dome)
   - Different animations based on `doorStyle.type`
   - Different gradients and visual effects per type
   - Conditional perspective (only for classic-doors, archway, lantern)

6. **Replaced hardcoded door overlay** (was ~135 lines of identical JSX) with a single `<DoorOverlay>` component call

## Verification
- Lint passes with no errors
- Dev server compiles successfully
- All 10 templates have unique door configurations
- Scratch card, countdown, events, venue, RSVP sections untouched
