module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2020,
    sourceType: "module",
    jsxPragma: "React",
    ecmaFeatures: {
      jsx: true,
      tsx: true
    }
  },
  extends: [
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier"
  ],
  rules: {
    // "comma-dangle": "off",
    // "max-len": [0, 160, 2, { ignoreUrls: true }],
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/ban-ts-ignore": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    //"@typescript-eslint/no-const-requires": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/ban-types": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off"
    // "@typescript-eslint/no-unused-vars": [
    //   "error",
    //   {
    //     argsIgnorePattern: "^h$",
    //     varsIgnorePattern: "^h$"
    //   }
    // ],
    // "no-unused-vars": [
    //   "error",
    //   {
    //     argsIgnorePattern: "^h$",
    //     varsIgnorePattern: "^h$"
    //   }
    // ],
    // "vue/custom-event-name-casing": "off",
    // "no-use-before-define": "off",
    // "space-before-function-paren": "off",
    //
    // "vue/attributes-order": "off",
    // "vue/one-component-per-file": "off",
    // "vue/html-closing-bracket-newline": "off",
    // "vue/max-attributes-per-line": "off",
    // "vue/multiline-html-element-content-newline": "off",
    // "vue/singleline-html-element-content-newline": "off",
    // "vue/attribute-hyphenation": "off",
    // // 'vue/html-self-closing': 'off',
    // "vue/require-default-prop": "off",
    // "vue/html-self-closing": [
    //   "error",
    //   {
    //     html: {
    //       void: "always",
    //       normal: "never",
    //       component: "always"
    //     },
    //     svg: "always",
    //     math: "always"
    //   }
    // ]
  }
};
