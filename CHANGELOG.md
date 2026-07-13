# Changelog
All notable changes to this project will be documented in this file.

## [1.2.6] - 2026-07-13
### Fixed & Enhanced
- **Eliminated Blue Flash on Load**: Upgraded `fetchThemeSettings` in `src/firebase.ts` and `AppearanceContext.tsx` to automatically detect and auto-migrate both gold (`#C9A227`) and blue (`#4ea8de`, `#000814`) configurations inside the database to pristine monochrome defaults.
- **Monochrome Tag Styling**: Updated category colors inside `ScheduleSection.tsx` to use elegant monochrome (silver/gray/white) styles instead of colored borders (blue/amber/purple), ensuring a perfectly consistent design.

## [1.2.5] - 2026-07-13
### Fixed & Enhanced
- **Pristine Monochrome Defaults**: Updated `defaultAppearanceSettings` inside `/src/types/appearance.ts` to replace all gold accents (`#C9A227`) with clean, elegant monochrome (black, white, and silver) colors. Buttons, links, accents, and focus borders are now sleek white or modern gray, establishing a timeless premium design.
- **Auto-Migration Engine**: Implemented an automated database migration block in the global `AppearanceContext.tsx` initialization loop. If the active database configuration still contains old default gold colors, it seamlessly overwrites it in Firestore with the beautiful new monochrome default settings on first load, eliminating any color-coordination confusion.

## [1.2.4] - 2026-07-13
### Fixed & Enhanced
- **Collapsible Advanced Colors Toggle**: Refactored the Appearance Control Center (`AppearanceControlCenter.tsx`) right panel header and tabs case structure to feature a highly intuitive toggle switch: **[세부/고급 색상 조절] (Detailed/Advanced Colors)**. This instantly declutters the default visual view by more than 70%—hiding non-essential elements like micro button colors, arrow outlines, gradient formulas, and link hover states. Users now enjoy a highly streamlined, friendly default screen containing only the 2 or 3 most essential section background and title configurations, with detailed controls accessible on-demand.
- **Pitch-Black Default Background**: Standardized default canvas theme settings (`defaultAppearanceSettings` inside `/src/types/appearance.ts`) to ensure a default pitch-black background (`#000000`) for all main modules (Biography, Portfolio, Videos, Schedule, Footer, and the global backdrop), creating a consistent high-contrast, premium aesthetic from the first site load.

## [1.2.3] - 2026-07-13
### Fixed & Enhanced
- **Pristine Biography Alignment & Mobile Stacking**: Restructured the Biography timeline entries in `/src/components/BiographySection.tsx` into a highly polished responsive layout (`flex-col sm:flex-row`). On mobile, the Role/Year and description stack vertically to utilize 100% of the screen width for beautiful readability, completely preventing clipping. On desktop, they return to the two-column format with stable widths (`sm:w-36 md:w-48`) and a beautiful vertical border separator.
- **Mobile Biography Tabs Grid**: Transformed the biography sub-section category tabs into a beautiful, symmetric 2x2 grid layout on mobile screens (Education & Training alongside Awards & Honors on top, Opera Roles alongside Concert on bottom) styled with minimalist grid borders. On larger tablet and desktop screens, they automatically transition back into a spacious horizontal line format.

## [1.2.2] - 2026-07-13
### Fixed
- **Mobile Navigation Drawer Clipping**: Resolved viewport clipping inside the mobile navigation drawer. Standardized drawer styling with `max-height: calc(100vh - 100%)` (clearing navbar boundaries), enabled clean vertical kinetic scrolling (`overflow-y-auto` and `WebkitOverflowScrolling: touch`), and secured direct vertical access to "Schedule" and "Contact" sections on small screens.
- **Dynamic Transparent Navbar Prioritization**: Restructured `Navbar.tsx` background logic (`isCurrentlyTransparent` check) to guarantee the dynamic customizer's transparent settings take absolute priority. When a user selects a custom background, border, or text color, those values are respected at 100% full brightness and styling without legacy text dimming overrides.
- **Framer-like Resizable Workspaces**: Upgraded `/src/components/admin/appearance/FloatingWindow.tsx` to automatically scale down on smaller displays and clamp positioning coordinates. This keeps the design controls fully accessible inside any viewport size, allowing the website to scroll freely and independently underneath.
- **Language Switcher Contrast**: Aligned language select badges inside both desktop and mobile drawer menus to use dynamic color mixing (`color-mix`) matching the active appearance theme accents.

## [1.2.1] - 2026-07-13
### Fixed
- **Theme Selection & Firestore Serialization Error**: Resolved a crucial database write bug where setting the top-level string `theme` field using the section/field select helpers inadvertently corrupted the theme document into a nested object map with an empty field `""`. This triggered validation errors on `setDoc()` operations inside the Firestore database.
- **Robust Self-Healing Decoupling**: Introduced an active `sanitizeSettings()` helper function in `/src/services/appearanceService.ts` that intercepts fetches and real-time database listeners to automatically heal any existing corrupt database state on-the-fly and cleanly overwrite it with standard string constants upon save or history restoration.

## [1.2.0] - 2026-07-13
### Enhanced
- **Appearance Control Center UX Overhaul**: Reorganized the control center into a sleek left-sidebar multi-tab configuration matching the exact chronological flow of the live website (Hero, Navigation, Biography, Portfolio, Videos, Schedule, Contact, Footer, Typography, Layout, Advanced).
- **Pro-Level Desktop Workspace**: Defaulted the floating console width and layout to a gorgeous widescreen container (`840px` by `700px`) for optimal readability and comfortable usage on desktop monitors.
- **Accessibility & Typography Sizing**: Upgraded font sizes throughout the Control Center to comfortable specifications (Section Titles: 18-20px, Setting Labels: 15-16px, Help Texts/Descriptions: 13-14px, Buttons & Inputs: 15px) with enlarged interactive click targets (minimum 44px).
- **Comprehensive Localization**: Translated all remaining hardcoded English text blocks, panels, search placeholders, list tags, and presets. The control center is now 100% localized in English, German (Deutsch), and Korean (한국어) via the app's native i18n system.
- **Dynamic Beginner-Friendly Tooltips**: Added helpful, localized, and context-aware descriptions for every single customizer slider, color row, and configuration switch to guide users seamlessly.
- **Codebase Optimization**: Unified separate, heavy components into elegant inline panels inside the core controller, and safely deleted unused files (`ColorPanel.tsx`, `ConfigPanel.tsx`) to reduce codebase complexity.


