#! /usr/bin/env node
import { Command } from 'commander';
import intlConverter from '../src/intlConverter.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
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
    .action(async (options) => {
        const targetFilePath = options.target;
        const messageFilePath = options.message;
        await intlConverter(targetFilePath, messageFilePath);
    });

program
    .command('*', { noHelp: true })
    .action(() => {
        console.log('해당 명령어를 찾을 수 없습니다.');
        program.help();
    })

program.parse(process.argv);

