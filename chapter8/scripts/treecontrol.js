goog.provide('tinyword.TreeControl');
goog.require('goog.ui.tree.TreeControl');
goog.require('goog.object');
goog.require('tinyword.TreeNode');
goog.require('goog.string');
goog.require('goog.array');
goog.require('goog.functions');
goog.require('goog.ds.DataManager');
goog.require('goog.ds.Expr');

/** @constructor */
tinyword.TreeControl = function(opt_folderOnly, opt_domHelper) {
  this.folderOnly_ = opt_folderOnly;

  var config = goog.object.clone(goog.ui.tree.TreeControl.defaultConfig);
  config.cleardotPath = 'files/closure-library/images/tree/cleardot.gif'; // 書籍とはパスが違います
  goog.base(this, '/', config, opt_domHelper);

  // ファイルツリーを構築
  this.dsPath_ = '$' + tinyword.App.DS_ROOT;
  this.nodes_  = {};
  this.nodes_[this.dsPath_] = this;

  var dm = goog.ds.DataManager.getInstance();
  this.loadFromDataNode_(this, dm.getChildNode(this.dsPath_));

  // データソースの更新を監視
  this.callback_ = goog.bind(this.onTreeChanged_, this);
  dm.addListener(this.callback_, this.dsPath_ + '/...');
};
goog.inherits(tinyword.TreeControl, goog.ui.tree.TreeControl);

// インスタンス削除時の処理
tinyword.TreeControl.prototype.disposeInternal = function() {
  goog.ds.DataManager.getInstance().removeListeners(this.callback_);
  goog.base(this, 'disposeInternal');
};

// データソースからファイルツリーを構築
tinyword.TreeControl.prototype.loadFromDataNode_ =
  function(parentTreeNode, parentDataNode)
{
  var entryNode = parentDataNode.getChildNode('entry');

  var nodeList = entryNode && entryNode.get();
  if(nodeList) {
    var treeNodes = [], treeNode, dataNode;
    for(var i = 0, l = nodeList.getCount() ; i < l ; ++i) {
      dataNode = nodeList.getByIndex(i);
      if(dataNode) {
        treeNode = this.createNode_(dataNode);
        if(treeNode) {
          treeNodes.push(treeNode);
          if(treeNode.getFileType() == 'folder')
            this.loadFromDataNode_(treeNode, dataNode);
        }
      }
    }
    treeNodes.sort(function(a, b) {
      return goog.string.numerateCompare(a.sortKey, b.sortKey);
    });
    goog.array.forEach(treeNodes, function(treeNode) {
      parentTreeNode.add(treeNode);
    }, this);
  }
};

// データソースのノードからツリーノードを生成
tinyword.TreeControl.prototype.createNode_ = function(dataNode) {
  var type = dataNode.getChildNodeValue('@type') || '';
  var text = dataNode.getChildNodeValue('#text') || '';
  var path = dataNode.getDataPath();
  if(this.folderOnly_ && type != 'folder')
    return null;
  var node = new tinyword.TreeNode(
    text, type, path, this.getConfig(), this.getDomHelper());
  this.nodes_[path] = node;
  return node;
};

// データソース更新時の処理
tinyword.TreeControl.prototype.onTreeChanged_ = function(dataPath) {
  dataPath     = dataPath.replace(/\/[#@][^\/]+$/g, '');
  var expr     = goog.ds.Expr.create(dataPath);
  var dataNode = expr.getNode();
  var treeNode = this.nodes_[dataPath];
  if(dataNode) {
    if(treeNode) {
      // 名前変更
      treeNode.setText(dataNode.getChildNodeValue('#text') || '');
    } else if(!this.folderOnly_ ||
              dataNode.getChildNodeValue('@type') == 'folder') {
      // 新規ノードの追加
      var parent = this.nodes_[expr.getParent().getParent().getSource()];
      if(parent)
        parent.add(this.createNode_(dataNode));
    }
  } else if(treeNode) {
    // ノードの削除
    var parent = this.nodes_[expr.getParent().getParent().getSource()];
    if(parent) {
      parent.removeChild(treeNode);
      delete this.nodes_[dataPath];
    }
  }
};

// 以下、tinyword.TreeNodeと互換性を保つためのメソッド
tinyword.TreeControl.prototype.isRootNode = goog.functions.TRUE;

tinyword.TreeControl.prototype.getDataSourcePath = function() {
  return this.dsPath_;
};

tinyword.TreeControl.prototype.getFileType = function() {
  return 'folder';
};

// ファイルを開いた時のイベント
tinyword.TreeControl.EventType = { SELECT_FILE: 'selectfile' };

tinyword.TreeControl.prototype.dispatchSelectFile = function() {
  var selectedNode = this.getSelectedItem();
  if(selectedNode && selectedNode.getFileType() == 'file') {
    this.dispatchEvent(tinyword.TreeControl.EventType.SELECT_FILE);
    return true;
  }
  return false;
};

// ドキュメントに挿入された時の処理
tinyword.TreeControl.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var el = this.getElement();
  var kh = this.keyHandler_ = new goog.events.KeyHandler(el);
  this.getHandler().
  listen(el, goog.events.EventType.DBLCLICK,       this.onDblClick_).
  listen(kh, goog.events.KeyHandler.EventType.KEY, this.onKey_);
};

tinyword.TreeControl.prototype.onDblClick_ = function(e) {
  this.dispatchSelectFile();
};

tinyword.TreeControl.prototype.onKey_ = function(e) {
  if(e.keyCode == goog.events.KeyCodes.ENTER && this.dispatchSelectFile())
    e.preventDefault();
};
