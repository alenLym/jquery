import { jQuery } from "../core.js";

import "../ajax.js";

jQuery.ajaxPrefilter(function (s, origOptions) {

	// 二进制数据需要按原样传递给 XHR，而无需字符串化。
	if (typeof s.data !== "string" && !jQuery.isPlainObject(s.data) &&
		!Array.isArray(s.data) &&

		// 如果用户明确设置，请不要禁用数据处理。
		!("processData" in origOptions)) {
		s.processData = false;
	}

	// 需要设置具有 'FormData' 正文的请求的 'Content-Type'
	// 浏览器，因为它需要附加它生成的 'boundary'。
	if (s.data instanceof window.FormData) {
		s.contentType = false;
	}
});
