import { jQuery } from "../core.js";

import "../ajax.js";

jQuery.ajaxSettings.xhr = function () {
	return new window.XMLHttpRequest();
};

var xhrSuccessStatus = {

	// 文件协议始终产生状态代码 0，假设为 200
	0: 200
};

jQuery.ajaxTransport(function (options) {
	var callback;

	return {
		send: function (headers, complete) {
			var i,
				xhr = options.xhr();

			xhr.open(
				options.type,
				options.url,
				options.async,
				options.username,
				options.password
			);

			// 应用自定义域（如果提供）
			if (options.xhrFields) {
				for (i in options.xhrFields) {
					xhr[i] = options.xhrFields[i];
				}
			}

			// 如果需要，覆盖 MIME 类型
			if (options.mimeType && xhr.overrideMimeType) {
				xhr.overrideMimeType(options.mimeType);
			}

			// X-Requested-With 标头
			// 对于跨域请求，预检的条件是
			// 类似于拼图游戏，我们只是从不将其设置为确定。
			// （它总是可以基于每个请求进行设置，甚至可以使用 ajaxSetup 进行设置）
			// 对于同一域请求，如果已提供，则不会更改标头。
			if (!options.crossDomain && !headers["X-Requested-With"]) {
				headers["X-Requested-With"] = "XMLHttpRequest";
			}

			// 设置标头
			for (i in headers) {
				xhr.setRequestHeader(i, headers[i]);
			}

			// 回调
			callback = function (type) {
				return function () {
					if (callback) {
						callback = xhr.onload = xhr.onerror = xhr.onabort = xhr.ontimeout = null;

						if (type === "abort") {
							xhr.abort();
						} else if (type === "error") {
							complete(

								// File： protocol 始终产生状态 0;请参阅 TRAC-8605、TRAC-14207
								xhr.status,
								xhr.statusText
							);
						} else {
							complete(
								xhrSuccessStatus[xhr.status] || xhr.status,
								xhr.statusText,

								// 对于 XHR2 非文本，让调用方处理 （gh-2498）
								(xhr.responseType || "text") === "text" ?
									{ text: xhr.responseText } :
									{ binary: xhr.response },
								xhr.getAllResponseHeaders()
							);
						}
					}
				};
			};

			// 监听事件
			xhr.onload = callback();
			xhr.onabort = xhr.onerror = xhr.ontimeout = callback("error");

			// 创建 abort 回调
			callback = callback("abort");

			try {

				// 发送请求 （这可能会引发异常）
				xhr.send(options.hasContent && options.data || null);
			} catch (e) {

				// trac-14683：仅当尚未将其通知为错误时，才重新引发
				if (callback) {
					throw e;
				}
			}
		},

		abort: function () {
			if (callback) {
				callback();
			}
		}
	};
});
