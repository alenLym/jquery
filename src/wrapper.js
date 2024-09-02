/*!
 * jQuery JavaScript Library v@VERSION
 * https://jquery.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: @DATE
 */
(function (global, factory) {

	"use strict";

	if (typeof module === "object" && typeof module.exports === "object") {

		// 对于 CommonJS 和类 CommonJS 环境，其中适当的“窗口”
		// 存在，请执行工厂并获取 jQuery。
		module.exports = factory(global, true);
	} else {
		factory(global);
	}

	// 如果尚未定义 window，则传递此
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {

	"use strict";

	if (!window.document) {
		throw new Error("jQuery requires a window with a document");
	}

	// @CODE
	// build.js在此处插入编译的 jQuery

	return jQuery;

});
