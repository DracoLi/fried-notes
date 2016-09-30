import React from 'react';
import BasicKeyboardShortcuts from './plugins/basic-keyboard-shortcuts';
import AutoMarkdownStyling from './plugins/auto-markdown-styling';
import { Editor, Raw } from '../slate/index';

const initialState = Raw.deserialize({
  nodes: [
    {
      kind: 'block',
      type: 'paragraph',
      nodes: [
        {
          kind: 'text',
          text: 'A line of text in a paragraph.',
        },
      ],
    },
  ],
}, { terse: true });

export default class Document extends React.Component {

  constructor(props) {
    super(props);
    window.main = this;
    this.onChange = this.onChange.bind(this);
  }

  state = {
    state: initialState,
  }

  onChange(state) {
    this.setState({ state });
  }

  render() {
    return (
      <Editor
        state={this.state.state}
        plugins={[BasicKeyboardShortcuts, AutoMarkdownStyling]}
        onChange={this.onChange}
      />
    );
  }
}
