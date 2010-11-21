goog.provide('tinyword.App');
goog.require('goog.events.EventHandler');
goog.require('goog.ds.DataManager');
goog.require('goog.ds.JsDataSource');
goog.require('goog.ui.SplitPane');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('tinyword.LeftPane');
goog.require('tinyword.RightPane');

/** @constructor */
tinyword.App = function() {
  this.initialize_(tinyword.App.dummyData_);
};
goog.addSingletonGetter(tinyword.App);

// ダミーのフォルダツリー情報
tinyword.App.dummyData_ = {
  "@type": "folder", "entry": {
    "f1": {
      "#text": "フォルダ1", "@type": "folder", "entry": {
        "f4": { "#text": "サブフォルダ", "@type": "folder" },
        "f5": { "#text": "ファイル2",    "@type": "file" }
      }
    },
    "f2": { "#text": "フォルダ2", "@type": "folder" },
    "f3": { "#text": "ファイル1", "@type": "file" }
  }
};

// データソースの名前
tinyword.App.DS_ROOT = 'FileTree';

// アプリケーションを初期化
tinyword.App.prototype.initialize_ = function(tree) {
  // イベントハンドラを管理するためのEventHandlerを生成
  this.eventHandler_ = new goog.events.EventHandler(this);

  // ファイルツリーを初期化
  var dm = goog.ds.DataManager.getInstance();
  dm.addDataSource(new goog.ds.JsDataSource(tree, tinyword.App.DS_ROOT), true);

  // 左ペインのコンポーネントを作成
  this.leftPane_ = new tinyword.LeftPane();

  // 右ペインのコンポーネントを作成
  this.rightPane_ = new tinyword.RightPane();

  // SplitPaneを作成
  this.splitPane_ = new goog.ui.SplitPane(
    this.leftPane_, this.rightPane_,
    goog.ui.SplitPane.Orientation.HORIZONTAL);
  this.splitPane_.setInitialSize(200);
  this.splitPane_.render(goog.dom.getElement('main'));

  // ブラウザのリサイズに対応
  this.viewportSizeMonitor_ = new goog.dom.ViewportSizeMonitor();
  this.eventHandler_.listen(this.viewportSizeMonitor_,
                            goog.events.EventType.RESIZE,
                            this.onResizeViewport_);
  this.onResizeViewport_();

  // ファイル選択のイベントを監視
  this.eventHandler_.listen(
    this.leftPane_, tinyword.TreeControl.EventType.SELECT_FILE, this.onSelectFile_);
};

// ブラウザのリサイズ時の処理
tinyword.App.prototype.onResizeViewport_ = function() {
  var size      = this.viewportSizeMonitor_.getSize();
  var titleSize = goog.style.getBorderBoxSize(goog.dom.getElement('title'));
  this.splitPane_.setSize(new goog.math.Size(
    size.width - 4*2, size.height - 4*2 - titleSize.height));
};

// ファイル選択時の処理
tinyword.App.prototype.onSelectFile_ = function(e) {
  var selectedNode = this.leftPane_.getTree().getSelectedItem();
  var editor       = this.rightPane_.getEditor();
  if(!editor.isUserModified() ||
     window.confirm('現在の編集内容を破棄しますか?'))
  {
    var path     = selectedNode.getDataSourcePath();
    var dataNode = goog.ds.Expr.create(path).getNode();
    if(dataNode.getChildNodeValue('@type') == 'file')
      editor.loadFile(dataNode.getDataPath());
  }
};

// tinyword.Appインスタンスを作成
tinyword.App.getInstance();
