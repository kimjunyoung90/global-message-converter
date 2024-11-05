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
    });

    //다국어 메시지 적용 파일 생성
    if (result) {
        fs.writeFile(componentPath, result, 'utf8', () => {
        });
    }
}

export default intlProcessor;