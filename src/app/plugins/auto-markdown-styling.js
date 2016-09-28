import React from 'react';
import loglevel from 'loglevel';
import corePlugin from '~/slate/plugins/core';

const slateCore = corePlugin();
const log = loglevel.getLogger('auto-markdown-styling');
log.info('auto-markdown-stlying applied');

/**
 * Add support for auto styling markdown related text.
 *
 * Supports headings, lists, codeblocks, and dividers.
 */
export default {

  /**
   * This array of data is used for transforming a block to a given
   * block type depending on its starting text.
   *
   * We do this by checking for `startBlock`'s text whenever the user makes
   * a change to the text in the current block.
   * If the block's starting text matches any of the `text` attributes in this
   * list followed by a space then we automatically transform that block to the
   * `blockType` for that text. The `textMarker` is then applied to the matched
   * text minus the extra space.
   * Any text data after the matched text will not have the marker applied
   * but will belong to the `blockType` applied.
   * If a block has a type in this list but its starting text no longer
   * matches then we will transform that block's type to `paragraph` and
   * remove the `textMarker` for that block.
   *
   * Note: You can use `texts` instead of `text` in the data list.
   * `texts` works by matching any text in the list to the `blockType` as
   * opposed to just a single text per `blockType`.
   */
  startBlockTransformers: [
    { blockType: 'heading-one', textMarker: 'heading-marker', text: '#' },
    { blockType: 'heading-two', textMarker: 'heading-marker', text: '##' },
    { blockType: 'heading-three', textMarker: 'heading-marker', text: '###' },
    { blockType: 'heading-four', textMarker: 'heading-marker', text: '####' },
    { blockType: 'heading-five', textMarker: 'heading-marker', text: '#####' },
    { blockType: 'bullet-list', textMarker: 'bullet-marker', texts: ['+', '-', '*'] },
  ],

  schema: {
    nodes: {
      'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
      'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
      'heading-three': props => <h3 {...props.attributes}>{props.children}</h3>,
      'heading-four': props => <h4 {...props.attributes}>{props.children}</h4>,
      'heading-five': props => <h5 {...props.attributes}>{props.children}</h5>,
      'bullet-list': props => <li {...props.attributes}>{props.children}</li>,
      divider: (props) => {
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
      },
    },
    marks: {
      'heading-marker': {
        fontStyle: 'italic',
        color: '#eee',
      },
      'bullet-marker': {
        color: '#eee',
      },
    },
  },

  onKeyDown(e, data, state) {
    // Dividers can only be created by pressing the enter key with
    // the text before your selection fit the divider text.
    if (data.key === 'enter') {
      return this.onEnter(e, state);
    } else if (data.key === 'backspace') {
      return this.onKeyDownBackspace(e, data, state);
    } else if (data.key === 'delete') {
      return this.onKeyDownDelete(e, data, state);
    }
  },

  onKeyDownBackspace(e, data, state) {
    const stateAfterCore = slateCore.onKeyDownBackspace(e, data, state);
    return this.stateAfterAutoTransformation(stateAfterCore);
  },

  onKeyDownDelete(e, data, state) {
    const stateAfterCore = slateCore.onKeyDownDelete(e, data, state);
    return this.stateAfterAutoTransformation(stateAfterCore);
  },

  onBeforeInput(e, data, state, editor) {
    const stateAfterCore = slateCore.onBeforeInput(e, data, state, editor);
    return this.stateAfterAutoTransformation(stateAfterCore);
  },

  onPaste(e, data, state) {
    const stateAfterPaste = slateCore.onPaste(e, data, state);
    return this.stateAfterAutoTransformation(stateAfterPaste);
  },

  onEnter(e, state) {
    const { startBlock, startOffset } = state;

    // Handle creating dividers
    const leftChars = startBlock.text.slice(0, startOffset);
    if (leftChars === '---') {
      e.preventDefault();
      return this.createDivider(state);
    }

    // Handle splitting a transformed block
    const hasTransformedBlock = this.startBlockTransformers
      .some(oneData => oneData.blockType === startBlock.type);
    if (hasTransformedBlock) {
      e.preventDefault();

      // Split block at selection
      let newState = state
        .transform()
        .splitBlock()
        .apply();

      // Transform last block
      const prevBlock = newState.document.getPreviousBlock(newState.startBlock);
      newState = this.stateAfterAutoTransformation(newState, prevBlock);

      // Transform new block
      return this.stateAfterAutoTransformation(newState, newState.startBlock);
    }
  },

  stateAfterAutoTransformation(state, block = null) {
    let blockToUse = block;
    if (blockToUse === null) blockToUse = state.startBlock;
    const transformData = this.transformationDataForBlock(blockToUse);
    const currentBlockType = blockToUse.type;
    const currentTransformData = this.startBlockTransformers.find((oneData) => {
      return oneData.blockType === currentBlockType;
    });

    if (currentTransformData !== undefined && transformData === null) {
      const newTranform = state.transform();
      this.removeAutoHeadingTransformation(newTranform,
                                           blockToUse, state.selection,
                                           currentTransformData.textMarker);
      return newTranform.apply({ merge: true });
    } else if (transformData !== null) {
      const newTranform = state.transform();
      this.applyAutoHeadingTransformation(newTranform, blockToUse,
                                          state.selection, state.document,
                                          transformData);
      return newTranform.apply({ merge: true });
    }
  },

  removeAutoHeadingTransformation(transform, block, selection, headingMarker) {
    return transform
      .collapseToStartOf(block)
      .extendToEndOf(block)
      .removeMark(headingMarker)
      .setBlock('paragraph')
      .moveTo(selection);
  },

  applyAutoHeadingTransformation(transform, block, selection, document, transformData) {
    const { matchText, textMarker, blockType } = transformData;
    const markerSelection = selection
      .collapseToStartOf(block)
      .extendForward(matchText.length);
    const contentSelection = markerSelection
      .collapseToFocus()
      .extendToEndOf(block);
    transform
      .moveTo(markerSelection)
      .addMark(textMarker)
      .moveTo(contentSelection)
      .removeMark(textMarker)
      .moveTo(selection)
      .setBlock(blockType);
    if (selection.isCollapsed &&
        selection.startOffset >= matchText.length + 1) {
      transform.removeMark(textMarker);
    }
    return transform;
  },

  shouldBlockBeTransformed(targetBlock) {
    return this.transformationDataForBlock(targetBlock) !== null;
  },

  transformationDataForBlock(targetBlock) {
    const blockText = targetBlock.text;
    let transformationData = null;

    this.startBlockTransformers.forEach((matchData) => {
      // Skip if transformation data found
      if (transformationData !== null) return;

      // Handle text and texts attributes
      let matchTexts = matchData.texts;
      if (matchTexts === undefined) matchTexts = [matchData.text];

      // Find matching text in block
      matchTexts.forEach((matchText) => {
        // Check if current block text starts with the match text plus a space.
        // If true, then we set target block type to the matched block type.
        if (blockText.indexOf(`${matchText} `) === 0) {
          transformationData = matchData;
          transformationData.matchText = matchText;
        }
      });
    });

    return transformationData;
  },

  createDivider(state) {
    const { startBlock } = state;
    return state
      .transform()
      .collapseToStart()
      .extendToStartOf(startBlock)
      .delete()
      .setBlock('divider')
      .splitBlock()
      .setBlock('paragraph')
      .apply();
  },
};
