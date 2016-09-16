import React from 'react'
import { Editor, Raw } from '../slate/index'
import BasicRichText from './plugins/basic-mod-shortcuts'

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
        plugins={[BasicRichText]}
        onChange={state => this.onChange(state) }
      />
    )
  }
}
