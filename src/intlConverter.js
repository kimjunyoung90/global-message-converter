import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs';
import path from "path";
import _ from 'lodash';
import {loadExistingMessages} from './messageUtils.js';
import {
    intlFormatMessageFunction,
    formattedMessage,
    importFormattedMessage,
    importInjectIntl,
    wrapExportWithInjectIntl,
} from './intlHelpers.js';

const isKorean = (text) => {
    const koreanRegex = /[가-힣]/;
    return koreanRegex.test(text);
};

const newMessages = {};

function convert(componentPath, globalMessages) {
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
                    const text = subPath.node.value;
                    if (!isKorean(text)) return;

                    //FixMe: defaultMessage 변경 제외
                    if (subPath.parent?.key?.name === 'defaultMessage') return;
                    if (subPath.parent?.name?.name === 'defaultMessage') return;
                    //FixMe: jsx 속성값 변경 제외
                    if(t.isJSXAttribute(subPath.container)) return;

                    let key = Object.keys(globalMessages).find((key) => globalMessages[key] === text);

                    //key가 파일에 없는 경우
                    if (!key) {
                        const newKey = `new.message.${Object.keys(globalMessages).length + 1}`;
                        globalMessages[newKey] = text;
                        newMessages[newKey] = text;
                        key = newKey;
                    }
                    subPath.replaceWith(intlFormatMessageFunction(key, text));
                    isInjectIntlImportNeed = true;
                }
            });
        },
        JSXText(path) {
            const text = path.node.value.trim();

            if (!text) return;
            if (!isKorean(text)) return;
            let key = Object.keys(globalMessages).find((key) => globalMessages[key] === text);

            //key가 파일에 없는 경우
            if (!key) {
                const newKey = `new.message.${Object.keys(globalMessages).length + 1}`;
                globalMessages[newKey] = text;
                newMessages[newKey] = text;
                key = newKey;
            }
            const formatMessage = formattedMessage(key, text);
            path.replaceWith(formatMessage);
            isFormattedMessageImportNeed = true;
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

function pathSearchAndConvert(inputPath, globalMessages) {

    if (!fs.existsSync(inputPath)) {
        console.error(`${inputPath} 파일(폴더)를 찾을 수 없습니다.`)
        return;
    }

    const stats = fs.statSync(inputPath);
    if (stats.isFile()) {
        console.log(`${inputPath} 변환`)
        convert(inputPath, globalMessages);
    } else if (stats.isDirectory()) {
        const files = fs.readdirSync(inputPath);
        files.forEach(file => {
            const fullPath = path.join(inputPath, file)
            pathSearchAndConvert(fullPath, globalMessages);
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

    //변환
    pathSearchAndConvert(inputPath, globalMessages);

    //신규 생성 메시지 파일 생성
    if(!_.isEmpty(newMessages)) {
        let newMessageFileName = 'newMessages.json';
        let counter = 1;
        while(fs.existsSync(newMessageFileName)) {
            const parsed = path.parse(newMessageFileName);
            newMessageFileName = path.join(parsed.dir, `${parsed.name}_${counter}${parsed.ext}`);
            counter++;
        }
        fs.writeFile(newMessageFileName, JSON.stringify(newMessages), 'utf-8', (err) => {
            if(err) {
                console.error(err);
            }
        });
    }
}

export default intlConverter;