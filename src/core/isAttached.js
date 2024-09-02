import { jQuery } from "../core.js";
import { documentElement } from "../var/documentElement.js";

var isAttached = function( elem ) {
		return jQuery.contains( elem.ownerDocument, elem ) ||
			elem.getRootNode( composed ) === elem.ownerDocument;
	},
	composed = { composed: true };

// 支持：IE 9 - 11+
// 尽可能检查跨影子 DOM 边界的附件 （gh-3504）。
// 为不支持 Shadow DOM v1 的浏览器提供回退。
if ( !documentElement.getRootNode ) {
	isAttached = function( elem ) {
		return jQuery.contains( elem.ownerDocument, elem );
	};
}

export { isAttached };
