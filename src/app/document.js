import React from 'react';
import BaseBehaviour from './plugins/base-behaviour';
import FormattingInline from './plugins/formatting/formatting-inline';
import MarkdownHeadingsAndLists from './plugins/markdown/markdown-headings-and-lists';
import MarkdownDivider from './plugins/markdown/markdown-divider';
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
        plugins={[FormattingInline,
                  MarkdownHeadingsAndLists,
                  MarkdownDivider,
                  BaseBehaviour]}
        onChange={this.onChange}
      />
    );
  }
}
