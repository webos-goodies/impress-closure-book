goog.provide('tinyword.App');
goog.require('goog.events.EventHandler');
goog.require('goog.ds.DataManager');
goog.require('goog.ds.JsDataSource');

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
};

// tinyword.Appインスタンスを作成
tinyword.App.getInstance();
