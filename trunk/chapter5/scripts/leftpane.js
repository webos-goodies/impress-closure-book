goog.provide('tinyword.LeftPane');
goog.require('goog.dom.classes');
goog.require('goog.ui.Component');
goog.require('goog.ui.Toolbar');
goog.require('goog.ui.ToolbarMenuButton');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuItem');
goog.require('goog.array');
goog.require('tinyword.TreeControl');
goog.require('goog.ui.PopupMenu');

/** @constructor */
tinyword.LeftPane = function(opt_domHelper) {
  goog.base(this, opt_domHelper)

  // ツールバーの作成
  this.toolbar_ = new goog.ui.Toolbar(
    goog.ui.ToolbarRenderer.getInstance(),
    goog.ui.Container.Orientation.HORIZONTAL, opt_domHelper);
  this.addChild(this.toolbar_);

  // ツリーコントロールの作成
  this.treeControl_ = new tinyword.TreeControl(false, opt_domHelper);
  this.addChild(this.treeControl_);

  // コンテキストメニューの作成
  this.contextMenu_ = new goog.ui.PopupMenu(opt_domHelper);
  this.contextMenu_.setId('popup-file-menu');
};
goog.inherits(tinyword.LeftPane, goog.ui.Component);

// CSSクラスの定義
tinyword.LeftPane.CLASS_NAME_ = goog.getCssName('leftpane');

tinyword.LeftPane.TREE_CLASS_NAME_ =
  goog.getCssName(tinyword.LeftPane.CLASS_NAME_, 'tree');

// decoreate()可能かどうかを返す
tinyword.LeftPane.prototype.canDecorate = function(element) {
  var dom       = this.getDomHelper();
  var toolbarEl = dom.getElementsByTagNameAndClass(
    'div', goog.ui.ToolbarRenderer.CSS_CLASS, element)[0];
  return (toolbarEl && this.toolbar_.canDecorate(toolbarEl));
};

// HTMLをコンポーネントに変換
tinyword.LeftPane.prototype.decorateInternal = function(element) {
  goog.base(this, 'decorateInternal', element);
  goog.dom.classes.add(element, tinyword.LeftPane.CLASS_NAME_);

  // ツールバーを初期化
  var dom       = this.getDomHelper();
  var toolbarEl = dom.getElementsByTagNameAndClass(
    'div', goog.ui.ToolbarRenderer.CSS_CLASS, element)[0];
  if(!toolbarEl) {
    toolbarEl = dom.createDom('div', goog.ui.ToolbarRenderer.CSS_CLASS);
    dom.appendChild(element, toolbarEl);
  }
  this.toolbar_.decorate(toolbarEl);

  // メニューボタンを作成
  var fileMenu = new goog.ui.Menu(dom);
  fileMenu.setId('toolbar-file-menu');
  this.buildItemsForFileMenu_(fileMenu);

  var fileBtn = new goog.ui.ToolbarMenuButton(
    'ファイル', fileMenu, goog.ui.ToolbarMenuButtonRenderer.getInstance(), dom);
  this.toolbar_.addChild(fileBtn, true);

  // ツリーコントロールを初期化
  var treeEl = dom.getElementsByTagNameAndClass(
    'div', tinyword.LeftPane.TREE_CLASS_NAME_)[0];
  if(!treeEl) {
    treeEl = dom.createDom('div', tinyword.LeftPane.TREE_CLASS_NAME_);
    dom.appendChild(element, treeEl);
  }
  this.treeControl_.createDom();
  dom.appendChild(treeEl, this.treeControl_.getElement());

  // コンテキストメニューを初期化
  this.buildItemsForFileMenu_(this.contextMenu_);
  this.contextMenu_.render();
};

// DOM要素を作成
tinyword.LeftPane.prototype.createDom = function() {
  this.decorateInternal(this.getDomHelper().createDom('div'));
};

// ドキュメントに追加された時の処理
tinyword.LeftPane.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  var handler = this.getHandler();
  handler.listen(
    this.toolbar_,
    goog.ui.Component.EventType.ACTION, this.onSelectMenuItem_);
  handler.listen(
    this.toolbar_, goog.ui.Menu.EventType.SHOW, this.onShowMenu_);

  this.contextMenu_.attach(
    this.treeControl_.getElement().parentNode, undefined, undefined, true);
  handler.listen(
    this.contextMenu_,
    goog.ui.Component.EventType.ACTION, this.onSelectMenuItem_);
  handler.listen(
    this.contextMenu_, goog.ui.Menu.EventType.SHOW, this.onShowMenu_);
};

// ドキュメントから削除された時の処理
tinyword.LeftPane.prototype.exitDocument = function() {
  this.contextMenu_.detachAll();
  goog.base(this, 'exitDocument');
};

// インスタンス削除時の処理
tinyword.LeftPane.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  if(this.contextMenu_)
    this.contextMenu_.dispose();
  this.contextMenu_ = null;
};

// メニュー項目の作成
tinyword.LeftPane.prototype.buildItemsForFileMenu_ = function(menu) {
  var data = [
    ['newfolder', '新規フォルダ'],
    ['rename',    '名前変更'],
    ['delete',    '削除']];

  var dom = menu.getDomHelper();
  goog.array.forEach(data, function(entry) {
    var item = new goog.ui.MenuItem(entry[1], null, dom);
    item.setId(entry[0]);
    menu.addChild(item, true);
  }, this);
};

// メニュー選択時の処理
tinyword.LeftPane.prototype.onSelectMenuItem_ = function(e) {
  switch(e.target.getId()) {
  case 'newfolder': this.onNewFolder_(e); break;
  case 'rename':    this.onRename_(e);    break;
  case 'delete':    this.onDelete_(e);    break;
  }
};

// 「新規フォルダ」の処理
tinyword.LeftPane.prototype.onNewFolder_ = function(e) {
  var treeNode = this.treeControl_.getSelectedItem();
  if(treeNode && treeNode.getFileType() == 'folder') {
    var parentPath = treeNode.getDataSourcePath();
    var parentNode = goog.ds.Expr.create(parentPath).getNode();
    var entryNode  = parentNode && parentNode.getChildNode('entry', true);
    entryNode.setChildNode(
      'f' + Math.random(), { '#text':'新規フォルダ', '@type':'folder' });
  }
};

// 「名前変更」の処理
tinyword.LeftPane.prototype.onRename_ = function(e) {
  var treeNode = this.treeControl_.getSelectedItem();
  if(treeNode && !treeNode.isRootNode()) {
    var path = treeNode.getDataSourcePath();
    var node = goog.ds.Expr.create(path).getNode();
    var name = node.getChildNodeValue('#text');
    if(name = window.prompt('新しい名前を指定してください。', name)) {
      node.setChildNode('#text', name);
    }
  }
};

// 「削除」の処理
tinyword.LeftPane.prototype.onDelete_ = function(e) {
  var treeNode = this.treeControl_.getSelectedItem();
  if(treeNode && !treeNode.hasChildren() && !treeNode.isRootNode()) {
    var expr   = goog.ds.Expr.create(treeNode.getDataSourcePath());
    var node   = expr.getNode();
    var parent = expr.getParent().getNode();
    if(node && parent)
      parent.setChildNode(node.getDataName(), null);
  }
};

// メニュー項目の状態を設定
tinyword.LeftPane.prototype.onShowMenu_ = function(e) {
  var menu = e.target;
  if(/-file-menu$/.test(menu.getId())) {
    var node = this.treeControl_.getSelectedItem();
    var sub  = node && !node.isRootNode();
    menu.getChild('newfolder').setEnabled(node && node.getFileType() == 'folder');
    menu.getChild('rename').setEnabled(sub);
    menu.getChild('delete').setEnabled(sub && !node.hasChildren());
  }
};

// リサイズ時の処理
tinyword.LeftPane.prototype.resize = function(size) {
  var toolbarSize = goog.style.getBorderBoxSize(this.toolbar_.getElement());
  var treeSize    = Math.max(size.height - toolbarSize.height - 2, 0);
  goog.style.setStyle(
    this.treeControl_.getElement().parentNode, 'height', treeSize + 'px');
};
