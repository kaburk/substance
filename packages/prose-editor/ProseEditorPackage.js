import BasePackage from '../base/BasePackage'
import ParagraphPackage from '../paragraph/ParagraphPackage'
import HeadingPackage from '../heading/HeadingPackage'
import CodeblockPackage from '../codeblock/CodeblockPackage'
import BlockquotePackage from '../blockquote/BlockquotePackage'
import LinkPackage from '../link/LinkPackage'
import EmphasisPackage from '../emphasis/EmphasisPackage'
import StrongPackage from '../strong/StrongPackage'
import CodePackage from '../code/CodePackage'
import SubscriptPackage from '../subscript/SubscriptPackage'
import SuperscriptPackage from '../superscript/SuperscriptPackage'
import ProseArticle from './ProseArticle'

export default {
  name: 'prose-editor',
  configure: function(config) {
    config.defineSchema({
      name: 'prose-article',
      ArticleClass: ProseArticle,
      defaultTextType: 'paragraph'
    })
    // SwitchTextType, Undo/Redo etc.
    config.import(BasePackage)
    config.import(ParagraphPackage)
    config.import(HeadingPackage)
    config.import(CodeblockPackage)
    config.import(BlockquotePackage)
    config.import(EmphasisPackage)
    config.import(StrongPackage)
    config.import(SubscriptPackage)
    config.import(SuperscriptPackage)
    config.import(CodePackage)
    config.import(LinkPackage)
  }
}
