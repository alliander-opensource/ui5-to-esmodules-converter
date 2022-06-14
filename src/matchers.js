import _ from "lodash";

export const isSapUiRequire = _.matches({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "sap" },
        property: { type: "Identifier", name: "ui" }
      },
      property: { type: "Identifier", name: "define" }
    }
  }
});

export const isReturnStatement = _.matches({ type: "ReturnStatement" });

export const isFunctionExpression = _.matches({ type: "FunctionExpression" });

export const isObjectExpression = _.matches({ type: "ObjectExpression" });

export const isIdentifier = _.matches({ type: "Identifier" });

export const isUi5Extend = _.matches({
  type: "CallExpression",
  callee: {
    type: "MemberExpression",
    property: { type: "Identifier", name: "extend" }
  }
});