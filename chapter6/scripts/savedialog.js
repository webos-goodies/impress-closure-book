goog.provide('tinyword.SaveDialog');
goog.require('goog.dom.TagName');
goog.require('goog.events.Event');
goog.require('goog.ui.editor.AbstractDialog');
goog.require('goog.ui.editor.AbstractDialog.Builder');
goog.require('goog.ui.editor.AbstractDialog.EventType');
goog.require('tinyword.TreeControl');

/** @constructor */
tinyword.SaveDialog = function(domHelper) {
  goog.base(this, domHelper);
};
goog.inherits(tinyword.SaveDialog, goog.ui.editor.AbstractDialog);

// ダイアログのクライアント領域のクラス名
tinyword.SaveDialog.CLASS_NAME_ = goog.getCssName('savedlg');

// ファイル名フィールドのクラス名
tinyword.SaveDialog.FNAME_CLASS_NAME_ =
  goog.getCssName(tinyword.SaveDialog.CLASS_NAME_, 'fname');

// ディレクトリ選択ツリービューの親DIVのクラス名
tinyword.SaveDialog.TREE_CLASS_NAME_ =
  goog.getCssName(tinyword.SaveDialog.CLASS_NAME_, 'tree');

// ダイアログコンポーネントを作成
tinyword.SaveDialog.prototype.createDialogControl = function() {
  var builder = new goog.ui.editor.AbstractDialog.Builder(this);
  this.input_ = this.dom.createDom(
    'input', tinyword.SaveDialog.FNAME_CLASS_NAME_);
  var el = this.dom.createDom(
    'div', tinyword.SaveDialog.CLASS_NAME_, [
      this.dom.createDom('div', null, ['ファイル名 ', this.input_]),
      this.dom.createDom('div', tinyword.SaveDialog.TREE_CLASS_NAME_)]);
  builder.setTitle('文章の保存');
  builder.setContent(el);
  var dialog = builder.build();

  this.tree_ = new tinyword.TreeControl(true, this.dom);
  dialog.addChild(this.tree_);
  this.tree_.render(this.dom.getElementsByTagNameAndClass(
    'div', tinyword.SaveDialog.TREE_CLASS_NAME_, el)[0]);

  return dialog;
};

// OKボタンが押された時の処理
tinyword.SaveDialog.prototype.createOkEvent = function(e) {
  if(!this.getFileName()) {
    alert("ファイル名を指定してください。");
  } else if(!this.getParentPath()) {
    alert("保存先フォルダを指定してください。") ;
  } else {
    return new goog.events.Event(
      goog.ui.editor.AbstractDialog.EventType.OK, this);
  }
  return null;
};

// アクセサメソッド
tinyword.SaveDialog.prototype.getParentPath = function() {
  var selectedNode = this.tree_.getSelectedItem();
  if(selectedNode && selectedNode.getFileType() == 'folder')
    return selectedNode.getDataSourcePath();
  return null;
};

tinyword.SaveDialog.prototype.getFileName = function() {
  return this.input_.value;
};
