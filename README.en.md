<div align="center">
  <img src="./icons/icon128.png" alt="ChatLine Logo" width="80" height="80">
  <h1>ChatLine</h1>
  <p><strong>Browser-based enhancement tool for AI chats</strong><br>ChatLine adds timeline navigation, prompt reuse, bookmarks, conversation export, and highlights to mainstream AI chat platforms.</p>

  <p>
    <a href="https://github.com/miguchn/ai-chatline/stargazers"><img src="https://img.shields.io/github/stars/miguchn/ai-chatline?style=social" alt="GitHub Stars"></a>
    <a href="https://github.com/miguchn/ai-chatline/forks"><img src="https://img.shields.io/github/forks/miguchn/ai-chatline?style=social" alt="GitHub Forks"></a>
    <img src="https://img.shields.io/github/v/release/miguchn/ai-chatline?style=flat-square&label=latest" alt="Latest Release">
    <img src="https://img.shields.io/github/license/miguchn/ai-chatline?style=flat-square" alt="License">
    <img src="https://img.shields.io/chrome-web-store/users/oiifmbmllkahpcagifgoedoiinohnfen?style=flat-square&label=users" alt="Chrome Web Store Users">
    <img src="https://img.shields.io/chrome-web-store/rating/oiifmbmllkahpcagifgoedoiinohnfen?style=flat-square" alt="Chrome Web Store Rating">
  </p>

  <p>
    <a href="https://chromewebstore.google.com/detail/oiifmbmllkahpcagifgoedoiinohnfen?utm_source=item-share-cb"><img src="https://img.shields.io/badge/Install-Chrome%20Web%20Store-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Install from Chrome Web Store"></a>
  </p>

  <h4><a href="./README.md">简体中文</a> | <strong>English</strong></h4>
</div>

## Contents

- [Installation](#installation)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Supported Platforms](#supported-platforms)
- [Data & Privacy](#data--privacy)
- [Local Development](#local-development)
- [Release Notes](#release-notes)
- [Contact & Support](#contact--support)
- [Acknowledgements](#acknowledgements)

## Installation

[![Install from Chrome Web Store](https://img.shields.io/badge/Install-Chrome%20Web%20Store-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/oiifmbmllkahpcagifgoedoiinohnfen?utm_source=item-share-cb)

The recommended way to install ChatLine is through the Chrome Web Store badge above. Open the store page and click "Add to Chrome" to complete the installation.

After installation, open a supported AI chat page and start using it with no extra setup.

## Screenshots

### Chat Timeline

![Chat Timeline](./READMEIMAGE/en-screenshot-01-timeline.png)

Automatically maps conversation nodes so long chats remain easy to locate, review, and navigate.

### Prompt Management

![Prompt Management](./READMEIMAGE/en-screenshot-02-prompts.png)

Save frequently used prompts and insert them from the chat page with less repeated typing.

### Highlights & Notes

![Highlights & Notes](./READMEIMAGE/en-screenshot-03-highlight.png)

Highlight, annotate, and note important parts of AI responses while keeping useful context visible.

### Conversation Export

![Conversation Export](./READMEIMAGE/en-screenshot-04-export.png)

Export AI conversations for archiving, sharing, and later review.

### More Enhancements

![More Enhancements](./READMEIMAGE/en-screenshot-05-more.png)

Practical enhancements continue to grow around reading, organization, export, and page display.

## Key Features

- **Chat Timeline**: Automatically detects conversation nodes for fast positioning, review, and jumping.
- **Folder Management**: Organize saved content, common materials, and conversation references by category.
- **Prompt Management**: Save reusable prompts and insert them quickly when chatting.
- **Code Runner (Advanced)**: Off by default and loaded only after the user enables it.
- **Conversation Export**: Export AI chat content for archiving, sharing, and review.
- **Highlights & Notes**: Mark key AI responses with highlights, colors, and notes.
- **Quick Follow-up (Optional)**: Off by default; quote selected text into the input box after enabling it.
- **Formula & Diagram Enhancements (Optional)**: LaTeX copying and Mermaid rendering are off by default and loaded on demand.
- **Page Enhancements**: Includes chat width, display optimization, and scroll-to-bottom; digital pets are off by default and limited to four styles.
- **Backup & Restore**: Supports JSON import/export and optional Google Drive sync for extension data.

## Supported Platforms

| Platform | Timeline | Text Highlight | Smart Input | Animations | Quick Follow-up | Chat Times | Sidebar Bookmarks | Scroll to Bottom |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ChatGPT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Gemini | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DeepSeek | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Claude | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Kimi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Doubao | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Qwen | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Qwen Intl | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Grok | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| Perplexity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| Yuanbao | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| Yiyan | ✅ | ✅ | - | ✅ | ✅ | ✅ | - | - |
| NotebookLM | - | ✅ | ✅ | ✅ | ✅ | - | - | - |

> The lightweight defaults are Timeline, Prompts, Bookmarks, Conversation Export, and Highlights. Code Runner, Mermaid, formula enhancements, digital pets, and AI completion notifications are off by default. Unsupported settings are hidden for the current platform.

## Data & Privacy

- ChatLine stores core extension data in the user's browser by default, including bookmarks, folders, prompts, extension settings, time labels, notes, and related local data.
- The extension does not proactively collect, upload, or share chat content or personal information, and the project code does not include remote user-data collection logic.
- Google Drive sync is optional. Chromium requests Google identity and API access only when cloud backup is first used. Firefox must declare `identity` at install time because it is not an optional API permission there, while the Google API host remains optional. Local JSON backup always works without cloud access.
- This project is open source, so its data-handling logic can be reviewed directly in the repository.

## Local Development

This repository is a browser extension project. It does not require a complex frontend build process; for local development or debugging, the source directory can be loaded directly.

Chrome / Edge debugging:

1. Open the browser extension management page, such as `chrome://extensions/` or `edge://extensions/`.
2. Enable developer mode.
3. Choose "Load unpacked".
4. Select the root directory of this repository.
5. After changing code, reload the extension from the extension management page and refresh the target AI platform page.

Run `npm test` after code changes to check platform contracts, security boundaries, the manifest, and JavaScript syntax.

Firefox debugging:

- Run `node scripts/build-firefox.js`, then load the generated ZIP as a temporary add-on from `about:debugging`.

## Release Notes

### v3.8.0

- Improved timeline bottom spacing for a more balanced layout across window sizes.
- Made the default experience lighter while keeping advanced features off and loaded on demand.
- Improved platform capability display, message detection, and conversation export stability.
- Strengthened safety boundaries for Markdown, Mermaid, HTML previews, and code execution.

## Contact & Support

- **Author**: MiguCHN
- **Bug reports / Feedback**: miguchn@gmail.com

## Acknowledgements

ChatLine has referenced and benefited from the open-source Timeline project during its evolution. Thanks to the original author and community contributors for their open work, and thanks to everyone who continues to help improve the ChatLine experience through feedback and suggestions.
