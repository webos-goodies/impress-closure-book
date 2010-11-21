goog.provide('tinyword.Editor');
goog.require('goog.editor.Command');
goog.require('goog.editor.Field');
goog.require('goog.editor.plugins.BasicTextFormatter');
goog.require('goog.editor.plugins.EnterHandler');
goog.require('goog.editor.plugins.HeaderFormatter');
goog.require('goog.editor.plugins.ListTabHandler');
goog.require('goog.editor.plugins.RemoveFormatting');
goog.require('goog.editor.plugins.SpacesTabHandler');
goog.require('goog.editor.plugins.UndoRedo');
goog.require('goog.editor.plugins.LinkDialogPlugin');
goog.require('goog.ui.editor.DefaultToolbar');
goog.require('goog.ui.editor.ToolbarController');
goog.require('goog.ui.editor.ToolbarFactory');
goog.require('tinyword.MapsPlugin');
goog.require('tinyword.SaveDialogPlugin');
goog.require('tinyword.NewFilePlugin');

/** @constructor */
tinyword.Editor = function(component, parentEl, opt_domHelper) {
  this.dom_          = opt_domHelper || goog.dom.getDomHelper();
  this.toolbarId_    = component.makeId('toolbar');
  this.fieldId_      = component.makeId('editor');
  this.userModified_ = false;

// ツールバー、エディタを配置するDIVを作成
  this.dom_.appendChild(
    parentEl, this.dom_.createDom('div', { 'id': this.toolbarId_ }));
  this.dom_.appendChild(
    parentEl, this.dom_.createDom('div', { 'id': this.fieldId_ }));

  // 親クラスのコンストラクタを呼び出す
  goog.base(this, this.fieldId_, this.dom_.getDocument());

  // プラグインを登録
  this.registerPlugin(new goog.editor.plugins.BasicTextFormatter());
  this.registerPlugin(new goog.editor.plugins.RemoveFormatting());
  this.registerPlugin(new goog.editor.plugins.UndoRedo());
  this.registerPlugin(new goog.editor.plugins.ListTabHandler());
  this.registerPlugin(new goog.editor.plugins.SpacesTabHandler());
  this.registerPlugin(new goog.editor.plugins.EnterHandler());
  this.registerPlugin(new goog.editor.plugins.LinkDialogPlugin());
  this.registerPlugin(new goog.editor.plugins.HeaderFormatter());
  this.registerPlugin(new tinyword.MapsPlugin());
  this.registerPlugin(new tinyword.SaveDialogPlugin());
  this.registerPlugin(new tinyword.NewFilePlugin());

  // Googleマッププラグイン用のボタンを作成
  var mapButton = goog.ui.editor.ToolbarFactory.makeButton(
    tinyword.MapsPlugin.Command.MAP,
    'Googleマップを挿入', '地図', 'tinyword-map-btn', null, this.dom_);

  // 保存ダイアログプラグイン用のボタンを作成
  var saveButton = goog.ui.editor.ToolbarFactory.makeButton(
    tinyword.SaveDialogPlugin.Command.SAVE_DIALOG,
    '保存', '保存', 'tinyword-save-btn', null, this.dom_);

  saveButton.queryable = true;
  saveButton.updateFromValue = function(value) {
    this.setEnabled(value);
  };

  // 新規プラグイン用のボタンを作成
  var newFileButton = goog.ui.editor.ToolbarFactory.makeButton(
    tinyword.NewFilePlugin.Command.NEW_FILE,
    '新規ファイルを編集', '新規', 'tinyword-new-file-btn', null, this.dom_);

  // ツールバーを作成する
  var buttons = [
    newFileButton,
    saveButton,
    goog.editor.Command.BOLD,
    goog.editor.Command.ITALIC,
    goog.editor.Command.UNDERLINE,
    goog.editor.Command.FONT_COLOR,
    goog.editor.Command.BACKGROUND_COLOR,
    goog.editor.Command.FORMAT_BLOCK,
    goog.editor.Command.FONT_FACE,
    goog.editor.Command.FONT_SIZE,
    goog.editor.Command.LINK,
    goog.editor.Command.UNDO,
    goog.editor.Command.REDO,
    goog.editor.Command.UNORDERED_LIST,
    goog.editor.Command.ORDERED_LIST,
    goog.editor.Command.INDENT,
    goog.editor.Command.OUTDENT,
    goog.editor.Command.JUSTIFY_LEFT,
    goog.editor.Command.JUSTIFY_CENTER,
    goog.editor.Command.JUSTIFY_RIGHT,
    goog.editor.Command.SUBSCRIPT,
    goog.editor.Command.SUPERSCRIPT,
    goog.editor.Command.STRIKE_THROUGH,
    goog.editor.Command.REMOVE_FORMAT,
    mapButton];

  goog.ui.editor.DefaultToolbar.setLocale('ja');
  this.toolbar_ = goog.ui.editor.DefaultToolbar.makeToolbar(
    buttons, goog.dom.getElement(this.toolbarId_));

  this.toolbarController_ =
    new goog.ui.editor.ToolbarController(this, this.toolbar_);

  // エディタを編集可能にする
  this.makeEditable();
};
goog.inherits(tinyword.Editor, goog.editor.Field);

// インスタンス削除時の処理
tinyword.Editor.prototype.disposeInternal = function() {
  this.toolbarController_.dispose();
  this.toolbarController_ = null;
  this.toolbar_           = null;
  goog.base(this, 'disposeInternal');
};

// リサイズの処理
tinyword.Editor.prototype.resize = function(size) {
  var toolbarEl   = this.dom_.getElement(this.toolbarId_);
  var toolbarSize = goog.style.getBorderBoxSize(toolbarEl).height;
  var editorSize  = Math.max(size.height - toolbarSize, 0);
  goog.style.setStyle(
    this.dom_.getElement(this.fieldId_), 'height', editorSize + 'px');
};

// 変更フラグの制御
tinyword.Editor.prototype.handleChange = function() {
  goog.base(this, 'handleChange');
  this.setUserModified(true);
};

tinyword.Editor.prototype.isUserModified = function() {
  return this.userModified_;
};

tinyword.Editor.prototype.setUserModified = function(value) {
  var change         = this.userModified_ != !!value;
  this.userModified_ = !!value;
  if(change) {
    this.dispatchCommandValueChange(
      [tinyword.SaveDialogPlugin.Command.SAVE_DIALOG]);
  }
};

// 編集中のパス名
tinyword.Editor.prototype.getFilePath = function() {
  return this.filePath_;
};

tinyword.Editor.prototype.setFilePath = function(path) {
  this.filePath_ = path;
};

// 文書ファイルの読み込み
tinyword.Editor.prototype.loadFile = function(path) {
  if(path != this.filePath_) {
    var node = goog.ds.Expr.create(path).getNode();
    if(node) {
      this.setHtml(false, node.getChildNodeValue('@content') || '', true);
      this.filePath_ = node.getDataPath();
      this.setUserModified(false);
    }
  }
};
