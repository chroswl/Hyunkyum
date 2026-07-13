# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Refactored Theme handling to use a centralized `AppearanceContext` instead of individual fetchThemeSettings calls in every content editor.
- Removed editor-specific theme state and editor-level Firestore refetching.
- Enabled real-time theme updates across all Admin preview panels.
- Cleaned up unnecessary 'key' props that were used for forced re-renders.
- Added `key` (based on `items` or `theme` state) to preview components in AdminTheme and content editors (Press, Archive, Videos, Schedule) to force re-renders when data or themes are updated.
- Fix real-time theme preview in Control Center. Added `key` to the dynamic `<style>` tag to force re-render, and added `!important` to text color styles to ensure overrides are properly applied in the preview pane.
- Ensure proper custom update events (`bioChanged`, `contactChanged`) are dispatched upon saving so that layout listeners update immediately without a manual browser refresh.
- Fix duplicate floating navigation bar in the Theme Customizer live preview by removing the nested `<Navbar />` inside the `#theme-preview-scope` container, resolving visual overlapping issues inside the Control Center.
- Fix text content visibility in the Theme Customizer live preview where layout elements wrapped in `<Reveal />` remained hidden (0 opacity) because of window-level Intersection Observer triggers. Added automatic preview-detection inside `Reveal` to render components with instant visibility inside scrollable viewport containers.
- Pass fetched `pressItems` data to the preview's `<PressSection />` to ensure press review contents populate accurately in the live theme preview.
- Add real-time responsive mirroring inside the Theme Editor (Theme Settings), fetching all page sections from Firestore (Hero, Slides, Biography, Press, Archive, Videos, Upcoming, Contact, and Footer) to mirror layout styling immediately.
- Add dynamic responsive viewports (Current Screen Size, Tablet, Mobile) inside the Theme Preview, utilizing custom scoped CSS injection to isolate the preview container from the main Admin Panel UI.
- Consolidate individual section text color overrides ("연주/비디오 목록 글씨" and "문의 섹션 글씨") into the main "기본 글씨 색상 (Text)" setting in Theme Settings, simplifying style customization while maintaining semantic colors.
- Unify "히어로 및 슬라이드 글씨 (Hero & Slides Text)" color setting in Theme Settings to simultaneously control both Selected Performances slides and the main Hero Design screen text (including subtitles, main titles, description, and discover buttons).
- Fix style leakage where custom theme colors (background, text, and accent colors) were overriding the Admin Control Center layout, restoring its clean, default high-contrast dark style.
- Fix Contact section text colors where form labels, headings, and input text ignored custom text colors or sectional color overrides by using dynamic CSS variable bindings with opacity.
- Fix React state-update-during-render error inside AdminTheme/AdminHero panels by refactoring custom event dispatch logic outside of state updater functions.
- Add a dedicated, real-time "Theme (테마)" content editor panel inside the Admin Control Center for controlling global and section-specific colors (Background, Text, Accent, Contact Form BG, and sectional text color overrides).
- Fix Google Drive authentication issue in GoogleDrivePicker component.
