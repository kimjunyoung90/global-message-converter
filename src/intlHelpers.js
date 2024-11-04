import t from "@babel/types";

export function callIntlFormatMessageExpression(messageKey, text) {
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

export function createFormatMessage(key, text) {

    const elementName = t.jsxIdentifier('FormattedMessage');

    const attributes = [
        t.jsxAttribute(t.jsxIdentifier('id'), t.stringLiteral(key)),
        t.jsxAttribute(t.jsxIdentifier('defaultMessage'), t.stringLiteral(text)),
    ];

    const openingElement = t.jsxOpeningElement(elementName, attributes, true);

    return t.jsxElement(openingElement, null, []);
}

export function importIntl(isFormattedMessageImportNeed, isInjectIntlImportNeed, path) {
    if (!(isFormattedMessageImportNeed || isInjectIntlImportNeed)) return;

    //import 추가
    const importDeclarations = path.node.body.filter((node) => t.isImportDeclaration(node));
    const reactIntlImport = importDeclarations.find((importDeclaration) => importDeclaration.source.value === 'react-intl');

    const newSpecifiers = [];
    if(isFormattedMessageImportNeed) {
        const importFormattedMessageSpecifier = t.importSpecifier(t.identifier('FormattedMessage'), t.identifier('FormattedMessage'));
        const hasFormattedMessageImport = reactIntlImport?.specifiers.find(specifier => specifier.imported.name === 'FormattedMessage');
        if(!hasFormattedMessageImport) {
            newSpecifiers.push(importFormattedMessageSpecifier)
        }
    }

    if(isInjectIntlImportNeed) {
        const importInjectIntlSpecifier = t.importSpecifier(t.identifier('injectIntl'), t.identifier('injectIntl'));
        const hasInjectIntlImport = reactIntlImport?.specifiers.find(specifier => specifier.imported.name === 'injectIntl');
        if(!hasInjectIntlImport) {
            newSpecifiers.push(importInjectIntlSpecifier)
        }
    }

    if (newSpecifiers.length === 0) return;

    if (reactIntlImport) {
        //추가
        reactIntlImport.specifiers = [...reactIntlImport.specifiers, ...newSpecifiers];
    } else {
        const source = t.stringLiteral('react-intl');
        const newImportDeclaration = t.importDeclaration(newSpecifiers, source);
        path.node.body = [
            ...importDeclarations,
            newImportDeclaration,
            ...path.node.body,
        ];
    }
}

export function isWrappedWithInjectIntl(node) {
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