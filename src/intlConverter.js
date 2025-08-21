import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs/promises';
import { existsSync, statSync, readdirSync } from 'fs';
import path from 'path';
import { createNewMessageFile, loadMessages } from './messageUtils.js';
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

// 변환 예외 패턴들을 설정으로 관리
const CONVERSION_EXCEPTIONS = {
    // 특정 속성명들 (React Intl 관련 및 스타일 속성 제외)
    EXCLUDED_PROPERTY_NAMES: ['defaultMessage', 'id', 'fontFamily', 'className', 'style'],
    // JSX 속성 중 변환할 속성들 (화이트리스트)
    INCLUDED_JSX_ATTRIBUTES: ['label', 'placeholder', 'title', 'alt', 'aria-label'],
    // 특정 패턴들
    EXCLUDED_PATTERNS: [
        /^\s*$/, // 공백만
        /^[a-zA-Z0-9_-]+$/, // 영문+숫자+기호만
        /^https?:\/\//, // URL
        /^\/[a-zA-Z0-9/_-]*/, // 경로
        /^\d+(\.\d+)?$/, // 숫자만
        /^#[a-fA-F0-9]{3,6}$/, // 색상코드
        /^[^\w가-힣]+$/, // 특수문자만 (한국어, 영문, 숫자가 아닌 문자들만)
        /^.*(고딕|명조|돋움|바탕|Arial|Times|Helvetica|sans-serif|serif|monospace).*$/i, // 글꼴 이름 패턴
    ]
};

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

function shouldSkipConversion(text, path) {
    // 1. 공백 체크
    if(!text) return true;

    // 2. 한국어 아닌 경우
    if(!isKorean(text)) return true;

    // 3. 예외 패턴 체크
    for (const pattern of CONVERSION_EXCEPTIONS.EXCLUDED_PATTERNS) {
        if (pattern.test(text)) return true;
    }

    // 4. 특정 속성명 체크
    const propertyName = path.parent?.key?.name || path.parent?.name?.name;
    if (propertyName && CONVERSION_EXCEPTIONS.EXCLUDED_PROPERTY_NAMES.includes(propertyName)) {
        return true;
    }

    // 5. JSX 속성 값 체크 - 화이트리스트 방식으로 변경
    if (t.isJSXAttribute(path.container)) {
        const attributeName = path.container.name.name;
        // 화이트리스트에 있는 속성만 변환 허용
        if (!CONVERSION_EXCEPTIONS.INCLUDED_JSX_ATTRIBUTES.includes(attributeName)) {
            return true;
        }
    }

    // 6. console 관련 텍스트 체크
    if (isConsoleCall(path)) {
        return true;
    }

    return false;
}

function convertStringLiteral(isFunctionComponent, path, globalMessages, newMessages) {
    const text = path.node.value.trim();

    if (shouldSkipConversion(text, path)) return false;

    //2. 메시지 탐색 및 생성
    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

    //3. 변환 - JSX 속성인지 확인
    const isJSXAttribute = t.isJSXAttribute(path.container);
    path.replaceWith(intlFormatMessageFunction(isFunctionComponent, messageKey, text, [], isJSXAttribute));
    return true;
}

const QUERY_STRING_REGEX = /\??([^=&]+)=[\s\S]+/;
const isQueryString = (text) => QUERY_STRING_REGEX.test(text);

function convertTemplateLiteral (isFunctionComponent, path, globalMessages, newMessages) {
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

    if (shouldSkipConversion(text, path) || isQueryString(text)) {
        return false;
    }

    const messageKey = getOrCreateMessageKey(text, globalMessages, newMessages);

    path.replaceWith(intlFormatMessageFunction(isFunctionComponent, messageKey, text, params));

    return true;
}

function convertJSXText(path, globalMessages, newMessages) {
    const text = path.node.value.trim();

    //1. 변환 예외 - shouldSkipConversion 함수 사용
    if (shouldSkipConversion(text, path)) return false;

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

async function convert(componentPath, globalMessages, newMessages) {
    try {
        const code = await fs.readFile(componentPath, 'utf8');

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
        console.error(`구문 분석 오류: ${componentPath} - ${error.message}`);
        return; // 구문 분석에 실패한 경우 변환을 중단
    }

    const visitor = {
        ClassDeclaration(path) {
            path.traverse({
                StringLiteral(subPath) {
                    if(convertStringLiteral(false, subPath, globalMessages, newMessages)) {
                        isInjectIntlImportNeed = true;
                    }
                },
                TemplateLiteral(path) {
                    if(convertTemplateLiteral(false, path, globalMessages, newMessages)) {
                        isInjectIntlImportNeed = true;
                    }
                },
                JSXText(path) {
                    if(convertJSXText(path, globalMessages, newMessages)) {
                        isFormattedMessageImportNeed = true;
                    }
                },
            });
        },
        FunctionDeclaration(path) {
            if(!isFunctionComponent(path.node)) return;

            path.traverse({
                StringLiteral(subPath) {
                    if(convertStringLiteral(true, subPath, globalMessages, newMessages)) {
                        isIntlHookNeed = true;
                    }
                },
                TemplateLiteral(path) {
                    if(convertTemplateLiteral(true, path, globalMessages, newMessages)) {
                        isIntlHookNeed = true;
                    }
                },
                JSXText(path) {
                    if(convertJSXText(path, globalMessages, newMessages)) {
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
                    if(convertStringLiteral(true, subPath, globalMessages, newMessages)) {
                        isIntlHookNeed = true;
                    }
                },
                TemplateLiteral(path) {
                    if(convertTemplateLiteral(true, path, globalMessages, newMessages)) {
                        isIntlHookNeed = true;
                    }
                },
                JSXText(path) {
                    if(convertJSXText(path, globalMessages, newMessages)) {
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
                    if(convertStringLiteral(true, subPath, globalMessages, newMessages)) {
                        isIntlHookNeed = true;
                    }
                },
                TemplateLiteral(path) {
                    if(convertTemplateLiteral(true, path, globalMessages, newMessages)) {
                        isIntlHookNeed = true;
                    }
                },
                JSXText(path) {
                    if(convertJSXText(path, globalMessages, newMessages)) {
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
        console.error(`변환 오류: ${componentPath} - ${error.message}`);
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
            console.log(`${componentPath} 변환`);
        }
    } catch (error) {
        console.error(`파일 처리 오류: ${componentPath} - ${error.message}`);
        throw error;
    }
}

// 지원하는 파일 확장자 목록
const SUPPORTED_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

function isValidFile(filePath) {
    const ext = path.extname(filePath);
    return SUPPORTED_EXTENSIONS.includes(ext);
}

function shouldSkipDirectory(dirName) {
    // 숨김 디렉토리 및 특정 디렉토리 제외
    const excludedDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.nyc_output'];
    return dirName.startsWith('.') || excludedDirs.includes(dirName);
}

async function searchPathAndConvert(inputPath, globalMessages, newMessages) {
    try {
        if (!existsSync(inputPath)) {
            console.error(`${inputPath} 파일(폴더)를 찾을 수 없습니다.`);
            return;
        }

        const stats = statSync(inputPath);
        if (stats.isFile()) {
            if (isValidFile(inputPath)) {
                await convert(inputPath, globalMessages, newMessages);
            } else {
                console.log(`지원하지 않는 파일 형식: ${inputPath}`);
            }
        } else if (stats.isDirectory()) {
            const dirName = path.basename(inputPath);
            if (shouldSkipDirectory(dirName)) {
                console.log(`디렉토리 건너뜀: ${inputPath}`);
                return;
            }

            const files = readdirSync(inputPath);
            // 병렬 처리를 위해 Promise.all 사용
            await Promise.all(files.map(async file => {
                const fullPath = path.join(inputPath, file);
                await searchPathAndConvert(fullPath, globalMessages, newMessages);
            }));
        } else {
            console.error(`${inputPath} 파일 및 폴더가 아닙니다.`);
        }
    } catch (error) {
        console.error(`경로 처리 오류: ${inputPath} - ${error.message}`);
        throw error;
    }
}

async function intlConverter(inputPath, messageFilePath) {
    try {
        if (!existsSync(messageFilePath)) {
            console.error(`${messageFilePath} 메시지 파일을 찾을 수 없습니다.`);
            return;
        }
        
        //메시지 파일 로드
        const globalMessages = await loadMessages(messageFilePath);
        const newMessages = {};

        //변환
        await searchPathAndConvert(inputPath, globalMessages, newMessages);

        //변환된 컴포넌트 생성
        if(Object.keys(newMessages).length > 0) {
            const newMessageFile = await createNewMessageFile(newMessages);
            console.log(`변환 완료! 새 메시지: ${Object.keys(newMessages).length}개`);
        } else {
            console.log('변환할 새로운 메시지가 없습니다.');
        }
    } catch (error) {
        console.error(`변환 프로세스 오류: ${error.message}`);
        process.exit(1);
    }
}

export default intlConverter;