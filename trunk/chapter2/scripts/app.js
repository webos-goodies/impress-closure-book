goog.provide('chapter2.App');
goog.require('goog.ui.HsvPalette');
goog.require('goog.fx.Dragger');

/** @constructor */
chapter2.App = function() {
  // 色選択ウィジェットを作成
  this.palette = new goog.ui.HsvPalette();
  this.palette.render(document.getElementById('palette'));

  // 背景色設定ボタンにクリックイベントを設定
  document.getElementById('bgcolor-btn').onclick =
    goog.bind(this.setBGColor, this);

  // ウィジェットをドラッグ可能にする
  new goog.fx.Dragger(document.getElementById('dragframe'),
                      document.getElementById('handle'));
};

// 背景設定ボタンがクリックされたときの処理
chapter2.App.prototype.setBGColor = function() {
  document.body.style.backgroundColor = this.palette.getColor();
};

// chapter2.Appのインスタンスを作成
new chapter2.App();
