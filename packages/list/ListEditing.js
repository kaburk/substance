import annotationHelpers from '../../model/annotationHelpers'

class ListEditing {

  register(editing) {
    editing.defineMerge('list', 'textish', this.mergeTextIntoList.bind(this))
    editing.defineMerge('textish', 'list', this.mergeListIntoText.bind(this))
    editing.defineMerge('list', 'list', this.mergeListIntoList.bind(this))
    editing.defineBreak('list', this.breakList.bind(this))
  }

  mergeTextIntoList(tx, args) {
    console.log('TODO: merge text into list', args)
    return args
  }

  mergeListIntoText(tx, args) {
    console.log('TODO: merge list into text', args)
    return args
  }

  mergeListIntoList(tx, args) {
    // console.log('TODO: merge list into list', args)
    let first = args.first
    let second = args.second
    let container = tx.get(args.containerId)
    let sel = args.selection
    let direction = args.direction
    let newSel
    // if direction is left put the selection to last position of the previous list
    if (direction === 'left') {
      let path = [first.id, 'items', first.items.length-1, 'content']
      let text = tx.get(path)
      let startOffset = text.length
      newSel = sel.createWith({
        path: path,
        startOffset: startOffset,
        endOffset: startOffset
      })
    } else {
      newSel = sel
    }
    // delete the second list
    container.hide(second.id)
    second.items.forEach(function(id) {
      tx.update([first.id, 'items'], { insert: { offset: first.items.length, value: id } })
    })
    tx.delete(second.id)

    return {
      selection: newSel
    }
  }

  breakList(tx, args) {
    let container = tx.get(args.containerId)
    if (!container) {
      console.error('Invalid selection for break list')
      return args
    }

    let sel = args.selection
    let path = sel.path
    if (!path.length === 4) {
      console.error('Invalid selection for break list')
      return args
    }
    let list = tx.get(path[0])
    let startOffset = sel.startOffset
    let text = tx.get(path)
    let itemIdx = Number(path[2])
    if (startOffset === 0) {
      if (text.length === 0) {
        // break the list in two turning the current into a paragraph and set selection into new paragraph
        // NOTE: this is the only case where the selection is not in the next list item
        return this._splitList(tx, sel, container, list, itemIdx)
      } else {
        // insert a new empty list item at the current position and set the selection into the next item
        this._insertListItem(tx, list, itemIdx)
      }
    } else {
      if (startOffset < text.length) {
        // move the trailing chunk into a new list item
        this._breakListItem(tx, list, itemIdx, text, startOffset)
      } else {
        this._insertListItem(tx, list, itemIdx+1)
      }
    }
    return {
      selection: sel.createWith({
        path: [list.id, 'items', itemIdx+1, 'content'],
        startOffset: 0,
        endOffset: 0
      })
    }
  }

  _splitList(tx, sel, container, list, pivot) {
    // the first stay in the original list
    // the latter go into the new list
    let L = list.items.length
    let nodePos = container.getPosition(list.id)
    let newParagraph

    // empty list
    if (L < 2) {
      // replace the list with a paragraph
      container.hide(list.id)
      tx.delete(list.id)
      newParagraph = tx.createDefaultTextNode()
      container.show(newParagraph.id, nodePos)
    }
    // first or last item
    else if (pivot === 0 || pivot === L-1) {
      let insertPos = pivot === 0 ? nodePos : nodePos+1
      // remove the item
      tx.update([list.id, 'items'], { delete: { offset: pivot } })
      // create a paragraph
      newParagraph = tx.createDefaultTextNode()
      container.show(newParagraph.id, insertPos)
    }
    else {
      let tailItems = list.items.slice(pivot+1)
      // remove items from original list
      // ATTENTION: we need to do this backwards
      for (var i = L-1; i >= pivot; i--) {
        tx.update([list.id, 'items'], { delete: { offset: i} })
      }
      // create a new list with the tail items
      let newList = tx.create({
        type: 'list',
        items: tailItems
      })
      container.show(newList.id, nodePos+1)
      // create a new paragraph between the two lists
      newParagraph = tx.createDefaultTextNode()
      container.show(newParagraph.id, nodePos+1)
    }
    // put the cursor into new paragraph
    let newSel = sel.createWith({
      path: newParagraph.getTextPath(),
      startOffset: 0,
      endOffset: 0
    })
    return {
      selection: newSel
    }
  }

  _insertListItem(tx, list, pos) {
    let newItem = tx.create({
      type: 'list-item',
      content: '',
    })
    tx.update([list.id, 'items'], { insert: { offset: pos, value: newItem.id } })
  }

  _breakListItem(tx, list, itemIdx, text, offset) {
    // ATTENTION: the order is vital here, so that the reverse is valid too
    let oldItemId = list.items[itemIdx]
    // create the new item first
    let newItem = tx.create({
      type: 'list-item',
      content: text.slice(offset)
    })
    // transfer the annotations
    annotationHelpers.transferAnnotations(tx, [oldItemId, 'content'], offset, [newItem.id, 'content'], 0)
    // truncate the original item
    tx.update([oldItemId, 'content'], { delete: { start: offset, end: text.length } })
    // show the new list item
    tx.update([list.id, 'items'], { insert: { offset: itemIdx+1, value: newItem.id } })
  }

}

let listEditing = new ListEditing()

export default listEditing