import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs';
import { readFile } from 'fs/promises';

//다국어 메시지 관리 파일 정보 추출
const readLanguage = async (filePath) => {
    const translations = {};

    const content = await readFile(filePath, 'utf8');

    const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx'],
    });

    traverse.default(ast, {
        ExportDefaultDeclaration(path) {
            const declaration = path.node.declaration;
            if (t.isObjectExpression(declaration)) {
                declaration.properties.forEach((property) => {
                    if (t.isObjectProperty(property)) {
                        const key = property.key.value;
                        const value = property.value;
                        if (t.isArrayExpression(value)) {
                            const textArray = value.elements
                                .map((element) => {
                                    if (t.isStringLiteral(element)) {
                                        return element.value; // 문자열 리터럴인 경우
                                    } else if (t.isJSXElement(element)) {
                                        // JSX 요소인 경우 처리할 수 있습니다.
                                        return convertJSXToString(element); // JSX 요소를 처리할 방식
                                    }
                                    return null; // 처리할 수 없는 경우
                                })
                                .filter(Boolean); // null 제거

                            translations[key] = textArray;
                        } else if (t.isStringLiteral(value)) {
                            // StringLiteral 노드 처리
                            translations[key] = value.value; // 문자열 값 추가
                        } else {
                            translations[key] = value; // 문자열인 경우 직접 할당
                        }
                    }
                });
            }
        },
    });

    return translations;
};

// JSX 요소를 문자열로 변환하는 함수
const convertJSXToString = (jsxElement) => {
    const elementType = jsxElement.openingElement.name.name; // JSX 요소의 타입
    const attributes = jsxElement.openingElement.attributes
        .map((attr) => {
            const attrName = attr.name.name;
            const attrValue = attr.value ? attr.value.value : ''; // 속성 값
            return `${attrName}="${attrValue}"`;
        })
        .join(' ');

    // self-closing 여부 확인
    if (jsxElement.selfClosing) {
        return `<${elementType} ${attributes} />`; // self-closing 형태
    } else {
        return `<${elementType} ${attributes}></${elementType}>`; // 일반 형태
    }
};

const translations = await readLanguage('./language/ko.js');

const isKorean = (text) => {
    const koreanRegex = /[가-힣]/;
    return koreanRegex.test(text);
};

function callIntlFormatMessageExpression(messageKey, text) {
    // JSX 표현식으로 변환
    const intlFormatMessage = t.memberExpression(
        t.memberExpression(t.memberExpression(t.thisExpression(), t.identifier('props')), t.identifier('intl')),
        t.identifier('formatMessage')
    );

    return t.callExpression(intlFormatMessage, [
        t.objectExpression([
            t.objectProperty(t.identifier('id'), t.stringLiteral(messageKey)),
            t.objectProperty(t.identifier('defaultMessage'), t.stringLiteral(text)),
        ]),
    ]);
}

function createFormatMessage(key, text) {

    const elementName = t.jsxIdentifier('FormattedMessage');

    const attributes = [
        t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(key)),
        t.jsxAttribute(t.jsxIdentifier('defaultMessage'), t.stringLiteral(text)),
    ];

    const openingElement = t.jsxOpeningElement(elementName, attributes, true);

    return t.jsxElement(openingElement, null, []);
}

//다국어 메시지 관리 파일 컴포넌트 적용
function convertTextToGlobal(componentPath, translations) {
    const data = fs.readFileSync(componentPath, 'utf8');

    let isFormattedMessageImportNeed = false;
    let isInjectIntlImportNeed = false;

    //code ast 변환
    const ast = parser.parse(data.toString(), {
        sourceType: 'module',
        plugins: ['jsx'],
    });

    traverse.default(ast, {
        JSXElement(path) {
            //JSX 속성 값으로 텍스트 하드코딩 되어 있는 경우 다국어 파일 자동 적용 추가
            const openingElement = path.node.openingElement;
            const elementName = openingElement.name.name;
            if (elementName === 'FormattedMessage') return;
            const attributes = openingElement.attributes;
            attributes.forEach((attribute) => {

                const attributeName = attribute.name.name;

                //defaultMessage 에 있는 한국어는 변경 제외
                if(attributeName === 'defaultMessage') return;

                if(!t.isStringLiteral(attribute?.value)) return;

                const attributeValue = attribute.value;
                if(!isKorean(attributeValue.value)) return;

                let key = Object.keys(translations).find((key) => translations[key] === attributeValue.value);

                //key가 파일에 없는 경우
                if (!key) {
                    const newKey = `new.message.${Object.keys(translations).length + 1}`;
                    translations[newKey] = attributeValue.value;
                    key = newKey;
                }

                attribute.value = t.jsxExpressionContainer(callIntlFormatMessageExpression(key, attributeValue.value));
                isInjectIntlImportNeed = true;

            });
        },
        JSXText(path) {
            const text = path.node.value.trim();

            if (!text) return;
            if(!isKorean(text)) return;
            let key = Object.keys(translations).find((key) => translations[key] === text);

            //key가 파일에 없는 경우
            if (!key) {
                const newKey = `new.message.${Object.keys(translations).length + 1}`;
                translations[newKey] = text;
                key = newKey;
            }

            const formatMessage = createFormatMessage(key, text);
            path.replaceWith(formatMessage);
            isFormattedMessageImportNeed = true;
        },
        ArrowFunctionExpression(path) {
            //화살표 함수에 내부에 하드코딩 된 한글 문자를 재귀적으로 탐색 하여 다국어 키 적용
            path.traverse({
               StringLiteral(subPath) {
                   const text = subPath.node.value;
                   if(!isKorean(text)) return;

                   //defaultMessage 에 있는 한국어는 변경 제외
                   if(subPath.parent?.key?.name === 'defaultMessage') return;
                   if(subPath.parent?.name?.name === 'defaultMessage') return;

                   let key = Object.keys(translations).find((key) => translations[key] === text);

                   //key가 파일에 없는 경우
                   if (!key) {
                       const newKey = `new.message.${Object.keys(translations).length + 1}`;
                       translations[newKey] = text;
                       key = newKey;
                   }
                   subPath.replaceWith(callIntlFormatMessageExpression(key, text));
                   isInjectIntlImportNeed = true;
               }
            });
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
    const { code: result } = generate.default(ast, {
        comments: true,
        jsescOption: {
            minimal: true, // ASCII로 변환하지 않음
        },
        retainLines: true,
    });
    return result;
}

function importIntl(isFormattedMessageImportNeed, isInjectIntlImportNeed, path) {
    if (!(isFormattedMessageImportNeed || isInjectIntlImportNeed)) return;

    //import 추가
    const importDeclarations = path.node.body.filter((node) => t.isImportDeclaration(node));
    const reactIntlImport = importDeclarations.find((importDeclaration) => importDeclaration.source.value === 'react-intl');

    const importFormattedMessageSpecifier = t.importSpecifier(t.identifier('FormattedMessage'), t.identifier('FormattedMessage'));
    const importInjectIntlSpecifier = t.importSpecifier(t.identifier('injectIntl'), t.identifier('injectIntl'));
    const newSpecifiers = [];

    //import 없으면 추가
    let hasFormattedMessageImport = false;
    let hasInjectIntlImport = false;

    if (reactIntlImport) {
        const specifiers = reactIntlImport.specifiers;
        specifiers.forEach((specifier) => {
            const moduleName = specifier.imported.name;
            if (moduleName === 'formattedMessage') hasFormattedMessageImport = true;
            if (moduleName === 'injectIntl') hasInjectIntlImport = true;
        });
    }

    if (isFormattedMessageImportNeed && !hasFormattedMessageImport) newSpecifiers.push(importFormattedMessageSpecifier);
    if (importInjectIntlSpecifier && !hasInjectIntlImport) newSpecifiers.push(importInjectIntlSpecifier);
    if (!newSpecifiers) return;

    if (reactIntlImport) {
        //추가
        reactIntlImport.specifiers = [...reactIntlImport.specifiers, ...newSpecifiers];
    } else {
        //신규
        const source = t.stringLiteral('react-intl');
        const importFormattedMessage = t.importDeclaration([...newSpecifiers], source);
        //import 아래에 넣기
        path.node.body.unshift(importFormattedMessage);
    }
}

function isWrappedWithInjectIntl(node) {
    if (t.isCallExpression(node) && t.isIdentifier(node.callee, { name: 'injectIntl' })) {
        return true;
    }

    //재귀 탐색
    if (t.isCallExpression(node)) {
        for (const arg of node.arguments) {
            if (isWrappedWithInjectIntl(arg)) {
                return true;
            }
        }
    }
    return false;
}

const componentPath = '/Users/junyoungkim/Projects/ui/invoice/src/components/Pages/ItemMng/ItemMngContainer.js';
const result = convertTextToGlobal(componentPath, translations);

if (result) {
    // const outputPath = './component/TestComponentUpdated.js';
    const outputPath = componentPath;
    fs.writeFile(outputPath, result, 'utf8', () => {});
}

console.log('end');
