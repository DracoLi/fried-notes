import React from 'react';
import loglevel from 'loglevel';

const log = loglevel.getLogger('auto-markdown-styling');

/**
 * Add support for auto styling markdown related text.
 *
 * Supports headings, lists, codeblocks, and dividers
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
    },
    marks: {
      'heading-header': {
        'fontStyle': 'italic',
        'color': '#eee',
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
    }
  },

  onSpace(e, state) {
    const chars = this.getTextFromStartOfBlock(state);
    log.info(`onSpace: "${chars}"`);

    // Handle headings
    if (this.shortcutKeysToNodeType(chars) == 'heading-one') {
      return this.handleHeadings(e, state);
    }
  },

  onBackspace(e, state) {
    const chars = this.getTextFromStartOfBlock(state);
    const afterRemovalChars = chars.slice(0, -1);

    if (this.shortcutKeysToNodeType(afterRemovalChars) == 'heading-one') {
      return this.handleRemoveHeadings(e, state);
    }
  },

  onEnter(e, state) {
    const chars = this.getTextFromStartOfBlock(state);
    log.info(`OnEnter: "${chars}"`);

    // Handle divider
    if (this.shortcutKeysToNodeType(chars) == 'divider') {
      return this.handleDividerOnEnter(e, state);
    }
  },

  handleRemoveHeadings(e, state) {
    log.info("handleRemoveHeadings");
    const { document, startBlock, selection } = state;
    const startSelection = selection.extendToStartOf(startBlock);
    return state
      .transform()
      .extendToStartOf(startBlock)
      .removeMark('heading-header')
      .collapseToEnd()
      .setBlock('paragraph')
      .extendBackward()
      .delete()
      .apply();
  },

  handleHeadings(e, state) {
    const { startBlock } = state;
    return state
      .transform()
      .extendToStartOf(startBlock)
      .addMark('heading-header')
      .extendToEndOf(startBlock)
      .removeMark('heading-header')
      .setBlock('heading-one')
      .apply();
  },

  handleDividerOnEnter(e, state) {
    const { startBlock } = state;
    e.preventDefault();
    return state
      .transform()
      .extendToStartOf(startBlock)
      .delete()
      .setBlock('divider')
      .splitBlock()
      .setBlock('paragraph')
      .apply();
  },

  getTextFromStartOfBlock(state) {
    const { startBlock, startOffset } = state;
    const chars = startBlock.text.slice(0, startOffset);
    return chars;
  }
}
