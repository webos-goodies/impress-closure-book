goog.provide('tinyword.TreeNode');
goog.require('goog.string');
goog.require('goog.functions');
goog.require('goog.ui.tree.TreeNode');

/** @constructor */
tinyword.TreeNode = function(name, type, dsPath, opt_config, opt_domHelper) {
  goog.base(this, goog.string.htmlEscape(name), opt_config, opt_domHelper);
  this.fileType_ = type;
  this.dsPath_   = dsPath;
  this.sortKey   = (type == 'folder' ? '0' : '1') + name;
};
goog.inherits(tinyword.TreeNode, goog.ui.tree.TreeNode);

// ファイルタイプに応じてアイコンを変更
tinyword.TreeNode.prototype.getCalculatedIconClass = function() {
  if(this.fileType_ == 'folder' && !this.hasChildren()) {
    var config = this.getConfig();
    return config.cssTreeIcon + ' ' + config.cssCollapsedFolderIcon;
  } else {
    return goog.base(this, 'getCalculatedIconClass');
  }
};

// ルートノードならtrueを返す(つまり常にfalseを返す)
tinyword.TreeNode.prototype.isRootNode = goog.functions.FALSE;

// 対応するデータソースのパスを返す
tinyword.TreeNode.prototype.getDataSourcePath = function() {
  return this.dsPath_;
};

// フォルダなら"folder"、通常ファイルなら"file"を返す
tinyword.TreeNode.prototype.getFileType = function() {
  return this.fileType_;
};
