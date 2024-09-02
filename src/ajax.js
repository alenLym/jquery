import { jQuery } from "./core.js";
import { document } from "./var/document.js";
import { rnothtmlwhite } from "./var/rnothtmlwhite.js";
import { location } from "./ajax/var/location.js";
import { nonce } from "./ajax/var/nonce.js";
import { rquery } from "./ajax/var/rquery.js";

import "./core/init.js";
import "./core/parseXML.js";
import "./event/trigger.js";
import "./deferred.js";
import "./serialize.js"; // jQuery.param

var
	r20 = /%20/g,
	rhash = /#.*$/,
	rantiCache = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,

	// trac-7653, trac-8125, trac-8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,

	/* 预过滤器
	 * 1） 它们对于引入自定义 dataTypes 很有用（有关示例，请参阅 ajax/jsonp.js）
	 * 2） 这些被称为：
	 *    - 在要求交通之前
	 *    - AFTER 参数序列化（如果 s.processData 为 true，则 s.data 为字符串）
	 * 3） key 是 dataType
	 * 4） 可以使用 catchall 符号“*”
	 * 5） 执行将从 transport dataType 开始，然后根据需要继续执行到 “*”
	 */
	prefilters = {},

	/* 传输绑定
	 * 1） key 是 dataType
	 * 2） 可以使用 catchall 符号 “*”
	 * 3） 选择将从 transport dataType 开始，然后根据需要转到 “*”
	 */
	transports = {},

	// 避免 comment-prolog char 序列 （trac-10098）;必须安抚 lint 并逃避压缩
	allTypes = "*/".concat("*"),

	// 用于解析文档来源的锚点标签
	originAnchor = document.createElement("a");

originAnchor.href = location.href;

// jQuery.ajaxPrefilter 和 jQuery.ajaxTransport 的基本“构造函数”
function addToPrefiltersOrTransports(structure) {

	// dataTypeExpression 是可选的，默认为 “*”
	return function (dataTypeExpression, func) {

		if (typeof dataTypeExpression !== "string") {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];

		if (typeof func === "function") {

			// 对于 dataTypeExpression 中的每个 dataType
			while ((dataType = dataTypes[i++])) {

				// 如果要求，请在 Preend
				if (dataType[0] === "+") {
					dataType = dataType.slice(1) || "*";
					(structure[dataType] = structure[dataType] || []).unshift(func);

					// Otherwise append
				} else {
					(structure[dataType] = structure[dataType] || []).push(func);
				}
			}
		}
	};
}

// 用于预过滤器和运输的底部检查功能
function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {

	var inspected = {},
		seekingTransport = (structure === transports);

	function inspect(dataType) {
		var selected;
		inspected[dataType] = true;
		jQuery.each(structure[dataType] || [], function (_, prefilterOrFactory) {
			var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);
			if (typeof dataTypeOrTransport === "string" &&
				!seekingTransport && !inspected[dataTypeOrTransport]) {

				options.dataTypes.unshift(dataTypeOrTransport);
				inspect(dataTypeOrTransport);
				return false;
			} else if (seekingTransport) {
				return !(selected = dataTypeOrTransport);
			}
		});
		return selected;
	}

	return inspect(options.dataTypes[0]) || !inspected["*"] && inspect("*");
}

// ajax 选项的特殊扩展
// 这需要 “flat” 选项（不要深入扩展）
// 修复 trac-9887
function ajaxExtend(target, src) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for (key in src) {
		if (src[key] !== undefined) {
			(flatOptions[key] ? target : (deep || (deep = {})))[key] = src[key];
		}
	}
	if (deep) {
		jQuery.extend(true, target, deep);
	}

	return target;
}

/* 处理对 ajax 请求的响应：
 * - 找到正确的 dataType （在 content-type 和 expected dataType 之间进行调解）
 * - 返回相应的响应
 */
function ajaxHandleResponses(s, jqXHR, responses) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// 在进程中删除 auto dataType 并获取 content-type
	while (dataTypes[0] === "*") {
		dataTypes.shift();
		if (ct === undefined) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// 检查我们是否正在处理已知的 content-type
	if (ct) {
		for (type in contents) {
			if (contents[type] && contents[type].test(ct)) {
				dataTypes.unshift(type);
				break;
			}
		}
	}

	// 检查是否有针对预期 dataType 的响应
	if (dataTypes[0] in responses) {
		finalDataType = dataTypes[0];
	} else {

		// Try convertible dataTypes
		for (type in responses) {
			if (!dataTypes[0] || s.converters[type + " " + dataTypes[0]]) {
				finalDataType = type;
				break;
			}
			if (!firstDataType) {
				firstDataType = type;
			}
		}

		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// 如果我们找到 dataType
	// 如果需要，我们将 dataType 添加到列表中
	// 并返回相应的响应
	if (finalDataType) {
		if (finalDataType !== dataTypes[0]) {
			dataTypes.unshift(finalDataType);
		}
		return responses[finalDataType];
	}
}

/* 给定请求和原始响应的链式转换
 * 此外，在 jqXHR 实例上设置 responseXXX 字段
 */
function ajaxConvert(s, response, jqXHR, isSuccess) {
	var conv2, current, conv, tmp, prev,
		converters = {},

		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if (dataTypes[1]) {
		for (conv in s.converters) {
			converters[conv.toLowerCase()] = s.converters[conv];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while (current) {

		if (s.responseFields[current]) {
			jqXHR[s.responseFields[current]] = response;
		}

		// Apply the dataFilter if provided
		if (!prev && isSuccess && s.dataFilter) {
			response = s.dataFilter(response, s.dataType);
		}

		prev = current;
		current = dataTypes.shift();

		if (current) {

			// There's only work to do if current dataType is non-auto
			if (current === "*") {

				current = prev;

				// Convert response if prev dataType is non-auto and differs from current
			} else if (prev !== "*" && prev !== current) {

				// Seek a direct converter
				conv = converters[prev + " " + current] || converters["* " + current];

				// If none found, seek a pair
				if (!conv) {
					for (conv2 in converters) {

						// If conv2 outputs current
						tmp = conv2.split(" ");
						if (tmp[1] === current) {

							// If prev can be converted to accepted input
							conv = converters[prev + " " + tmp[0]] ||
								converters["* " + tmp[0]];
							if (conv) {

								// Condense equivalence converters
								if (conv === true) {
									conv = converters[conv2];

									// Otherwise, insert the intermediate dataType
								} else if (converters[conv2] !== true) {
									current = tmp[0];
									dataTypes.unshift(tmp[1]);
								}
								break;
							}
						}
					}
				}

				// Apply converter （如果不是等效的）
				if (conv !== true) {

					// Unless errors are allowed to bubble, catch and return them
					if (conv && s.throws) {
						response = conv(response);
					} else {
						try {
							response = conv(response);
						} catch (e) {
							return {
								state: "parsererror",
								error: conv ? e : "No conversion from " + prev + " to " + current
							};
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}

jQuery.extend({

	// 用于保存活动查询数的 Counter
	active: 0,

	// 下一个请求的 Last-Modified 标头缓存
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: location.href,
		type: "GET",
		isLocal: rlocalProtocol.test(location.protocol),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",

		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /\bxml\b/,
			html: /\bhtml/,
			json: /\bjson\b/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// 数据转换器
		// 键用单个空格分隔源（或捕获全部 “*”）和目标类型
		converters: {

			// 将任何内容转换为文本
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// 将文本作为 json 表达式计算
			"text json": JSON.parse,

			// 将文本解析为 xml
			"text xml": jQuery.parseXML
		},

		// 对于不应深度扩展的选项：
		// 如果满足以下条件，您可以在此处添加自己的自定义选项
		// 而当你创建一个不应该
		// deep extend（请参阅 ajaxExtend）
		flatOptions: {
			url: true,
			context: true
		}
	},

	// 在 target 中创建完整的 settings 对象
	// 同时具有 ajaxSettings 和 settings 字段。
	// 如果省略 target，则写入 ajaxSettings。
	ajaxSetup: function (target, settings) {
		return settings ?

			// 构建 settings 对象
			ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) :

			// 扩展 ajaxSettings
			ajaxExtend(jQuery.ajaxSettings, target);
	},


	ajaxPrefilter: addToPrefiltersOrTransports(prefilters),

	ajaxTransport: addToPrefiltersOrTransports(transports),

	// 主要方法
	ajax: function (url, options) {

		// 如果 url 是一个对象，则模拟 1.5 之前的签名
		if (typeof url === "object") {
			options = url;
			url = undefined;
		}

		// 强制选项为对象
		options = options || {};

		var transport,

			// 没有 anti-cache 参数的 URL
			cacheURL,

			// 响应标头
			responseHeadersString,
			responseHeaders,

			// 超时句柄
			timeoutTimer,

			// Url cleanup var
			urlAnchor,

			// 请求状态（发送时变为 false，完成时变为 true）
			completed,

			// 了解是否要调度全局事件
			fireGlobals,

			// Loop 变量
			i,

			// URL 的未缓存部分
			uncached,

			// 创建最终选项对象
			s = jQuery.ajaxSetup({}, options),

			// 回调上下文
			callbackContext = s.context || s,

			// 如果全局事件是 DOM 节点或 jQuery 集合，则全局事件的上下文为 callbackContext
			globalEventContext = s.context &&
				(callbackContext.nodeType || callbackContext.jquery) ?
				jQuery(callbackContext) :
				jQuery.event,

			// 延期
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),

			// 状态相关回调
			statusCode = s.statusCode || {},

			// 标头（一次发送所有标头）
			requestHeaders = {},
			requestHeadersNames = {},

			// 默认中止消息
			strAbort = "canceled",

			// 假 xhr
			jqXHR = {
				readyState: 0,

				// 根据需要构建标头哈希表
				getResponseHeader: function (key) {
					var match;
					if (completed) {
						if (!responseHeaders) {
							responseHeaders = {};
							while ((match = rheaders.exec(responseHeadersString))) {

								// 支持：IE 11+
// IE 中的 'getResponseHeader（ key ）' 不合并所有标头
// values 转换为具有 values 的单个结果
// 与其他浏览器一样用逗号连接。相反，它会返回
// 它们位于不同的行上。
								responseHeaders[match[1].toLowerCase() + " "] =
									(responseHeaders[match[1].toLowerCase() + " "] || [])
										.concat(match[2]);
							}
						}
						match = responseHeaders[key.toLowerCase() + " "];
					}
					return match == null ? null : match.join(", ");
				},

				// 原始字符串
				getAllResponseHeaders: function () {
					return completed ? responseHeadersString : null;
				},

				// 缓存标头
				setRequestHeader: function (name, value) {
					if (completed == null) {
						name = requestHeadersNames[name.toLowerCase()] =
							requestHeadersNames[name.toLowerCase()] || name;
						requestHeaders[name] = value;
					}
					return this;
				},

				// 覆盖响应 content-type 标头
				overrideMimeType: function (type) {
					if (completed == null) {
						s.mimeType = type;
					}
					return this;
				},

				// 状态相关回调
				statusCode: function (map) {
					var code;
					if (map) {
						if (completed) {

							// 执行适当的回调
							jqXHR.always(map[jqXHR.status]);
						} else {

							// 以保留旧回调的方式延迟添加新回调
							for (code in map) {
								statusCode[code] = [statusCode[code], map[code]];
							}
						}
					}
					return this;
				},

				// 取消请求
				abort: function (statusText) {
					var finalText = statusText || strAbort;
					if (transport) {
						transport.abort(finalText);
					}
					done(0, finalText);
					return this;
				}
			};

		// 附加延迟
		deferred.promise(jqXHR);

		// 如果未提供，请添加协议（预过滤器可能期望它）
// 处理 settings 对象中的虚假 url（trac-10093：与旧签名一致）
// 如果可用，我们还使用 url 参数
		s.url = ((url || s.url || location.href) + "")
			.replace(rprotocol, location.protocol + "//");

		// 根据票证 trac-12004 键入的别名方法选项
		s.type = options.method || options.type || s.method || s.type;

		// 提取数据类型列表
		s.dataTypes = (s.dataType || "*").toLowerCase().match(rnothtmlwhite) || [""];

		// 当源与当前源不匹配时，将按顺序发出跨域请求。
		if (s.crossDomain == null) {
			urlAnchor = document.createElement("a");

			// 支持： IE <=8 - 11+
// 如果 url 格式错误，IE 在访问 href 属性时会引发异常，
// 例如 http：//example.com：80x/
			try {
				urlAnchor.href = s.url;

				// 支持： IE <=8 - 11+
// 当 s.url 是 relative 时，锚点的 host 属性未正确设置
				urlAnchor.href = urlAnchor.href;
				s.crossDomain = originAnchor.protocol + "//" + originAnchor.host !==
					urlAnchor.protocol + "//" + urlAnchor.host;
			} catch (e) {

				// 如果解析 URL 时出错，则假设它是 crossDomain，
// 如果它无效，则可以被 transport 拒绝
				s.crossDomain = true;
			}
		}

		// 应用预过滤器
		inspectPrefiltersOrTransports(prefilters, s, options, jqXHR);

		// 如果还不是字符串，则转换数据
		if (s.data && s.processData && typeof s.data !== "string") {
			s.data = jQuery.param(s.data, s.traditional);
		}

		// 如果请求在预过滤器内中止，则在此处停止
		if (completed) {
			return jqXHR;
		}

		// 如果需要，我们现在可以触发全球事件
// 如果在 ESM 使用场景中未定义 jQuery.event，则不触发事件 （trac-15118）
		fireGlobals = jQuery.event && s.global;

		// 关注一组新的请求
		if (fireGlobals && jQuery.active++ === 0) {
			jQuery.event.trigger("ajaxStart");
		}

		// 将类型大写
		s.type = s.type.toUpperCase();

		// 确定请求是否包含内容
		s.hasContent = !rnoContent.test(s.type);

		// 保存 URL，以防我们玩弄 If-Modified-Since
// 和/或 If-None-Match 标头
// 删除哈希以简化 url 操作
		cacheURL = s.url.replace(rhash, "");

		// 为没有内容的请求处理更多选项
		if (!s.hasContent) {

			// 记住哈希值，以便我们可以将其放回原处
			uncached = s.url.slice(cacheURL.length);

			// 如果数据可用且应进行处理，请将数据附加到 url
			if (s.data && (s.processData || typeof s.data === "string")) {
				cacheURL += (rquery.test(cacheURL) ? "&" : "?") + s.data;

				// TRAC-9682：移除数据，使其在最终重试中不被使用
				delete s.data;
			}

			// 如果需要，添加或更新 anti-cache param
			if (s.cache === false) {
				cacheURL = cacheURL.replace(rantiCache, "$1");
				uncached = (rquery.test(cacheURL) ? "&" : "?") + "_=" +
					(nonce.guid++) + uncached;
			}

			// 在将请求的 URL 上放置哈希和防缓存 （gh-1732）
			s.url = cacheURL + uncached;

			// 如果这是以正文内容形式编码的，请将“%20”更改为“+” （gh-2658）
		} else if (s.data && s.processData &&
			(s.contentType || "").indexOf("application/x-www-form-urlencoded") === 0) {
			s.data = s.data.replace(r20, "+");
		}

		// 如果处于 ifModified 模式，请设置 If-Modified-Since 和/或 If-None-Match 标头。
		if (s.ifModified) {
			if (jQuery.lastModified[cacheURL]) {
				jqXHR.setRequestHeader("If-Modified-Since", jQuery.lastModified[cacheURL]);
			}
			if (jQuery.etag[cacheURL]) {
				jqXHR.setRequestHeader("If-None-Match", jQuery.etag[cacheURL]);
			}
		}

		// 如果正在发送数据，请设置正确的标头
		if (s.data && s.hasContent && s.contentType !== false || options.contentType) {
			jqXHR.setRequestHeader("Content-Type", s.contentType);
		}

		// 根据 dataType 为服务器设置 Accepts 标头
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[0] && s.accepts[s.dataTypes[0]] ?
				s.accepts[s.dataTypes[0]] +
				(s.dataTypes[0] !== "*" ? ", " + allTypes + "; q=0.01" : "") :
				s.accepts["*"]
		);

		// Check for headers 选项
		for (i in s.headers) {
			jqXHR.setRequestHeader(i, s.headers[i]);
		}

		// 允许自定义标头/mimetype 和提前中止
		if (s.beforeSend &&
			(s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) {

			// 如果尚未完成，则中止并返回
			return jqXHR.abort();
		}

		// 中止不再是取消
		strAbort = "abort";

		// 在 deferreds 上安装回调
		completeDeferred.add(s.complete);
		jqXHR.done(s.success);
		jqXHR.fail(s.error);

		// 获取交通
		transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR);

		// 如果没有 transport，我们会自动中止
		if (!transport) {
			done(-1, "No Transport");
		} else {
			jqXHR.readyState = 1;

			// 发送全局事件
			if (fireGlobals) {
				globalEventContext.trigger("ajaxSend", [jqXHR, s]);
			}

			// 如果请求在 ajaxSend 中中止，则在此处停止
			if (completed) {
				return jqXHR;
			}

			// 超时
			if (s.async && s.timeout > 0) {
				timeoutTimer = window.setTimeout(function () {
					jqXHR.abort("timeout");
				}, s.timeout);
			}

			try {
				completed = false;
				transport.send(requestHeaders, done);
			} catch (e) {

				// Rethrow post-completion 异常
				if (completed) {
					throw e;
				}

				// 将其他 Propagate others as results
				done(-1, e);
			}
		}

		// 所有操作完成后的回调
		function done(status, nativeStatusText, responses, headers) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// 忽略重复调用
			if (completed) {
				return;
			}

			completed = true;

			// 如果存在，请清除超时
			if (timeoutTimer) {
				window.clearTimeout(timeoutTimer);
			}

			// 取消引用传输以进行早期垃圾回收
			// （无论 jqXHR 对象将使用多长时间）
			transport = undefined;

			// 缓存响应标头
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// 确定是否成功
			isSuccess = status >= 200 && status < 300 || status === 304;

			// 获取响应数据
			if (responses) {
				response = ajaxHandleResponses(s, jqXHR, responses);
			}

			// 对缺少的脚本使用 noop 转换器，但如果 jsonp 则不这样做
			if (!isSuccess &&
				jQuery.inArray("script", s.dataTypes) > -1 &&
				jQuery.inArray("json", s.dataTypes) < 0) {
				s.converters["text script"] = function () { };
			}

			// 无论如何都要转换（这样 responseXXX 字段总是被设置的）
			response = ajaxConvert(s, response, jqXHR, isSuccess);

			// 如果成功，则处理类型链接
			if (isSuccess) {

				// 如果处于 ifModified 模式，请设置 If-Modified-Since 和/或 If-None-Match 标头。
				if (s.ifModified) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if (modified) {
						jQuery.lastModified[cacheURL] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if (modified) {
						jQuery.etag[cacheURL] = modified;
					}
				}

				// 如果没有内容
				if (status === 204 || s.type === "HEAD") {
					statusText = "nocontent";

					// 如果未修改
				} else if (status === 304) {
					statusText = "notmodified";

					// 如果我们有数据，让我们转换它
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {

				// 从 statusText 中提取错误并针对非中止进行规范化
				error = statusText;
				if (status || !statusText) {
					statusText = "error";
					if (status < 0) {
						status = 0;
					}
				}
			}

			// 为假 xhr 对象设置数据
			jqXHR.status = status;
			jqXHR.statusText = (nativeStatusText || statusText) + "";

			// Success/Error
			if (isSuccess) {
				deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
			} else {
				deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
			}

			// 状态相关回调
			jqXHR.statusCode(statusCode);
			statusCode = undefined;

			if (fireGlobals) {
				globalEventContext.trigger(isSuccess ? "ajaxSuccess" : "ajaxError",
					[jqXHR, s, isSuccess ? success : error]);
			}

			// 完成
			completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);

			if (fireGlobals) {
				globalEventContext.trigger("ajaxComplete", [jqXHR, s]);

				// 处理全局 AJAX 计数器
				if (!(--jQuery.active)) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function (url, data, callback) {
		return jQuery.get(url, data, callback, "json");
	},

	getScript: function (url, callback) {
		return jQuery.get(url, undefined, callback, "script");
	}
});

jQuery.each(["get", "post"], function (_i, method) {
	jQuery[method] = function (url, data, callback, type) {

		// 如果省略了 data 参数，则移动参数。
		// 处理 null 回调占位符。
		if (typeof data === "function" || data === null) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		// url 可以是 options 对象（然后必须具有 .url）
		return jQuery.ajax(jQuery.extend({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		}, jQuery.isPlainObject(url) && url));
	};
});

jQuery.ajaxPrefilter(function (s) {
	var i;
	for (i in s.headers) {
		if (i.toLowerCase() === "content-type") {
			s.contentType = s.headers[i] || "";
		}
	}
});

export { jQuery, jQuery as $ };
