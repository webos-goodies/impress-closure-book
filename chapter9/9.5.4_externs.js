var google = {}; google.language = {};
/**
 * Google APIの読み込み
 * @param {string} api APIの名前
 * @param {string} version APIのバージョン
 */
google.load = function(api, version) {};

/**
 * APIの読み込み完了時に実行するコールバック関数の指定
 * @param {function()} callback 読み込み完了時に実行する関数
 */
google.setOnLoadCallback = function(callback) {};

/**
 * 文章を翻訳する。
 * @param {(string|{text:string, type:string})} text 翻訳する文章
 * @param {string} srcLang 翻訳前の言語
 * @param {string} destLang 翻訳後の言語
 * @param {function(Object)} callback 翻訳結果を受け取るコールバック関数
 */
google.language.translate = function(text, srcLang, destLang, callback){};
