import loglevel from 'loglevel';

const log = loglevel.getLogger('formatting-inline');
log.info('[Plugin] \'formatting-inline\' applied');

/**
 * Add support for inline formatting shortcuts.
 *
 * Supports bold, italic, strikethrough, and underline.
 */
export default {
  schema: {
    marks: {
      bold: {
        fontWeight: 'bold',
      },
      italic: {
        fontStyle: 'italic',
      },
      underlined: {
        textDecoration: 'underline',
      },
      strikethrough: {
        textDecoration: 'line-through',
      }
    },
  },

  onKeyDown(e, data, state) {
    if (!data.isMod) return;
    let mark;
    switch (data.key) {
      case 'b':
        mark = 'bold';
        break;
      case 'i':
        mark = 'italic';
        break;
      case 'u':
        mark = 'underlined';
        break;
      case 's':
        if (data.isModAlt) {
          mark = 'strikethrough';
        }
        break;
      default:
        return;
    }

    const newState = state
      .transform()
      .toggleMark(mark)
      .apply();
    e.preventDefault();
    return newState;
  },
};
