// src/having/courses/extensions/CustomCode.ts

import Code from '@tiptap/extension-code';

export const CustomCode = Code.extend({
  excludes: '', // Don't exclude any marks - allow super/sub inside code
  
  parseHTML() {
    return [
      {
        tag: 'code',
        preserveWhitespace: 'full',
      },
    ];
  },
});