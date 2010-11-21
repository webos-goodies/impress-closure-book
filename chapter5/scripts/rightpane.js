goog.provide('tinyword.RightPane');
goog.require('goog.ui.Component');
goog.require('goog.ui.Tab');
goog.require('goog.ui.TabBar');
goog.require('goog.array');

/** @constructor */
tinyword.RightPane = function(opt_domHelper) {
  goog.base(this, opt_domHelper);

  // タブバーを作成
  this.tabBar_ = new goog.ui.TabBar(
    goog.ui.TabBar.Location.TOP, goog.ui.TabBarRenderer.getInstance(), opt_domHelper);
  this.addChild(this.tabBar_);

  var editorTab = new goog.ui.Tab('エディタ', null, opt_domHelper);
  editorTab.setId('editor-tab');
  this.tabBar_.addChild(editorTab);

  var previewTab = new goog.ui.Tab('プレビュー', null, opt_domHelper);
  previewTab.setId('preview-tab');
  this.tabBar_.addChild(previewTab);
};
goog.inherits(tinyword.RightPane, goog.ui.Component);

// CSSクラスの定義
tinyword.RightPane.CLASS_NAME_ = goog.getCssName('rightpane');

tinyword.RightPane.TABBAR_CLASS_NAME_ =
  goog.getCssName(tinyword.RightPane.CLASS_NAME_, 'tabbar');

tinyword.RightPane.CONTENT_CLASS_NAME_ =
  goog.getCssName(tinyword.RightPane.CLASS_NAME_, 'content');

// DOM要素の作成
tinyword.RightPane.prototype.createDom = function() {
  var dom = this.getDomHelper();
  this.tabBar_.createDom();
  this.setElementInternal(dom.createDom(
    'div', tinyword.RightPane.CLASS_NAME_,
    dom.createDom('div', tinyword.RightPane.TABBAR_CLASS_NAME_,
                  this.tabBar_.getElement(),
                  dom.createDom('div', 'goog-tab-bar-clear')),
    dom.createDom('div', tinyword.RightPane.CONTENT_CLASS_NAME_),
    dom.createDom('div', tinyword.RightPane.CONTENT_CLASS_NAME_)));

  this.tabBar_.forEachChild(function(tab) {
    tab.createDom();
    this.tabBar_.getContentElement().appendChild(tab.getElement());
  }, this);
};

// ドキュメントに追加された時の処理
tinyword.RightPane.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');

  // タブ選択の処理
  this.getHandler().listen(
    this.tabBar_, goog.ui.Component.EventType.SELECT, this.onSelectTab);
  this.tabBar_.setSelectedTabIndex(0);
};

// タブ選択時の処理
tinyword.RightPane.prototype.onSelectTab = function(e) {
  var dom   = this.getDomHelper();
  var index = this.tabBar_.getSelectedTabIndex();
  var root  = this.getElement();
  var els   = dom.getElementsByTagNameAndClass(
    'div', tinyword.RightPane.CONTENT_CLASS_NAME_, root);
  goog.array.forEach(els, function(el, i) {
    goog.style.showElement(el, index == i);
  }, this);
};

// リサイズ時の処理
tinyword.RightPane.prototype.resize = function(size) {
  var dom         = this.getDomHelper();
  var tabBarEl    = this.tabBar_.getElement().parentNode;
  var tabBarSize  = goog.style.getBorderBoxSize(tabBarEl).height;
  var contentSize = Math.max(size.height - tabBarSize - 2, 0);
  goog.array.forEach(
    dom.getElementsByTagNameAndClass(
      'div', tinyword.RightPane.CONTENT_CLASS_NAME_, this.getElement()),
    function(el) {
      goog.style.setStyle(el, 'height', contentSize + 'px');
    });
};
