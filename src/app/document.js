import React from 'react';
import BaseBehaviour from './plugins/base-behaviour';
import MarkdownMarks from './plugins/markdown-marks';
import MarkdownBlocks from './plugins/markdown-blocks';
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
        plugins={[MarkdownMarks, MarkdownBlocks, BaseBehaviour]}
        onChange={this.onChange}
      />
    );
  }
}
