import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import fs from 'fs';
import {loadExistingMessages} from './messageUtils.js';
import {
    createFormatMessage,
    importFormattedMessage,
    importInjectIntl,
    wrapExportWithInjectIntl
} from './intlHelpers.js';
import path from "path";

const isKorean = (text) => {
    const koreanRegex = /[가-힣]/;
    return koreanRegex.test(text);
};

function convert(componentPath, globalMessages) {
    const code = fs.readFileSync(componentPath, 'utf8');

    let isFormattedMessageImportNeed = false;
    let isInjectIntlImportNeed = false;

    //code ast 변환
    const ast = parser.parse(code, {
        sourceType: 'module', plugins: ['jsx'],
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
        fs.writeFile(componentPath, result, 'utf8', () => {
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
    //메시지 추출
    const globalMessages = loadExistingMessages(messageFilePath);

    //경로 탐색 및 변환
    pathSearchAndConvert(inputPath, globalMessages);
}

export default intlConverter;

intlConverter('/Users/snvlqkq/WebstormProjects/global-message-converter/components/SampleComponent.js', '/Users/snvlqkq/WebstormProjects/global-message-converter/messages/ko.js');