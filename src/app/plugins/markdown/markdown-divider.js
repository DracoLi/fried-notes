import React from 'react';
import loglevel from 'loglevel';

const log = loglevel.getLogger('markdown-divider');
log.info('[Plugin] \'markdown-divider\' applied');

export default {
  schema: {
    nodes: {
      divider: (props) => {
        return (
          <div
            className="document-divider"
            contentEditable={false}
            suppressContentEditableWarning
            {...props.attributes}>
              <span
                className="divider-span"
                contentEditable={false}
                suppressContentEditableWarning>{props.children}</span>
          </div>
        );
      },
    },
  },

  onKeyDown(e, data, state) {
    if (data.key === 'enter') {
      return this.onKeyDownEnter(e, data, state);
    } else if (data.key === 'backspace') {
      return this.onKeyDownBackspace(e, data, state);
    } else if (data.key === 'left') {
      return this.onKeyDownLeft(e, data, state);
    }
  },

  onKeyDownEnter(e, data, state) {
    const { startBlock, startOffset } = state;

    // Handle creating dividers when needed
    const leftChars = startBlock.text.substring(0, startOffset);
    if (leftChars === '---') {
      e.preventDefault();
      return this.createDivider(state);
    }
  },

  onKeyDownLeft(e, data, state) {
    if (data.isCtrl) return;
    if (data.isAlt) return;

    // Ignore unless focus is collapsed and at start of block
    const { isExpanded, startBlock, startOffset} = state;

    if (state.startOffset !== 0) return;
    if (state.isExpanded) return;

    // Ignore unless previous block is a divider
    let prevBlock = state.document.getPreviousBlock(startBlock.key);
    if (prevBlock.type !== 'divider') return;

    // Move focus to end of the first previous block that is not a divider
    while (prevBlock !== null && prevBlock.type === 'divider') {
      prevBlock = state.document.getPreviousBlock(prevBlock.key);
    }

    // Apply transformation if found block
    if (prevBlock !== null) {
      return state
        .transform()
        .collapseToEndOf(prevBlock)
        .moveForward(1)
        .apply()

    // If no block, do nothing by applying an empty transform so
    // the core plugin will not do something wierd.
    } else {
      return state.transform().apply();
    }
  },

  onKeyDownBackspace(e, data, state) {
    // Handle deleting dividers
    const { startBlock, startOffset, isCollapsed } = state;
    const prevBlock = state.document.getPreviousBlock(startBlock.key);
    if (isCollapsed && startOffset === 0 && prevBlock.type === 'divider') {
      return this.deleteDivider(state, prevBlock, startBlock)
    }
  },

  createDivider(state) {
    return state
      .transform()
      .setBlock('divider')
      .splitBlock()
      .setBlock('paragraph')
      .apply();
  },

  deleteDivider(state, startBlock, endBlock) {
    const selection = state.selection;
    const deleteRange = selection.moveToRangeOf(startBlock, endBlock).moveToOffsets(0);
    return state
      .transform()
      .moveTo(deleteRange)
      .delete()
      .setBlock('paragraph')
      .apply();
  }
}
