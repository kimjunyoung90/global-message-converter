import traverse from '@babel/traverse';
import parser from '@babel/parser';
import t from '@babel/types';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

//다국어 메시지 관리 파일 정보 추출
export const loadMessages = async (filePath) => {
    try {
        const messages = {};

        const content = await fs.readFile(filePath, 'utf8');

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
    } catch (error) {
        throw new Error(`메시지 파일 로드 실패: ${filePath} - ${error.message}`);
    }
};

export async function createNewMessageFile (newMessages) {
    try {
        let newMessageFileName = 'newMessages.json';
        let counter = 1;
        while (existsSync(newMessageFileName)) {
            const parsed = path.parse(newMessageFileName);
            newMessageFileName = path.join(parsed.dir,
                `${parsed.name}_${counter}${parsed.ext}`);
            counter++;
        }
        
        await fs.writeFile(newMessageFileName, JSON.stringify(newMessages, null, 2), 'utf-8');
        console.log(`새 메시지 파일 생성: ${newMessageFileName}`);
        return newMessageFileName;
    } catch (error) {
        console.error(`메시지 파일 생성 실패: ${error.message}`);
        throw error;
    }
}