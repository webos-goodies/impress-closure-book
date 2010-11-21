goog.provide('tinyword.App');
goog.require('goog.events.EventHandler');
goog.require('goog.ds.DataManager');
goog.require('goog.ds.JsDataSource');
goog.require('goog.ui.SplitPane');
goog.require('goog.dom.ViewportSizeMonitor');
goog.require('tinyword.LeftPane');
goog.require('tinyword.RightPane');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrManager');
goog.require('goog.object');
goog.require('goog.fx.dom');

/** @constructor */
tinyword.App = function() {
  goog.net.XhrIo.send('/' + window['user_id'] + '/tree', function(e) {
    var xhr = e.target;
    var obj = xhr.getResponseJson('while(1);');
    tinyword.App.getInstance().initialize_(obj);
  });
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

  // XhrManagerを作成
  this.xhrManager_ = new goog.net.XhrManager();
  this.nextXhrId_ = 1;

  // アクセスインジケータのアニメーションを初期化
  var indicator = goog.dom.getElement('xhr-indicator');
  this.fadeInIndicator_  = new goog.fx.dom.FadeInAndShow(indicator, 10);
  this.fadeOutIndicator_ = new goog.fx.dom.FadeOutAndHide(indicator, 1000);
  this.fadeOutIndicator_.play(true);

  this.eventHandler_.listen(
    this.xhrManager_, goog.net.EventType.READY, this.onXhrReady_);
  this.eventHandler_.listen(
    this.xhrManager_, goog.net.EventType.COMPLETE, this.onXhrComplete_);

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

// 非同期リクエストの送信
tinyword.App.prototype.sendRequest =
  function(path, query, callback, method, opt_content)
{
  var url = goog.Uri.parse('/' + window['user_id'] + '/' + path);
  goog.object.forEach(query || {}, function(value, key) {
    url.setParameterValue(key, value);
  }, this);
  var headers = {}, body = null;
  if(opt_content) {
    body = goog.json.serialize(opt_content);
    headers['Content-Type'] = 'application/json';
  }
  return this.xhrManager_.send(
    this.nextXhrId_++, url, method, body, headers, 0,
    goog.bind(this.processRequest_, this, callback));
};

// レスポンスの処理
tinyword.App.prototype.processRequest_ = function(callback, e) {
  var xhr = e.target; if(xhr.isSuccess()) {
    callback && callback(xhr.getResponseJson('while(1);'));
  } else {
    alert(xhr.getResponseText());
  }
};

// アクセスインジケータの処理
tinyword.App.prototype.onXhrReady_ = function(e) {
  if(this.xhrManager_.getOutstandingCount() == 1) {
    this.fadeOutIndicator_.stop(false);
    this.fadeInIndicator_.play(true);
  }
};

tinyword.App.prototype.onXhrComplete_ = function(e) {
  if(this.xhrManager_.getOutstandingCount() == 1) {
    this.fadeInIndicator_.stop(false);
    this.fadeOutIndicator_.play(true);
  }
};

// tinyword.Appインスタンスを作成
tinyword.App.getInstance();
