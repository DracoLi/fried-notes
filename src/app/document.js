import React from 'react'
import { Editor, Raw } from '../slate/index'
import BasicKeyboardShortcuts from './plugins/basic-keyboard-shortcuts'
import AutoMarkdownStyling from './plugins/auto-markdown-styling'

const initialState = Raw.deserialize({
  nodes: [
    {
      kind: 'block',
      type: 'paragraph',
      nodes: [
        {
          kind: 'text',
          text: 'A line of text in a paragraph.'
        }
      ]
    }
  ]
}, { terse: true })

export default class Document extends React.Component {

  state = {
    state: initialState
  }

  onChange(state) {
    this.setState({ state })
  }

  render() {
    return (
      <Editor
        state={this.state.state}
        plugins={[BasicKeyboardShortcuts, AutoMarkdownStyling]}
        onChange={state => this.onChange(state) }
      />
    )
  }
}
