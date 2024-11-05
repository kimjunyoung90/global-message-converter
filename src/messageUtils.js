import traverse from "@babel/traverse";
import parser from "@babel/parser";
import t from '@babel/types';
import fs from "fs";

//다국어 메시지 관리 파일 정보 추출
export const loadExistingMessages = (filePath) => {
    const messages = {};

    const content = fs.readFileSync(filePath, 'utf8');

    const ast = parser.parse(content, {
        sourceType: 'module',
        plugins: ['jsx'],
    });

    traverse.default(ast, {
        ObjectProperty(path) {
            const key = t.isIdentifier(path.node.key) ? path.node.key.name : path.node.key.value;
            const valueNode = path.node.value;
            messages[key] = valueNode.value;
        }
    });

    return messages;
};