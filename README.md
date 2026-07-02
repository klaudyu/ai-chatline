<div align="center">
  <img src="./icons/icon128.png" alt="ChatLine Logo" width="80" height="80">
  <h1>ChatLine</h1>
  <p><strong>浏览器端 AI 对话增强工具</strong><br>ChatLine 为主流 AI 对话平台提供时间轴导航、提示词复用、收藏整理、对话导出与高亮标注，帮助用户更高效地浏览、管理和复盘 AI 对话。</p>

  <p>
    <a href="https://github.com/miguchn/ai-chatline/stargazers"><img src="https://img.shields.io/github/stars/miguchn/ai-chatline?style=social" alt="GitHub Stars"></a>
    <a href="https://github.com/miguchn/ai-chatline/forks"><img src="https://img.shields.io/github/forks/miguchn/ai-chatline?style=social" alt="GitHub Forks"></a>
    <img src="https://img.shields.io/github/v/release/miguchn/ai-chatline?style=flat-square&label=latest" alt="Latest Release">
    <img src="https://img.shields.io/github/license/miguchn/ai-chatline?style=flat-square" alt="License">
    <img src="https://img.shields.io/chrome-web-store/users/oiifmbmllkahpcagifgoedoiinohnfen?style=flat-square&label=users" alt="Chrome Web Store Users">
    <img src="https://img.shields.io/chrome-web-store/rating/oiifmbmllkahpcagifgoedoiinohnfen?style=flat-square" alt="Chrome Web Store Rating">
  </p>

  <p>
    <a href="https://chromewebstore.google.com/detail/oiifmbmllkahpcagifgoedoiinohnfen?utm_source=item-share-cb"><img src="https://img.shields.io/badge/安装-Chrome%20Web%20Store-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="从 Chrome Web Store 安装"></a>
  </p>

  <h4><strong>简体中文</strong> | <a href="./README.en.md">English</a></h4>
</div>

## 目录

- [安装方式](#安装方式)
- [功能预览](#功能预览)
- [核心功能](#核心功能)
- [支持平台](#支持平台)
- [数据与隐私](#数据与隐私)
- [本地开发](#本地开发)
- [版本说明](#版本说明)
- [联系与反馈](#联系与反馈)
- [致谢](#致谢)

## 安装方式

[![从 Chrome Web Store 安装](https://img.shields.io/badge/安装-Chrome%20Web%20Store-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/oiifmbmllkahpcagifgoedoiinohnfen?utm_source=item-share-cb)

推荐通过上方的 Chrome Web Store 安装按钮安装 ChatLine。进入商店页面后，点击「添加至 Chrome」即可完成安装。

安装后打开支持的 AI 对话页面即可使用，无需额外配置。

## 功能预览

### 对话时间轴

![对话时间轴](./READMEIMAGE/screenshot-01-timeline.png)

自动生成对话节点，长对话中也能快速定位、回看和跳转。

### 提示词管理

![提示词管理](./READMEIMAGE/screenshot-02-prompts.png)

保存常用提示词，并从对话页面快速插入，减少重复输入。

### 高亮标注与笔记

![高亮标注与笔记](./READMEIMAGE/screenshot-03-highlight.png)

对 AI 回复中的关键信息进行高亮、标注和备注，保留重要上下文。

### 对话导出

![对话导出](./READMEIMAGE/screenshot-04-export.png)

将当前 AI 对话导出保存，便于归档、分享和二次整理。

### 更多增强能力

![更多增强能力](./READMEIMAGE/screenshot-05-more.png)

围绕阅读、整理、导出和页面显示持续补充实用能力。

## 核心功能

- **对话时间轴**：自动识别对话节点，支持快速定位、回看和跳转。
- **文件夹管理**：对收藏内容、常用资料和对话线索进行分类整理。
- **提示词管理**：保存常用提示词，并支持快速插入使用。
- **代码运行（高级功能）**：默认关闭，仅在用户主动开启后加载，适合需要本地预览代码的场景。
- **对话导出**：支持将 AI 对话内容导出保存，便于归档、分享和复盘。
- **高亮标注与笔记**：支持对 AI 回复内容进行重点标注、颜色区分和备注记录。
- **快捷追问（可选）**：默认关闭，开启后可将选中内容快速引用到输入框。
- **公式与图表增强（可选）**：LaTeX 复制和 Mermaid 渲染默认关闭，开启后才加载对应运行时。
- **页面增强能力**：包括对话宽度、显示优化、回到底部等设置；电子宠物默认关闭并仅保留四种样式。
- **数据备份与恢复**：支持 JSON 导入导出，也可选择使用 Google Drive 同步扩展数据。

## 支持平台

| 平台 | 时间轴 | 文本高亮 | 智能输入 | 输入动画 | 快捷追问 | 提问时间 | 侧边栏收藏 | 回到底部 |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| ChatGPT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Gemini | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DeepSeek | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Claude | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Kimi | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| 豆包 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| 千问 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Qwen 国际版 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - |
| Grok | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| Perplexity | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| 元宝 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| 文心一言 | ✅ | ✅ | - | ✅ | ✅ | ✅ | - | - |
| NotebookLM | - | ✅ | ✅ | ✅ | ✅ | - | - | - |

> 轻量版默认仅开启时间轴、提示词、收藏、对话导出和高亮。代码运行、Mermaid、公式增强、电子宠物和 AI 完成提醒均默认关闭；设置面板会按当前平台能力隐藏不支持的入口。

## 数据与隐私

- ChatLine 的核心数据默认保存在用户浏览器本地，主要包括收藏、文件夹、提示词、插件设置、时间标签、笔记等扩展数据。
- 插件不会主动收集、上传或分享用户的对话内容和个人信息；项目代码中也不包含远程采集用户数据的逻辑。
- Google Drive 同步是可选高级功能。Chromium 安装时不申请 Google 身份与 API 权限，只有用户首次点击云备份时才请求；Firefox 因 `identity` 不能作为可选 API 权限，安装包仍需声明该权限，但 Google API host 继续按需申请。本地 JSON 备份始终可直接使用。
- 本项目已开源，相关数据处理逻辑可直接在仓库中审查。

## 本地开发

本仓库是浏览器扩展项目，没有复杂的前端构建步骤；如需本地开发或调试，可以直接加载源码目录。

Chrome / Edge 调试流程：

1. 打开浏览器扩展管理页面，例如 `chrome://extensions/` 或 `edge://extensions/`。
2. 启用开发者模式。
3. 选择"加载已解压的扩展程序"。
4. 选择本仓库根目录。
5. 修改代码后，在扩展管理页面点击重新加载，并刷新目标 AI 平台页面。

代码修改后可运行 `npm test`，执行平台契约、安全边界、manifest 与 JavaScript 语法检查。

Firefox 调试：

- 运行 `node scripts/build-firefox.js` 生成 Firefox 包，再通过 `about:debugging` 临时载入生成的 ZIP。

## 版本说明

### v3.8.0

- 优化右侧时间轴底部间距，在不同窗口尺寸下显示更协调。
- 默认体验进一步轻量化，高级功能保持默认关闭并按需加载。
- 优化多平台能力展示、消息识别与对话导出稳定性。
- 加强 Markdown、Mermaid、HTML 预览和代码运行的安全边界。

## 联系与反馈

- **作者**：MiguCHN
- **问题反馈**：欢迎发送邮件到 miguchn@gmail.com

## 致谢

ChatLine 在项目演进过程中参考并受益于 Timeline 开源项目。感谢原作者和社区贡献者的开放分享，也感谢所有持续推动本项目体验优化的反馈与建议。
