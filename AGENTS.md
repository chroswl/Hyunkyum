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
