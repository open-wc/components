import { globSync, readFileSync } from 'node:fs';
import ts from 'typescript';

/** Check the shared renderer binding without executing a page's server code. */
export function checkRocketPage(source, path) {
  const server = [...source.matchAll(/^```js server[^\S\n]*\n([\s\S]*?)^```/gm)]
    .map(match => match[1])
    .join('\n');
  const file = ts.createSourceFile(path, server, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let usesAtlasDoc = false;
  let componentsName;
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@rocket/js/layouts/atlasDoc.js'
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        const imported = (element.propertyName ?? element.name).text;
        usesAtlasDoc ||= imported === 'atlasDocLayout';
        if (imported === 'atlasDocComponents') {
          componentsName = element.name.text;
        }
      }
    }
  }
  if (!usesAtlasDoc) {
    return [];
  }
  const exportsComponents = file.statements.some(
    statement =>
      ts.isVariableStatement(statement) &&
      statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) &&
      statement.declarationList.declarations.some(
        declaration =>
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === 'components' &&
          declaration.initializer &&
          ts.isIdentifier(declaration.initializer) &&
          declaration.initializer.text === componentsName,
      ),
  );
  return exportsComponents
    ? []
    : [
        `${path}: Atlas doc pages must import atlasDocComponents and export const components = atlasDocComponents.`,
      ];
}

if (import.meta.main) {
  const errors = [...globSync('src/**/*.rocket.md')].flatMap(path =>
    checkRocketPage(readFileSync(path, 'utf8'), path),
  );
  if (errors.length) {
    process.stderr.write(`${errors.join('\n')}\n`);
    process.exitCode = 1;
  }
}
