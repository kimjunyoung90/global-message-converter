/**
 * 로깅 시스템 - 다양한 로그 레벨과 색상 지원
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    gray: '\x1b[90m'
};

class Logger {
    constructor(level = LOG_LEVELS.INFO, enableColors = true) {
        this.level = level;
        this.enableColors = enableColors;
    }

    setLevel(level) {
        this.level = level;
    }

    setColors(enabled) {
        this.enableColors = enabled;
    }

    _formatMessage(level, message, prefix = '') {
        const timestamp = new Date().toISOString();
        const levelStr = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level);
        
        if (this.enableColors) {
            const colorMap = {
                [LOG_LEVELS.ERROR]: COLORS.red,
                [LOG_LEVELS.WARN]: COLORS.yellow,
                [LOG_LEVELS.INFO]: COLORS.blue,
                [LOG_LEVELS.DEBUG]: COLORS.gray
            };
            
            return `${COLORS.gray}[${timestamp}]${COLORS.reset} ${colorMap[level]}${levelStr}${COLORS.reset}: ${prefix}${message}`;
        }
        
        return `[${timestamp}] ${levelStr}: ${prefix}${message}`;
    }

    error(message, prefix = '') {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(this._formatMessage(LOG_LEVELS.ERROR, message, prefix));
        }
    }

    warn(message, prefix = '') {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(this._formatMessage(LOG_LEVELS.WARN, message, prefix));
        }
    }

    info(message, prefix = '') {
        if (this.level >= LOG_LEVELS.INFO) {
            console.log(this._formatMessage(LOG_LEVELS.INFO, message, prefix));
        }
    }

    debug(message, prefix = '') {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.log(this._formatMessage(LOG_LEVELS.DEBUG, message, prefix));
        }
    }

    // 특수 메서드들
    success(message, prefix = '') {
        if (this.level >= LOG_LEVELS.INFO) {
            const formattedMessage = this.enableColors 
                ? `${COLORS.green}✓${COLORS.reset} ${message}`
                : `✓ ${message}`;
            console.log(this._formatMessage(LOG_LEVELS.INFO, formattedMessage, prefix));
        }
    }

    progress(current, total, message = '') {
        if (this.level >= LOG_LEVELS.INFO) {
            const percentage = Math.round((current / total) * 100);
            const progressMessage = `[${current}/${total}] ${percentage}% ${message}`;
            console.log(this._formatMessage(LOG_LEVELS.INFO, progressMessage, '📊 '));
        }
    }
}

// 기본 로거 인스턴스
const logger = new Logger();

export { Logger, LOG_LEVELS, logger as default };