/**
 * RunnerManager - 代码Run器核心管理器
 * 
 * 协调各个模块，管理代码执行流程
 */

class RunnerManager {
    constructor() {
        this.languageRegistry = null;
        this.currentLanguage = 'javascript';
        this.isRunning = false;
        this.outputLimit = 1000; // 最多显示 1000 条输出
        this.outputCount = 0;
    }

    /**
     * 初始化
     */
    initialize() {
        if (!this.languageRegistry) {
            this.languageRegistry = new window.LanguageRegistry();
        }
    }

    /**
     * Run代码
     * @param {string} code - 要执行的代码
     * @param {string} language - 语言类型
     * @param {Object} callbacks - 回调函数
     * @returns {Promise}
     */
    async run(code, language, callbacks = {}) {
        this.initialize();

        const {
            onStart = () => {},
            onOutput = () => {},
            onComplete = () => {},
            onError = () => {}
        } = callbacks;

        // 检查代码是否为空
        if (!code || !code.trim()) {
            onError({ message: 'Code cannot be empty' });
            return { success: false, error: 'Code cannot be empty' };
        }

        // 检查语言是否支持
        const runner = this.languageRegistry.getRunner(language);
        if (!runner) {
            onError({ message: `Unsupported language: ${language}` });
            return { success: false, error: `Unsupported language: ${language}` };
        }

        // 检查是否正在Run
        if (this.isRunning) {
            onError({ message: 'Code is running, please wait...' });
            return { success: false, error: 'Code is running' };
        }

        // 重置输出计数
        this.outputCount = 0;
        this.isRunning = true;
        onStart();

        try {
            // 执行代码（使用各语言Default的超时时间）
            const result = await runner.execute(code, {
                onOutput: (output) => {
                    this.handleOutput(output, onOutput);
                }
            });

            this.isRunning = false;
            onComplete(result);
            return result;

        } catch (error) {
            this.isRunning = false;
            const errorResult = {
                success: false,
                error: error.message
            };
            onError(errorResult);
            return errorResult;
        }
    }

    /**
     * 处理输出
     * @param {Object} output - 输出数据
     * @param {Function} callback - 回调函数
     */
    handleOutput(output, callback) {
        // 检查输出限制
        if (this.outputCount >= this.outputLimit) {
            if (this.outputCount === this.outputLimit) {
                callback({
                    level: 'warn',
                    data: [`输出已达到上限 (${this.outputLimit} 条)，后续输出将被忽略...`],
                    truncated: true
                });
                this.outputCount++;
            }
            return;
        }

        this.outputCount++;
        callback(output);
    }

    /**
     * 停止当前Run
     */
    stop() {
        if (!this.isRunning) return;

        // 清理当前语言的Run器
        const runner = this.languageRegistry.getRunner(this.currentLanguage);
        if (runner && runner.cleanup) {
            runner.cleanup();
        }

        this.isRunning = false;
    }

    /**
     * 验证代码语法
     * @param {string} code - 代码
     * @param {string} language - 语言
     * @returns {Object}
     */
    validateSyntax(code, language) {
        this.initialize();

        const runner = this.languageRegistry.getRunner(language);
        if (!runner) {
            return { valid: false, error: 'Unsupported language' };
        }

        if (runner.validateSyntax) {
            return runner.validateSyntax(code);
        }

        return { valid: true };
    }

    /**
     * 获取示例代码
     * @param {string} language - 语言
     * @returns {string}
     */
    getExampleCode(language) {
        this.initialize();

        const runner = this.languageRegistry.getRunner(language);
        if (runner && runner.getExampleCode) {
            return runner.getExampleCode();
        }

        return '';
    }

    /**
     * 获取所有语言
     * @returns {Array}
     */
    getAllLanguages() {
        this.initialize();
        return this.languageRegistry.getAllLanguages();
    }

    /**
     * Settings当前语言
     * @param {string} language - 语言
     */
    setCurrentLanguage(language) {
        this.currentLanguage = language;
    }

    /**
     * 获取当前语言
     * @returns {string}
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * 清理资源
     */
    cleanup() {
        this.stop();
        if (this.languageRegistry) {
            this.languageRegistry.cleanup();
        }
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.RunnerManager = RunnerManager;
}

