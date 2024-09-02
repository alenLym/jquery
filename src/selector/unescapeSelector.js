// CSS escapes
// https://www.w3.org/TR/CSS21/syndata.html#escaped-characters
import { whitespace } from "../var/whitespace.js";

var runescape = new RegExp( "\\\\[\\da-fA-F]{1,6}" + whitespace +
	"?|\\\\([^\\r\\n\\f])", "g" ),
	funescape = function( escape, nonHex ) {
		var high = "0x" + escape.slice( 1 ) - 0x10000;

		if ( nonHex ) {

			// 从非十六进制转义序列中去除反斜杠前缀
			return nonHex;
		}

		// 将十六进制转义序列替换为编码的 Unicode 码位
// 支持：IE <=11+
// 对于基本多语言平面 （BMP） 之外的值，请手动构造
// 代理对
		return high < 0 ?
			String.fromCharCode( high + 0x10000 ) :
			String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

export function unescapeSelector( sel ) {
	return sel.replace( runescape, funescape );
}
