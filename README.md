# Global Message Converter
`global-message-converter` is a command-line tool that detects hardcoded text within React applications and converts it to the format required by global messaging systems (react-intl). This library enables easy conversion of text.

**[CHANGELOG](./CHANGELOG.md)**: Check the latest update history here.

#### Conversion Examples (Class and Functional Component Support)
1. Text Conversion in JSX
> **Before:**
> ```javascript
> <div>Hello.</div>
> ```

> **After:**
> ```javascript
> <div><FormattedMessage id="greeting" defaultMessage="Hello." /></div>
> ```

2. Plain Text Conversion
- In this case, if the text is english converts only that starts with uppercase.
> **Before:**
> ```javascript
> const hi = 'Hello.';
> ```

> **After:**
> ```javascript
> const hi = intl.formatMessage({ id: 'new.message', defaultMessage: 'Hello.' });
> ```

3. Template Literal Conversion
> **Before:**
> ```javascript
> const error = `${error} occurred`;
> ```

> **After:**
> ```javascript
> const error = intl.formatMessage({ id: 'error.message' }, { error });
> ```

## Getting Started
To use this library, Node.js must be installed. Then you can install the library using npm.
```bash
npm install -g global-message-converter
```

## Usage
After installation, run the library using the following command:
```bash
gmc [command]
```

## Commands
### convert
Detects hardcoded text and converts it to a format readable by the global messaging system.

## Usage Example
```bash
gmc convert -t <file or folder path> -m <message file path>
```

#### Options
- `-t, --target <target>`: Enter the file or folder to be converted.
- `-m, --message <message>`: Enter the message file path.

#### Example
To convert files containing hardcoded text:
```bash
gmc convert --target ./src/components --message ./messages/messages.json
```

## Message File Format
The message file is the baseline used to convert hardcoded text.

It detects message keys matching the text. If no matching message is found, a new message is created, and newly created messages are provided in file format (newMessages).

Must be written in JSON or JS format, with each message having a unique key and corresponding text value.
Here's an example of a message file:
```json
{
    "welcome_message": "Welcome, {username}!",
    "loading": "Loading...",
    "error": "Error: Unable to load data.",
    "success": "Congratulations! All tasks completed."
}
```

For JS files, nested message structures are not recognized:
```javascript
export default {
    ko: {
       "welcome_message": "Welcome, {username}!",
       "loading": "Loading...",
       "error": "Error: Unable to load data.",
       "success": "Congratulations! All tasks completed."
    },
    en: {
        ...
    }
}
```

Must be converted to a non-nested format for proper message conversion:
```javascript
export default {
   "welcome_message": "Welcome, {username}!",
   "loading": "Loading...",
   "error": "Error: Unable to load data.",
   "success": "Congratulations! All tasks completed."
}
```

## How to Contribute
1. Fork the [repository](https://github.com/kimjunyoung90/global-message-converter.git).
2. Create a branch:
   git checkout -b feature/feature-name
3. Commit and push your changes.

- **Bug Reports**: If a bug is discovered, create a new issue in the [Issues](https://github.com/kimjunyoung90/global-message-converter/issues) section. Clearly describe the problem and include reproduction steps.
- **Feature Requests**: New feature suggestions are always welcome! Provide detailed explanations to aid review.

## License
This project is distributed under the MIT License.