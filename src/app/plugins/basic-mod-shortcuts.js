/**
 * Add support for basic shortcuts with the modifier key.
 *
 * Supports bold, italic, underline
 */
export default {
  schema: {
    marks: {
      bold: {
        fontWeight: 'bold'
      },
      code: {
        fontFamily: 'monospace',
        backgroundColor: '#eee',
        padding: '3px',
        borderRadius: '4px'
      },
      italic: {
        fontStyle: 'italic'
      },
      underlined: {
        textDecoration: 'underline'
      }
    }
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
      default:
        return;
    }

    state = state
      .transform()
      .toggleMark(mark)
      .apply();

    e.preventDefault();
    return state;
  }
}
