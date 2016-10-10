export default {

  /**
   * Disable slate core's copy behaviour
   */
  onCopy(e, data, state) {
    return state;
  },

  /**
   * Disable tabs in the editor
   */
  onKeyDown(e, data, state) {
    if (data.key === 'tab') {
      e.preventDefault();
      return state;
    }
  },
};
