import { jQuery } from "../core.js";
import { document } from "../var/document.js";

import "../core/readyException.js";
import "../deferred.js";

// 在 DOM ready 上使用的 deferred
var readyList = jQuery.Deferred();

jQuery.fn.ready = function( fn ) {

	readyList
		.then( fn )

		// 将 jQuery.readyException 包装在函数中，以便查找
// 发生在错误处理时，而不是回调时
// 注册。
		.catch( function( error ) {
			jQuery.readyException( error );
		} );

	return this;
};

jQuery.extend( {

	// DOM 准备好了吗？一旦发生，就设置为 true。
	isReady: false,

	// 一个计数器，用于跟踪之前要等待的项目数
// 将触发 ready 事件。请参阅 trac-6781
	readyWait: 1,

	// 当 DOM 准备就绪时进行处理
	ready: function( wait ) {

		// 如果有待处理的保留或我们已经准备好了，则中止
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// 请记住，DOM 已准备就绪
		jQuery.isReady = true;

		// 如果触发了正常的 DOM Ready 事件，则递减并在需要时等待
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// 如果有绑定的函数，要执行
		readyList.resolveWith( document, [ jQuery ] );
	}
} );

jQuery.ready.then = readyList.then;

// ready 事件处理程序和自我清理方法
function completed() {
	document.removeEventListener( "DOMContentLoaded", completed );
	window.removeEventListener( "load", completed );
	jQuery.ready();
}

// 捕获调用 $（document）.ready（） 的情况
// 在 browser 事件已发生之后。
if ( document.readyState !== "loading" ) {

	// 异步处理它，让脚本有机会延迟就绪
	window.setTimeout( jQuery.ready );

} else {

	// 使用方便的事件回调
	document.addEventListener( "DOMContentLoaded", completed );

	// 回退到 window.onload，将始终有效
	window.addEventListener( "load", completed );
}
