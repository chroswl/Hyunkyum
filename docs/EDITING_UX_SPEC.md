# Visual CMS Framework: Editing UX Specification

This document defines the unified editing interaction behavior across the entire Visual CMS Framework. It ensures that every future implementation provides a consistent, predictable, and seamless editing experience.

---

## Core Editing Philosophy

1.  **One Continuous Session**: All editing actions happen within a global session. No individual action writes directly to the database until the global "Save" is triggered via the Global Editing Toolbar.
2.  **Predictability**: The user should never have to guess how to edit an element. The interaction language is universal.
3.  **Direct Manipulation**: Prefer inline editing over overlay forms whenever possible.
4.  **Interaction Lifecycle & Visual State Hierarchy**:
    The complete visual editing lifecycle is as follows:
    *   **Hover**: Subtle indication that the element is editable.
    *   **Focused**: Accent outline showing the active target.
    *   **Editing**: Active input interaction.
    *   **Dirty**: Editing has finished (Blur/Enter), but changes are still part of the current global editing session. A local indicator shows unsaved status.
    *   **Saved (Commit)**: The section returns to its normal presentation after a successful global Save.
    *Finishing an edit interaction never commits to the database. It only marks the global session and local element as "Unsaved".*

---

## Viewing Mode vs. Editing Mode

**Evaluation**: The Visual CMS Framework should maintain a **single, unified Admin Mode** without introducing sub-modes (Viewing vs. Editing).

**Rationale**:
*   **Frictionless UX**: The core premise of the framework is "Click → Edit". Introducing a toggle creates a barrier. Administrators would frequently experience friction: clicking an element, realizing they are in "Viewing" mode, toggling the mode, and clicking again. 
*   **Cognitive Load**: It violates the "Universal Interaction Language" principle. Elements would behave differently depending on a hidden global toggle state.
*   **Clear Boundaries**: The boundary between Viewing and Editing is already defined by authentication. The public website is the viewing mode. The authenticated state (Admin Mode) is the editing mode.
*   **Navigation in Edit Mode**: To ensure administrators can still navigate the site while in a single Admin Mode, interactive elements (like links) should require a specific interaction (e.g., `Cmd/Ctrl + Click` to follow the link, or an overlay action button) rather than compromising the entire inline editing philosophy.

---

## Interaction Taxonomy

The framework categorizes editable elements into four interaction types:

### 1. Inline Text
**Target Elements**: Hero Title, Hero Subtitle, Contact Labels, Footer Text, Simple Text Elements.

*   **Trigger**: Single-click on the text element immediately enters edit mode.
*   **Visual States**:
    *   *Hover*: A subtle visual indicator (e.g., a light outline and an `Edit3` cursor/icon hint) appears.
    *   *Focused*: An accent border highlights the element.
    *   *Editing*: The text becomes an active cursor field within the focused border.
    *   *Dirty*: A subtle, elegant indicator (e.g., a small status dot or minimal unsaved badge integrated into the outline) appears, remaining until a global save.
*   **Selection**: Clicking places the cursor exactly at the click coordinate. We do **not** auto-select all text, as this often leads to accidental deletion. Double-click selects a word.
*   **Finish Interaction (Dirty State)**: 
    *   Pressing `Enter` finishes the editing interaction and removes focus.
    *   Clicking outside the element (blur) finishes the editing interaction.
    *   *Result*: The UI is updated, and the Global Save Engine marks the session as "Unsaved". No database commit occurs.
*   **Cancel Interaction**: Pressing `Escape` reverts the text to its pre-interaction state and removes focus. The dirty state is not triggered by this action.
*   **Navigation**: Pressing `Tab` finishes the current interaction and moves focus to the next logically sequential editable element. `Shift+Tab` moves backwards.
*   **Empty Values & Placeholders**: If a value is completely deleted, the element must not collapse to 0px. A placeholder string appears in a muted, italicized style, maintaining a minimum hit-area.

### 2. Rich Text (Paragraphs)
**Target Elements**: Biography Text, Legal Documents, Long-form content blocks.

*   **Trigger**: Single-click on the text block enters edit mode.
*   **Visual States**:
    *   *Hover*: A subtle boundary box appears.
    *   *Focused*: An accent boundary box highlights the block.
    *   *Editing*: A floating formatting toolbar (Bold, Italic, Link) appears anchored seamlessly near the active text block.
    *   *Dirty*: A minimal status dot or unsaved badge appears on the boundary of the text block to indicate pending changes.
*   **Selection**: Cursor placement matches the click coordinate.
*   **Finish Interaction (Dirty State)**: Clicking outside the element (blur) finishes the interaction and marks the session as "Unsaved".
    *   *Crucial Difference*: Pressing `Enter` creates a new paragraph/line break; it does **not** finish editing.
*   **Cancel Interaction**: Pressing `Escape` reverts the text block to its pre-interaction state and removes focus.
*   **Navigation**: Pressing `Tab` finishes the interaction and moves to the next editable element.
*   **Empty Values & Placeholders**: A muted placeholder is displayed. The element maintains a minimum height.

### 3. Collection Items
**Target Elements**: Gallery Cards, Press Cards, Video Cards, Schedule Rows, Selected Performances, Education items.

*   **Visual States**:
    *   *Hover*: The item slightly dims or receives a subtle outline, revealing the overlay Action Menu (Edit, Delete) and a Drag Handle.
    *   *Focused*: Using keyboard navigation highlights the card with the accent border.
    *   *Dirty*: An elegant unsaved indicator (e.g., a status dot on the card corner) appears if the item was edited, moved, or newly created.
*   **Trigger (Actions)**: Hovering reveals the actions. Clicking "Edit" opens the Form Engine.
*   **Drag & Drop**: Clicking and holding the drag handle immediately picks up the item. Dropping it updates the visual order and registers as "Unsaved" in the Global Save Engine.
*   **Delete (Universal Delete Dialog)**: Clicking "Delete" opens a single, reusable **Universal Delete Dialog**. This dialog halts interaction, clearly stating what is being removed. Once confirmed, the item visually disappears, and the removal is registered as "Unsaved" in the Global Save Engine. No database commit occurs until Global Save.
*   **Create (+)**: A consistent `+ Add New` button/card is always present at the logical end or beginning of the collection. Clicking it opens the Form Engine.

### 4. Overlay Forms (Form Engine)
**Target Elements**: Deep metadata editing, Image Cropping, Settings, Complex Collection Item creation/editing.

*   **Trigger**: Clicking "Edit" on a Collection Item, or clicking a specialized action button.
*   **Visual States**: Opens in a centered modal or slide-over panel. The background page is dimmed. The first input field is auto-focused.
    *   *Dirty (on parent component)*: After the form is completed (Done/Apply), the modal closes and the underlying parent collection item or component receives a subtle "Dirty" indicator.
*   **Finish Interaction (Dirty State)**: Clicking "Done" or "Apply" closes the form, updates the visual component on the underlying page, and registers as "Unsaved" in the Global Save Engine. No database commit occurs.
*   **Cancel Interaction**: Clicking "Cancel", the "X" button, or pressing `Escape` closes the form, discarding any inputs made during this form session.
*   **Navigation**: `Tab` / `Shift+Tab` navigates logically through the form fields.
*   **Clicking Outside**: Clicking the dimmed background should **not** auto-close the modal if there are unsaved inputs, preventing accidental data loss. It should gently pulse the form to indicate required action, or explicitly require a Cancel/Done click.
