# Implementation Plan - Biography Section & Pronunciation Player Refinement

## 1. Objectives
- Refine the Biography section by keeping the top "HYUNKYUM KIM" and "김현겸" heading row with the small circular pronunciation play button.
- Remove redundant duplicate headings from the start of the biography text block while preserving all intro paragraphs, translation keys, repertoire, education, and awards.
- Refine the pronunciation player popover with three speed options (Slow 0.75x, Normal 1.0x, Fast 1.25x) that adjust `playbackRate` dynamically without restarting the audio.
- Ensure clean visual hierarchy, dark theme consistency, and responsive mobile/desktop behavior.

## 2. Proposed Changes

### `src/components/PronunciationAudioPlayer.tsx`
- Refine the circular play button to be minimal, understated, and visually secondary to the name.
- Implement the clean speed-selection popover (Slow 0.75x, Normal 1.0x default, Fast 1.25x) anchored to the button.
- Update `playbackRate` directly on the active HTMLAudioElement instance when switching speeds without restarting playback if already playing.
- Add subtle gold accent and checkmark for the active speed option.
- Handle click-outside and `Escape` key listeners to close the popover.

### `src/components/BiographySection.tsx`
- Clean up any redundant duplicate name headings at the beginning of the biography text block.
- Ensure the name header row correctly places `HYUNKYUM KIM`, `김현겸`, and the refined `PronunciationAudioPlayer` together.
- Preserve all biography settings, InlineEditors, timeline tabs, and translations.

## 3. Verification Plan
- Run `npx tsc --noEmit` (`lint_applet`) to ensure zero type errors.
- Run `npm run build` (`compile_applet`) to verify successful compilation.
- Verify interactive playback and speed selection behavior.
