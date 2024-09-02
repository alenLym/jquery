import { jQuery } from "../core.js";
import { document } from "../var/document.js";
import { rsingleTag } from "./var/rsingleTag.js";
import { buildFragment } from "../manipulation/buildFragment.js";
import { isObviousHtml } from "./isObviousHtml.js";

// 参数 “data” 应该是 html 字符串或明显 HTML 的 TrustedHTML 包装器
// context （可选）：如果指定，则将在此上下文中创建 fragment，
// 默认为 document
// keepScripts（可选）：如果为 true，将包含在 html 字符串中传递的脚本
jQuery.parseHTML = function( data, context, keepScripts ) {
	if ( typeof data !== "string" && !isObviousHtml( data + "" ) ) {
		return [];
	}
	if ( typeof context === "boolean" ) {
		keepScripts = context;
		context = false;
	}

	var base, parsed, scripts;

	if ( !context ) {

		// 停止立即执行脚本或内联事件处理程序
// 通过使用 document.implementation
		context = document.implementation.createHTMLDocument( "" );

		// 为创建的文档设置基本 href
// 因此，任何带有 URL 的解析元素
// 基于文档的 URL （gh-2965）
		base = context.createElement( "base" );
		base.href = document.location.href;
		context.head.appendChild( base );
	}

	parsed = rsingleTag.exec( data );
	scripts = !keepScripts && [];

	// 单个标签
	if ( parsed ) {
		return [ context.createElement( parsed[ 1 ] ) ];
	}

	parsed = buildFragment( [ data ], context, scripts );

	if ( scripts && scripts.length ) {
		jQuery( scripts ).remove();
	}

	return jQuery.merge( [], parsed.childNodes );
};
