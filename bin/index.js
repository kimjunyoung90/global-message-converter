#! /usr/bin/env node
import { Command } from 'commander';
import intlProcessor from '../src/intlProcessor.js';

const program = new Command();

program
    .name('global message converter')
    .version('0.0.1', '-v, --version')
    .description('하드코딩된 텍스트를 탐지하여 글로벌 메시지 시스템이 읽을 수 있는 형태로 변환합니다.');

program
    .command('convert')
    .description('하드코딩된 텍스트를 탐지하여 글로벌 메시지 시스템이 읽을 수 있는 형태로 변환합니다.')
    .option('-t, --target <target>', '변환 대상이 되는 파일 명을 입력해 주세요.')
    .option('-m, --message <message>', '메시지 파일을 입력해 주세요.')
    .action((options) => {
        const targetFile = options.target;
        const globalMessage = options.message;
        intlProcessor(targetFile, globalMessage);
    });

program
    .command('*', { noHelp: true })
    .action(() => {
        console.log('해당 명령어를 찾을 수 없습니다.');
        program.help();
    })

program.parse(process.argv);

