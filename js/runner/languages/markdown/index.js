/**
 * MarkdownRunner - Markdown 渲染器
 * 
 * 使用 marked.js 渲染 Markdown
 */

class MarkdownRunner extends BaseRunner {
    constructor() {
        super({
            language: 'markdown',
            displayName: 'Markdown',
            icon: '📝',
            fileExtension: '.md'
        });
    }

    /**
     * 执行（渲染）代码
     * @param {string} code - 要渲染的 Markdown
     * @param {Object} options - 选项
     * @returns {Promise}
     */
    async execute(code, options = {}) {
        const startTime = Date.now();
        const { onOutput = () => {} } = options;
        
        try {
            // 检查 marked 是否已加载
            if (typeof marked === 'undefined') {
                throw new Error('Markdown 渲染器未加载');
            }
            
            // 渲染 Markdown
            const html = this._sanitizeHtml(marked.parse(code));
            
            // 发送渲染结果
            onOutput({
                level: 'markdown-preview',
                data: { html: html, raw: code }
            });
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                duration: duration,
                language: this.language
            };
        } catch (error) {
            onOutput({
                level: 'error',
                data: [error.message]
            });
            
            return {
                success: false,
                error: error.message,
                language: this.language
            };
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        // 无需清理
    }

    _sanitizeHtml(html) {
        const template = document.createElement('template');
        template.innerHTML = html;

        template.content.querySelectorAll('script, style, iframe, object, embed, link, meta, base, form').forEach(el => el.remove());
        template.content.querySelectorAll('*').forEach(el => {
            for (const attr of Array.from(el.attributes)) {
                const name = attr.name.toLowerCase();
                const value = attr.value.trim().replace(/[\u0000-\u001f\u007f\s]+/g, '').toLowerCase();
                const isExecutableAttribute = name.startsWith('on') || name === 'srcdoc' || name === 'style';
                const isUrlAttribute = ['href', 'src', 'xlink:href', 'formaction'].includes(name);
                const isUnsafeUrl = value.startsWith('javascript:') ||
                    value.startsWith('vbscript:') ||
                    (value.startsWith('data:') && !/^data:image\/(png|gif|jpe?g|webp);/i.test(value));

                if (isExecutableAttribute || (isUrlAttribute && isUnsafeUrl)) {
                    el.removeAttribute(attr.name);
                }
            }
        });

        return template.innerHTML;
    }

    /**
     * 获取占位符
     */
    getPlaceholder() {
        return '# Title\n\nEnter Markdown content...';
    }

    /**
     * 获取示例代码
     * @returns {string}
     */
    getExampleCode() {
        return `# Markdown 示例

## 文本格式

这是 **粗体** 和 *斜体* 文本。

这是 ~~Delete线~~ 和 \`行内代码\`。

## 列表

- 项目 1
- 项目 2
  - 子项目 A
  - 子项目 B

1. 有序列表
2. 第二项
3. 第三项

## 引用

> 这是一段引用文本
> 可以多行

## 链接和图片

[访问 GitHub](https://github.com)

## 代码块

\`\`\`javascript
console.log("Hello World!");
\`\`\`

## 表格

| 名称 | 描述 |
|------|------|
| HTML | 超文本标记语言 |
| CSS | 层叠样式表 |
| JS | JavaScript |
`;
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.MarkdownRunner = MarkdownRunner;
}
