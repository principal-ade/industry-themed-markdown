# themed-markdown

Industry-themed markdown renderer with presentation capabilities.

## Features

- 🎨 Beautiful industry-themed styling
- 📊 Mermaid diagram support
- 🎯 Presentation mode with slide navigation
- 🌓 Dark/light theme support
- 📱 Responsive design
- ⚡ Built with React and TypeScript
- 🌐 **Web-only** (see [React Native Compatibility](#react-native-compatibility))

## Installation

```bash
npm install themed-markdown
# or
yarn add themed-markdown
# or
bun add themed-markdown
```

## Usage

```tsx
import { IndustryMarkdownSlide, ThemeProvider, defaultTheme } from 'themed-markdown';

function App() {
  const markdownContent = `
# My Presentation

## Slide 1
Content for the first slide

## Slide 2
Content for the second slide
  `;

  return (
    <ThemeProvider theme={defaultTheme}>
      <IndustryMarkdownSlide
        content={markdownContent}
        slideIdPrefix="demo"
        slideIndex={0}
        isVisible
        theme={defaultTheme}
      />
    </ThemeProvider>
  );
}
```

## React Native Compatibility

⚠️ **This library is currently web-only and not compatible with React Native.**

It has a hard dependency on `react-dom` which is not available in React Native environments. Attempting to use it in a React Native project will result in dependency conflicts and runtime errors.

**For React Native projects**, consider:
- Using WebView to render pre-rendered HTML from this library
- Using pure React Native markdown libraries (with limitations)
- See [REACT_NATIVE_COMPATIBILITY.md](./REACT_NATIVE_COMPATIBILITY.md) for detailed analysis and alternatives

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build the project
bun run build

# Type check
bun run typecheck

# Lint
bun run lint
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

Developed by [a24z.ai](https://a24z.ai)
