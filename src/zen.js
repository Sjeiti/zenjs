/**
* uses emmetio (aka zen) with jquery
* dependencies: (emmet/javascript/) :: underscore core parsers\abbreviationParser utils handlerList stringStream resources profile abbreviationUtils htmlMatcher tabStops preferences elements filters filters\format filters\html
 */
window.zen = (function(emmet){
	'use strict';
	var mParent = document.createElement('div');
	function zen(zenString,content){
		var sHtml = emmet.expandAbbreviation(zenString);
		if (content!==undefined) {
			for (var key in content) {
				var value = content[key];
				if (value instanceof Array) {
					for (var i=value.length;i>=0;i--) {
					  sHtml = sHtml.replace(new RegExp(key+(i+1),'g'),value[i]);
					}
				} else {
					sHtml = sHtml.replace(new RegExp(key,'g'),value);
				}
			}
		}
		mParent.innerHTML = sHtml;
		return mParent.firstChild;
	}
	return zen;
})(emmet);
