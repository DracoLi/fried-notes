/**
 * Add support for basic shortcuts with the modifier key.
 *
 * Supports bold, italic, strikethrough and underline.
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
      },
      strikethrough: {
        textDecoration: 'line-through'
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
      case 's':
        if (data.isModAlt) {
          mark = 'strikethrough';
        }
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
