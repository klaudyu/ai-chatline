/**
 * Tab Registry - 统一的 Tab 注册管理
 * 
 * ✨ 设计理念：所有 tabs 按数组顺序依次注册，互相独立
 */

/**
 * 获取 Tab 类的辅助函数
 */
function getTabClass(name) {
    switch (name) {
        case 'StarredTab': return typeof StarredTab !== 'undefined' ? StarredTab : null;
        case 'TimelineSettingsTab': return typeof TimelineSettingsTab !== 'undefined' ? TimelineSettingsTab : null;
        case 'PromptTab': return typeof PromptTab !== 'undefined' ? PromptTab : null;
        case 'SmartInputBoxTab': return typeof SmartInputBoxTab !== 'undefined' ? SmartInputBoxTab : null;
        case 'FormulaTab': return typeof FormulaTab !== 'undefined' ? FormulaTab : null;
        case 'AnimationTab': return typeof AnimationTab !== 'undefined' ? AnimationTab : null;
        case 'RunnerTab': return typeof RunnerTab !== 'undefined' ? RunnerTab : null;
        case 'ConversationExportTab': return typeof ConversationExportTab !== 'undefined' ? ConversationExportTab : null;
        case 'DataSyncTab': return typeof DataSyncTab !== 'undefined' ? DataSyncTab : null;
        case 'AboutTab': return typeof AboutTab !== 'undefined' ? AboutTab : null;
        case 'HighlightTab': return typeof HighlightTab !== 'undefined' ? HighlightTab : null;
        case 'ChatWidthTab': return typeof ChatWidthTab !== 'undefined' ? ChatWidthTab : null;
        default: return null;
    }
}

function isExtensionContextInvalidatedError(error) {
    return String(error?.message || error).includes('Extension context invalidated');
}

/**
 * Tab 配置数组（按显示顺序排列）
 * - id: tab 的唯一标识
 * - className: 对应的类名（字符串）
 */
const TAB_CONFIG = [
    { id: 'timeline', className: 'TimelineSettingsTab', group: 'core' },
    { id: 'starred', className: 'StarredTab', group: 'core' },
    { id: 'prompt', className: 'PromptTab', group: 'core' },
    { id: 'conversation-export', className: 'ConversationExportTab', group: 'core' },
    { id: 'highlight', className: 'HighlightTab', group: 'core' },
    { id: 'smart-input-box', className: 'SmartInputBoxTab', group: 'advanced' },
    { id: 'chat-width', className: 'ChatWidthTab', group: 'advanced' },
    { id: 'formula', className: 'FormulaTab', group: 'advanced' },
    { id: 'runner', className: 'RunnerTab', group: 'advanced' },
    { id: 'animation', className: 'AnimationTab', group: 'experimental' },
    { id: 'data-sync', className: 'DataSyncTab', group: 'backup' },
    { id: 'about', className: 'AboutTab', group: 'about' }
];

/**
 * 注册所有可用的 tabs（按配置数组顺序）
 */
function registerAllTabs() {
    if (!window.panelModal) {
        console.error('[TabRegistry] PanelModal not initialized');
        return;
    }
    
    const pm = window.panelModal;
    
    // 按顺序注册每个 tab
    for (const config of TAB_CONFIG) {
        // 跳过已注册的
        if (pm.tabs.has(config.id)) {
            continue;
        }
        
        // 获取 Tab 类
        const TabClass = getTabClass(config.className);
        if (!TabClass) {
            continue;
        }
        
        try {
            const tabInstance = new TabClass();
            if (typeof tabInstance.shouldShow === 'function' && !tabInstance.shouldShow()) {
                continue;
            }
            tabInstance.group = config.group;
            pm.registerTab(tabInstance);
        } catch (error) {
            if (!isExtensionContextInvalidatedError(error)) {
                console.error(`[TabRegistry] Failed to register tab "${config.id}":`, error);
            }
        }
    }
}

/**
 * TimelineManager 初始化时调用（保持兼容）
 */
function registerTimelineTabs() {
    registerAllTabs();
}

/**
 * @deprecated 使用 registerTimelineTabs 代替
 */
function initializePanelModalTabs() {
    registerAllTabs();
}
