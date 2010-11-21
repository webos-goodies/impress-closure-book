goog.provide('tinyword.NewFilePlugin');
goog.provide('tinyword.NewFilePlugin.COMMAND');
goog.require('goog.editor.Plugin');

/** @constructor */
tinyword.NewFilePlugin = function() {
  goog.base(this);
};
goog.inherits(tinyword.NewFilePlugin, goog.editor.Plugin);

// コマンドの定義
tinyword.NewFilePlugin.Command = { NEW_FILE: 'newFile' };

// プラグインIDの取得
tinyword.NewFilePlugin.prototype.getTrogClassId =
  goog.functions.constant('NewFilePlugin');

// サポートするコマンドかどうかをテスト
tinyword.NewFilePlugin.prototype.isSupportedCommand = function(command) {
  return command == tinyword.NewFilePlugin.Command.NEW_FILE;
};

// コマンドの実行
tinyword.NewFilePlugin.prototype.execCommandInternal =
  function(command, var_args)
{
  var editor = this.fieldObject;
  if(command == tinyword.NewFilePlugin.Command.NEW_FILE &&
     (!editor.isUserModified() ||
      window.confirm('現在の編集内容を破棄しますか?')))
  {
    editor.setHtml(false, '', true);
    editor.setFilePath(null);
    editor.setUserModified(false);
  }
};
