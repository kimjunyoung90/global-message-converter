import traverse from "@babel/traverse";
import parser from "@babel/parser";
import fs from "fs";
import t from "@babel/types";

//다국어 메시지 관리 파일 정보 추출
export const loadExistingMessages = (filePath) => {
    const messages = {};

    const content = fs.readFileSync(filePath, 'utf8');

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

                            messages[key] = textArray;
                        } else if (t.isStringLiteral(value)) {
                            // StringLiteral 노드 처리
                            messages[key] = value.value; // 문자열 값 추가
                        } else {
                            messages[key] = value; // 문자열인 경우 직접 할당
                        }
                    }
                });
            }
        },
    });

    return messages;
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