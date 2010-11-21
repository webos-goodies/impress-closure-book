google.load('language', '1');

function initialize() {
  var text = document.getElementById('ja-text').value;
  google.language.translate(
	text, 'ja', 'en',
	function(result) {
	  if (result['translation']) {
		document.getElementById('en-text').value = result['translation'];
	  }
	});
}
google.setOnLoadCallback(initialize);
