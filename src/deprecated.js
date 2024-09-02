import { jQuery } from "./core.js";
import { slice } from "./var/slice.js";

import "./deprecated/ajax-event-alias.js";
import "./deprecated/event.js";

// 将函数绑定到上下文，可以选择部分应用任何参数。
// jQuery.proxy 已弃用以提升标准（特别是 Function#bind）
// 但是，它不会很快被删除
jQuery.proxy = function( fn, context ) {
	var tmp, args, proxy;

	if ( typeof context === "string" ) {
		tmp = fn[ context ];
		context = fn;
		fn = tmp;
	}

	// 快速检查以确定 target 是否是可调用的，在 spec 中这会抛出一个 TypeError，但我们只会返回 undefined。
	if ( typeof fn !== "function" ) {
		return undefined;
	}

	// 模拟绑定
	args = slice.call( arguments, 2 );
	proxy = function() {
		return fn.apply( context || this, args.concat( slice.call( arguments ) ) );
	};

	// 将 unique handler 的 guid 设置为与原始 handler 相同，以便可以将其删除
	proxy.guid = fn.guid = fn.guid || jQuery.guid++;

	return proxy;
};

jQuery.holdReady = function( hold ) {
	if ( hold ) {
		jQuery.readyWait++;
	} else {
		jQuery.ready( true );
	}
};

export { jQuery, jQuery as $ };
