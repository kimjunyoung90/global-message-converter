import t from '@babel/types';
import _ from 'lodash';

export function intlFormatMessageFunction (messageKey, text, params = []) {
    // JSX 표현식으로 변환
    const intlFormatMessage = t.memberExpression(
        t.memberExpression(
            t.memberExpression(t.thisExpression(), t.identifier('props')),
            t.identifier('intl')),
        t.identifier('formatMessage'),
    );

    const argumentsArray = [
        t.objectExpression([
            t.objectProperty(t.identifier('id'), t.stringLiteral(messageKey)),
            t.objectProperty(t.identifier('defaultMessage'), t.stringLiteral(text)),
        ]),
    ];

    if (!_.isEmpty(params)) {
        const objectProperties = Object.entries(params).map(([key, value]) => t.objectProperty(t.identifier(key), value));
        const argument = t.objectExpression(objectProperties);
        argumentsArray.push(argument);
    }

    return t.callExpression(intlFormatMessage, argumentsArray);
}

export function formattedMessage(key, text) {

    const elementName = t.jsxIdentifier('FormattedMessage');

    const attributes = [
        t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(key)),
        t.jsxAttribute(t.jsxIdentifier('defaultMessage'), t.stringLiteral(text)),
    ];

    const openingElement = t.jsxOpeningElement(elementName, attributes, true);

    return t.jsxElement(openingElement, null, []);
}

export function importFormattedMessage(path) {
    const importDeclarations = path.node.body.filter((node) => t.isImportDeclaration(node));
    const reactIntlImport = importDeclarations.find((importDeclaration) => importDeclaration.source.value === 'react-intl');
    const hasFormattedMessageImport = reactIntlImport?.specifiers.find(specifier => specifier.imported.name === 'FormattedMessage');
    if(hasFormattedMessageImport) return;

    const importFormattedMessageSpecifier = t.importSpecifier(t.identifier('FormattedMessage'), t.identifier('FormattedMessage'));
    if (reactIntlImport) {
        reactIntlImport.specifiers = [...reactIntlImport.specifiers, importFormattedMessageSpecifier];
    } else {
        const source = t.stringLiteral('react-intl');
        const newImportDeclaration = t.importDeclaration([importFormattedMessageSpecifier], source);
        path.node.body = [
            ...importDeclarations,
            newImportDeclaration,
            ...path.node.body.filter(node => !t.isImportDeclaration(node)),
        ];
    }
}

export function importInjectIntl(path) {
    //import 추가
    const importDeclarations = path.node.body.filter((node) => t.isImportDeclaration(node));
    const reactIntlImport = importDeclarations.find((importDeclaration) => importDeclaration.source.value === 'react-intl');

    const hasInjectIntlImport = reactIntlImport?.specifiers.find(specifier => specifier.imported.name === 'injectIntl');
    if(hasInjectIntlImport) return;

    const importInjectIntlSpecifier = t.importSpecifier(t.identifier('injectIntl'), t.identifier('injectIntl'));
    if (reactIntlImport) {
        reactIntlImport.specifiers = [...reactIntlImport.specifiers, importInjectIntlSpecifier];
    } else {
        const source = t.stringLiteral('react-intl');
        const newImportDeclaration = t.importDeclaration([importInjectIntlSpecifier], source);
        path.node.body = [
            ...importDeclarations,
            newImportDeclaration,
            ...path.node.body.filter(node => !t.isImportDeclaration(node)),
        ];
    }
}

function isWrappedWithInjectIntl (node) {
    if (t.isCallExpression(node) &&
        t.isIdentifier(node.callee, { name: 'injectIntl' })) {
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

export function wrapExportWithInjectIntl (path) {
    const exportDefault = path.node.body.find(
        (node) => t.isExportDefaultDeclaration(node));
    const isWrapped = isWrappedWithInjectIntl(exportDefault.declaration);
    if (isWrapped) return;
    exportDefault.declaration = t.callExpression(t.identifier('injectIntl'),
        [exportDefault.declaration]);
}