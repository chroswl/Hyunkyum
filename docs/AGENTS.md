# General Development Principles

This project is already feature-complete. The website is live in production.
From now on, prioritize stability, consistency and usability over adding new features.
Preserve all existing functionality. Keep full backward compatibility.
Do NOT redesign working systems unless explicitly requested.
Always improve incrementally.

Prefer small incremental improvements.
Do not rewrite working systems.
Do not redesign existing architecture.
Keep components maintainable.
Avoid duplicated logic.
Keep Firestore compatibility.
Keep backward compatibility.
Prioritize performance.
Prioritize stability.
Prioritize maintainability.

## FIRESTORE IS THE SINGLE SOURCE OF TRUTH

Firestore is the ONLY source of truth for all website content.
This includes (but is not limited to):
- Hero
- Biography
- Selected Performances
- Schedule
- Portfolio
- Press
- Videos
- Contact Information
- Theme Settings
- Homepage Configuration

Never recreate local default content.
Never restore demo content.
Never generate placeholder data.
Never overwrite Firestore with local values.
Never seed data automatically unless explicitly requested.

## NO LOCAL DEFAULT CONTENT

Do NOT use hardcoded content as runtime fallbacks.
Do NOT recreate initial arrays.
Do NOT restore previous demo values.
If Firestore contains data, always use Firestore.
If Firestore is empty, display appropriate empty states instead of regenerating demo content.

## GOOGLE AI STUDIO PREVIEW = PRODUCTION

Google AI Studio Preview must behave exactly like the production website.
The Preview is a development environment, but the data flow must remain identical to Production.
Whenever Preview reloads after code changes, always fetch the newest Firestore documents.
Never reuse stale Preview state.
Never reuse cached Admin state.
Never restore previously rendered Preview content.
Never regenerate initial data.
Always display the latest Firestore content.

The behavior should be identical to Production.
Never create special Preview-only logic.
Never use Preview-specific cached data.
Always reload from Firestore.

## ADMIN CMS

Any changes made through the Admin CMS are permanent Firestore updates.
After saving:
- Never recreate previous values.
- Never restore cached state.
- Never reset Admin data.
- Never reload demo content.
- Always display the newest Firestore values.

The Admin CMS must always reflect the latest saved database state.

## CODE CHANGES

When implementing new features:
- Never reset existing Firestore documents.
- Never replace working logic.
- Never regenerate existing settings.
- Never overwrite saved Admin data.
- Only extend existing functionality.

## AFTER EVERY TASK

Confirm that:
✓ Firestore remains the only source of truth.
✓ No demo content was regenerated.
✓ No cached Preview state is being used.
✓ Preview behavior matches Production.
✓ Existing Admin data remains untouched.
✓ Existing Firestore documents remain compatible.
✓ No existing functionality was broken.
✓ Document all changes in CHANGELOG.md.

## VISUAL CMS FRAMEWORK ARCHITECTURE

1. **PAGE EDITOR (Content)**: Manages everything the visitor reads, watches, or interacts with (Hero, Biography, Press, Gallery, Videos, Schedule, Contact, Footer, Legal Documents). If it changes WHAT the visitor sees, it belongs here. 
2. **CONTROL CENTER (Configuration)**: Manages global appearance, layout, and behavior (Theme, Colors, Typography, Layout, Navigation, Animations, Effects). If it changes HOW the website looks, it belongs here. Never edits page content.

## VISUAL CMS MANIFESTO & PRINCIPLES

- **The Framework Always Comes First**: We are designing a reusable Visual CMS framework, not a single portfolio website. Every component must be designed for reuse. Optimize for the framework, not for today's website.
- **Think in Generic Components**: Do not think in terms of pages. Think in reusable building blocks (e.g., Sortable Collection, Article Collection, Media Collection, Rich Content Block, Legal Content Block, Hero Block, Event Collection).
- **Direct Editing Whenever Possible, Overlay Editing Whenever Necessary**:
  - Simple content (headings, paragraphs, labels, footer text) should be inline edited directly on the page.
  - Complex content (image upload, multi-language forms, validation, Firebase logic, rich media) must reuse the existing mature Overlay Editors. Do not replace or duplicate them.
- **Universal Interaction Language**:
  - **Click** → Edit (Inline)
  - **Hover** → Edit / Delete
  - **Drag** → Reorder
  - **+** → Create
  No section should invent its own interaction model. Consistency is more valuable than additional functionality.
- **Global Editing Experience**: Editing is one continuous session. Editing state should be global. A floating editing toolbar (Unsaved Changes, Undo, Redo, Cancel, Save) remains accessible while scrolling, managing the entire session. The administrator edits the website itself.
- **Reuse Before Rebuild**: Before creating any new editing interface, reuse existing ones. Never duplicate editors, dialogs, forms, upload systems, sorting systems, validation, or Firestore logic. The framework grows by composition, not duplication.
- **Development Priorities**: 1. Consistency, 2. Reusability, 3. Simplicity, 4. Scalability, 5. Visual Quality. Visual improvements should never compromise architectural consistency.
- **Lead Software Engineer Responsibility**: Protect the architecture of the Visual CMS. Before writing code, evaluate whether the request fits the framework. If it weakens consistency, introduces duplicated workflows, or violates the interaction language, propose a better architectural solution before implementation.

## VISUAL CMS COMPONENT STANDARD

Every component must support the same editing philosophy. No component should invent its own behavior. Every component should feel immediately familiar.

- **Text Content**: (Headings, Paragraphs, Labels, Descriptions, Footer Text, Legal Documents, Contact Text). **Behavior**: Click → Inline Edit. Edit directly where the content is displayed. No unnecessary popup, no separate editing page.
- **Collection Components**: (Gallery, Press, Videos, Schedule, Biography Lists, Awards, Education, Future Collections). **Behavior**: Hover → Edit/Delete. Drag → Reorder. `+` → Create. Every collection behaves exactly the same.
- **Edit Workflow**: Simple edits → Inline. Complex edits → Existing Overlay Editor (e.g., Image Upload, Video Configuration, Multi-language Forms, Validation, Firestore Operations, Rich Metadata). Never replace the Overlay Editors. Reuse them.
- **Delete Workflow**: Delete should never happen immediately. Delete → Confirmation Dialog → Delete.
- **Reorder Workflow**: Whenever a collection has order, it must support drag and drop. Do not create sorting pages or dialogs. Direct manipulation is the standard.
- **Create Workflow**: Every editable collection should expose a visible `+` action. The `+` action opens the existing creation Overlay Editor. Creation should never require navigating to another page.
- **Global Editing Session**: Every component participates in one global editing session. Editing is not isolated per section. One Save, One Cancel, One Undo, One Redo, One editing state across the entire website.
- **Consistency Requirement**: Whenever implementing a new component, ask: Does it behave like every other component? If not, redesign it before implementation. The user should never need to learn a new interaction pattern.
- **Final Rule**: The framework is now mature enough that no feature should introduce a new editing pattern without strong architectural justification. Protect consistency above all else. Every improvement should make the Visual CMS feel more unified, more predictable, and more reusable.

## VISUAL CMS EDITING SYSTEM

The website should behave like one continuous editing workspace. The administrator should never feel like they are editing isolated components. Instead, they are editing one website with one editing session.

- **Editing Session**: When Admin Mode is enabled, the entire website enters one Editing Session. Every change belongs to this single session. The session ends only when Save or Cancel is executed.
- **Unsaved State**: The framework automatically detects modifications (text edits, reorders, creations, deletions). The session immediately enters "Unsaved Changes" state.
- **Global Editing Toolbar**: A persistent floating toolbar manages the entire editing session. It is never tied to an individual section and remains visible while scrolling. Supports: Editing Status, Undo, Redo, Cancel, Save.
- **Inline Editing**: Click → Edit. Click outside → Remain in editing mode. Saving is controlled ONLY by the Global Editing Toolbar.
- **Overlay Editing**: Complex content uses existing Overlay Editors. Opening an Overlay Editor participates in the current global session, it does not create a separate session.
- **Reordering**: Dragging immediately updates visual order. The new order becomes part of the current editing session.
- **Delete**: Always requires confirmation. After confirmation, deletion becomes part of the current editing session. Nothing is permanently committed until Save.
- **Create**: Creating new content belongs to the current editing session. New content appears immediately. It is only permanently committed after Save.
- **Undo / Redo**: Works across the entire editing session. Undo is global, not section-specific.
- **Cancel**: Restores the website to the last saved state. Reverts every modification made during the current editing session.
- **Save**: Commits every pending modification together. The website behaves as one document.
- **Framework Principle**: The editing session is more important than the individual editor. Every interaction must contribute to one continuous editing experience. The administrator edits the website, not individual components. Future implementations must respect this editing model before introducing any new features.

## VISUAL CMS FRAMEWORK CONSTRAINTS

These constraints are permanent architectural laws. Future development must respect them:

1. **DO NOT DUPLICATE SYSTEMS**: Never build a second version of an existing workflow (Editor, Modal, Dialog, Upload, Validation, Form, Sorting, Toolbar). Always reuse before rebuild.
2. **DO NOT CREATE PAGE-SPECIFIC SOLUTIONS**: Every implementation should first be evaluated as a reusable framework component (Collection, Media, Rich Content, Legal, Hero, Event). Avoid page-specific systems.
3. **DO NOT INTRODUCE NEW INTERACTION PATTERNS**: The CMS already has one interaction language (Click → Edit, Hover → Edit/Delete, Drag → Reorder, + → Create). Every new feature must use these. Do not invent new interaction models.
4. **DO NOT BREAK THE GLOBAL EDITING SESSION**: There is only one editing session. No feature should create local save, local undo, local editing state, or local toolbar. Everything participates in the global editing workflow.
5. **DO NOT MOVE CONTENT INTO THE CONTROL CENTER**: Content belongs to the Page Editor. Configuration belongs to the Control Center. Never mix these responsibilities.
6. **DO NOT REPLACE EXISTING OVERLAY EDITORS**: The Overlay Editors already solve complex forms, validation, uploads, language management, and Firestore integration. Do not rebuild them. Improve access to them. Reuse them.
7. **DO NOT IMPLEMENT FEATURES THAT REQUIRE TRAINING**: The administrator should immediately understand every interaction. If a feature requires documentation, its design should be reconsidered.
8. **DO NOT SACRIFICE CONSISTENCY FOR CONVENIENCE**: A shortcut that only works for one component is usually the wrong solution. Always prefer one consistent behavior across the entire framework.
9. **DO NOT OPTIMIZE FOR TODAY**: Every implementation should assume that the framework will eventually support many completely different portfolio websites. Build generic systems.
10. **PROTECT THE FRAMEWORK**: Your responsibility is to protect the long-term quality of the Visual CMS Framework. If a feature request conflicts with these constraints, pause implementation, explain the conflict, and propose a framework-compatible solution.
