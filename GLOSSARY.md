# akli-ui

Shared UI components and design tokens published as `@akli-dev/ui` for akli.dev apps.

## Icons

**Glyph**:
A ready-made, decorative icon element that takes no inputs; its size comes from its own markup or from whatever contains it.
_Avoid_: icon constant, raw icon

**Sized icon**:
An icon rendered with an explicit size chosen by the caller.
_Avoid_: icon component

## Theming

**Theme**:
The colour scheme a page is shown in: light or dark.
_Avoid_: mode, colour mode

**Saved theme**:
The theme a visitor last chose explicitly, kept between visits.
_Avoid_: preference, persisted theme, stored theme

**System theme**:
The theme the visitor's operating system asks for.
_Avoid_: preference, OS theme

**Theme bootstrap**:
The step that applies the theme before the page first paints, so a visitor never sees the wrong one flash.
_Avoid_: theme script, no-flash script
