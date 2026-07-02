/**
 * SQLSandboxManager - SQL 沙箱管理器
 * 
 * 使用 sql.js (SQLite WASM) 在沙箱中执行 SQL
 */

class SQLSandboxManager {
    constructor() {
        this.currentSandbox = null;
        this.messageHandler = null;
        this.timeoutId = null;
        this.isReady = false;
        this.pendingCode = null;
        this.pendingResolve = null;
        this.pendingReject = null;
        this.pendingOnMessage = null;
        this.messageToken = null;
    }

    /**
     * 获取沙箱 HTML 的 URL
     */
    getSandboxUrl() {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
            return chrome.runtime.getURL('js/runner/languages/sql/sandbox.html');
        }
        return null;
    }

    /**
     * 在沙箱中执行代码
     * @param {string} code - 要执行的 SQL 代码
     * @param {Function} onMessage - 消息回调
     * @param {number} timeout - 超时时间（毫秒）
     * @returns {Promise}
     */
    execute(code, onMessage, timeout = 30000) {
        return new Promise((resolve, reject) => {
            this.destroy();
            if (typeof code !== 'string' || code.length > 1000000) {
                reject(new Error('代码必须是小于 1 MB 的文本'));
                return;
            }
            
            const sandboxUrl = this.getSandboxUrl();
            if (!sandboxUrl) {
                reject(new Error('无法获取沙箱 URL'));
                return;
            }
            
            this.pendingCode = code;
            this.pendingResolve = resolve;
            this.pendingReject = reject;
            this.pendingOnMessage = onMessage;
            this.isReady = false;
            this.messageToken = crypto.randomUUID();
            
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'display:none;position:absolute;width:0;height:0;border:none;';
            iframe.setAttribute('sandbox', 'allow-scripts');
            
            this.messageHandler = (event) => {
                if (event.source !== this.currentSandbox?.contentWindow) return;
                if (!event.data || typeof event.data !== 'object') return;
                if (event.data.token !== this.messageToken) return;
                
                const { type, data } = event.data;
                const validTypes = [
                    'SQL_SANDBOX_READY', 
                    'SQL_LOADING', 
                    'SQL_OUTPUT', 
                    'SQL_TABLE',
                    'SQL_ERROR', 
                    'SQL_COMPLETE'
                ];
                if (!validTypes.includes(type)) return;
                if (!this._isValidPayload(type, data)) return;
                
                switch (type) {
                    case 'SQL_SANDBOX_READY':
                        this.isReady = true;
                        if (this.currentSandbox && this.pendingCode) {
                            this.currentSandbox.contentWindow.postMessage({
                                type: 'EXECUTE_SQL',
                                code: this.pendingCode,
                                token: this.messageToken
                            }, '*');
                        }
                        break;
                    
                    case 'SQL_LOADING':
                        if (this.pendingOnMessage) {
                            this.pendingOnMessage({
                                level: 'info',
                                data: [data.message || '正在加载 SQLite...']
                            });
                        }
                        break;
                        
                    case 'SQL_OUTPUT':
                        if (this.pendingOnMessage) {
                            this.pendingOnMessage(data);
                        }
                        break;
                    
                    case 'SQL_TABLE':
                        // 表格数据，特殊处理
                        if (this.pendingOnMessage) {
                            this.pendingOnMessage({
                                level: 'table',
                                data: data
                            });
                        }
                        break;
                        
                    case 'SQL_ERROR':
                        if (this.pendingOnMessage) {
                            this.pendingOnMessage({
                                level: 'error',
                                data: [data.message || String(data)]
                            });
                        }
                        break;
                        
                    case 'SQL_COMPLETE':
                        clearTimeout(this.timeoutId);
                        const savedResolve = this.pendingResolve;
                        setTimeout(() => {
                            this.destroy();
                        }, 50);
                        if (savedResolve) {
                            savedResolve(data);
                        }
                        break;
                }
            };
            
            window.addEventListener('message', this.messageHandler);
            
            this.timeoutId = setTimeout(() => {
                const savedReject = this.pendingReject;
                this.destroy();
                if (savedReject) {
                    savedReject(new Error('代码执行超时（30秒）'));
                }
            }, timeout);
            
            document.body.appendChild(iframe);
            this.currentSandbox = iframe;
            iframe.src = `${sandboxUrl}#${encodeURIComponent(this.messageToken)}`;
        });
    }

    _isValidPayload(type, data) {
        if (!data || typeof data !== 'object') return false;
        if (type === 'SQL_SANDBOX_READY') return true;
        if (type === 'SQL_LOADING' || type === 'SQL_ERROR') return typeof data.message === 'string';
        if (type === 'SQL_OUTPUT') return typeof data.level === 'string' && Array.isArray(data.data);
        if (type === 'SQL_TABLE') return Array.isArray(data.columns) && Array.isArray(data.values);
        return type === 'SQL_COMPLETE' && typeof data.success === 'boolean';
    }

    /**
     * 清理沙箱
     */
    destroy() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        if (this.messageHandler) {
            window.removeEventListener('message', this.messageHandler);
            this.messageHandler = null;
        }
        
        if (this.currentSandbox) {
            this.currentSandbox.remove();
            this.currentSandbox = null;
        }
        
        this.isReady = false;
        this.pendingCode = null;
        this.pendingResolve = null;
        this.pendingReject = null;
        this.pendingOnMessage = null;
        this.messageToken = null;
    }
}

if (typeof window !== 'undefined') {
    window.SQLSandboxManager = SQLSandboxManager;
}
