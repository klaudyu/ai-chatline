/**
 * Changelog Data - 版本更新内容
 * 
 * 每次想推送更新提示时只需修改这个文件：
 * 1. 更换 id 为任意新字符串（与上次不同即可触发提示）
 * 2. 设置 displayMode：'icon'(提示词按钮左侧 Logo) 或 'popup'(自动弹窗)
 * 3. 更新 features / improvements 列表（支持 zh/en 双语）
 *    - features: 新功能
 *    - improvements: 功能优化 & 修复
 * 
 * 弹窗中展示的版本号自动从 manifest.json 获取，无需手动维护
 */

const CHANGELOG_DATA = {
    id: '2026070201',
    // 'icon' = 提示词按钮左侧显示 Logo + 小红点（温和提示）
    // 'popup' = 自动弹窗展示更新内容（强提醒）
    displayMode: 'icon',

    features: [],

    improvements: [
        {
            zh: '优化右侧时间轴底部间距，在不同窗口尺寸下显示更协调',
            en: 'Improved the timeline bottom spacing for a more balanced layout across window sizes'
        },
        {
            zh: '默认体验更轻量，代码运行、图表、公式和动画等高级功能按需启用',
            en: 'Made the default experience lighter, with code, diagrams, formulas, and animations enabled only when needed'
        },
        {
            zh: '优化多平台能力展示、消息识别与对话导出稳定性',
            en: 'Improved platform capability display, message detection, and conversation export stability'
        },
        {
            zh: '加强 Markdown、Mermaid、HTML 预览与代码运行的安全边界',
            en: 'Strengthened safety boundaries for Markdown, Mermaid, HTML previews, and code execution'
        }
    ]
};
