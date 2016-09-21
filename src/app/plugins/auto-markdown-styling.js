import React from 'react';
import loglevel from 'loglevel';
import CorePlugin from '~/slate/plugins/core'

const slateCore = CorePlugin();

const log = loglevel.getLogger('auto-markdown-styling');

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
   * We do this by checking for startBlock's text in `OnDocumentChange`.
   * If the starting text matches any of the text attributes in this list
   * followed by a space then we automatically transforms that block to the
   * `blockType` for that text. The `textMarker` is then applied to the matched
   * text plus the extra space.
   * Any text data after the matched text will not have the marker applied
   * but will belong to the block type applied.
   * If a block has a type in this list but the starting text no longer
   * matches then we will transform that block's type to `paragraph` and
   * remove the `textMarker` for that `blockType`.
   *
   * Note: You can use `texts` instead of `text` in the data list.
   * `texts` work by matching any text in the list to the `blockType` as
   * opposed to just a single text.
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
      'heading-marker': {
        'fontStyle': 'italic',
        'color': '#eee'
      },
      'bullet-marker': {
        'color': '#eee'
      },
      'shit': {

      }
    }
  },

  onKeyDown(e, data, state) {
    // Dividers can only be created by pressing the enter key with
    // the text before your selection fit the divider text.
    const { startBlock, startOffset } = state;
    const leftChars = startBlock.text.slice(0, startOffset);
    if (data.key === 'enter' && leftChars === '---') {
      return this.createDivider(state);
    }

    if (data.key === 'backspace') {
      return this.onKeyDownBackspace(e, data, state);
    }else if (data.key === 'delete') {
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

  /**
   * This method handles auto block transformations using the passed in state.
   */
  stateAfterAutoTransformation(state) {
    const { startBlock } = state;
    const currentBlockText = startBlock.text;
    const currentBlockType = startBlock.type;
    let currentBlockTextMarker = null;
    let isCurrentBlockTransformed = false;
    let targetBlockType = null;
    let targetBlockTextMarker = null;
    let targetBlockMatchText = null;

    this.startBlockTransformers.forEach((matchData) => {
      if (targetBlockType !== null) return;

      let matchTexts = matchData.texts;
      if (matchTexts === undefined) matchTexts = [matchData.text];

      matchTexts.forEach((matchText) => {
        // Check if the current block is already transformed
        if (currentBlockType === matchData.blockType) {
          isCurrentBlockTransformed = true;
          currentBlockTextMarker = matchData.textMarker;
        }

        // Check if current block text starts with the match text plus a space.
        // If true, then we set target block type to the matched block type.
        if (currentBlockText.indexOf(`${matchText} `) === 0) {
          targetBlockType = matchData.blockType;
          targetBlockTextMarker = matchData.textMarker;
          targetBlockMatchText = matchText;
        }
      });

    });

    // If current block type is null but the block is already transformed
    // then we need to remove the transformation.
    if (targetBlockType === null && isCurrentBlockTransformed) {
      log.info(`Removing an existing transformation with type: ${currentBlockType}`);
      const startingSelection = state.selection;
      return state
        .transform()
        .collapseToStartOf(startBlock)
        .extendToEndOf(startBlock)
        .removeMark(currentBlockTextMarker)
        .setBlock('paragraph')
        .moveTo(startingSelection)
        .apply({merge: true});

    // Else if we have a target block type that is different than
    // current block type then we transform the block to it.
    }else if (targetBlockType !== null && currentBlockType !== targetBlockType) {
      log.info(`Creating a new transformation with type: ${targetBlockType}, marker: ${targetBlockTextMarker}`);
      const startingSelection = state.selection;
      window.startingSelection = startingSelection;
      const markerSelection = startingSelection
        .collapseToStartOf(startBlock)
        .extendForward(targetBlockMatchText.length)
      window.markerSelection = markerSelection;
      const blockContentSelection = markerSelection
        .collapseToFocus()
        .extendToEndOf(startBlock)

      const newState = state
        .transform()
        .moveTo(markerSelection)
        .addMark(targetBlockTextMarker)
        .moveTo(blockContentSelection)
        .removeMark(targetBlockTextMarker)
        .moveTo(startingSelection)
        .setBlock(targetBlockType);
      if (startingSelection.isCollapsed) {
        newState.removeMark(targetBlockTextMarker);
      }
      return newState.apply({merge: true});
    }
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
}
