const { readFileSync, writeFileSync } = require("fs");
const { generate, parse, replace, traverse } = require("abstract-syntax-tree");
const _ = require("lodash");
const {
  isFunctionExpression,
  isObjectExpression,
  isSapUiRequire,
  isUi5Extend,
  isReturnStatement,
} = require("./matchers");

// import {program} from 'commander';
//
// program.argument('<path>', 'The path to the /webapp directory');
// const command = program.parse();
// command.

function convertDependencyToImport(dependency) {
  return {
    type: "ImportDeclaration",
    source: {
      type: "Literal",
      value: dependency.value,
    },
    specifiers: [
      {
        type: "ImportDefaultSpecifier",
        local: {
          type: "Identifier",
          name: _.last(dependency.value.split("/")),
        },
      },
    ],
  };
}

function createDefaultExport(declaration) {
  return {
    type: "ExportDefaultDeclaration",
    declaration,
  };
}

function convertPropertyToClassMember(property) {
  if (isFunctionExpression(property.value)) {
    return {
      type: "MethodDefinition",
      kind: "method",
      static: false,
      key: property.key,
      value: property.value,
      computed: property.computed,
    };
  }

  if (isObjectExpression(property.value)) {
    return {
      type: "PropertyDefinition",
      key: property.key,
      value: property.value,
      computed: property.computed,
      decorators: [],
      static: true,
    };
  }

  throw new Error("Unimplemented");
}

function convertObjectExpressionToClassBody(objectExpression) {
  return {
    type: "ClassBody",
    body: objectExpression.properties.map(convertPropertyToClassMember),
  };
}

function replacer(node) {
  if (isSapUiRequire(node)) {
    const dependencies = node.expression.arguments[0].elements;
    const globalStatements = node.expression.arguments[1].body.body;
    const returnStatement = globalStatements.find(isReturnStatement);

    const globalNonReturnStatements = globalStatements.filter(
        (statement) => !isReturnStatement(statement)
    );
    const importStatements = dependencies.map(convertDependencyToImport);
    const exportStatement = createDefaultExport(returnStatement.argument);

    return [
      ...importStatements,
      ...globalNonReturnStatements,
      exportStatement,
    ];
  }

  if (isUi5Extend(node)) {
    return {
      type: "ClassDeclaration",
      id: {
        type: "Identifier",
        name: _.last(node.arguments[0].value.split(".")),
      },
      superClass: node.callee.object,
      body: convertObjectExpressionToClassBody(node.arguments[1]),
    };
  }

  return node;
}

const srcPath = "/home/vanlonden/src/monteursapp/webapp/Component.js";
const sourcesIn = readFileSync(srcPath, "utf-8");
const tree = parse(sourcesIn, {
  next: true,
});

traverse(tree, {
  enter(node) {
    replace(node, replacer);
  },
  leave(node) {},
});

const sourcesOut = generate(tree);

writeFileSync(srcPath, Buffer.from(sourcesOut));
