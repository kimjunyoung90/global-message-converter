import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';
import fs from 'fs';
import {readFile} from 'fs/promises';

//다국어 메시지 관리 파일 정보 추출
const extractLang = async (filePath) => {
    const translations = {};

    const content = await readFile(filePath, 'utf8');

    const ast = parser.parse(content, {
        sourceType: 'module',
        plugins   : ['jsx']
    });

    traverse.default(ast, {

        ExportDefaultDeclaration(path) {
            const declaration = path.node.declaration;
            if (t.isObjectExpression(declaration)) {
                declaration.properties.forEach(property => {
                    if (t.isObjectProperty(property)) {
                        const key = property.key.value;
                        const value = property.value;
                        if (t.isArrayExpression(value)) {
                            const textArray = value.elements.map(element => {
                                if (t.isStringLiteral(element)) {
                                    return element.value; // 문자열 리터럴인 경우
                                } else if (t.isJSXElement(element)) {
                                    // JSX 요소인 경우 처리할 수 있습니다.
                                    return convertJSXToString(element); // JSX 요소를 처리할 방식
                                }
                                return null; // 처리할 수 없는 경우
                            }).filter(Boolean); // null 제거

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
}

// JSX 요소를 문자열로 변환하는 함수
const convertJSXToString = (jsxElement) => {
    const elementType = jsxElement.openingElement.name.name; // JSX 요소의 타입
    const attributes = jsxElement.openingElement.attributes.map(attr => {
        const attrName = attr.name.name;
        const attrValue = attr.value ? attr.value.value : ''; // 속성 값
        return `${attrName}="${attrValue}"`;
    }).join(' ');

    // self-closing 여부 확인
    if (jsxElement.selfClosing) {
        return `<${elementType} ${attributes} />`; // self-closing 형태
    } else {
        return `<${elementType} ${attributes}></${elementType}>`; // 일반 형태
    }
};

const translations = await extractLang('./language/common/ko.js');

const isKorean = (text) => {
    const koreanRegex = /[가-힣]/;
    return koreanRegex.test(text);
};

//다국어 메시지 관리 파일 기반 컴포넌트에 다국어 적용
function adjustLangToComp(componentPath, translations) {

    //file인지 dir인지 구분
    // const status = fs.statSync(componentPath);
    // if(status.isDirectory()) {
    //     const files = fs.readdirSync(componentPath);
    //     files.forEach(file => {
    //        const filePath = pathUtil.join(componentPath, file);
    //         adjustLangToComp(filePath, translations);
    //     });
    //     return;
    // }

    const data = fs.readFileSync(componentPath, 'utf8');

    let hasFormattedMessageImport = false;
    let isFormattedMessageImportNeed = false;
    const ast = parser.parse(data.toString(), {
        sourceType: 'module',
        plugins   : ['jsx']
    });

    traverse.default(ast, {
        ImportDeclaration(path) {
            if (path.node.source.value === 'react-intl') {
                path.node.specifiers.forEach(specifier => {
                    if (specifier.local.name === 'FormattedMessage') {
                        hasFormattedMessageImport = true;
                    } else {
                        path.node.specifiers.push(t.importSpecifier(
                            t.identifier('FormattedMessage'), t.identifier('FormattedMessage')
                        ));
                        hasFormattedMessageImport = true;
                    }
                });
            }
        },
        JSXElement(path) {
            const openingElement = path.node.openingElement;
            const attributes = openingElement.attributes;
            attributes.forEach(attribute => {
                if (t.isJSXAttribute(attribute) && t.isStringLiteral(attribute.value)) {
                    const attributeValueNode = attribute.value;
                    if (isKorean(attributeValueNode.value)) {

                        let key = Object.keys(translations).find(key => translations[key] === attributeValueNode.value);

                        //key가 파일에 없는 경우
                        if (!key) {
                            const newKey = `new.message.${Object.keys(translations).length + 1}`;
                            translations[newKey] = text;
                            key = newKey;
                        }

                        // JSX 표현식으로 변환
                        attribute.value = t.jsxExpressionContainer(
                            t.callExpression(
                                t.memberExpression(
                                    t.memberExpression(
                                        t.memberExpression(
                                            t.thisExpression(),
                                            t.identifier('props')
                                        ),
                                        t.identifier('intl')
                                    ),
                                    t.identifier('formatMessage')
                                ),
                                [
                                    t.objectExpression([
                                        t.objectProperty(
                                            t.identifier('id'),
                                            t.stringLiteral(key)
                                        )
                                    ])
                                ]
                            )
                        );
                    }
                }
            });
        },
        JSXText(path) {
            const text = path.node.value.trim();

            if (!text) return;

            let key = Object.keys(translations).find(key => translations[key] === text);

            //key가 파일에 없는 경우
            if (!key) {
                const newKey = `new.message.${Object.keys(translations).length + 1}`;
                translations[newKey] = text;
                key = newKey;
            }

            const elementName = t.jsxIdentifier("FormattedMessage");

            const attributes = [
                t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(key)),
                t.jsxAttribute(t.jsxIdentifier('defaultMessage'), t.stringLiteral(text)),
            ];

            const openingElement = t.jsxOpeningElement(
                elementName,
                attributes,
                true,
            );

            const formatMessage = t.jsxElement(
                openingElement,
                null,
                []
            )
            path.replaceWith(formatMessage);
            isFormattedMessageImportNeed = true;
        },
        Program: {
            exit(path) {
                if (isFormattedMessageImportNeed && !hasFormattedMessageImport) {
                    const importFormattedMessage = t.importDeclaration(
                        [t.importSpecifier(t.identifier('FormattedMessage'), t.identifier('FormattedMessage'))],
                        t.stringLiteral('react-intl')
                    );
                    path.node.body.unshift(importFormattedMessage);
                }
            }
        }
    });
    const {code: result} = generate.default(ast, {
        comments   : true,
        jsescOption: {
            minimal: true,    // ASCII로 변환하지 않음
        },
        retainLines: true,
    });
    return result;
}

const componentPath = './TestComponent.js';
const result = adjustLangToComp(componentPath, translations);

if (result) {
    fs.writeFile('./TestComponentUpdated.js', result, 'utf8', () => {
    });
}

console.log('end');