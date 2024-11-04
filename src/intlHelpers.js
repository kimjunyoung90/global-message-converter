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