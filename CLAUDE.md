# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Release
- `npm run release` - Creates a new release using standard-version (bumps version, updates CHANGELOG.md)
- No test, build, or lint commands are configured in package.json

### CLI Usage
- `gmc convert -t <target> -m <message>` - Convert hardcoded Korean text to react-intl format
  - `-t, --target`: File or folder path to convert
  - `-m, --message`: Message file path (JSON or JS format)

## Code Architecture

### Core Components
- **`bin/index.js`**: CLI entry point using Commander.js, defines the `convert` command
- **`src/intlConverter.js`**: Main conversion logic using Babel AST transformation
- **`src/intlHelpers.js`**: React-intl helper functions for generating AST nodes
- **`src/messageUtils.js`**: Message file parsing and new message file creation utilities

### Conversion Logic
The tool analyzes JavaScript/JSX files using Babel AST parsing and transforms hardcoded Korean text:

1. **String Literals**: Converts to `intl.formatMessage()` calls (function components) or `this.props.intl.formatMessage()` (class components)
2. **Template Literals**: Extracts variables as parameters for interpolation
3. **JSX Text**: Converts to `<FormattedMessage />` components

### Component Detection
- Automatically detects React function components vs class components
- Function components get `useIntl()` hook injection
- Class components get `injectIntl()` HOC wrapping
- JSX elements get `<FormattedMessage />` imports

### Message Management
- Reads existing messages from JS/JSON files (flat structure only, no nesting)
- Creates new message keys as `new.message.{number}` for unmatched text
- Outputs new messages to `newMessages.json` (or numbered variants if file exists)
- Only processes Korean text (detected via `/[가-힣]/` regex)

### Key Files
- **`messages/`**: Contains sample message files (ko.js, en.js)
- **`test.js`**: Utility script for finding duplicate messages in external projects
- Uses ES modules (`"type": "module"` in package.json)

### Dependencies
- Babel ecosystem for AST parsing/transformation (@babel/parser, @babel/traverse, @babel/generator, @babel/types)
- Commander.js for CLI interface
- Inquirer for interactive prompts
- Chalk for colored output
- Lodash for utilities