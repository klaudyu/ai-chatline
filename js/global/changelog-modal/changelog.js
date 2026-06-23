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
    id: '2026062301',
    // 'icon' = 提示词按钮左侧显示 Logo + 小红点（温和提示）
    // 'popup' = 自动弹窗展示更新内容（强提醒）
    displayMode: 'icon',

    features: [],

    improvements: [
        {
            zh: '优化提示词悬浮按钮定位，提升 ChatGPT 及其他 AI 平台上的显示稳定性',
            en: 'Improved prompt button positioning for more stable placement on ChatGPT and other AI platforms'
        },
        {
            zh: '适配滚动、输入框高度变化和窄窗口场景，减少按钮错位、漂移与遮挡',
            en: 'Improved compatibility with scrolling, input resizing, and narrow windows to reduce misalignment and overlap'
        }
    ]
};
