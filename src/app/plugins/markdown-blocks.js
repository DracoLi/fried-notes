import React from 'react';
import loglevel from 'loglevel';
import corePlugin from '~/slate/plugins/core';

const slateCore = corePlugin();
const log = loglevel.getLogger('markdown-blocks');
log.info('markdown-blocks plugin applied');

/**
 * Add support for handling markdown blocks.
 *
 * This includes headings, lists, codeblocks, and dividers.
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

    // Handle state changes for transformation splitting
    return this.handleBlockSplitting(e, state);
  },

  /**
   * When splitting a block we check if the previous block or the next
   * block need transformation adjustments. If true for any one of the block,
   * then return a new state with the correct transformation applied.
   */
  handleBlockSplitting(e, state) {
    // Handle splitting a block that neeeds transformations
    let needTransformation = false;
    let newState = state
      .transform()
      .splitBlock()
      .setBlock('paragraph')
      .apply();

    // Transform last block if needed
    const newBlock = newState.startBlock;
    const prevBlock = newState.document.getPreviousBlock(newBlock);
    const newPrevState = this.stateAfterAutoTransformation(newState, prevBlock);
    if (newPrevState) {
      needTransformation = true;
      newState = newPrevState;
    } else {
      // If prev block is transformed, then we need to make sure the new
      // block is set to paragraph by default if it is not transformed.
      const isPrevBlockTransformed = this.startBlockTransformers
        .some(oneData => oneData.blockType === prevBlock.type);
      if (isPrevBlockTransformed) needTransformation = true;
    }

    // Transform new block if needed
    const newNextState = this.stateAfterAutoTransformation(newState, newBlock);
    if (newNextState) {
      needTransformation = true;
      newState = newNextState;
    }

    // Return new state if prev or next block should be transformed
    if (needTransformation) {
      e.preventDefault();
      return newState;
    }
  },

  /**
   * Check for auto transformations on the passed in block or the `startBlock`
   * of the currently selection.
   *
   * If the block should be transformed, we apply the transformation to the
   * block and return the new tranform.
   * If the block should not be transformed but is already transformed, then
   * we remove the transformation and return the new transform.
   */
  stateAfterAutoTransformation(state, block = null) {
    // Determine the block to use
    let blockToUse = block;
    if (blockToUse === null) blockToUse = state.startBlock;

    // Find current block transformation and the transformation needed
    const targetData = this.transformationDataForBlock(blockToUse);
    const currentData = this.startBlockTransformers
      .find(oneData => oneData.blockType === blockToUse.type);

    // Remove transformation if no target transform data and block
    // has transform data.
    if (currentData && targetData === null) {
      const newTranform = state.transform();
      this.removeAutoHeadingTransformation(newTranform,
                                           state,
                                           blockToUse,
                                           currentData);
      return newTranform.apply({ merge: true });

    // Apply transformation if have target transformation and it's not the
    // same as the current transformation data
    } else if (targetData !== null) {
      if (currentData && targetData.blockType === currentData.blockType) return;
      const newTranform = state.transform();
      this.applyAutoHeadingTransformation(newTranform,
                                          state,
                                          blockToUse,
                                          targetData);
      return newTranform.apply({ merge: true });

    // Make sure no text markers exists if no transformation is applied.
    // This could be from a delete command that joins a transformed block with
    // a normal block.
    } else if (this.blockHasTextMarker(blockToUse, state)) {
      const newTranform = state.transform();
      this.removeHeadingMarkerFromBlock(newTranform, state, blockToUse);
      return newTranform.apply({ merge: true });
    }
  },

  blockHasTextMarker(block, state) {
    const { document, selection } = state;
    const blockSelection = selection
      .collapseToStartOf(block)
      .extendToEndOf(block);
    return document
      .getMarksAtRange(blockSelection)
      .some(mark => mark.type === 'heading-marker');
  },

  removeHeadingMarkerFromBlock(transform, state, block) {
    const { selection } = state;
    const blockSelection = selection
      .collapseToStartOf(block)
      .extendToEndOf(block);
    return transform.removeMarkAtRange(blockSelection, 'heading-marker');
  },

  removeAutoHeadingTransformation(transform, state, block, transformData) {
    return transform
      .collapseToStartOf(block)
      .extendToEndOf(block)
      .removeMark(transformData.textMarker)
      .setBlock('paragraph')
      .moveTo(state.selection);
  },

  applyAutoHeadingTransformation(transform, state, block, transformData) {
    const { selection } = state;
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
    if (selection.isCollapsed
        && selection.startOffset >= matchText.length + 1) {
      transform.removeMark(textMarker);
    }
    return transform;
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
    return state
      .transform()
      .collapseToStart()
      .extendToStartOf(state.startBlock)
      .delete()
      .setBlock('divider')
      .splitBlock()
      .setBlock('paragraph')
      .apply();
  },
};
