/* exported zen */
/**
 * A simple function to use Emmet in a web environment
 * @property {Boolean} [firstChild=false] When set to true the result to the zen function is an HTMLElement when the length of the NodeList is one. Default is false.
 * @param {string} abbreviation The Emmet abbreviation to expand.
 * @param {Object} [content] An optional content object to replace strings from the result.
 * @returns {Array} The Emmet result in an Array.
 * @version 0.1.3
 * @author Ron Valstar <ron@ronvalstar.nl>
 * @licence MIT: http://www.opensource.org/licenses/mit-license.php
 * @requires Emmet (currently using revision c973f3d)
 * @copyright Emmet 2012 Sergey Chikuyonok <serge.che@gmail.com>
 */
var zen = (function(emmet){
	'use strict';
	var mParent = document.createElement('div')
		,nChildren = mParent.childNodes
		,zen = function(abbreviation,content){
			var i
				,iLen
				,aReturn = []
				,sHtml = emmet.expandAbbreviation(abbreviation)
			;
			if (content!==undefined) {
				for (var key in content) {
					var value = content[key];
					if (value instanceof Array) {
						for (i=value.length;i>=0;i--) {
						  sHtml = sHtml.replace(new RegExp(key+(i+1),'g'),value[i]);
						}
					} else {
						sHtml = sHtml.replace(new RegExp(key,'g'),value);
					}
				}
			}
			mParent.innerHTML = sHtml;
			iLen = nChildren.length;
			if (zen.firstChild&&iLen===1) {
				aReturn = mParent.firstChild;
			} else { // return an Array because the NodeList is live
				for (i=0;i<iLen;i++) {
					aReturn.push(nChildren[i]);
				}
			}
			return aReturn;
		}
	;
	zen.firstChild = false;
	zen.exposeEmmet = function(){return emmet;};
	return zen;
})(emmet);