/**
 * 설정 파일 관리 시스템
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 기본 설정
const DEFAULT_CONFIG = {
    // 변환 설정
    conversion: {
        // 변환 예외 패턴
        excludedPropertyNames: ['defaultMessage', 'id', 'fontFamily', 'className', 'style'],
        includedJSXAttributes: ['label', 'placeholder', 'title', 'alt', 'aria-label'],
        excludedPatterns: [
            '^\\s*$', // 공백만
            '^[a-zA-Z0-9_-]+$', // 영문+숫자+기호만
            '^https?:\\/\\/', // URL
            '^\\\/[a-zA-Z0-9/_-]*', // 경로
            '^\\d+(\\.\\d+)?$', // 숫자만
            '^#[a-fA-F0-9]{3,6}$', // 색상코드
            '^[^\\w가-힣]+$', // 특수문자만
            '^.*(고딕|명조|돋움|바탕|Arial|Times|Helvetica|sans-serif|serif|monospace).*$' // 글꼴 패턴
        ]
    },
    
    // 파일 처리 설정
    files: {
        supportedExtensions: ['.js', '.jsx', '.ts', '.tsx'],
        excludedDirectories: ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.nyc_output'],
        outputFormat: 'pretty' // 'pretty' or 'compact'
    },
    
    // 로깅 설정
    logging: {
        level: 'info', // 'error', 'warn', 'info', 'debug'
        colors: true,
        progress: true
    },
    
    // 출력 설정
    output: {
        newMessageFilePattern: 'newMessages.json',
        showStatistics: true,
        verbose: false
    }
};

class Config {
    constructor() {
        this.config = { ...DEFAULT_CONFIG };
        this.configPaths = [
            '.gmcrc.json',
            '.gmc.config.json',
            'gmc.config.json',
            path.join(process.cwd(), 'package.json') // package.json의 gmc 섹션
        ];
    }

    async load() {
        // 설정 파일들을 순서대로 확인
        for (const configPath of this.configPaths) {
            if (existsSync(configPath)) {
                try {
                    if (configPath.endsWith('package.json')) {
                        const packageJson = JSON.parse(await fs.readFile(configPath, 'utf8'));
                        if (packageJson.gmc) {
                            this.merge(packageJson.gmc);
                            return configPath;
                        }
                    } else {
                        const fileConfig = JSON.parse(await fs.readFile(configPath, 'utf8'));
                        this.merge(fileConfig);
                        return configPath;
                    }
                } catch (error) {
                    console.warn(`설정 파일 로드 실패: ${configPath} - ${error.message}`);
                }
            }
        }
        
        return null; // 기본 설정 사용
    }

    merge(userConfig) {
        this.config = this._deepMerge(this.config, userConfig);
    }

    get(path) {
        return this._getByPath(this.config, path);
    }

    set(path, value) {
        this._setByPath(this.config, path, value);
    }

    getAll() {
        return { ...this.config };
    }

    async save(configPath = '.gmcrc.json') {
        try {
            await fs.writeFile(configPath, JSON.stringify(this.config, null, 2), 'utf8');
            return configPath;
        } catch (error) {
            throw new Error(`설정 파일 저장 실패: ${error.message}`);
        }
    }

    // 설정 검증
    validate() {
        const errors = [];
        
        // 로그 레벨 검증
        const validLogLevels = ['error', 'warn', 'info', 'debug'];
        if (!validLogLevels.includes(this.config.logging.level)) {
            errors.push(`잘못된 로그 레벨: ${this.config.logging.level}`);
        }
        
        // 파일 확장자 검증
        if (!Array.isArray(this.config.files.supportedExtensions)) {
            errors.push('supportedExtensions는 배열이어야 합니다');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    _deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this._deepMerge(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    _getByPath(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    _setByPath(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
}

// 기본 설정 인스턴스
const config = new Config();

export { Config, DEFAULT_CONFIG, config as default };