const _ = require("lodash");

const isSapUiRequire = _.matches({
  type: "ExpressionStatement",
  expression: {
    type: "CallExpression",
    callee: {
      type: "MemberExpression",
      object: {
        type: "MemberExpression",
        object: { type: "Identifier", name: "sap" },
        property: { type: "Identifier", name: "ui" },
      },
      property: { type: "Identifier", name: "define" },
    },
  },
});

const isReturnStatement = _.matches({ type: "ReturnStatement" });

const isFunctionExpression = _.matches({ type: "FunctionExpression" });

const isObjectExpression = _.matches({ type: "ObjectExpression" });

const isIdentifier = _.matches({ type: "Identifier" });

const isUi5Extend = _.matches({
  type: "CallExpression",
  callee: {
    type: "MemberExpression",
    property: { type: "Identifier", name: "extend" },
  },
});

module.exports = {
  isSapUiRequire,
  isReturnStatement,
  isFunctionExpression,
  isObjectExpression,
  isIdentifier,
  isUi5Extend,
};
