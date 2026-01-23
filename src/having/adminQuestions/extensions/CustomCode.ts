// src/having/adminQuestions/extensions/CustomCode.ts

import Code from '@tiptap/extension-code';

export const CustomCode = Code.extend({
  excludes: '', // Allow super/sub inside code
  
  parseHTML() {
    return [
      {
        tag: 'code',
        preserveWhitespace: 'full',
      },
    ];
  },
});