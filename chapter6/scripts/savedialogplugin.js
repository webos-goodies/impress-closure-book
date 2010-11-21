goog.provide('tinyword.SaveDialogPlugin');
goog.provide('tinyword.SaveDialogPlugin.Command');
goog.require('goog.json');
goog.require('goog.functions');
goog.require('goog.ds.Expr');
goog.require('goog.editor.plugins.AbstractDialogPlugin');
goog.require('goog.editor.range');
goog.require('goog.ui.editor.AbstractDialog.EventType');
goog.require('tinyword.SaveDialog');

/** @constructor **/
tinyword.SaveDialogPlugin = function() {
  goog.base(this, tinyword.SaveDialogPlugin.Command.SAVE_DIALOG);
  this.setReuseDialog(true);
};
goog.inherits(tinyword.SaveDialogPlugin, goog.editor.plugins.AbstractDialogPlugin);

// コマンドの定義
tinyword.SaveDialogPlugin.Command = { SAVE_DIALOG: 'saveDialog' };

// プラグインIDの取得
tinyword.SaveDialogPlugin.prototype.getTrogClassId =
  goog.functions.constant('SaveDialog');

// ダイアログの作成
tinyword.SaveDialogPlugin.prototype.createDialog = function(dialogDomHelper) {
  var dialog = new tinyword.SaveDialog(dialogDomHelper);
  dialog.addEventListener(
    goog.ui.editor.AbstractDialog.EventType.OK, this.handleOk_, false, this);
  return dialog;
};

// OKボタンの処理
tinyword.SaveDialogPlugin.prototype.handleOk_ = function(e) {
  var dialog = e.target;
  if(dialog) {
    var parentNode = goog.ds.Expr.create(dialog.getParentPath()).getNode();
    if(parentNode && parentNode.getChildNodeValue('@type') == 'folder') {
      var entryNode = parentNode && parentNode.getChildNode('entry', true);
      if(entryNode) {
        entryNode.setChildNode('f' + Math.random(), {
          '#text':    dialog.getFileName()||'',
          '@type':    'file',
          '@content': this.fieldObject.getCleanContents()
        });
        this.fieldObject.setUserModified(false);
      }
    }
  }
};

// コマンドの状態を返す
tinyword.SaveDialogPlugin.prototype.queryCommandValue = function(command) {
  return this.fieldObject.isUserModified();
};

// すでに保存先が決まっている場合はダイアログを出さない
tinyword.SaveDialogPlugin.prototype.execCommandInternal = function(command) {
  var path = this.fieldObject.getFilePath();
  if(path) {
    var node = goog.ds.Expr.create(path).getNode();
    if(node && node.getChildNodeValue('@type') == 'file') {
      node.setChildNode('@content', this.fieldObject.getCleanContents());
      this.fieldObject.setUserModified(false);
    } else {
      goog.base(this, 'execCommandInternal');
    }
  } else {
    goog.base(this, 'execCommandInternal');
  }
};
