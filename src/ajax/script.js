import { jQuery } from "../core.js";
import { document } from "../var/document.js";

import "../ajax.js";

function canUseScriptTag(s) {

	// 脚本标签只能用于异步、跨域或 forced-by-attrs 请求。
	// 带有标头的请求不能使用 script 标签。但是，当 'scriptAttrs' 和
	// 'headers' 选项，两者不可能一起满足;我们
	// 那么更喜欢 'scriptAttrs' 。
	// 同步请求的处理方式保持不变，以保持严格的脚本排序。
	return s.scriptAttrs || (
		!s.headers &&
		(
			s.crossDomain ||

			// 处理 JSONP 时（'s.dataTypes' 则包含 “json”）
			// 不要使用 script 标签，以便错误响应仍然可能具有
			// 'responseJSON' 设置。继续对 JSONP 请求使用脚本标签，满足以下条件：
			//   * 是跨域的，因为如果没有 CORS 设置，AJAX 请求将无法工作
			//   * 设置了 'scriptAttrs'，因为这是一个仅限脚本的功能
			// 请注意，这意味着 JSONP 请求违反了严格的 CSP script-src 设置。
			// 一个合适的解决方案是从使用 JSONP 迁移到 CORS 设置。
			(s.async && jQuery.inArray("json", s.dataTypes) < 0)
		)
	);
}

// 安装脚本 dataType。不要指定 'contents.script'，这样显式的
// 'dataType： “script”' 是必需的（请参阅 GH-2432、GH-4822）
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, " +
			"application/ecmascript, application/x-ecmascript"
	},
	converters: {
		"text script": function (text) {
			jQuery.globalEval(text);
			return text;
		}
	}
});

// 处理缓存的特殊情况和 crossDomain
jQuery.ajaxPrefilter("script", function (s) {
	if (s.cache === undefined) {
		s.cache = false;
	}

	// 这些类型的请求通过 script 标签进行处理
	// 所以强制他们的方法执行 GET。
	if (canUseScriptTag(s)) {
		s.type = "GET";
	}
});

// 绑定脚本标签 hack 传输
jQuery.ajaxTransport("script", function (s) {
	if (canUseScriptTag(s)) {
		var script, callback;
		return {
			send: function (_, complete) {
				script = jQuery("<script>")
					.attr(s.scriptAttrs || {})
					.prop({ charset: s.scriptCharset, src: s.url })
					.on("load error", callback = function (evt) {
						script.remove();
						callback = null;
						if (evt) {
							complete(evt.type === "error" ? 404 : 200, evt.type);
						}
					});

				// 使用本机 DOM 操作来避免我们的 domManip AJAX 欺骗
				document.head.appendChild(script[0]);
			},
			abort: function () {
				if (callback) {
					callback();
				}
			}
		};
	}
});
