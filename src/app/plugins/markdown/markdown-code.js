// import loglevel from 'loglevel';
// import corePlugin from '~/slate/plugins/core';

// const slateCore = corePlugin();
// const log = loglevel.getLogger('markdown-marks');
// log.info('[Plugin] \'markdown-code\' applied');

// /**
//  * Handle markdown code formatting via `` wrap and ``` blocks.
//  */
// export default {
//   schema: {
//     nodes: {
//       'code': props => <pre {...props.attributes}><code>{props.children}</code></pre>,
//     },
//     marks: {
//       code: {
//         fontFamily: 'monospace',
//         backgroundColor: '#eee',
//         padding: '3px',
//         borderRadius: '4px',
//       }
//     },
//   },

//   onKeyDown(e, data, state) {
//     switch (data.key) {
//       case 'enter': return this.onKeyDownEnter(e, data, state);
//       case 'backspace': return this.onKeyDownBackspace(e, data, state);
//       case 'delete': return this.onKeyDownDelete(e, data, state);
//       case 'tab': return this.onKeyDownTab(e, data, state);
//     }
//   },

//   onKeyDownEnter(e, data, state) {
//     tildaCharCountInBlock(state.texts)
//     const stateAfterCore = slateCore.onKeyDownEnter(e, data, state) || state;
//     return stateAfterCodeFormatting(e, data, slate);
//   },

//   onKeyDownBackspace(e, data, state) {
//     const stateAfterCore = slateCore.onKeyDownBackspace(e, data, state) || state;
//     return stateAfterCodeFormatting(e, data, slate);
//   },

//   onKeyDownDelete(e, data, state) {
//     const stateAfterCore = slateCore.onKeyDownDelete(e, data, state) || state;
//     return stateAfterCodeFormatting(e, data, slate);
//   },

//   onKeyDownTab(e, data, state) {
//     // TODO: tab support in a code block
//   },

//   tildaCharCountInBlock(block) {
//     let tildaCount = 0;
//     for (let oneChar of block.text) {
//       if (oneChar === '`') {
//         tildaCount += 1;
//       }
//     }
//     return tildaCount;
//   }

//   stateAfterCodeFormatting(e, data, state) {
//     const stateAfterMarks = stateAfterInlineCodeMarks(e, data, state) || state;
//     return stateAfterCodeBlocks(e, data, state) || stateAfterMarks;
//   }

//   stateAfterInlineCodeMarks(e, data, state) {
//     const { selection, startBlock, endBlock } = state;
//     const blocktext = startBlock.text;
//     let tildaCount = 0;
//     const transform = state.transform();
//     const selectionRange = selection.moveToRangeOf(startBlock, endBlock);
//     transform.removeMarkAtRange(selectionRange, 'code');
//     for (let charIndex in blockText) {
//       const oneChar = blockText[charIndex];
//       if (oneChar !== '`') continue;
//       tildaCount += 1;
//       if (tildaCount % 2 === 0) {
//         const markSelection = selection.moveToOffsets(lastTildaIndex, charIndex + 1);
//         transform.addMarkAtRange(targetSelection, 'code')
//       }
//       lastTildaIndex = charIndex;
//     }
//     return transform.apply();
//   },

//   stateAfterCodeBlocks(e, data, state) {

//   }

//   onBeforeInput(e, data, state, editor) {
//     const stateAfterCore = slateCore.onBeforeInput(e, data, state, editor) || state;
//     return this.stateAfterMarkDownMarks(e, stateAfterCore);
//   },

//   stateAfterMarkDownMarks(e, state) {
//     if (e.data !== '`') return;

//     const { selection, startBlock } = state;
//     const blockText = startBlock.text;

//     // Pass if somehow last char is not tilda
//     if (blockText[blockText.length - 1] !== '`') return;

//     let tildaCount = 0;
//     let textIndex = -1;
//     let lastTildaIndex = 0;
//     log.info(`handling code mark: ${blockText}`);
//     for (let char of blockText) {
//       textIndex += 1;
//       if (char !== '`') continue;
//       const isLastChar = textIndex === blockText.length - 1;
//       tildaCount += 1;
//       log.info(`tildaCount ${tildaCount}, isLastChar ${isLastChar}, textIndex ${textIndex}, totalLength ${blockText.length}`);
//       if (isLastChar && tildaCount % 2 === 0) {
//         const targetSelection = selection.moveToOffsets(lastTildaIndex, textIndex + 1);
//         return state
//           .transform()
//           .addMarkAtRange(targetSelection, 'code')
//           .removeMark('code')
//           .apply();
//       } else {
//         lastTildaIndex = textIndex;
//       }
//     }
//   }
// };
