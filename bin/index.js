#! /usr/bin/env node
import { Command } from 'commander';
import intlConverter from '../src/intlConverter.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import logger, { LOG_LEVELS } from '../src/logger.js';
import config from '../src/config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// package.json 파일 경로 생성
const packageJsonPath = path.resolve(__dirname, '../package.json');

// package.json 내용을 읽어오기
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
    .name('global message converter')
    .version(packageJson.version, '-v, --version')
    .description('하드코딩된 텍스트를 탐지하여 글로벌 메시지 시스템이 읽을 수 있는 형태로 변환합니다.');

program
    .command('convert')
    .description('하드코딩된 텍스트를 탐지하여 글로벌 메시지 시스템이 읽을 수 있는 형태로 변환합니다.')
    .option('-t, --target <target>', '변환 대상이 되는 파일 또는 폴더를 입력해 주세요.')
    .option('-m, --message <message>', '메시지 파일 경로를 입력해 주세요.')
    .option('-c, --config <config>', '설정 파일 경로')
    .option('-v, --verbose', '상세 로그 출력')
    .option('-q, --quiet', '조용한 모드 (오류만 출력)')
    .option('--no-colors', '색상 비활성화')
    .option('--no-progress', '진행률 비활성화')
    .action(async (options) => {
        try {
            // 설정 로드
            const configFile = await config.load();
            if (configFile) {
                logger.info(`설정 파일 로드: ${configFile}`);
            }
            
            // 커맨드라인 옵션으로 설정 오버라이드
            if (options.verbose) config.set('logging.level', 'debug');
            if (options.quiet) config.set('logging.level', 'error');
            if (options.colors === false) config.set('logging.colors', false);
            if (options.progress === false) config.set('logging.progress', false);
            
            // 로거 설정 적용
            const logLevel = LOG_LEVELS[config.get('logging.level').toUpperCase()];
            logger.setLevel(logLevel);
            logger.setColors(config.get('logging.colors'));
            
            const targetFilePath = options.target;
            const messageFilePath = options.message;
            
            if (!targetFilePath || !messageFilePath) {
                logger.error('필수 옵션이 누락되었습니다: --target 및 --message');
                program.help();
                return;
            }
            
            await intlConverter(targetFilePath, messageFilePath, config.getAll());
        } catch (error) {
            logger.error(`변환 실패: ${error.message}`);
            process.exit(1);
        }
    });

// 설정 관리 커맨드
program
    .command('config')
    .description('설정 관리')
    .option('--init', '기본 설정 파일 생성')
    .option('--show', '현재 설정 보기')
    .option('--validate', '설정 검증')
    .action(async (options) => {
        try {
            if (options.init) {
                const configPath = await config.save();
                logger.success(`설정 파일 생성: ${configPath}`);
            } else if (options.show) {
                await config.load();
                console.log(JSON.stringify(config.getAll(), null, 2));
            } else if (options.validate) {
                await config.load();
                const validation = config.validate();
                if (validation.valid) {
                    logger.success('설정이 유효합니다');
                } else {
                    logger.error('설정 오류:');
                    validation.errors.forEach(error => logger.error(`  - ${error}`));
                }
            } else {
                program.help();
            }
        } catch (error) {
            logger.error(`설정 명령 실패: ${error.message}`);
        }
    });

program
    .command('*', { noHelp: true })
    .action(() => {
        logger.error('해당 명령어를 찾을 수 없습니다.');
        program.help();
    })

// 인수가 없으면 도움말 표시
if (process.argv.length <= 2) {
    program.help();
}

program.parse(process.argv);

