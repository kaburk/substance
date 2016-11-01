import annotationHelpers from '../model/annotationHelpers'
import PropertySelection from '../model/PropertySelection'

/**
  Core editing implementation, that controls meta behavior
  such as deleting a selection, merging nodes, etc.

  Some of the implementation are then delegated to specific editing behaviors,
  such as manipulating content of a text-property, merging or breaking text nodes
 */
class Editing {

  constructor(editorSession, editingBehavior) {
    this.editorSession = editorSession
    this.editingBehavior = editingBehavior
  }

  delete(direction) {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this._transaction((tx) => {
      this._delete(tx, direction)
    }, { action: 'delete' })
  }

  break() {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this._transaction((tx) => {
      this._break(tx)
    }, { action: 'break' })
  }

  type(text) {
    let selection = this._getSelection()
    if (selection.isNull()) return
    this._transaction((tx) => {
      this._type(tx, text)
    }, { action: 'type' })
  }

  _getSelection() {
    return this.editorSession.getSelection()
  }

  _getSurface() {
    return this.editorSession.getFocusedSurface()
  }

  _transaction(fn) {
    let selection = this._getSelection()
    let surface = this._getSurface()
    this.editorSession.transaction((tx) => {
      tx.selection = selection
      tx.surfaceId = surface.id
      fn(tx)
      return {
        selection: tx.selection
      }
    })
  }

  _delete(tx, direction) {
    let sel = tx.selection
    // special implementation for node selections:
    // either delete the node (replacing with an empty text node)
    // or just move the cursor
    if (sel.isNodeSelection()) {
      if (sel.isFull() ||
          sel.isBefore() && direction === 'right' ||
          sel.isAfter() && direction === 'left' ) {
        // replace the node with default text node
        let nodeId = sel.getNodeId()
        let container = tx.get(sel.containerId)
        let nodePos = container.getPosition(nodeId)
        tx.update([container.id, 'nodes'], {delete: {offset: nodePos}})
        tx.delete(nodeId)
        let newNode = tx.createDefaultTextNode()
        tx.update([container.id, 'nodes'], {insert: {offset: nodePos, value: newNode.id}})
        tx.selection = PropertySelection.fromJSON({
          path: [],
          startOffset: 0,
          endOffset: 0,
          containerId: container.id,
          surfaceId: tx.surfaceId
        })
      } else {
        // just put the selection in the next or previous node
        // TODO: need to be implemented
      }
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    }
    // if the selection is collapsed this is the classical one-character deletion
    // either backwards (backspace) or forward (delete)
    else if (sel.isCollapsed()) {
      let path = sel.start.path
      let offset = sel.start.offset
      let text = tx.get(path)
      if (offset === 0 && direction === 'left') {
        // need to merge
        console.log('TODO: merge')
      } else if (offset === text.length && direction === 'right') {
        // need to merge
        console.log('TODO: merge')
      } else {
        // make sure we have the real path, e.g. in case of list items
        let realPath = tx.getRealPath(path)
        let start = offset
        if (direction === 'left') start = start-1
        let end = start+1
        // delete a single character
        tx.update(realPath, { delete: { start: start, end: end } })
        annotationHelpers.deletedText(tx, realPath, start, end)
        tx.selection = new PropertySelection({
          path: path,
          startOffset: start,
          containerId: sel.containerId,
          surfaceId: sel.surfaceId
        })
      }
    }
    // simple deletion of a range of characters
    else if (sel.isPropertySelection()) {
      // remove the selected text
      this._deletePropertySelection(tx, sel)
      tx.selection = new PropertySelection({
        path: sel.path,
        startOffset: sel.startOffset,
        containerId: sel.containerId,
        surfaceId: sel.surfaceId
      })
    }
    else if (sel.isContainerSelection()) {
      // truncate start and end node
      // delete all inner nodes
      // merge end into start
    }
  }

  _break(tx) {
    let sel = tx.selection
    if (sel.isNodeSelection()) {
      let containerId = sel.containerId
      let container = tx.get(containerId)
      let nodeId = sel.getNodeId()
      let nodePos = container.getPosition(nodeId)
      let textNode = tx.createDefaultTextNode()
      if (sel.isBefore()) {
        container.show(textNode, nodePos)
      } else if (sel.isAfter()) {
        container.show(textNode, nodePos+1)
      } else {
        container.hide(nodeId)
        tx.delete(nodeId)
        container.show(textNode, nodePos)
      }
    } else if (sel.isCustomSelection()) {
      // TODO: what to do with custom selections?
    } else if (sel.isCollapsed() || sel.isPropertySelection()) {
      let containerId = sel.containerId
      if (!sel.isCollapsed()) {
        // delete the selection
        this._deletePropertySelection(tx, sel)
        sel.collapse('left')
      }
      // then break the node
      if (containerId) {
        console.log('Break node...')
      }
    } else if (sel.isContainerSelection()) {
      // delete the selection
      this._deleteContainerSelection(tx, sel)
      // but don't merge, simply set the selection at the beginning of the second node
      //TODO set selection
    }
  }

  _type(tx, text) {
    console.log('TODO: type ', text)
  }

  _deletePropertySelection(tx, sel) {
    let realPath = tx.getRealPath(sel.path)
    let start = sel.startOffset
    let end = sel.endOffset
    tx.update(realPath, { delete: { start: start, end: end } })
    annotationHelpers.deletedText(tx, realPath, start, end)
  }

  _deleteContainerSelection(tx, sel) {
    // TODO
  }

}

export default Editing