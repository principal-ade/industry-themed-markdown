# React Native Compatibility Investigation

**Date**: 2026-04-14
**Status**: ⚠️ **Currently Incompatible**
**Related Issue**: Attempted usage in `principal-ai-mobile` (Oct 2025 - Apr 2025)

## Problem Summary

`themed-markdown` cannot currently be used in React Native applications due to a hard dependency on `react-dom`. This was discovered when attempting to integrate it into the `principal-ai-mobile` React Native app.

## Historical Context

### Timeline of Events

1. **October 5, 2025** - Added `themed-markdown@0.1.62` to `principal-ai-mobile`
   - Commit: `712d47b` - "Add themed-markdown package for next phase"
   - Encountered dependency conflicts with `react-dom`

2. **April 2025** - Removed from `principal-ai-mobile`
   - Commit: `26e8144` - "Migrate to @principal-ade namespace and pivot to activity feed"
   - Reason stated: "Reduce bundle size, simplify codebase, avoid maintaining unused code"
   - Real technical reason: Dependency conflict with `react-dom`

3. **April 12, 2026** - Alternative solution implemented
   - Used WebView + GitHub HTML API for README rendering
   - Documentation: `mobile-app/docs/markdown-rendering-options.md`

## The Core Technical Issue

### Why It Doesn't Work

`themed-markdown` has a **hard peer dependency** on `react-dom`:

```json
// package.json
"peerDependencies": {
  "react": ">=19.0.0",
  "react-dom": ">=19.0.0",  // ← THE BLOCKER
  "react-markdown": ">=8.0.0",
  // ...
}
```

**React Native apps cannot have `react-dom`** because:

1. **Mutually Exclusive Rendering Systems**:
   - `react-dom` → Browser DOM (HTML elements: `<div>`, `<span>`, CSS)
   - `react-native` → Native views (iOS: `UIView`, Android: `View`)

2. **Dependency Conflicts**:
   - Installing `react-dom` in a React Native project creates peer dependency conflicts
   - npm/yarn will fail or require `--legacy-peer-deps` (which doesn't fix runtime issues)

3. **Runtime Failures**:
   - Even if installed, imports fail: `Unable to resolve module react-dom`
   - Metro bundler cannot bundle web-only dependencies

### Where `react-dom` is Used

The dependency chain:

```
themed-markdown
  └─> @principal-ade/panels
       └─> react-resizable-panels
            └─> react-dom (uses DOM APIs for resize observers)

themed-markdown
  └─> react-markdown
       └─> Uses DOM rendering internally

themed-markdown
  └─> rehype-* plugins
       └─> Process HTML/AST (web-focused)
```

Additionally, the build configuration explicitly targets browsers:

```json
// package.json build script
"build:esm": "bun build ... --target browser ..."
```

## What Would Be Needed for React Native Support

### Option 1: Create a Separate React Native Package

**Recommended Approach**: Create `themed-markdown-native` as a separate package

**Requirements**:
1. Replace `react-markdown` with a React Native markdown renderer:
   - Options: `react-native-markdown-display`, `react-native-marked`
   - ⚠️ **Major limitation**: These don't support HTML in markdown (GitHub Flavored Markdown issue)

2. Replace `@principal-ade/panels` with React Native layout:
   - Use `react-native-gesture-handler` for drag/resize
   - Or remove resizable panels entirely

3. Replace `rehype-*` plugins:
   - These process HTML - not compatible with RN renderers
   - Would need custom RN-compatible processors

4. Replace syntax highlighting:
   - `highlight.js` works but needs RN-compatible renderer
   - Consider `react-syntax-highlighter/native` or `react-native-syntax-highlighter`

5. Remove Mermaid diagram support (or find RN alternative):
   - Mermaid requires DOM
   - Alternative: Render diagrams server-side, show as images

6. Build target changes:
   - Remove `--target browser`
   - Ensure no web-only APIs (localStorage, window, document)

**Estimated Effort**: 30-50 hours
- Not just "removing react-dom"
- Requires rewriting core rendering logic
- Likely 40-60% of codebase would change

---

### Option 2: Use WebView Wrapper

**Simpler Approach**: Keep `themed-markdown` as-is, render in WebView

**How it works**:
```tsx
// In React Native app
import { WebView } from 'react-native-webview';
import { renderToStaticMarkup } from 'react-dom/server'; // server-side only

// On a Node.js server or pre-build step:
const htmlOutput = renderToStaticMarkup(
  <IndustryMarkdownSlide content={markdown} theme={theme} />
);

// In React Native component:
<WebView
  source={{ html: htmlOutput }}
  style={{ flex: 1 }}
/>
```

**Pros**:
- No changes to `themed-markdown` needed
- Full feature parity (Mermaid, syntax highlighting, etc.)
- All existing styles work

**Cons**:
- Requires server-side rendering or pre-build step
- WebView overhead (heavier than native components)
- Less "native" feel (no native scrolling, gestures)
- Can't easily integrate with native navigation

**Use Cases**:
- Document viewers
- README displays
- Presentation viewers
- Any read-only markdown content

---

### Option 3: Conditional Exports (Advanced)

**Hybrid Approach**: Dual package with conditional exports

```json
// package.json
"exports": {
  ".": {
    "react-native": "./dist/native/index.js",  // RN version
    "browser": "./dist/web/index.js",          // Web version
    "default": "./dist/web/index.js"
  }
}
```

**Requirements**:
- Maintain two separate implementations
- Shared core logic where possible
- Platform-specific rendering layers

**Estimated Effort**: 50-80 hours
- Most complex option
- High maintenance burden
- Best for libraries targeting both platforms equally

---

## Recommendations

### For Web-Only Use (Current State)
✅ **Keep as-is** - `themed-markdown` works great for:
- Web applications
- Documentation sites
- Browser-based presentations
- Storybook (uses react-dom)

### For React Native Projects
Choose based on use case:

1. **Read-only markdown viewing**:
   - Use **Option 2 (WebView)** - simplest, full features
   - Example: README viewer, documentation browser

2. **Native-feeling markdown in UI**:
   - Use plain React Native markdown libraries directly
   - Accept limitations (no HTML, simpler features)
   - Example: Comment rendering, note-taking

3. **Full presentation/slide features in RN**:
   - Consider **Option 1 (Native package)** if there's strong demand
   - Significant development investment required
   - Would need to evaluate if features like Mermaid are critical

## GitHub Flavored Markdown (GFM) Caveat

**Important Discovery** (from mobile-app investigation):

Even if you remove `react-dom` and use React Native markdown libraries, **GitHub READMEs won't render correctly** because:

- GitHub READMEs contain HTML tags: `<p align="center">`, `<picture>`, `<source>`, badges
- React Native markdown libraries **cannot parse HTML** - they only handle pure markdown
- They convert markdown → React Native components, not HTML → RN components

**This is why the mobile app uses WebView + GitHub's HTML API for README rendering.**

If `themed-markdown-native` were created, it would have the same limitation unless:
- It includes an HTML-to-ReactNative renderer (complex)
- Or only supports pure markdown (breaking change for many users)

## Related Documentation

- **Mobile App Investigation**: `/Users/griever/Developer/mobile-app/docs/markdown-rendering-options.md`
- **Mobile App README Viewer**: `mobile-app/src/screens/RepoReadmeScreen.tsx`
- **Mobile App History**: See commit `26e8144` for removal context

## Decision: Keep Web-Only for Now

**Rationale**:
1. The library serves its web use case well
2. React Native compatibility requires major architectural changes
3. WebView is a viable workaround for RN apps that need this
4. The GFM HTML issue makes full RN support even more complex

**If demand increases**:
- Create `@principal-ade/themed-markdown-native` as separate package
- Start with basic markdown rendering (no HTML, no Mermaid)
- Iterate based on actual mobile use cases

## Questions to Answer Before Starting RN Support

1. **Use cases**: What specific features are needed in React Native?
   - Slide presentations?
   - Document viewing?
   - Editing?

2. **HTML support**: Is GitHub Flavored Markdown with HTML required?
   - If yes: Must use WebView or build HTML-to-RN converter
   - If no: Can use simpler RN markdown libraries

3. **Mermaid diagrams**: Are these critical for mobile?
   - If yes: Server-side rendering → images
   - If no: Remove from RN version

4. **Resizable panels**: Needed on mobile?
   - Mobile screens are smaller - may not make sense
   - Could replace with tabs or accordion

5. **Interactive features**: Touch gestures, navigation?
   - Would need RN-specific implementations

## Appendix: Attempted Mobile Integration

### What Was Tried

From mobile-app documentation, three React Native markdown libraries were tested:

1. **react-native-markdown-display** ❌
   - Only renders pure markdown
   - Cannot handle HTML tags in GFM

2. **react-native-marked** ❌
   - Same HTML limitation
   - White background styling issues

3. **react-native-markdown-renderer** ❌
   - Same HTML handling problems

**None worked for GitHub READMEs due to HTML content.**

### What Worked

**WebView + GitHub HTML API**:
```tsx
// Fetch pre-rendered HTML from GitHub
const html = await fetch(`/repos/${owner}/${repo}/readme`, {
  headers: { Accept: 'application/vnd.github.html' }
});

// Render in WebView with GitHub CSS
<WebView source={{ html: githubHtmlWithCSS }} />
```

This approach could be used for `themed-markdown` in RN apps too.

---

## Contributing

If you'd like to work on React Native support, please:

1. Open an issue discussing your use case
2. Clarify which features are essential
3. Propose an implementation approach
4. Consider starting with a proof-of-concept for core features

The maintainers are happy to guide architecture decisions for a potential `themed-markdown-native` package.
