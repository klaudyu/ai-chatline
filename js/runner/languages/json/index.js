/**
 * JsonRunner - JSON 格式化/验证器
 * 
 * 格式化 JSON 并验证语法
 */

class JsonRunner extends BaseRunner {
    constructor() {
        super({
            language: 'json',
            displayName: 'JSON',
            icon: '📋',
            fileExtension: '.json'
        });
    }

    /**
     * 执行（格式化）代码
     * @param {string} code - 要格式化的 JSON
     * @param {Object} options - 选项
     * @returns {Promise}
     */
    async execute(code, options = {}) {
        const startTime = Date.now();
        const { onOutput = () => {} } = options;
        
        try {
            // 解析 JSON
            const parsed = JSON.parse(code);
            
            // 格式化输出
            const formatted = JSON.stringify(parsed, null, 2);
            
            // 统计信息
            const stats = this._getJsonStats(parsed);
            
            onOutput({
                level: 'info',
                data: [`✓ JSON 有效 | ${stats}`]
            });
            
            // 发送格式化后的 JSON
            onOutput({
                level: 'json-formatted',
                data: { json: formatted, parsed: parsed }
            });
            
            const duration = Date.now() - startTime;
            return {
                success: true,
                duration: duration,
                language: this.language
            };
        } catch (error) {
            // 解析错误，尝试给出更详细的信息
            let errorMsg = error.message;
            
            // 尝试定位错误位置
            const posMatch = errorMsg.match(/position (\d+)/);
            if (posMatch) {
                const pos = parseInt(posMatch[1]);
                const lines = code.substring(0, pos).split('\n');
                const line = lines.length;
                const col = lines[lines.length - 1].length + 1;
                errorMsg = `第 ${line} 行, 第 ${col} 列: ${errorMsg}`;
            }
            
            onOutput({
                level: 'error',
                data: [`✗ JSON 无效: ${errorMsg}`]
            });
            
            const duration = Date.now() - startTime;
            return {
                success: false,
                error: errorMsg,
                duration: duration,
                language: this.language
            };
        }
    }

    /**
     * 获取 JSON 统计信息
     */
    _getJsonStats(obj) {
        const type = Array.isArray(obj) ? 'Array' : typeof obj === 'object' ? 'Object' : typeof obj;
        
        if (Array.isArray(obj)) {
            return `数组, ${obj.length} 项`;
        } else if (typeof obj === 'object' && obj !== null) {
            const keys = Object.keys(obj);
            return `对象, ${keys.length} 个键`;
        } else {
            return `${type}`;
        }
    }

    /**
     * 清理资源
     */
    cleanup() {
        // 无需清理
    }

    /**
     * 获取占位符
     */
    getPlaceholder() {
        return '{\n  "key": "value"\n}';
    }

    /**
     * 获取示例代码
     * @returns {string}
     */
    getExampleCode() {
        return `{
  "name": "AI Chat Timeline",
  "version": "4.1.0",
  "features": [
    "代码Run",
    "Timeline",
    "公式渲染"
  ],
  "languages": {
    "javascript": true,
    "python": true,
    "sql": true
  },
  "author": {
    "name": "开发者",
    "email": "dev@example.com"
  }
}`;
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.JsonRunner = JsonRunner;
}

