# Visual CMS Framework: Engine Map

This document serves as the official technical blueprint for the Visual CMS Framework. It maps the architectural hierarchy distinguishing between **Core Engines** (subsystems) and **Capabilities** (behaviors provided by an Engine).

The Visual CMS is an enhancement layer that sits on top of the existing production website. We do not rebuild production components; we attach reusable engines to them.

---

## 1. Editing Engine
**Purpose**: Manages the global editing lifecycle, tracks all modifications, and handles text manipulation across the framework.
*   **Capabilities**:
    *   Editing Session (Global State)
    *   Inline Editing
    *   Rich Text Editing
    *   Save
    *   Cancel
    *   Undo
    *   Redo
    *   Dirty State (Unsaved Changes)
*   **Existing Code**: `EditingContext.tsx`, `AdminToolbar.tsx`, `EditableBlock.tsx`.
*   **Used By**: Hero, Biography, Footer, Contact, Legal Documents, and as the underlying state manager for all other Engines.

## 2. Collection Engine
**Purpose**: Manages arrays of data, list manipulation, and generic interactive wrappers for recurring items.
*   **Capabilities**:
    *   Hover Actions (Edit / Delete overlay)
    *   Drag & Drop
    *   Delete
    *   Create (+)
    *   Sorting
*   **Existing Code**: `SortableItem.tsx`.
*   **Used By**: Gallery, Press, Videos, Schedule, Selected Performances, Legal Documents, Education, Awards.

## 3. Media Engine
**Purpose**: Handles asset acquisition, processing, and attachment for images and videos.
*   **Capabilities**:
    *   Upload (Local)
    *   Crop
    *   Replace
    *   Google Drive Integration
    *   Optimization
*   **Existing Code**: `GoogleDrivePicker.tsx`, `ImageCropperModal.tsx`, `mediaUtils.ts`, `imageCompressor.ts`.
*   **Used By**: Hero (Background/Video), Biography (Image), Gallery (Images/Videos), Videos (Thumbnails).

## 4. Form Engine
**Purpose**: Orchestrates complex data input, multi-language support, and deep metadata editing within an overlay context.
*   **Capabilities**:
    *   Overlay Forms
    *   Validation
    *   Multi-language Management
    *   Complex Data Editing
*   **Existing Code**: `AdminLayout.tsx`, `PropertyAccordion.tsx`, `PropertyFields.tsx`.
*   **Used By**: Collection Engine (triggered by "Edit" actions), Media Engine (for deep configuration).

---

## Recommended Implementation Order

1.  **Editing Engine**: Establish the global editing session, unify Undo/Redo/Save capabilities, and build the inline/rich text editing capabilities.
2.  **Collection Engine**: Implement hover actions and drag & drop capabilities to make all collections generically editable on the page.
3.  **Form Engine**: Refactor existing admin panels into generic modal forms triggered by the Collection Engine.
4.  **Media Engine**: Connect existing uploaders directly to the visual components.
