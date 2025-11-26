
/**
 * Custom TipTap Extension for Product Boxes
 * Preserves custom HTML divs with inline styles
 * Stores full innerHTML to preserve all nested content exactly
 */

import { Node, mergeAttributes } from '@tiptap/core';

export const ProductBox = Node.create({
  name: 'productBox',
  
  group: 'block',
  
  atom: true, // Treat as atomic block - preserve HTML exactly
  
  parseHTML() {
    return [
      {
        tag: 'div.writgo-product-box',
        priority: 100,
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          return {
            class: element.getAttribute('class'),
            style: element.getAttribute('style'),
            innerHTML: element.innerHTML,
          };
        },
      },
      {
        tag: 'div.writgo-product-box-v2',
        priority: 100,
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          return {
            class: element.getAttribute('class'),
            style: element.getAttribute('style'),
            innerHTML: element.innerHTML,
          };
        },
      },
      {
        tag: 'div.writgo-cta-box',
        priority: 100,
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          return {
            class: element.getAttribute('class'),
            style: element.getAttribute('style'),
            innerHTML: element.innerHTML,
            'data-cta-config': element.getAttribute('data-cta-config'),
          };
        },
      },
      {
        tag: 'div.writgo-product-grid',
        priority: 100,
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          return {
            class: element.getAttribute('class'),
            style: element.getAttribute('style'),
            innerHTML: element.innerHTML,
          };
        },
      },
      {
        tag: 'div.writgo-comparison-table',
        priority: 100,
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          return {
            class: element.getAttribute('class'),
            style: element.getAttribute('style'),
            innerHTML: element.innerHTML,
          };
        },
      },
      {
        tag: 'div.universal-cta-box',
        priority: 100,
        getAttrs: (dom) => {
          if (typeof dom === 'string') return false;
          const element = dom as HTMLElement;
          return {
            class: element.getAttribute('class'),
            style: element.getAttribute('style'),
            innerHTML: element.innerHTML,
          };
        },
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    const { innerHTML, ...attrs } = HTMLAttributes;
    // Create a div with preserved innerHTML
    if (innerHTML) {
      return ['div', mergeAttributes(attrs), ['div', { innerHTML }]];
    }
    return ['div', mergeAttributes(attrs)];
  },
  
  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('div');
      const attrs = node.attrs;
      
      // Set all attributes
      if (attrs.class) dom.className = attrs.class;
      if (attrs.style) dom.setAttribute('style', attrs.style);
      if (attrs['data-cta-config']) dom.setAttribute('data-cta-config', attrs['data-cta-config']);
      
      // Set innerHTML directly to preserve all nested content
      if (attrs.innerHTML) {
        dom.innerHTML = attrs.innerHTML;
      }
      
      // Make it non-editable
      dom.contentEditable = 'false';
      
      return {
        dom,
      };
    };
  },
  
  addAttributes() {
    return {
      class: {
        default: null,
      },
      style: {
        default: null,
      },
      innerHTML: {
        default: null,
      },
      'data-cta-config': {
        default: null,
      },
      'data-product-id': {
        default: null,
      },
    };
  },
});

/**
 * Generic HTML Div Extension
 * Preserves any div with styles for WordPress compatibility
 */
export const GenericDiv = Node.create({
  name: 'genericDiv',
  
  group: 'block',
  
  content: 'block+', // Allow block content (was inline* before)
  
  parseHTML() {
    return [
      {
        tag: 'div',
        priority: 50, // Lower priority so specific ones (like ProductBox) match first
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      style: {
        default: null,
        parseHTML: element => element.getAttribute('style'),
        renderHTML: attributes => {
          if (!attributes.style) {
            return {};
          }
          return { style: attributes.style };
        },
      },
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => {
          if (!attributes.class) {
            return {};
          }
          return { class: attributes.class };
        },
      },
      // Preserve common attributes
      id: {
        default: null,
        parseHTML: element => element.getAttribute('id'),
        renderHTML: attributes => attributes.id ? { id: attributes.id } : {},
      },
      role: {
        default: null,
        parseHTML: element => element.getAttribute('role'),
        renderHTML: attributes => attributes.role ? { role: attributes.role } : {},
      },
    };
  },
});
