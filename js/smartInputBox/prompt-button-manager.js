/**
 * Prompt Button Manager
 * 
 * Prompt按钮管理器
 * 在输入框左上角显示一个 fixed 定位的"Prompt"按钮
 * 
 * 位置更新策略（事件驱动）：
 * - resize 时立即更新
 * - MutationObserver 检测输入框出现/消失
 * - 不使用持续轮询
 */

class PromptButtonManager {
    constructor(adapter) {
        if (!adapter) {
            throw new Error('PromptButtonManager requires an adapter');
        }
        
        this.adapter = adapter;
        this.buttonElement = null;
        this.inputElement = null;
        this.isEnabled = false;
        this.isDestroyed = false;
        this.platformSettings = {};
        this.storageListener = null;
        this._unsubscribeObserver = null;  // DOMObserverManager Cancel订阅函数
        
        // Prompt列表
        this.prompts = [];
        
        // 版本更新 Logo 按钮
        this._updateBtnElement = null;
        this._hasUpdate = false;
        
        // 事件处理器引用
        this._onResize = null;
        this._onScroll = null;
        this._rafPending = false;  // RAF 节流标志
        
        // 配置
        this.config = {
            gap: 8,  // 按钮与输入框的间距
            updateBtnGap: 6  // Logo 按钮与Prompt按钮的间距
        };
    }
    
    /**
     * 初始化
     */
    async init() {
        // 1. 加载平台Settings
        await this._loadPlatformSettings();
        
        // 2. 加载Prompt列表
        await this._loadPrompts();
        
        // 3. 监听 Storage 变化
        this._attachStorageListener();
        
        // 4. 创建按钮
        this._createButton();
        
        // 5. 检查版本更新状态 & 创建 Logo 按钮
        await this._checkUpdateStatus();
        this._createUpdateButton();
        
        // 6. 检查是否启用
        if (this._shouldTrackInput()) {
            this._enable();
        }
    }
    
    /**
     * 加载Prompt列表
     */
    async _loadPrompts() {
        try {
            const result = await chrome.storage.local.get('prompts');
            this.prompts = result.prompts || [];
        } catch (e) {
            console.error('[PromptButton] Failed to load prompts:', e);
            this.prompts = [];
        }
    }
    
    /**
     * 启用功能
     */
    _enable() {
        if (this.isEnabled) return;
        this.isEnabled = true;
        
        // 绑定事件
        this._bindEvents();
        
        // 启动输入框检测
        this._startInputDetection();
        
        // 尝试立即查找输入框
        this._findInputAndShow();
    }
    
    /**
     * 禁用功能
     */
    _disable() {
        if (!this.isEnabled) return;
        this.isEnabled = false;
        
        // 解绑事件
        this._unbindEvents();
        
        // 停止检测
        this._stopInputDetection();
        
        // 隐藏按钮
        this._hideButton();
        
        // Clear输入框引用
        this.inputElement = null;
    }
    
    /**
     * 加载平台Settings
     */
    async _loadPlatformSettings() {
        try {
            const result = await chrome.storage.local.get('promptButtonPlatformSettings');
            this.platformSettings = result.promptButtonPlatformSettings || {};
        } catch (e) {
            this.platformSettings = {};
        }
    }
    
    /**
     * 检查当前平台是否启用
     */
    _isPlatformEnabled() {
        try {
            const platform = getCurrentPlatform();
            if (!platform) return false;
            if (platform.features?.smartInput !== true) return false;
            return this.platformSettings[platform.id] !== false;
        } catch (e) {
            return true;
        }
    }

    _isAnimationEnabled() {
        try {
            const platform = getCurrentPlatform();
            return platform?.features?.inputAnimation === true;
        } catch (e) {
            return false;
        }
    }

    _shouldTrackInput() {
        return this._isPlatformEnabled() || this._isAnimationEnabled();
    }
    
    /**
     * 监听 Storage 变化
     */
    _attachStorageListener() {
        this.storageListener = (changes, areaName) => {
            // ✅ 已销毁则忽略
            if (this.isDestroyed) return;
            
            if (areaName === 'local') {
                // 监听平台Settings变化
                if (changes.promptButtonPlatformSettings) {
                    this.platformSettings = changes.promptButtonPlatformSettings.newValue || {};
                    const shouldEnable = this._shouldTrackInput();

                    if (shouldEnable && !this.isEnabled) {
                        this._enable();
                    } else if (!shouldEnable && this.isEnabled) {
                        this._disable();
                    }
                }
                
                // 监听Prompt列表变化
                if (changes.prompts) {
                    this.prompts = changes.prompts.newValue || [];
                }
                
                // 监听版本已读状态变化（用户在某个站点看完更新后，其他站点实时隐藏 Logo）
                if (changes['ait-changelog-read-version']) {
                    this._checkUpdateStatus().then(() => this._updateUpdateButtonVisibility());
                }
            }
        };
        chrome.storage.onChanged.addListener(this.storageListener);
    }
    
    /**
     * 创建按钮元素
     */
    _createButton() {
        if (this.buttonElement) return;
        
        const button = document.createElement('div');
        button.className = 'smart-input-prompt-btn';
        button.innerHTML = `
            <svg class="smart-input-prompt-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
        `;

        button.style.display = 'none';

        // ✅ 使用事件委托（解决长时间停留后事件失效问题）
        window.eventDelegateManager.on('click', '.smart-input-prompt-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._handleClick();
        });

        document.body.appendChild(button);
        this.buttonElement = button;

        const platform = typeof getCurrentPlatform === 'function' ? getCurrentPlatform() : null;
        if (window.inputBoxAnimationManager && platform?.features?.inputAnimation === true) {
            window.inputBoxAnimationManager.init();
            this._ensureAIStateMonitor();
        }
    }

    _ensureAIStateMonitor() {
        try {
            const aiMon = window.AIStateMonitor?.getInstance?.();
            if (!aiMon || aiMon.currentAdapter || typeof this.adapter?.isAIGenerating !== 'function') {
                return;
            }
            aiMon.start(this.adapter);
        } catch (e) {
            // Pets are decorative; never block input features if state detection fails.
        }
    }
    
    /**
     * 检查是否有版本更新
     */
    async _checkUpdateStatus() {
        try {
            // 仅 icon 模式下在Prompt按钮旁显示 Logo，popup 模式由 ChangelogModal 自行弹窗
            if (typeof CHANGELOG_DATA !== 'undefined' && CHANGELOG_DATA.displayMode !== 'icon') {
                this._hasUpdate = false;
                return;
            }
            const hasChatTimes = await this._hasChatTimesRecords();
            if (!hasChatTimes) {
                this._hasUpdate = false;
                return;
            }
            // 仅在下午 3 点 ~ 8 点之间展示更新 icon，减少对用户的打扰
            // const hour = new Date().getHours();
            // if (hour < 15 || hour >= 20) {
            //     this._hasUpdate = false;
            //     return;
            // }
            if (window.changelogModal) {
                this._hasUpdate = await window.changelogModal.hasUpdate();
            } else {
                this._hasUpdate = false;
            }
        } catch {
            this._hasUpdate = false;
        }
    }

    /**
     * chatTimes 中已有记录时，才展示更新 Logo
     */
    async _hasChatTimesRecords() {
        try {
            const result = await chrome.storage.local.get('chatTimes');
            const chatTimes = result?.chatTimes;

            const count = chatTimes && typeof chatTimes === 'object'
                ? Object.keys(chatTimes).length
                : 0;

            return count > 0;
        } catch {}
        return false;
    }
    
    /**
     * 创建版本更新 Logo 按钮
     */
    _createUpdateButton() {
        if (this._updateBtnElement) return;
        
        const btn = document.createElement('div');
        btn.className = 'smart-input-update-btn';
        
        try {
            const logoUrl = chrome.runtime.getURL('images/logo.png');
            btn.innerHTML = `
                <img class="smart-input-update-logo" src="${logoUrl}" alt="logo" />
                <span class="smart-input-update-dot"></span>
            `;
        } catch {
            return;
        }
        
        btn.style.display = 'none';
        
        window.eventDelegateManager.on('click', '.smart-input-update-btn', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._handleUpdateClick();
        });
        
        document.body.appendChild(btn);
        this._updateBtnElement = btn;
    }
    
    /**
     * 更新 Logo 按钮的显示/隐藏
     */
    _updateUpdateButtonVisibility() {
        if (!this._updateBtnElement) return;
        
        if (this._hasUpdate && this.isEnabled && this.inputElement) {
            this._updatePosition();
        } else {
            this._updateBtnElement.style.display = 'none';
        }
    }
    
    /**
     * 处理 Logo 按钮点击 → 打开 changelog 弹窗
     */
    _handleUpdateClick() {
        if (window.changelogModal) {
            window.changelogModal.show();
        }
    }
    
    /**
     * 绑定事件（resize）
     */
    _bindEvents() {
        // 使用 RAF 节流，每帧最多更新一次
        const scheduleUpdate = () => {
            if (this._rafPending) return;
            this._rafPending = true;
            
            requestAnimationFrame(() => {
                this._rafPending = false;
                this._updatePosition();
            });
        };
        
        this._onResize = scheduleUpdate;
        this._onScroll = scheduleUpdate;
        
        window.addEventListener('resize', this._onResize);
        document.addEventListener('scroll', this._onScroll, true);
    }
    
    /**
     * 解绑事件
     */
    _unbindEvents() {
        this._rafPending = false;
        
        if (this._onResize) {
            window.removeEventListener('resize', this._onResize);
            this._onResize = null;
        }
        if (this._onScroll) {
            document.removeEventListener('scroll', this._onScroll, true);
            this._onScroll = null;
        }
    }
    
    /**
     * 启动输入框检测
     * 使用 DOMObserverManager 统一管理
     */
    _startInputDetection() {
        if (this._unsubscribeObserver) return;
        
        if (window.DOMObserverManager) {
            this._unsubscribeObserver = window.DOMObserverManager.getInstance().subscribeBody('prompt-button', {
                callback: () => {
                    // 再次检查状态（防止禁用后仍执行）
                    if (!this.isEnabled || this.isDestroyed) return;
                    
                    if (!this.inputElement) {
                        // 还没找到输入框，尝试查找
                        this._findInputAndShow();
                    } else if (!document.body.contains(this.inputElement)) {
                        // 输入框被移除，重新查找
                        this.inputElement = null;
                        this._hideButton();
                        this._findInputAndShow();
                    } else {
                        // 输入框存在时也重新筛选，避免继续绑定 SPA 中已隐藏的旧输入框
                        this._findInputAndShow();
                    }
                },
                filter: { hasAddedNodes: true, hasAttributeChanges: true },
                debounce: 100
            });
        }
    }
    
    /**
     * 停止输入框检测
     */
    _stopInputDetection() {
        if (this._unsubscribeObserver) {
            this._unsubscribeObserver();
            this._unsubscribeObserver = null;
        }
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._transitionHandler) {
            document.body.removeEventListener('transitionend', this._transitionHandler);
            this._transitionHandler = null;
        }
    }
    
    /**
     * 查找输入框并显示按钮
     */
    _findInputAndShow() {
        if (!this.isEnabled || this.isDestroyed) return;
        
        try {
            const selector = this.adapter.getInputSelector();
            const inputs = Array.from(document.querySelectorAll(selector));
            const input = inputs.find(element => {
                const rect = element.getBoundingClientRect();
                return rect.width > 0 &&
                    rect.height > 0 &&
                    rect.bottom > 0 &&
                    rect.top < window.innerHeight &&
                    rect.right > 0 &&
                    rect.left < window.innerWidth;
            });
            
            if (input) {
                const inputChanged = input !== this.inputElement;
                this.inputElement = input;
                this._updatePosition();
                if (inputChanged || !this._resizeObserver) {
                    this._observeInputResize();
                }
            } else if (this.inputElement) {
                this.inputElement = null;
                if (this._resizeObserver) {
                    this._resizeObserver.disconnect();
                    this._resizeObserver = null;
                }
                this._hideButton();
            }
        } catch (e) {
            // 忽略
        }
    }
    
    _observeInputResize() {
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (!this.inputElement) return;
        const ref = this.adapter.getPositionReferenceElement?.(this.inputElement) || this.inputElement;
        this._resizeObserver = new ResizeObserver(() => {
            if (this.isEnabled && !this.isDestroyed) this._updatePosition();
        });
        this._resizeObserver.observe(ref);
        if (ref !== this.inputElement) {
            this._resizeObserver.observe(this.inputElement);
        }

        if (!this._transitionHandler) {
            this._transitionHandler = () => {
                if (this.isEnabled && !this.isDestroyed) this._updatePosition();
            };
            document.body.addEventListener('transitionend', this._transitionHandler);
        }
    }

    /**
     * 更新按钮位置
     */
    _updatePosition() {
        if (!this.buttonElement || !this.inputElement || this.isDestroyed || !this.isEnabled) {
            return;
        }
        
        try {
            const promptEnabled = this._isPlatformEnabled();
            const animationEnabled = this._isAnimationEnabled();
            // 获取定位参考元素（适配器可自定义，Default使用输入框）
            const referenceElement = this.adapter.getPositionReferenceElement?.(this.inputElement) || this.inputElement;
            const rect = referenceElement.getBoundingClientRect();
            
            // 参考元素不可见
            if (
                rect.width === 0 ||
                rect.height === 0 ||
                rect.bottom <= 0 ||
                rect.top >= window.innerHeight ||
                rect.right <= 0 ||
                rect.left >= window.innerWidth
            ) {
                this._hideButton();
                return;
            }
            
            if (promptEnabled) {
                // 获取按钮尺寸
                this.buttonElement.style.visibility = 'hidden';
                this.buttonElement.style.display = 'flex';
                const buttonRect = this.buttonElement.getBoundingClientRect();

                // 获取平台偏移量
                const offset = this.adapter.getPromptButtonOffset?.(this.inputElement) || { top: 0, left: 0 };

                // 计算位置：相对于参考元素左上角
                const top = rect.top + offset.top;
                const left = rect.left - buttonRect.width - this.config.gap + offset.left;

                // 左侧空间不足时隐藏，避免按钮被钳制后Overwrite输入框或页面核心操作
                if (left < 8) {
                    this.buttonElement.style.display = 'none';
                    if (this._updateBtnElement) {
                        this._updateBtnElement.style.display = 'none';
                    }
                } else {
                    // 边界检查
                    const safeTop = Math.max(8, Math.min(top, window.innerHeight - buttonRect.height - 8));
                    const safeLeft = left;

                    // Settings位置并显示
                    this.buttonElement.style.top = `${safeTop}px`;
                    this.buttonElement.style.left = `${safeLeft}px`;
                    this.buttonElement.style.visibility = 'visible';

                    // 更新 Logo 按钮位置（在Prompt按钮左侧）
                    if (this._updateBtnElement && this._hasUpdate) {
                        this._updateBtnElement.style.visibility = 'hidden';
                        this._updateBtnElement.style.display = 'flex';
                        const updateRect = this._updateBtnElement.getBoundingClientRect();
                        const updateLeft = safeLeft - updateRect.width - this.config.updateBtnGap;
                        if (updateLeft >= 8) {
                            this._updateBtnElement.style.top = `${safeTop}px`;
                            this._updateBtnElement.style.left = `${updateLeft}px`;
                            this._updateBtnElement.style.visibility = 'visible';
                        } else {
                            this._updateBtnElement.style.display = 'none';
                        }
                    } else if (this._updateBtnElement) {
                        this._updateBtnElement.style.display = 'none';
                    }
                }
            } else {
                this.buttonElement.style.display = 'none';
                if (this._updateBtnElement) {
                    this._updateBtnElement.style.display = 'none';
                }
            }

            if (window.inputBoxAnimationManager && animationEnabled) {
                this._ensureAIStateMonitor();
                window.inputBoxAnimationManager.updatePosition(referenceElement.getBoundingClientRect());
            } else if (window.inputBoxAnimationManager) {
                window.inputBoxAnimationManager.hideActive();
            }
        } catch (e) {
            this._hideButton();
        }
    }
    
    /**
     * 隐藏按钮
     */
    _hideButton() {
        if (this.buttonElement) {
            this.buttonElement.style.display = 'none';
        }
        if (this._updateBtnElement) {
            this._updateBtnElement.style.display = 'none';
        }
        if (window.inputBoxAnimationManager) {
            window.inputBoxAnimationManager.hideActive();
        }
    }
    
    /**
     * 处理点击
     */
    _handleClick() {
        console.log('[PromptButton] Button clicked');
        
        if (!this.buttonElement) {
            return;
        }
        
        // 如果已经显示，则Close
        if (this._promptDropdown) {
            this._hidePromptDropdown();
            return;
        }
        
        // 显示自定义下拉菜单
        this._showPromptDropdown();
    }
    
    /**
     * 显示Prompt下拉菜单（委托给共享 prompt-dropdown-ui）
     */
    _showPromptDropdown() {
        if (window.globalDropdownManager) {
            window.globalDropdownManager.hide(true);
        }
        
        this._promptOverlay = document.createElement('div');
        this._promptOverlay.className = 'prompt-dropdown-overlay';
        this._promptOverlay.addEventListener('click', () => this._hidePromptDropdown());
        document.body.appendChild(this._promptOverlay);
        
        const currentPlatform = typeof getCurrentPlatform === 'function' ? getCurrentPlatform() : null;
        const currentPlatformId = currentPlatform?.id || '';
        const filteredPrompts = this.prompts.filter(p => !p.platformId || p.platformId === currentPlatformId);
        
        this._promptDropdown = createPromptDropdownUI({
            prompts: filteredPrompts,
            onItemClick: (prompt) => {
                this._hidePromptDropdown();
                this._insertPrompt(prompt);
            },
            onManageClick: () => {
                this._hidePromptDropdown();
                if (window.panelModal) window.panelModal.show('prompt');
            }
        });
        
        document.body.appendChild(this._promptDropdown);
        this._positionPromptDropdown();
        
        requestAnimationFrame(() => {
            this._promptDropdown.classList.add('visible');
        });
        
        this._boundCloseOnClickOutside = (e) => {
            if (!this._promptDropdown?.contains(e.target) && e.target !== this.buttonElement) {
                this._hidePromptDropdown();
            }
        };
        setTimeout(() => {
            document.addEventListener('click', this._boundCloseOnClickOutside, true);
        }, 0);
    }
    
    /**
     * 计算下拉菜单位置
     */
    _positionPromptDropdown() {
        if (!this._promptDropdown || !this.buttonElement) return;
        
        const buttonRect = this.buttonElement.getBoundingClientRect();
        const dropdownWidth = 320;
        const dropdownHeight = 400;
        const topPadding = 20; // 顶部安全距离
        const gap = 8; // 弹窗与按钮的间距
        
        // Settings固定宽高
        this._promptDropdown.style.width = `${dropdownWidth}px`;
        this._promptDropdown.style.height = `${dropdownHeight}px`;
        this._promptDropdown.style.visibility = 'hidden';
        this._promptDropdown.style.display = 'flex';
        
        // 水平位置：与按钮左对齐
        let left = buttonRect.left;
        if (left + dropdownWidth > window.innerWidth - 8) {
            left = window.innerWidth - dropdownWidth - 8;
        }
        left = Math.max(8, left);
        
        // 垂直位置：往上展开，底部挨着按钮顶部
        // 如果超过顶部安全距离，就把弹窗往Move down
        const top = Math.max(topPadding, buttonRect.top - gap - dropdownHeight);
        
        this._promptDropdown.style.left = `${left}px`;
        this._promptDropdown.style.top = `${top}px`;
        this._promptDropdown.style.visibility = 'visible';
    }
    
    /**
     * 隐藏Prompt下拉菜单
     */
    _hidePromptDropdown() {
        if (this._boundCloseOnClickOutside) {
            document.removeEventListener('click', this._boundCloseOnClickOutside, true);
            this._boundCloseOnClickOutside = null;
        }
        
        // Close可能还在显示的 tooltip
        if (window.globalTooltipManager) {
            window.globalTooltipManager.hide();
        }
        
        if (this._promptDropdown) {
            this._promptDropdown.classList.remove('visible');
            setTimeout(() => {
                if (this._promptDropdown?.parentNode) {
                    this._promptDropdown.parentNode.removeChild(this._promptDropdown);
                }
                this._promptDropdown = null;
            }, 150);
        }
        
        if (this._promptOverlay?.parentNode) {
            this._promptOverlay.parentNode.removeChild(this._promptOverlay);
        }
        this._promptOverlay = null;
    }
    
    /**
     * 插入Prompt到输入框
     */
    _insertPrompt(prompt) {
        if (!this.inputElement || !prompt.content) {
            return;
        }
        
        try {
            // 获取适配器的插入方法
            if (this.adapter.insertText) {
                this.adapter.insertText(this.inputElement, prompt.content);
            } else {
                // Default插入逻辑
                this._defaultInsertText(prompt.content);
            }
        } catch (e) {
            console.error('[PromptButton] Failed to insert prompt:', e);
        }
    }
    
    /**
     * Default的文本插入逻辑（追加到末尾）
     */
    _defaultInsertText(text) {
        if (!this.inputElement) return;
        
        // 聚焦输入框
        this.inputElement.focus();
        
        if (this.inputElement.isContentEditable) {
            // contenteditable 处理：使用 insertText 追加，避免替换整个内容
            
            // 移动光标到末尾
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(this.inputElement);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 配置：空行数（1个空行 = 2个换行符）
            const separatorBlankLines = 1;  // 新旧内容之间的空行数
            const trailingBlankLines = 1;   // 追加内容末尾的空行数
            
            const existingText = this.inputElement.innerText || '';
            const hasContent = existingText.trim().length > 0;
            
            let separator = '';
            if (hasContent) {
                // 检查末尾已有的空行数（换行符数 - 1 = 空行数）
                const trailingMatch = existingText.match(/\n+$/);
                const existingNewlines = trailingMatch ? trailingMatch[0].length : 0;
                const existingBlankLines = Math.max(0, existingNewlines - 1);
                
                // 计算需要补充多少空行才能达到目标
                const needBlankLines = Math.max(0, separatorBlankLines - existingBlankLines);
                // 空行数 + 1 = 换行符数（至少需要 1 个换行符来换行）
                separator = existingNewlines === 0 
                    ? '\n'.repeat(separatorBlankLines + 1)  // 没有换行，加完整的
                    : '\n'.repeat(needBlankLines);          // 有换行，补差值
            }
            
            const trailing = '\n'.repeat(trailingBlankLines + 1);
            const appendText = separator + text + trailing;
            
            // 使用 insertText 命令追加（execCommand 虽已弃用，但无替代方案能避免框架重格式化问题）
            document.execCommand('insertText', false, appendText);
            
            // 延迟Settings焦点、光标和滚动
            setTimeout(() => {
                this.inputElement.focus();
                
                // Settings光标到末尾（contenteditable 需要 selection 才能显示光标）
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(this.inputElement);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                
                this.inputElement.scrollTop = this.inputElement.scrollHeight;
            }, 50);
        } else {
            // textarea 或 input 处理：内联文本追加逻辑
            const existingText = this.inputElement.value || '';
            let finalText;
            if (!existingText.trim()) {
                finalText = text + '\n\n';
            } else {
                // 清理末尾换行符，Add1个空行（2个换行符）作为分隔
                const cleanedText = existingText.replace(/\n+$/, '');
                finalText = cleanedText + '\n\n' + text + '\n\n';
            }
            this.inputElement.value = finalText;
            this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.value.length;
            
            // 触发 input 事件
            this.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            
            // 延迟Settings焦点和滚动
            setTimeout(() => {
                this.inputElement.focus();
                this.inputElement.selectionStart = this.inputElement.selectionEnd = this.inputElement.value.length;
                this.inputElement.scrollTop = this.inputElement.scrollHeight;
            }, 50);
        }
    }
    
    /**
     * 显示
     */
    show() {
        if (this.isEnabled) {
            this._findInputAndShow();
        }
    }
    
    /**
     * 隐藏
     */
    hide() {
        this._hideButton();
    }
    
    /**
     * 销毁
     */
    destroy() {
        this.isDestroyed = true;
        this._disable();
        
        // Close下拉菜单
        this._hidePromptDropdown();
        
        // 移除 Storage 监听
        if (this.storageListener) {
            chrome.storage.onChanged.removeListener(this.storageListener);
            this.storageListener = null;
        }
        
        // 移除按钮
        if (this.buttonElement?.parentNode) {
            this.buttonElement.parentNode.removeChild(this.buttonElement);
            this.buttonElement = null;
        }
        if (this._updateBtnElement?.parentNode) {
            this._updateBtnElement.parentNode.removeChild(this._updateBtnElement);
            this._updateBtnElement = null;
        }
        if (window.inputBoxAnimationManager) {
            window.inputBoxAnimationManager.destroy();
        }
    }
}
