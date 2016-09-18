import React from 'react'

/**
 * Add support for auto styling markdown related text.
 *
 * Supports headings, lists, codeblocks
 */
export default {
  schema: {
    nodes: {
      'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
      'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
      'heading-three': props => <h3 {...props.attributes}>{props.children}</h3>,
      'heading-four': props => <h4 {...props.attributes}>{props.children}</h4>,
      'bullet-list': props => <li {...props.attributes}>{props.children}</li>,
      'divider': (props) => {
        return (
          <div
            className="document-divider"
            contentEditable={false}
            suppressContentEditableWarning
            {...props.attributes}>
              <span
                contentEditable={false}
                suppressContentEditableWarning>&nbsp;</span>
          </div>
        );
      }
    }
  },

  shortcutKeysToNodeType(chars) {
    switch (chars) {
      case '*':
      case '-':
      case '+': return 'bullet-list';
      case '#': return 'heading-one';
      case '##': return 'heading-two';
      case '###': return 'heading-three';
      case '####': return 'heading-four';
      case '---': return 'divider';
      default: return null;
    }
  },

  onKeyDown(e, data, state) {
    if (data.key == 'space') {
      return this.onSpace(e, state);
    }else if (data.key == 'backspace') {
      return this.onBackspace(e, state);
    }else if (data.key == 'enter') {
      return this.onEnter(e, state);
    }else {

    }
  },

  onSpace(e, state) {

  },

  onBackspace(e, state) {

  },

  onEnter(e, state) {
    // Handle divider
    const chars = this.getTextFromStartOfBlock(state);
    const { startBlock } = state;
    console.log(chars);
    if (this.shortcutKeysToNodeType(chars) == 'divider') {
      e.preventDefault();
      state = state
        .transform()
        .extendToStartOf(startBlock)
        .delete()
        .setBlock('divider')
        .splitBlock()
        .setBlock('paragraph')
        .apply();
      return state;
    }
  },

  getTextFromStartOfBlock(state) {
    const { startBlock, startOffset } = state;
    const chars = startBlock.text.slice(0, startOffset);
    return chars;
  }
}
