goog.provide('tinyword.MapsPlugin');
goog.provide('tinyword.MapsPlugin.Command');
goog.require('goog.Uri');
goog.require('goog.editor.BrowserFeature');
goog.require('goog.editor.Plugin');
goog.require('goog.editor.range');

/** @constructor */
tinyword.MapsPlugin = function() {
  goog.base(this);
};
goog.inherits(tinyword.MapsPlugin, goog.editor.Plugin);

// サポートする編集コマンド
tinyword.MapsPlugin.Command = { MAP: 'map' };

// プラグイン識別子を返す
tinyword.MapsPlugin.prototype.getTrogClassId =
  goog.functions.constant('MapsPlugin');

// 指定コマンドをサポートしているかを返す
tinyword.MapsPlugin.prototype.isSupportedCommand = function(command) {
  return command == tinyword.MapsPlugin.Command.MAP;
};

// コマンドを実行する
tinyword.MapsPlugin.prototype.execCommandInternal = function(command) {
  if(command != tinyword.MapsPlugin.Command.MAP)
    return;
  var uri = this.fieldObject.getAppWindow().prompt('GoogleマップURL', '');
  if(uri && /^https?:\/\/maps\.google\.co(m|\.jp)\//.test(uri)) {
    var range     = this.fieldObject.getRange();
    var staticUri = this.mapToStaticMap_(uri);
    range.replaceContentsWithNode(this.getFieldDomHelper().createDom(
      'img', { 'class': 'map', 'src': staticUri, 'title' : uri }));
  }
};

// 地図画像のURLを生成
tinyword.MapsPlugin.prototype.mapToStaticMap_ = function(uri) {
  uri           = goog.Uri.parse(uri);
  var staticUri = goog.Uri.parse('http://maps.google.com/maps/api/staticmap');
  var center    = uri.getParameterValue('ll') || uri.getParameterValue('q');
  staticUri.setParameterValue('center', center);
  staticUri.setParameterValue('zoom', uri.getParameterValue('z'));
  staticUri.setParameterValue('size', '425x350');
  staticUri.setParameterValue('sensor', 'false');
  return staticUri.toString();
};

// キーボードイベントの処理
tinyword.MapsPlugin.prototype.handleKeyboardShortcut =
  function(e, key, isModifierPressed)
{
  if(isModifierPressed && key == 'm') {
    this.fieldObject.execCommand(tinyword.MapsPlugin.Command.MAP);
    return true;
  }
  return false;
};

// 文書をエクスポートする際の処理
tinyword.MapsPlugin.prototype.cleanContentsHtml = function(html) {
  return html.replace(/<img\s+([^>]+)>/gi, function(s0, s1) {
    var title = /title="?([^\" \t>]+)"?/.exec(s1);
    if(title && /class="?map"?/.test(s1)) {
      return ['<iframe class="map" width="425" height="350" frameborder="0" ',
              'scrolling="no" marginheight="0" marginwidth="0" ',
              'src="', title[1], '&amp;output=embed"></iframe>'].join('');
    } else {
      return s0;
    }
  });
};

// 文書をインポートする際の処理
tinyword.MapsPlugin.prototype.prepareContentsHtml = function(html) {
  var self = this;
  return html.replace(/<iframe\s+([^>]+)>/gi, function(s0, s1) {
    var uri = /src="?([^\" \t>]+)"?/.exec(s1);
    if(uri && /class="?map"?/.test(s1)) {
      uri = uri[1].replace('&amp;output=embed', '');
      return ['<img class="map" title="', uri, '" src="',
              self.mapToStaticMap_(goog.string.unescapeEntities(uri)),
              '">'].join('');
    } else {
      return s0;
    }
  });
};
