import { jQuery } from "../core.js";

var

	// 在覆盖的情况下映射
	_jQuery = window.jQuery,

	// 在覆盖的情况下映射 $
	_$ = window.$;

jQuery.noConflict = function( deep ) {
	if ( window.$ === jQuery ) {
		window.$ = _$;
	}

	if ( deep && window.jQuery === jQuery ) {
		window.jQuery = _jQuery;
	}

	return jQuery;
};

// 公开 jQuery 和 $ 标识符，即使在 AMD 中也是如此
// （TRAC-7102#评论：10， GH-557）
// 和用于浏览器模拟器的 CommonJS （trac-13566）
if ( typeof noGlobal === "undefined" ) {
	window.jQuery = window.$ = jQuery;
}
