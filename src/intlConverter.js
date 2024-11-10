import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { createNewMessageFile, loadExistingMessages } from './messageUtils.js';
import {
    formattedMessage,
    importFormattedMessage,
    importInjectIntl,
    intlFormatMessageFunction,
    wrapExportWithInjectIntl,
} from './intlHelpers.js';

const KOREAN_REGEX = /[가-힣]/;
const isKorean = (text) => KOREAN_REGEX.test(text);

function getOrCreateMessageKey(text, globalMessages, newMessages) {
    let messageKey = Object.keys(globalMessages).find((key) => globalMessages[key] === text);
    if(!messageKey) {
        const newMessageKey = `new.message.${Object.keys(globalMessages).length + 1}`;
        globalMessages [newMessageKey] = text;
        newMessages[newMessageKey] = text;
        messageKey = newMessageKey;
    }
    return messageKey;
}

function handleStringLiteral(path, globalMessages, newMessages) {
    const text = path.node.value.trim();

    //1. 변환 예외
    //한국어 아닌 경우
    if(!isKorean(text)) return false;
    //defaultMessage 속성
    if(path.parent?.key?.name === 'defaultMessage') return false;
    if(path.parent?.name?.name === 'defaultMessage') return false;
    //JSX 속성 값
    if(t.isJSXAttribute(path.container)) return false;

    //2. 메시지 탐색 및 생성
    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

    //3. 변환
    path.replaceWith(intlFormatMessageFunction(messageKey, text));
    return true;
}

function handleJSXText(path, globalMessages, newMessages) {
    const text = path.node.value.trim();

    //1. 변환 예외
    //공백
    if(!text) return false;
    //한국어 아닌 경우
    if(!isKorean(text)) return false;

    //2. 메시지 탐색 및 변환
    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

    //3. 변환
    path.replaceWith(formattedMessage(messageKey, text));
    return true;
}

function convertFile(componentPath, globalMessages, newMessages) {
    const code = fs.readFileSync(componentPath, 'utf8');

    let isFormattedMessageImportNeed = false;
    let isInjectIntlImportNeed = false;

    //code ast 변환
    const ast = parser.parse(code, {
        sourceType: 'module', plugins: ['jsx'],
    });

    traverse.default(ast, {
        ClassMethod(path) {
            path.traverse({
                StringLiteral(subPath) {
                    if(handleStringLiteral(subPath, globalMessages, newMessages)) {
                        isInjectIntlImportNeed = true;
                    }
                }
            });
        },
        ArrowFunctionExpression(path) {
            path.traverse({
                StringLiteral(subPath) {
                    if(handleStringLiteral(subPath, globalMessages, newMessages)) {
                        isInjectIntlImportNeed = true;
                    }
                }
            });
        },
        JSXText(path) {
            if(handleJSXText(path, globalMessages, newMessages)) {
                isFormattedMessageImportNeed = true;
            }
        },
        Program: {
            exit(path) {

                if(isFormattedMessageImportNeed) {
                    importFormattedMessage(path);
                }

                if(isInjectIntlImportNeed) {
                    importInjectIntl(path);
                    wrapExportWithInjectIntl(path);
                }
            },
        },
    });

    const {code: result} = generate.default(ast, {
        comments: true, jsescOption: {
            minimal: true, // ASCII로 변환하지 않음
        },
    });

    //다국어 메시지 적용 파일 생성
    if (result) {
        fs.writeFile(componentPath, result, 'utf8', (err) => {
            if(err) {
                console.error(err);
            }
        });
    }
}

function processPath(inputPath, globalMessages, newMessages) {

    if (!fs.existsSync(inputPath)) {
        console.error(`${inputPath} 파일(폴더)를 찾을 수 없습니다.`)
        return;
    }

    const stats = fs.statSync(inputPath);
    if (stats.isFile()) {
        console.log(`${inputPath} 변환`)
        convertFile(inputPath, globalMessages, newMessages);
    } else if (stats.isDirectory()) {
        const files = fs.readdirSync(inputPath);
        files.forEach(file => {
            const fullPath = path.join(inputPath, file)
            processPath(fullPath, globalMessages, newMessages);
        });
    } else {
        console.error(`${inputPath} 파일 및 폴더가 아닙니다.`);
    }
}

function intlConverter(inputPath, messageFilePath) {
    if (!fs.existsSync(messageFilePath)) {
        console.error(`${messageFilePath} 메시지 파일을 찾을 수 없습니다.`);
        return;
    }
    //메시지 분석
    const globalMessages = loadExistingMessages(messageFilePath);
    const newMessages = {};

    //변환
    processPath(inputPath, globalMessages, newMessages);

    //신규 생성 메시지 파일 생성
    if(!_.isEmpty(newMessages)) {
        createNewMessageFile(newMessages);
    }
}

export default intlConverter;