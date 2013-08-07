/* global zen:true */
/* exported $zen */
(function($,zen) {
	'use strict';
	$.fn.extend({
		zen: function() {
			this.html(zen.apply(this,arguments));
			return this;
		}
	});
	$.zen = function() {
		return $(zen.apply(this,arguments));
	};
})(jQuery,zen);
var $zen = jQuery.zen;