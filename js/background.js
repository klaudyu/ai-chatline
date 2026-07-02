/**
 * Background Service Worker
 * 
 * 职责：
 * 1. Google Drive 云同步（OAuth2 认证 + 文件读写）
 * 2. 按需注入高级功能运行时
 */

// ============================================
// Google Drive 同步服务
// ============================================

const GDRIVE_FOLDER_NAME = 'AITimeline_Backup';
const GDRIVE_DATA_FILE = 'ait-backup.json';
const GDRIVE_API = 'https://www.googleapis.com';

const IS_FIREFOX = typeof browser !== 'undefined' && browser.runtime?.id;
const browserAPI = IS_FIREFOX ? browser : chrome;

const OAUTH_CLIENT_ID = '945798922226-jve664u0ibs7lsji89kr8s7f9lsnilla.apps.googleusercontent.com';
const OAUTH_SCOPES = 'https://www.googleapis.com/auth/drive.file';

const OPTIONAL_FEATURES = {
    runner: {
        css: [
            'js/runner/codemirror/codemirror.min.css',
            'js/runner/styles.css',
            'js/runner/components/runner-panel.css',
            'js/runner/components/floating-runner.css',
            'js/mermaid/styles.css'
        ],
        js: [
            'js/runner/codemirror/codemirror.min.js',
            'js/runner/codemirror/javascript.min.js',
            'js/runner/codemirror/xml.min.js',
            'js/runner/codemirror/css.min.js',
            'js/runner/codemirror/sql.min.js',
            'js/runner/codemirror/htmlmixed.min.js',
            'js/runner/codemirror/markdown.min.js',
            'js/runner/highlight/highlight.core.min.js',
            'js/runner/highlight/javascript.min.js',
            'js/runner/highlight/typescript.min.js',
            'js/runner/highlight/sql.min.js',
            'js/runner/highlight/xml.min.js',
            'js/runner/highlight/css.min.js',
            'js/runner/highlight/json.min.js',
            'js/runner/highlight/markdown.min.js',
            'js/runner/libs/marked.min.js',
            'js/runner/highlight/language-detector.js',
            'js/runner/core/base-runner.js',
            'js/runner/languages/javascript/sandbox-manager.js',
            'js/runner/languages/javascript/index.js',
            'js/runner/languages/typescript/sandbox-manager.js',
            'js/runner/languages/typescript/index.js',
            'js/runner/languages/sql/sandbox-manager.js',
            'js/runner/languages/sql/index.js',
            'js/runner/languages/html/index.js',
            'js/runner/languages/json/index.js',
            'js/runner/languages/markdown/index.js',
            'js/runner/languages/mermaid/index.js',
            'js/runner/languages/registry.js',
            'js/runner/runner-manager.js',
            'js/runner/components/runner-panel.js',
            'js/runner/components/floating-runner.js',
            'js/runner/index.js',
            'js/mermaid/lib/mermaid.min.js',
            'js/mermaid/index.js'
        ]
    },
    formula: {
        css: ['js/formula/formula.css'],
        js: [
            'js/formula/libs/temml.min.js',
            'js/formula/latex-extractor.js',
            'js/formula/formula-manager.js',
            'js/formula/index.js'
        ]
    },
    quickAsk: {
        css: ['js/quickAsk/styles.css'],
        js: [
            'js/quickAsk/selection-copy.js',
            'js/quickAsk/quick-ask-manager.js',
            'js/quickAsk/index.js'
        ]
    },
    scrollToBottom: {
        css: ['js/scrollToBottom/styles.css'],
        js: ['js/scrollToBottom/scroll-to-bottom-manager.js']
    },
    animation: {
        css: [
            'js/smartInputBox/animations/snail/styles.css',
            'js/smartInputBox/animations/zombie/styles.css',
            'js/smartInputBox/animations/ant/styles.css',
            'js/smartInputBox/animations/wizard/styles.css'
        ],
        js: [
            'js/smartInputBox/animations/snail/index.js',
            'js/smartInputBox/animations/zombie/index.js',
            'js/smartInputBox/animations/ant/index.js',
            'js/smartInputBox/animations/wizard/index.js',
            'js/smartInputBox/animations/index.js'
        ]
    }
};

const GDRIVE_PERMISSIONS = IS_FIREFOX
    ? { origins: ['https://www.googleapis.com/*'] }
    : { permissions: ['identity'], origins: ['https://www.googleapis.com/*'] };

async function hasGDrivePermissions() {
    if (!browserAPI.permissions?.contains) return false;
    return await browserAPI.permissions.contains(GDRIVE_PERMISSIONS);
}

async function requestGDrivePermissions() {
    if (!browserAPI.permissions?.request) {
        throw new Error('This browser cannot request cloud backup permissions');
    }
    // Keep request() as the first async boundary so the browser can associate it
    // with the user's cloud-backup button click.
    return browserAPI.permissions.request(GDRIVE_PERMISSIONS);
}

async function injectOptionalFeature(tabId, frameId, feature) {
    const config = OPTIONAL_FEATURES[feature];
    if (!config) throw new Error('Unknown optional feature');
    if (!browserAPI.scripting) throw new Error('Dynamic script loading is not supported');

    const target = { tabId, frameIds: [frameId] };
    const markerResult = await browserAPI.scripting.executeScript({
        target,
        func: featureName => {
            window.__aitOptionalFeatures ||= {};
            if (window.__aitOptionalFeatures[featureName]) return true;
            window.__aitOptionalFeatures[featureName] = 'loading';
            return false;
        },
        args: [feature]
    });
    if (markerResult?.[0]?.result === true) return;

    try {
        if (config.css.length > 0) {
            await browserAPI.scripting.insertCSS({ target, files: config.css });
        }
        await browserAPI.scripting.executeScript({ target, files: config.js });
        await browserAPI.scripting.executeScript({
            target,
            func: featureName => {
                window.__aitOptionalFeatures[featureName] = 'loaded';
            },
            args: [feature]
        });
    } catch (error) {
        await browserAPI.scripting.executeScript({
            target,
            func: featureName => {
                if (window.__aitOptionalFeatures) delete window.__aitOptionalFeatures[featureName];
            },
            args: [feature]
        }).catch(() => {});
        throw error;
    }
}

/**
 * 获取 OAuth2 Access Token
 * 统一使用 identity.launchWebAuthFlow 方式
 */
async function getAuthToken(interactive = true) {
    if (!await hasGDrivePermissions()) {
        throw new Error('Cloud backup permission has not been granted');
    }
    const stored = await browserAPI.storage.local.get('gdriveToken');
    if (stored.gdriveToken?.access_token) {
        const isValid = await validateToken(stored.gdriveToken.access_token);
        if (isValid) return stored.gdriveToken.access_token;
    }

    if (!interactive) throw new Error('Not authenticated');

    const redirectUrl = browserAPI.identity.getRedirectURL();
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(OAUTH_CLIENT_ID)}` +
        `&response_type=token` +
        `&redirect_uri=${encodeURIComponent(redirectUrl)}` +
        `&scope=${encodeURIComponent(OAUTH_SCOPES)}`;

    const responseUrl = await browserAPI.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
    });

    const params = new URL(responseUrl.replace('#', '?')).searchParams;
    const accessToken = params.get('access_token');
    if (!accessToken) throw new Error('OAuth failed: no access_token');

    await browserAPI.storage.local.set({
        gdriveToken: { access_token: accessToken, obtained_at: Date.now() }
    });

    return accessToken;
}

async function validateToken(token) {
    try {
        const resp = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`);
        return resp.ok;
    } catch { return false; }
}

/**
 * 查找 Google Drive 中的文件/文件夹
 * @param {string} token - Access Token
 * @param {string} name - 文件名
 * @param {string} mimeType - MIME 类型（可选，用于区分文件和文件夹）
 * @param {string} parentId - 父文件夹 ID（可选）
 * @returns {string|null} 文件 ID
 */
async function findFile(token, name, mimeType = null, parentId = null) {
    let query = `name='${name}' and trashed=false`;
    if (mimeType) query += ` and mimeType='${mimeType}'`;
    if (parentId) query += ` and '${parentId}' in parents`;
    
    const url = `${GDRIVE_API}/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
    const resp = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!resp.ok) throw new Error(`Find file failed: ${resp.status}`);
    
    const data = await resp.json();
    return data.files?.[0]?.id || null;
}

/**
 * 确保备份文件夹存在
 * @returns {string} 文件夹 ID
 */
async function ensureFolder(token) {
    // 先查找
    const folderId = await findFile(token, GDRIVE_FOLDER_NAME, 'application/vnd.google-apps.folder');
    if (folderId) return folderId;
    
    // 不存在，创建
    const resp = await fetch(`${GDRIVE_API}/drive/v3/files`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: GDRIVE_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder'
        })
    });
    
    if (!resp.ok) throw new Error(`Create folder failed: ${resp.status}`);
    
    const folder = await resp.json();
    return folder.id;
}

/**
 * 上传数据到 Google Drive
 * 使用 multipart upload（元数据 + 内容一起上传）
 */
async function uploadToDrive(token, data) {
    const folderId = await ensureFolder(token);
    const fileId = await findFile(token, GDRIVE_DATA_FILE, null, folderId);
    
    // 构建 multipart body
    const boundary = 'ait_boundary_' + Date.now();
    const metadata = {
        name: GDRIVE_DATA_FILE,
        mimeType: 'application/json',
        ...(!fileId && { parents: [folderId] }) // 新建时指定父文件夹
    };
    
    const body = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify(metadata),
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        JSON.stringify(data),
        `--${boundary}--`
    ].join('\r\n');
    
    // 更新已有文件 or 创建新文件
    const url = fileId
        ? `${GDRIVE_API}/upload/drive/v3/files/${fileId}?uploadType=multipart`
        : `${GDRIVE_API}/upload/drive/v3/files?uploadType=multipart`;
    
    const resp = await fetch(url, {
        method: fileId ? 'PATCH' : 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
        },
        body: body
    });
    
    if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Upload failed: ${resp.status} ${errText}`);
    }
    
    return await resp.json();
}

/**
 * 从 Google Drive 下载数据
 */
async function downloadFromDrive(token) {
    const folderId = await findFile(token, GDRIVE_FOLDER_NAME, 'application/vnd.google-apps.folder');
    if (!folderId) return null; // 文件夹不存在，说明从未上传过
    
    const fileId = await findFile(token, GDRIVE_DATA_FILE, null, folderId);
    if (!fileId) return null; // 文件不存在
    
    const resp = await fetch(`${GDRIVE_API}/drive/v3/files/${fileId}?alt=media`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
    
    return await resp.json();
}

// ============================================
// 扩展图标点击
// ============================================

const SUPPORTED_DOMAINS = [
    'chatgpt.com', 'chat.openai.com', 'gemini.google.com', 'doubao.com',
    'chat.deepseek.com', 'yiyan.baidu.com', 'qianwen.com', 'tongyi.com',
    'tongyi.aliyun.com', 'qianwen.aliyun.com', 'chat.qwen.ai',
    'kimi.com', 'kimi.moonshot.cn', 'yuanbao.tencent.com', 'grok.com',
    'perplexity.ai', 'claude.ai', 'notebooklm.google.com'
];

function isSupportedSite(url) {
    try {
        const hostname = new URL(url).hostname;
        return SUPPORTED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
    } catch { return false; }
}

chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url && isSupportedSite(tab.url)) {
        try {
            await chrome.tabs.sendMessage(tab.id, { type: 'OPEN_PANEL_MODAL' });
        } catch {
            chrome.tabs.create({ url: chrome.runtime.getURL('popup/guide.html') });
        }
    } else {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/guide.html') });
    }
});

// ============================================
// 消息处理
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'LOAD_OPTIONAL_FEATURE') {
        if (!sender.tab?.id) {
            sendResponse({ success: false, error: 'Missing sender tab' });
            return false;
        }
        injectOptionalFeature(sender.tab.id, sender.frameId || 0, request.feature)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    
    // --- Google Drive 同步 ---

    if (request.type === 'REQUEST_GDRIVE_PERMISSIONS') {
        requestGDrivePermissions()
            .then(granted => sendResponse({
                success: granted === true,
                error: granted ? null : 'Cloud backup permission was declined'
            }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
    
    // 上传到 Google Drive（未登录时自动触发登录）
    if (request.type === 'GDRIVE_UPLOAD') {
        (async () => {
            try {
                const token = await getAuthToken(true);
                await uploadToDrive(token, request.data);
                sendResponse({ success: true });
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        })();
        return true;
    }
    
    // 从 Google Drive 下载（未登录时自动触发登录）
    if (request.type === 'GDRIVE_DOWNLOAD') {
        (async () => {
            try {
                const token = await getAuthToken(true);
                const data = await downloadFromDrive(token);
                sendResponse({ success: true, data });
            } catch (e) {
                sendResponse({ success: false, error: e.message });
            }
        })();
        return true;
    }
    
});
