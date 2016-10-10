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
  blockTransformData: [
    { blockType: 'heading-one', textMarker: 'heading-marker', text: '#' },
    { blockType: 'heading-two', textMarker: 'heading-marker', text: '##' },
    { blockType: 'heading-three', textMarker: 'heading-marker', text: '###' },
    { blockType: 'heading-four', textMarker: 'heading-marker', text: '####' },
    { blockType: 'heading-five', textMarker: 'heading-marker', text: '#####' },
    { blockType: 'list-item-bullet',
      textMarker: 'list-marker',
      texts: ['+', '-', '*'],
      listBlockType: 'bullet-list' },
    { blockType: 'list-item-number',
      textMarker: 'list-marker',
      text: '[numbered-list]',
      listBlockType: 'numbered-list' },
  ],

  schema: {
    nodes: {
      'heading-one': props => <h1 {...props.attributes}>{props.children}</h1>,
      'heading-two': props => <h2 {...props.attributes}>{props.children}</h2>,
      'heading-three': props => <h3 {...props.attributes}>{props.children}</h3>,
      'heading-four': props => <h4 {...props.attributes}>{props.children}</h4>,
      'heading-five': props => <h5 {...props.attributes}>{props.children}</h5>,
      'bullet-list': props => <ul {...props.attributes}>{props.children}</ul>,
      'numbered-list': props => <ol {...props.attributes}>{props.children}</ol>,
      'list-item-bullet': props => <li {...props.attributes}>{props.children}</li>,
      'list-item-number': props => <li {...props.attributes}>{props.children}</li>,
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
      'heading-marker': 'heading-marker',
      'list-marker': 'list-marker',
    },
  },


  /**
   * Determines when we remove a list block transformation, whether the
   * indentations for the list blocks should be removed as well.
   */
  shouldRemoveIndentationsOnListBlockRemoval: true,

  onKeyDown(e, data, state) {
    if (data.key === 'enter') {
      return this.onKeyDownEnter(e, data, state);
    } else if (data.key === 'backspace') {
      return this.onKeyDownBackspace(e, data, state);
    } else if (data.key === 'delete') {
      return this.onKeyDownDelete(e, data, state);
    } else if (data.key === 'tab') {
      return this.onKeyDownTab(e, data, state);
    }
  },

  onKeyDownBackspace(e, data, state) {
    // Handle deleting indentations in a number or bullet list.
    // This will override the default backspace implementation so we do this first.
    const newState = this.stateAfterListIndentationDeletion(e, data, state);
    if (newState) return newState;

    // Handle block transformation after core's backspace behaviour
    const stateAfterCore = slateCore.onKeyDownBackspace(e, data, state) || state;
    return this.stateAfterBlockTransformation(stateAfterCore);
  },

  onKeyDownDelete(e, data, state) {
    const stateAfterCore = slateCore.onKeyDownDelete(e, data, state) || state;
    return this.stateAfterBlockTransformation(stateAfterCore);
  },

  onKeyDownTab(e, data, state) {
    return this.stateAfterListItemAddIndentation(e, data, state);
  },

  onKeyDownEnter(e, data, state) {
    const { startBlock, startOffset } = state;

    // Handle creating dividers
    const leftChars = startBlock.text.substring(0, startOffset);
    if (leftChars === '---') {
      e.preventDefault();
      return this.createDivider(state);
    }

    // Handle continuing list item
    const newState = this.stateAfterContinueListItem(e, data, state);
    if (newState) return newState;

    // Handle block spitting logic for everything else
    return this.handleBlockSplitting(e, state);
  },

  onBeforeInput(e, data, state, editor) {
    const stateAfterCore = slateCore.onBeforeInput(e, data, state, editor) || state;
    return this.stateAfterBlockTransformation(stateAfterCore);
  },

  onPaste(e, data, state) {
    const stateAfterPaste = slateCore.onPaste(e, data, state) || state;
    return this.stateAfterBlockTransformation(stateAfterPaste);
  },

  /**
   * Continue a list item with the same indentation.
   * Continue can only work if the current selection is after
   * the space in the bullet marker.
   */
  stateAfterContinueListItem(e, data, state) {
    const { startBlock, selection } = state;
    const blockText = startBlock.text;
    if (startBlock.type.indexOf('list-item-') !== 0) return;

    // If the selection is before the space in the marker then we return nothing
    // so the default block splitting behaviour will be used.
    const indexAfterSpace = blockText.indexOf(' ') + 1;
    if (selection.startOffset < indexAfterSpace) return;

    // If selection is collpased and at the start of list item,
    // then remove block and add new pargraph block
    if (selection.isCollapsed && selection.startOffset === indexAfterSpace) {
      const currentData = this.blockTransformData
        .find(oneData => oneData.blockType === startBlock.type);
      e.preventDefault();
      return state
        .transform()
        .moveToOffsets(0, indexAfterSpace)
        .unwrapBlock(currentData.listBlockType)
        .setBlock('paragraph')
        .delete()
        .splitBlock()
        .apply();

    // Else split block and create a new list item
    } else {
      const indentationCount = this.getIndentationCountForText(blockText);
      const markerText = blockText.substring(indentationCount, indexAfterSpace - 1);
      const isNumberList = markerText.slice(-1) === '.';
      let newText = blockText.substring(0, indexAfterSpace);
      if (isNumberList) {
        const numberStr = markerText.slice(0, -1);
        const nextNumber = Number.parseInt(numberStr, 10) + 1;
        newText = blockText.substring(0, indentationCount) + nextNumber;
        newText = `${newText}. `;
      }
      e.preventDefault();
      return state
        .transform()
        .splitBlock()
        .insertText(newText)
        .apply();
    }
  },

  /**
   * Handle adding an indentation to a list item.
   */
  stateAfterListItemAddIndentation(e, data, state) {
    const { startBlock, selection } = state;
    if (startBlock.type.indexOf('list-item-') !== 0) return;
    e.preventDefault();
    const insertRange = selection.collapseToStartOf(startBlock);
    const afterSelection = selection.moveForward();
    return state
      .transform()
      .moveTo(insertRange)
      .insertText('\t')
      .moveTo(afterSelection)
      .apply();
  },

  /**
   * Handle removing indentations on backspace in a numbered or bullet list.
   * This only works if the current selection is right after the list markers.
   */
  stateAfterListIndentationDeletion(e, data, state) {
    const { startBlock, selection } = state;
    const blockText = startBlock.text;

    // Block must be of list-item
    if (startBlock.type.indexOf('list-item-') !== 0) return;

    // Selection must be collapsed
    if (!selection.isCollapsed) return;

    // Selection start offset must be right after bullet
    const firstSpaceIndex = blockText.indexOf(' ');
    if (selection.startOffset !== (firstSpaceIndex + 1)) return;

    // If have indentation remove indentation
    const indentation = this.getIndentationCountForText(blockText);
    if (indentation > 0) {
      const deleteRange = selection
        .collapseToStartOf(startBlock)
        .extendForward();
      const finalSelection = selection
        .moveBackward();
      e.preventDefault();
      return state
        .transform()
        .moveTo(deleteRange)
        .delete()
        .moveTo(finalSelection)
        .apply();

    // Else if no indentation and no content after selection,
    // then remove the list item transform.
    } else if (indentation == 0
               && (startBlock.text.length === selection.startOffset)) {
      const currentData = this.blockTransformData
        .find(oneData => oneData.blockType === startBlock.type);
      e.preventDefault();
      return state
        .transform()
        .moveToRangeOf(startBlock)
        .delete()
        .unwrapBlock(currentData.listBlockType)
        .setBlock('paragraph')
        .delete()
        .apply();
    }
  },

  /**
   * When splitting a block we check if the previous block or the next
   * block need transformation adjustments. If true for any one of the block,
   * then return a new state with the correct transformation applied.
   */
  handleBlockSplitting(e, state) {
    let isTransformationNeeded = false;

    // Apply default block splitting and get data from split block
    let newState = state
      .transform()
      .splitBlock()
      .setBlock('paragraph')
      .apply();
    const newBlock = newState.startBlock;
    const prevBlock = newState.document.getPreviousBlock(newBlock);
    const isPrevBlockTransformed = this.blockTransformData
      .some(oneData => oneData.blockType === prevBlock.type);

    // Transform last block if needed
    const newPrevState = this.stateAfterBlockTransformation(newState, prevBlock);
    if (newPrevState) {
      isTransformationNeeded = true;
      newState = newPrevState;
    }

    // Transform new block if needed
    const newNextState = this.stateAfterBlockTransformation(newState, newBlock);
    if (newNextState) {
      isTransformationNeeded = true;
      newState = newNextState;
    }

    // Return new state if prev or next block should be transformed.
    // Also apply our custom splitting with paragraph as the new block type
    // if the previous block is already transformed.
    if (isTransformationNeeded || isPrevBlockTransformed) {
      e.preventDefault();
      return newState;
    }
  },

  /**
   * Check for auto transformations on the passed in block or the `startBlock`
   * of the current selection.
   *
   * If the block should be transformed, we apply the transformation to the
   * block and return the new state.
   * If the block should not be transformed but is already transformed, then
   * we remove the transformation and return the new state.
   */
  stateAfterBlockTransformation(state, block = null) {
    // Determine the block to use
    let blockToUse = block;
    if (blockToUse === null) blockToUse = state.startBlock;

    // Find current block transformation and the transformation needed
    const targetData = this.transformDataForBlock(blockToUse);
    const currentData = this.blockTransformData
      .find(oneData => oneData.blockType === blockToUse.type);
    let newState;

    // Remove transformation if no target data and block has transform data.
    if (!targetData && currentData) {
      newState = this.removeBlockTransformation(state, blockToUse, currentData);

    // Apply transformation if have target data and it's not the
    // same as the current transformation data
    } else if (targetData) {
      newState = this.applyBlockTransformation(state, blockToUse, targetData);
    }

    // Make sure no text markers exists if no transformation is applied.
    // This could be from a delete command that joins a transformed block with
    // a normal block.
    if (!newState) {
      return this.removeExtraBlockMarkersFromBlock(state, blockToUse, currentData);
    }

    return newState;
  },

  /**
   * Remove any extra block markers applied from the passed in block.
   * If the block is transformed, we remove only block markers after the
   * matched text, else we remove block markers from the whole block.
   * If no block makers exist, then no transformations are applied.
   * Note: State changes are merged by default.
   */
  removeExtraBlockMarkersFromBlock(state, block, transformData, shouldMerge = true) {
    const { document, selection } = state;
    const marks = Object.keys(this.schema.marks);

    // Determine the selection to remove the markers.
    // If the block is transformed we select everything past the matched text,
    // else we select the whole block.
    let markerSelection = selection.moveToRangeOf(block);
    if (transformData) {
      const markerLength = block.text.indexOf(' ') + 1;
      markerSelection = markerSelection
        .moveToOffsets(markerLength, block.length)
    }

    // Remove all possible markers from the selection
    const transform = state.transform().moveTo(markerSelection);
    let marksRemoved = false;
    marks.forEach((oneMark) => {
      const hasMark = document
        .getMarksAtRange(markerSelection)
        .some(mark => mark.type === oneMark);
      if (hasMark) {
        transform.removeMark(oneMark);
        marksRemoved = true;
      }
    });

    // Apply the transformation
    if (marksRemoved) {
      return transform
        .moveTo(selection)
        .apply({ merge: shouldMerge });
    }
  },

  /**
   * Remove any block transformations made by this plugin.
   * This will handle heading and list transformations in `blockTransformData`.
   * Note: State changes are merged by default.
   */
  removeBlockTransformation(state, block, transformData, shouldMerge = true) {
    const { selection } = state;
    const { listBlockType, textMarker, indentationCount } = transformData;

    // Do nothing if target block is not of the transform block type.
    if (block.type !== transformData.blockType) return;

    // Remove block and block marker
    const transform = state
      .transform()
      .moveToRangeOf(block)
      .removeMark(textMarker)
      .setBlock('paragraph');

    // Remove list blocks
    if (listBlockType) {
      transform.unwrapBlock(listBlockType);

      // Remove indentations if any
      if (this.shouldRemoveIndentationsOnListBlockRemoval
          && indentationCount > 0) {
        const deleteRange = selection
          .collapseToStartOf(block)
          .extendForward(indentationCount);
        transform
          .moveTo(deleteRange)
          .delete();
      }
    }

    // Revert selection changes
    transform.moveTo(selection);

    // Apply changes
    return transform.apply({ merge: shouldMerge });
  },

  /**
   * Apply the block transformation passed in.
   * This will handle heading and list transformations in `blockTransformData`.
   * Note: State changes are merged by default.
   */
  applyBlockTransformation(state, block, transformData, shouldMerge = true) {
    const { selection } = state;
    const { matchedText, textMarker, blockType, indentationCount, listBlockType } = transformData;
    const markerMatchLength = indentationCount + matchedText.length;

    // If block already transform to target type, do nothing.
    if (block.type === blockType) return;

    // Set block type and add in block markers
    const markerSelection = selection
      .collapseToStartOf(block)
      .extendForward(markerMatchLength);
    const contentSelection = markerSelection
      .collapseToFocus()
      .extendToEndOf(block);
    const transform = state
      .transform()
      .moveTo(markerSelection)
      .addMark(textMarker)
      .moveTo(contentSelection)
      .removeMark(textMarker)
      .setBlock(blockType);

    // Wrap entire block in `listBlockType` if provided.
    if (listBlockType) {
      log.info("wrap block: " + listBlockType)
      transform
        .moveToRangeOf(block)
        .wrapBlock(listBlockType);
    }

    // Revert selection changes
    transform.moveTo(selection);

    // Remove marks at selection if its right after the matched marker text.
    if (selection.isCollapsed
        && selection.startOffset === markerMatchLength + 1) {
      transform.removeMark(textMarker);
    }

    // Apply changes
    return transform.apply({ merge: shouldMerge });
  },

  /**
   * Returns the transformation data required for the passed in block.
   * If the block should not be transformed, nothing is returned.
   */
  transformDataForBlock(block) {
    const blockText = block.text;
    let transformData;
    this.blockTransformData.forEach((matchData) => {
      // Skip if we found our transform data
      if (transformData) return;

      // Handle text and texts attributes
      const matchTexts = matchData.texts ? matchData.texts : [matchData.text];

      // If match data is list block, adjust text to match by removing
      // starting indentations before matching the text.
      let textToMatch = blockText;
      const isListBlock = !!matchData.listBlockType;
      let listBlockIndentation = 0;
      if (isListBlock) {
        listBlockIndentation = this.getIndentationCountForText(blockText);
        textToMatch = blockText.substring(listBlockIndentation);
      }

      // Try to match the block text with our transform data text
      matchTexts.forEach((matchText) => {
        if (transformData) return;

        // Handle special case for numbered lists.
        // We need to figure out if the `textToMatch` is of format `[number]. `.
        if (matchText === '[numbered-list]') {
          const dotIndex = textToMatch.indexOf('. ');
          const listNumberString = textToMatch.substring(0, dotIndex);
          if (dotIndex > 0 && this.isInt(listNumberString)) {
            transformData = matchData;
            transformData.matchedText = textToMatch.substring(0, dotIndex + 1);
          }

        // Check if `textToMatch` starts with the `matchText` plus a space.
        // If true, then we set target block type to the matched block type.
        } else if (textToMatch.indexOf(`${matchText} `) === 0) {
          transformData = matchData;
          transformData.matchedText = matchText;
        }
      });

      // Set indentation amount for list types
      if (transformData) {
        transformData.indentationCount = listBlockIndentation;
      }
    });

    return transformData;
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

  getIndentationCountForText(matchedText) {
    let index = 0;
    let indentationCount = 0;
    while (matchedText.charAt(index) === '\t') {
      index += 1;
      indentationCount += 1;
    }
    return indentationCount;
  },

  isInt(value) {
    if (Number.isNaN(value)) return false;
    const floatValue = Number.parseFloat(value);
    return (floatValue | 0) === floatValue;
  },
};
