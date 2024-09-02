import { jQuery } from "../core.js";

// CSS 字符串/标识符序列化
// https://drafts.csswg.org/cssom/#common-serializing-idioms
var rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\x80-\uFFFF\w-]/g;

function fcssescape( ch, asCodePoint ) {
	if ( asCodePoint ) {

		// U+0000 NULL 变为 U+FFFD 替换字符
		if ( ch === "\0" ) {
			return "\uFFFD";
		}

		// 控制字符和（取决于位置）数字作为代码点进行转义
		return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
	}

	// 其他可能特殊的 ASCII 字符采用反斜杠转义
	return "\\" + ch;
}

jQuery.escapeSelector = function( sel ) {
	return ( sel + "" ).replace( rcssescape, fcssescape );
};
