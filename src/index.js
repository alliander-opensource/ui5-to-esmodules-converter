import { attachComments } from "estree-util-attach-comments";
import _ from "lodash";
import astractSyntaxTree from "abstract-syntax-tree";
import { readFileSync, writeFileSync } from "fs";
import {
    isFunctionExpression,
    isIdentifier,
    isObjectExpression,
    isReturnStatement,
    isSapUiRequire, isUi5Extend
} from "./matchers.js";

const { generate, parse, replace, traverse } = astractSyntaxTree;

function convertDependencyToImport(dependency) {
  return {
    type: "ImportDeclaration",
    source: {
      type: "Literal",
      value: dependency.value
    },
    specifiers: [
      {
        type: "ImportDefaultSpecifier",
        local: {
          type: "Identifier",
          name: _.last(dependency.value.split("/"))
        }
      }
    ]
  };
}

function createDefaultExport(declaration) {
  return {
    type: "ExportDefaultDeclaration",
    declaration
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
      computed: property.computed
    };
  }

  if (isObjectExpression(property.value)) {
    return {
      type: "PropertyDefinition",
      key: property.key,
      value: property.value,
      computed: property.computed,
      decorators: [],
      static: true
    };
  }

  if (isIdentifier(property.value)) {
    return {
      type: "PropertyDefinition",
      key: property.key,
      value: property.value,
      computed: property.computed,
      decorators: [],
      static: false
    };
  }

  throw new Error(`Unimplemented type: ${property.value.type}`);
}

function convertObjectExpressionToClassBody(objectExpression) {
  return {
    type: "ClassBody",
    body: objectExpression.properties.map(convertPropertyToClassMember)
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
      exportStatement
    ];
  }

  if (isUi5Extend(node)) {
    return {
      type: "ClassDeclaration",
      id: {
        type: "Identifier",
        name: _.last(node.arguments[0].value.split("."))
      },
      superClass: node.callee.object,
      body: convertObjectExpressionToClassBody(node.arguments[1])
    };
  }


  return node;
}

// const webappPath = '/home/vanlonden/src/monteursapp/webapp';
// glob.sync();

// const srcPath = '/home/vanlonden/src/monteursapp/webapp/component/afsluitercontrole/controller/App.controller.js'
// const srcPath = '/home/vanlonden/src/monteursapp/webapp/Component.js'
// const srcPath = '/home/vanlonden/src/monteursapp/webapp/core/onderhoud/services/msrPrefiller.js'
const srcPath = "/home/vanlonden/src/monteursapp/webapp/core/common/controller/Werkorders.controller.js";


const sourcesIn = readFileSync(srcPath, "utf-8");

const comments = [];
const ast = parse(sourcesIn, {
  onComment: comments,
  next: true,
  loc: true
});

let mappedComments = comments.map(comment => ({
  ...comment,
  start: 0,
  end: 0,
  type: comment.type === "SingleLine" ? "Line" : "Block"
}));
attachComments(ast, mappedComments);


traverse(ast, {
  enter(node) {
    replace(node, replacer);
  },
  leave(node) {
  }
});


const sourcesOut = generate(ast, {
  comments: true
});

writeFileSync(srcPath, Buffer.from(sourcesOut));
