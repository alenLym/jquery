// 初始化 jQuery 对象
import { jQuery } from "../core.js";
import { document } from "../var/document.js";
import { rsingleTag } from "./var/rsingleTag.js";
import { isObviousHtml } from "./isObviousHtml.js";

import "../traversing/findFilter.js";

// 对根 jQuery（document） 的中心引用
var rootjQuery,

	// 检查 HTML 字符串的简单方法
	// 优先 #id <tag> 以避免通过 location.hash 进行 XSS （trac-9521）
	// 严格 HTML 识别（trac-11290：必须以 < 开头）
	// 捷径 简单 #id 速度案例
	rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,

	init = jQuery.fn.init = function (selector, context) {
		var match, elem;

		// HANDLE: $(""), $(null), $(undefined), $(false)
		if (!selector) {
			return this;
		}

		// HANDLE: $(DOMElement)
		if (selector.nodeType) {
			this[0] = selector;
			this.length = 1;
			return this;

			// 句柄：$（function）
			// 文档就绪的快捷方式
		} else if (typeof selector === "function") {
			return rootjQuery.ready !== undefined ?
				rootjQuery.ready(selector) :

				// 如果 ready 不存在，则立即执行
				selector(jQuery);

		} else {

			// 处理明显的 HTML 字符串
			match = selector + "";
			if (isObviousHtml(match)) {

				// 假设以 <> 开头和结尾的字符串是 HTML 和 skip
				// 正则表达式检查。这还会处理浏览器支持的 HTML 包装器
				// 就像 TrustedHTML 一样。
				match = [null, selector, null];

				// 处理 HTML 字符串或选择器
			} else if (typeof selector === "string") {
				match = rquickExpr.exec(selector);
			} else {
				return jQuery.makeArray(selector, this);
			}

			// 匹配 html 或确保没有为 #id 指定上下文
			// 注意：match[1] 可以是字符串或 TrustedHTML 包装器
			if (match && (match[1] || !context)) {

				// HANDLE: $(html) -> $(array)
				if (match[1]) {
					context = context instanceof jQuery ? context[0] : context;

					// 运行脚本的选项对于向后兼容为 true
					// 如果 parseHTML 不存在，则故意引发错误
					jQuery.merge(this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					));

					// HANDLE: $(html, props)
					if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
						for (match in context) {

							// 如果可能，将 context 的属性作为方法调用
							if (typeof this[match] === "function") {
								this[match](context[match]);

								// ...，否则设置为 attributes
							} else {
								this.attr(match, context[match]);
							}
						}
					}

					return this;

					// HANDLE: $(#id)
				} else {
					elem = document.getElementById(match[2]);

					if (elem) {

						// 将元素直接注入 jQuery 对象
						this[0] = elem;
						this.length = 1;
					}
					return this;
				}

				// HANDLE: $(expr) & $(expr, $(...))
			} else if (!context || context.jquery) {
				return (context || rootjQuery).find(selector);

				// 句柄： $（expr， context）
				// （相当于： $（context）.find（expr）
			} else {
				return this.constructor(context).find(selector);
			}
		}

	};

// 为 init 函数提供 jQuery 原型以供以后实例化
init.prototype = jQuery.fn;

// 初始化中心引用
rootjQuery = jQuery(document);
