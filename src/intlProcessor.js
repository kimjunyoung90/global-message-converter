import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs';
import {loadExistingMessages} from './messageUtils.js';
import {callIntlFormatMessageExpression, createFormatMessage, importIntl, isWrappedWithInjectIntl} from './intlHelpers.js';

const isKorean = (text) => {
    const koreanRegex = /[가-힣]/;
    return koreanRegex.test(text);
};

function intlProcessor(componentPath, messageFilePath) {
    const globalMessages = loadExistingMessages(messageFilePath);

    const code = fs.readFileSync(componentPath, 'utf8');

    let isFormattedMessageImportNeed = false;
    let isInjectIntlImportNeed = false;

    //code ast 변환
    const ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx'],
    });

    traverse.default(ast, {
        ArrowFunctionExpression(path) {
            //화살표 함수에 내부에 하드코딩 된 한글 문자를 재귀적으로 탐색 하여 다국어 키 적용
            path.traverse({
                StringLiteral(subPath) {
                    const text = subPath.node.value;
                    if (!isKorean(text)) return;

                    //defaultMessage 에 있는 한국어는 변경 제외
                    if (subPath.parent?.key?.name === 'defaultMessage') return;
                    if (subPath.parent?.name?.name === 'defaultMessage') return;

                    let key = Object.keys(globalMessages).find((key) => globalMessages[key] === text);

                    //key가 파일에 없는 경우
                    if (!key) {
                        const newKey = `new.message.${Object.keys(globalMessages).length + 1}`;
                        globalMessages[newKey] = text;
                        key = newKey;
                    }
                    subPath.replaceWith(callIntlFormatMessageExpression(key, text));
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
                key = newKey;
            }

            const formatMessage = createFormatMessage(key, text);
            path.replaceWith(formatMessage);
            isFormattedMessageImportNeed = true;
        },
        Program: {
            exit(path) {

                importIntl(isFormattedMessageImportNeed, isInjectIntlImportNeed, path);

                //wrappingWithInjectIntl
                const exportDefault = path.node.body.find((node) => t.isExportDefaultDeclaration(node));
                if (isInjectIntlImportNeed) {
                    const isWrapped = isWrappedWithInjectIntl(exportDefault.declaration);
                    if (isWrapped) return;
                    exportDefault.declaration = t.callExpression(t.identifier('injectIntl'), [exportDefault.declaration]);
                }
            },
        },
    });

    const {code: result} = generate.default(ast, {
        comments: true,
        jsescOption: {
            minimal: true, // ASCII로 변환하지 않음
        },
        retainLines: true,
    });

    //다국어 메시지 적용 파일 생성
    if (result) {
        fs.writeFile(componentPath, result, 'utf8', () => {
        });
    }
}

export default intlProcessor;
