import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs/promises';
import { existsSync, statSync, readdirSync } from 'fs';
import path from 'path';
import { createNewMessageFile, loadMessages } from './messageUtils.js';
import logger from './logger.js';
import {
    formattedMessage,
    importFormattedMessage,
    importInjectIntl,
    importIntlHook,
    insertIntlHook,
    intlFormatMessageFunction,
    wrapExportWithInjectIntl,
} from './intlHelpers.js';

const KOREAN_REGEX = /[가-힣]/;
const isKorean = (text) => KOREAN_REGEX.test(text);

// 설정에서 변환 예외 패턴 가져오기
function getConversionExceptions(config) {
    const conversion = config?.conversion || {};
    
    return {
        EXCLUDED_PROPERTY_NAMES: conversion.excludedPropertyNames || ['defaultMessage', 'id', 'fontFamily', 'className', 'style'],
        INCLUDED_JSX_ATTRIBUTES: conversion.includedJSXAttributes || ['label', 'placeholder', 'title', 'alt', 'aria-label'],
        EXCLUDED_PATTERNS: (conversion.excludedPatterns || [
            '^\\s*$',
            '^[a-zA-Z0-9_-]+$',
            '^https?:\\/\\/',
            '^\\/[a-zA-Z0-9/_-]*',
            '^\\d+(\\.\\d+)?$',
            '^#[a-fA-F0-9]{3,6}$',
            '^[^\\w가-힣]+$',
            '^.*(고딕|명조|돋움|바탕|Arial|Times|Helvetica|sans-serif|serif|monospace).*$'
        ]).map(pattern => new RegExp(pattern, 'i'))
    };
}

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

function isConsoleCall(path) {
    // CallExpression인지 확인하고 console 메소드 호출인지 체크
    let currentPath = path;
    
    // 부모 경로를 따라 올라가면서 CallExpression 찾기
    while (currentPath) {
        if (t.isCallExpression(currentPath.parent)) {
            const callee = currentPath.parent.callee;
            
            // console.log, console.error, console.warn 등 체크
            if (t.isMemberExpression(callee) && 
                t.isIdentifier(callee.object, { name: 'console' })) {
                return true;
            }
        }
        currentPath = currentPath.parentPath;
    }
    
    return false;
}

function shouldSkipConversion(text, path, exceptions) {
    // 1. 공백 체크
    if(!text) return true;

    // 2. 한국어 아닌 경우
    if(!isKorean(text)) return true;

    // 3. 예외 패턴 체크
    for (const pattern of exceptions.EXCLUDED_PATTERNS) {
        if (pattern.test(text)) return true;
    }

    // 4. 특정 속성명 체크
    const propertyName = path.parent?.key?.name || path.parent?.name?.name;
    if (propertyName && exceptions.EXCLUDED_PROPERTY_NAMES.includes(propertyName)) {
        return true;
    }

    // 5. JSX 속성 값 체크 - 화이트리스트 방식으로 변경
    if (t.isJSXAttribute(path.container)) {
        const attributeName = path.container.name.name;
        // 화이트리스트에 있는 속성만 변환 허용
        if (!exceptions.INCLUDED_JSX_ATTRIBUTES.includes(attributeName)) {
            return true;
        }
    }

    // 6. console 관련 텍스트 체크
    if (isConsoleCall(path)) {
        return true;
    }

    return false;
}

function convertStringLiteral(isFunctionComponent, path, globalMessages, newMessages, exceptions) {
    const text = path.node.value.trim();

    if (shouldSkipConversion(text, path, exceptions)) return false;

    //2. 메시지 탐색 및 생성
    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

    //3. 변환 - JSX 속성인지 확인
    const isJSXAttribute = t.isJSXAttribute(path.container);
    path.replaceWith(intlFormatMessageFunction(isFunctionComponent, messageKey, text, [], isJSXAttribute));
    return true;
}

const QUERY_STRING_REGEX = /\??([^=&]+)=[\s\S]+/;
const isQueryString = (text) => QUERY_STRING_REGEX.test(text);

function convertTemplateLiteral (isFunctionComponent, path, globalMessages, newMessages, exceptions) {
    const params = {};
    const quasis = path.node.quasis;
    const expressions = path.node.expressions;
    const usedParamKeys = new Set();

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
                } else if (t.isMemberExpression(expression.callee)) {
                    paramKey = expression.callee.property.name;
                }
            }

            if(paramKey && paramKey.trim() !== '') {
                // 중복 변수명 처리
                let uniqueParamKey = paramKey;
                let counter = 1;
                while (usedParamKeys.has(uniqueParamKey)) {
                    uniqueParamKey = `${paramKey}${counter}`;
                    counter++;
                }
                usedParamKeys.add(uniqueParamKey);
                
                text += `{${uniqueParamKey}}`;
                params[uniqueParamKey] = expression;
            } else {
                // 변수명을 추출할 수 없는 경우 param{index} 사용
                let counter = 1;
                let fallbackKey = `param${index}`;
                while (usedParamKeys.has(fallbackKey)) {
                    fallbackKey = `param${index}_${counter}`;
                    counter++;
                }
                usedParamKeys.add(fallbackKey);
                
                text += `{${fallbackKey}}`;
                params[fallbackKey] = expression;
            }
        });

        //마지막 quasis 처리
        text += quasis[quasis.length - 1].value.cooked;
    }

    if (shouldSkipConversion(text, path, exceptions) || isQueryString(text)) {
        return false;
    }

    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

    path.replaceWith(intlFormatMessageFunction(isFunctionComponent, messageKey, text, params));

    return true;
}

function convertJSXText(path, globalMessages, newMessages, exceptions) {
    const text = path.node.value.trim();

    //1. 변환 예외 - shouldSkipConversion 함수 사용
    if (shouldSkipConversion(text, path, exceptions)) return false;

    //2. 메시지 탐색 및 변환
    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

    //3. 변환
    path.replaceWith(formattedMessage(messageKey, text));
    return true;
}

function isFunctionComponent (node) {

    switch (node.type) {
        case 'FunctionDeclaration': {
            if (!t.isIdentifier(node.id) || !/^[A-Z]/.test(node.id.name)) {
                return false;
            }

            const returnStatement = node.body.body.find(node => t.isReturnStatement(node));
            return returnStatement !== undefined;
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

async function convert(componentPath, globalMessages, newMessages, config) {
    try {
        const code = await fs.readFile(componentPath, 'utf8');
        const exceptions = getConversionExceptions(config);

        let isFormattedMessageImportNeed = false;
        let isInjectIntlImportNeed = false;
        let isIntlHookNeed = false;

        //code ast 변환
        let ast;
        try {
            // code ast 변환
            ast = parser.parse(code, {
                sourceType: 'module',
                plugins: ['jsx'],
            });
        } catch (error) {
            logger.error(`구문 분석 오류: ${componentPath} - ${error.message}`);
            return; // 구문 분석에 실패한 경우 변환을 중단
        }

        const visitor = {
            ClassDeclaration(path) {
                path.traverse({
                    StringLiteral(subPath) {
                        if(convertStringLiteral(false, subPath, globalMessages, newMessages, exceptions)) {
                            isInjectIntlImportNeed = true;
                        }
                    },
                    TemplateLiteral(path) {
                        if(convertTemplateLiteral(false, path, globalMessages, newMessages, exceptions)) {
                            isInjectIntlImportNeed = true;
                        }
                    },
                    JSXText(path) {
                        if(convertJSXText(path, globalMessages, newMessages, exceptions)) {
                            isFormattedMessageImportNeed = true;
                        }
                    },
                });
            },
            FunctionDeclaration(path) {
                if(!isFunctionComponent(path.node)) return;

                path.traverse({
                    StringLiteral(subPath) {
                        if(convertStringLiteral(true, subPath, globalMessages, newMessages, exceptions)) {
                            isIntlHookNeed = true;
                        }
                    },
                    TemplateLiteral(path) {
                        if(convertTemplateLiteral(true, path, globalMessages, newMessages, exceptions)) {
                            isIntlHookNeed = true;
                        }
                    },
                    JSXText(path) {
                        if(convertJSXText(path, globalMessages, newMessages, exceptions)) {
                            isFormattedMessageImportNeed = true;
                        }
                    }
                });

                if(isIntlHookNeed) {
                    insertIntlHook(path.node);
                }
            },
            VariableDeclarator(path) {
                if(!isFunctionComponent(path.node)) return;

                path.traverse({
                    StringLiteral(subPath) {
                        if(convertStringLiteral(true, subPath, globalMessages, newMessages, exceptions)) {
                            isIntlHookNeed = true;
                        }
                    },
                    TemplateLiteral(path) {
                        if(convertTemplateLiteral(true, path, globalMessages, newMessages, exceptions)) {
                            isIntlHookNeed = true;
                        }
                    },
                    JSXText(path) {
                        if(convertJSXText(path, globalMessages, newMessages, exceptions)) {
                            isFormattedMessageImportNeed = true;
                        }
                    }
                });

                if(isIntlHookNeed) {
                    insertIntlHook(path.node.init);
                }
            },
            ExportDefaultDeclaration(path) {
                if(!isFunctionComponent(path.node)) return;

                path.traverse({
                    StringLiteral(subPath) {
                        if(convertStringLiteral(true, subPath, globalMessages, newMessages, exceptions)) {
                            isIntlHookNeed = true;
                        }
                    },
                    TemplateLiteral(path) {
                        if(convertTemplateLiteral(true, path, globalMessages, newMessages, exceptions)) {
                            isIntlHookNeed = true;
                        }
                    },
                    JSXText(path) {
                        if(convertJSXText(path, globalMessages, newMessages, exceptions)) {
                            isFormattedMessageImportNeed = true;
                        }
                    }
                });

                if(isIntlHookNeed) {
                    insertIntlHook(path.node.declaration);
                }
            },
            Program: {
                exit(path) {

                    if(isFormattedMessageImportNeed) {
                        importFormattedMessage(path);
                    }

                    if(isIntlHookNeed) {
                        importIntlHook(path.node);
                    }

                    if(isInjectIntlImportNeed) {
                        importInjectIntl(path);
                        wrapExportWithInjectIntl(path);
                    }
                },
            },
        };

        try {
            traverse.default(ast, visitor);
        } catch (error) {
            logger.error(`변환 오류: ${componentPath} - ${error.message}`);
            return; // 변환 도중 에러 발생한 경우 변환 중단
        }

        const {code: result} = generate.default(ast, {
            comments: true,
            compact: false,      // 읽기 좋은 형태로 출력
            retainLines: true,   // 기존 라인 번호 최대한 유지
            concise: false,      // 간결하게 하지 않음
            minified: false,     // 최소화하지 않음
            jsescOption: {
                minimal: true,   // ASCII로 변환하지 않음
            },
        });

        //다국어 메시지 적용 파일 생성
        if (result) {
            await fs.writeFile(componentPath, result, 'utf8');
            logger.success(`${componentPath} 변환`);
        }
    } catch (error) {
        logger.error(`파일 처리 오류: ${componentPath} - ${error.message}`);
        throw error;
    }
}

function isValidFile(filePath, config) {
    const ext = path.extname(filePath);
    const supportedExtensions = config?.files?.supportedExtensions || ['.js', '.jsx', '.ts', '.tsx'];
    return supportedExtensions.includes(ext);
}

function shouldSkipDirectory(dirName, config) {
    // 숨김 디렉토리 및 특정 디렉토리 제외
    const excludedDirs = config?.files?.excludedDirectories || ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.nyc_output'];
    return dirName.startsWith('.') || excludedDirs.includes(dirName);
}

async function searchPathAndConvert(inputPath, globalMessages, newMessages, config, stats = { processed: 0, total: 0 }) {
    try {
        if (!existsSync(inputPath)) {
            logger.error(`${inputPath} 파일(폴더)를 찾을 수 없습니다.`);
            return;
        }

        const fileStats = statSync(inputPath);
        if (fileStats.isFile()) {
            if (isValidFile(inputPath, config)) {
                if (config?.logging?.progress) {
                    stats.processed++;
                    logger.progress(stats.processed, stats.total, path.basename(inputPath));
                }
                await convert(inputPath, globalMessages, newMessages, config);
            } else {
                logger.debug(`지원하지 않는 파일 형식: ${inputPath}`);
            }
        } else if (fileStats.isDirectory()) {
            const dirName = path.basename(inputPath);
            if (shouldSkipDirectory(dirName, config)) {
                logger.debug(`디렉토리 건너뜀: ${inputPath}`);
                return;
            }

            const files = readdirSync(inputPath);
            // 병렬 처리를 위해 Promise.all 사용
            await Promise.all(files.map(async file => {
                const fullPath = path.join(inputPath, file);
                await searchPathAndConvert(fullPath, globalMessages, newMessages, config, stats);
            }));
        } else {
            logger.error(`${inputPath} 파일 및 폴더가 아닙니다.`);
        }
    } catch (error) {
        logger.error(`경로 처리 오류: ${inputPath} - ${error.message}`);
        throw error;
    }
}

// 파일 개수 카운트 함수
function countFiles(inputPath, config) {
    let count = 0;
    
    function countRecursive(currentPath) {
        if (!existsSync(currentPath)) return;
        
        const stats = statSync(currentPath);
        if (stats.isFile()) {
            if (isValidFile(currentPath, config)) {
                count++;
            }
        } else if (stats.isDirectory()) {
            const dirName = path.basename(currentPath);
            if (!shouldSkipDirectory(dirName, config)) {
                const files = readdirSync(currentPath);
                files.forEach(file => {
                    countRecursive(path.join(currentPath, file));
                });
            }
        }
    }
    
    countRecursive(inputPath);
    return count;
}

async function intlConverter(inputPath, messageFilePath, config = {}) {
    try {
        if (!existsSync(messageFilePath)) {
            logger.error(`${messageFilePath} 메시지 파일을 찾을 수 없습니다.`);
            return;
        }
        
        logger.info('변환 시작...');
        
        //메시지 파일 로드
        const globalMessages = await loadMessages(messageFilePath);
        const newMessages = {};
        
        // 파일 개수 카운트 (진행률 표시용)
        const totalFiles = config?.logging?.progress ? countFiles(inputPath, config) : 0;
        const stats = { processed: 0, total: totalFiles };
        
        if (totalFiles > 0) {
            logger.info(`처리할 파일: ${totalFiles}개`);
        }

        //변환
        await searchPathAndConvert(inputPath, globalMessages, newMessages, config, stats);

        //변환된 컴포넌트 생성
        if(Object.keys(newMessages).length > 0) {
            const newMessageFile = await createNewMessageFile(newMessages, config);
            logger.success(`변환 완료! 새 메시지: ${Object.keys(newMessages).length}개`);
            
            if (config?.output?.showStatistics) {
                logger.info(`새 메시지 파일: ${newMessageFile}`);
                logger.info(`처리된 파일: ${stats.processed}개`);
            }
        } else {
            logger.info('변환할 새로운 메시지가 없습니다.');
        }
    } catch (error) {
        logger.error(`변환 프로세스 오류: ${error.message}`);
        process.exit(1);
    }
}

export default intlConverter;