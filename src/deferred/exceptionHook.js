import { jQuery } from "../core.js";

import "../deferred.js";

// 这些通常表示程序员在开发过程中的错误，
// 尽快警告它们，而不是默认吞下它们。
var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

// 如果定义了 'jQuery.Deferred.getErrorHook'，则 'asyncError' 是一个错误
// 在 async barrier 之前捕获以获取原始错误原因
// 否则可能会隐藏。
jQuery.Deferred.exceptionHook = function( error, asyncError ) {

	if ( error && rerrorNames.test( error.name ) ) {
		window.console.warn(
			"jQuery.Deferred exception",
			error,
			asyncError
		);
	}
};
