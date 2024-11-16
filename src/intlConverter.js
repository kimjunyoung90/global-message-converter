import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { createNewMessageFile, loadMessages } from './messageUtils.js';
import {
    formattedMessage,
    importFormattedMessage, importInjectIntl,
    importUseIntl,
    intlFormatMessageFunction, wrapExportWithInjectIntl,
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

function handleStringLiteral(isFunctionComponent, path, globalMessages, newMessages) {
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
    path.replaceWith(intlFormatMessageFunction(isFunctionComponent, messageKey, text));
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

function createTemplateText (expressions, quasis, params) {
    let text = '';
    if (expressions.length === 0) {
        text = quasis.reduce((acc, cur) => acc + cur.value.cooked, '');
    } else {

        expressions.forEach((expression, index) => {
            text += quasis[index].value.cooked;
            let paramKey = '';

            if (t.isIdentifier(expression)) {
                paramKey = expression.name;
            } else if (t.isMemberExpression(expression)) {
                paramKey = expression.property.name
            } else if (t.isCallExpression(expression)) {
                if (t.isIdentifier(expression.callee)) {
                    paramKey = expression.callee.name;
                } else {
                    paramKey = expression.callee.property.name;
                }
            }

            if(!_.isEmpty(paramKey)) {
                text += `{${paramKey}}`;
                params[paramKey] = expression;
            }
        });

        //마지막 quasis 처리
        text += quasis[quasis.length - 1].value.cooked;
    }
    return text;
}

function isFunctionComponent (node) {

    switch (node.type) {
        case 'FunctionDeclaration': {
            if (!t.isIdentifier(node.id) || !/^[A-Z]/.test(node.id.name)) {
                return false;
            }

            const returnStatement = node.body.body.find(node => t.isReturnStatement(node));
            return !_.isEmpty(returnStatement);
        }
        case 'VariableDeclarator' : {
            const init = node.init;

            if(!(t.isFunctionExpression(init) || t.isArrowFunctionExpression(init))) return false;

            if(!t.isIdentifier(node.id) || !/^[A-Z]/.test(node.id.name)) return false;

            const body = init.body;

            if(t.isBlockStatement(body)) {
                const returnStatement = body.body.find(chideNode => t.isReturnStatement(chideNode) && t.isJSXElement(chideNode.argument));
                if(!returnStatement) return false;
            }else if(!t.isJSXElement(body)) {
                return false;
            }

            return true;
        }
        case 'ExportDefaultDeclaration': {
            const declaration = node.declaration;
            if(!(t.isFunctionDeclaration(declaration) || t.isArrowFunctionExpression(declaration))) return false;

            const body = declaration.body;
            if(t.isBlockStatement(body)) {
                const returnStatement = body.body.find(node => t.isReturnStatement(node) || t.isJSXElement(node));
                if(!returnStatement) {
                    return false;
                }
            } else if(!t.isJSXElement(body)) {
                return false;
            }
            return true;
        }
        default:
            return false;
    }

}

function declareUseIntlInit (node) {
    const blockStatement = node.body;
    const variableDeclarations = blockStatement.body.filter(
        node => t.isVariableDeclaration(node));
    const variableDeclarators = variableDeclarations.filter(
        variableDeclaration => variableDeclaration.declarations);
    const intlInitialize = variableDeclarators.find(
        variableDeclarator => t.isIdentifier(variableDeclarator.id) &&
            (variableDeclarator.id.name === 'intl'));

    if (_.isEmpty(intlInitialize)) {
        const variableDeclarator = t.variableDeclarator(t.identifier('intl'),
            t.callExpression(t.identifier('useIntl'), []));
        const useIntlInitialization = t.variableDeclaration(
            'const',
            [variableDeclarator],
        );
        blockStatement.body.unshift(useIntlInitialization);
    }
}

function convertFile(componentPath, globalMessages, newMessages) {
    const code = fs.readFileSync(componentPath, 'utf8');

    let isFormattedMessageImportNeed = false;
    let isInjectIntlImportNeed = false;
    let isUseIntl = false;

    //code ast 변환
    const ast = parser.parse(code, {
        sourceType: 'module', plugins: ['jsx'],
    });

    traverse.default(ast, {
        ClassDeclaration(path) {
            path.traverse({
                StringLiteral(subPath) {
                    if(t.isJSXAttribute(subPath.parent)) return;
                    if(handleStringLiteral(false, subPath, globalMessages, newMessages)) {
                        isInjectIntlImportNeed = false;
                    }
                },
                TemplateLiteral(path) {
                    const params = {};
                    const quasis = path.node.quasis;
                    const expressions = path.node.expressions;

                    const text = createTemplateText(expressions, quasis, params);

                    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

                    path.replaceWith(intlFormatMessageFunction(false, messageKey, text, params));
                    isInjectIntlImportNeed = true;
                },
                JSXText(path) {
                    if(handleJSXText(path, globalMessages, newMessages)) {
                        isFormattedMessageImportNeed = true;
                    }
                },
            });
        },
        FunctionDeclaration(path) {
            if(!isFunctionComponent(path.node)) return;

            path.traverse({
                StringLiteral(subPath) {
                    if(t.isJSXAttribute(subPath.parent)) return;
                    if(handleStringLiteral(true, subPath, globalMessages, newMessages)) {
                        isUseIntl = true;
                    }
                },
                TemplateLiteral(path) {
                    const params = {};
                    const quasis = path.node.quasis;
                    const expressions = path.node.expressions;

                    const text = createTemplateText(expressions, quasis, params);

                    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

                    path.replaceWith(intlFormatMessageFunction(true, messageKey, text, params));
                    isUseIntl = true;
                },
                JSXText(path) {
                    if(handleJSXText(path, globalMessages, newMessages)) {
                        isFormattedMessageImportNeed = true;
                    }
                }
            });

            if(isUseIntl) {
                declareUseIntlInit(path.node);
            }
        },
        VariableDeclarator(path) {
            if(!isFunctionComponent(path.node)) return;

            path.traverse({
                StringLiteral(subPath) {
                    if(t.isJSXAttribute(subPath.parent)) return;
                    if(handleStringLiteral(true, subPath, globalMessages, newMessages)) {
                        isUseIntl = true;
                    }
                },
                TemplateLiteral(path) {
                    const params = {};
                    const quasis = path.node.quasis;
                    const expressions = path.node.expressions;

                    const text = createTemplateText(expressions, quasis, params);

                    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

                    path.replaceWith(intlFormatMessageFunction(true, messageKey, text, params));
                    isUseIntl = true;
                },
                JSXText(path) {
                    if(handleJSXText(path, globalMessages, newMessages)) {
                        isFormattedMessageImportNeed = true;
                    }
                }
            });

            if(isUseIntl) {
                declareUseIntlInit(path.node.init);
            }
        },
        ExportDefaultDeclaration(path) {
            if(!isFunctionComponent(path.node)) return;

            path.traverse({
                StringLiteral(subPath) {
                    if(t.isJSXAttribute(subPath.parent)) return;
                    if(handleStringLiteral(true, subPath, globalMessages, newMessages)) {
                        isUseIntl = true;
                    }
                },
                TemplateLiteral(path) {
                    const params = {};
                    const quasis = path.node.quasis;
                    const expressions = path.node.expressions;

                    const text = createTemplateText(expressions, quasis, params);

                    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

                    path.replaceWith(intlFormatMessageFunction(true, messageKey, text, params));
                    isUseIntl = true;
                },
                JSXText(path) {
                    if(handleJSXText(path, globalMessages, newMessages)) {
                        isFormattedMessageImportNeed = true;
                    }
                }
            });

            if(isUseIntl) {
                declareUseIntlInit(path.node.declaration);
            }
        },
        Program: {
            exit(path) {

                if(isFormattedMessageImportNeed) {
                    importFormattedMessage(path);
                }

                if(isUseIntl) {
                    importUseIntl(path.node);
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

function converting(inputPath, globalMessages, newMessages) {

    if (!fs.existsSync(inputPath)) {
        console.error(`${inputPath} 파일(폴더)를 찾을 수 없습니다.`);
        return;
    }

    const stats = fs.statSync(inputPath);
    if (stats.isFile()) {
        console.log(`${inputPath} 변환`);
        convertFile(inputPath, globalMessages, newMessages);
    } else if (stats.isDirectory()) {
        const files = fs.readdirSync(inputPath);
        files.forEach(file => {
            const fullPath = path.join(inputPath, file)
            converting(fullPath, globalMessages, newMessages);
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
    //메시지 파일 로드
    const globalMessages = loadMessages(messageFilePath);
    const newMessages = {};

    //변환
    converting(inputPath, globalMessages, newMessages);

    //변환된 컴포넌트 생성
    if(!_.isEmpty(newMessages)) {
        createNewMessageFile(newMessages);
    }
}

export default intlConverter;