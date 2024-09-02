/*
 * 用于自定义构建的可选有限选择器模块。
 *
 * 请注意，这不支持许多记录在 JQUERY
 * 功能换取其更小的尺寸：
 *
 * * 属性不等于选择器 （！=）
 * * 位置选择器 （：first; ：eq（n）; ：odd; 等）
 * * 类型选择器 （：input; ：checkbox; ：button; 等）
 * * 基于状态的选择器 （：animated; ：visible; ：hidden; 等）
 * * ：has（selector） 在没有本机支持的浏览器中
 * * IE 中的 ：not（复杂选择器）
 * * 通过 jQuery 扩展自定义选择器
 * * XML 片段上的可靠功能
 * * 与非元素匹配
 * * 对断开连接的节点进行可靠排序
 * * querySelector所有错误修复（例如，不可靠：关注 WebKit）
 *
 * 如果其中任何一个是不可接受的权衡，请使用完整的
 * selector engine 或为项目的特定
 * 需要。
 */

import { jQuery } from "./core.js";
import { document } from "./var/document.js";
import { whitespace } from "./var/whitespace.js";
import { isIE } from "./var/isIE.js";
import { rleadingCombinator } from "./selector/var/rleadingCombinator.js";
import { rdescend } from "./selector/var/rdescend.js";
import { rsibling } from "./selector/var/rsibling.js";
import { matches } from "./selector/var/matches.js";
import { testContext } from "./selector/testContext.js";
import { filterMatchExpr } from "./selector/filterMatchExpr.js";
import { preFilter } from "./selector/preFilter.js";
import { tokenize } from "./selector/tokenize.js";
import { toSelector } from "./selector/toSelector.js";

// 以下 util 直接附加到 jQuery 对象。
import "./selector/escapeSelector.js";
import "./selector/uniqueSort.js";

var matchExpr = jQuery.extend({
	needsContext: new RegExp("^" + whitespace + "*[>+~]")
}, filterMatchExpr);

jQuery.extend({
	find: function (selector, context, results, seed) {
		var elem, nid, groups, newSelector,
			newContext = context && context.ownerDocument,

			// nodeType 默认为 9，因为 context 默认为 document
			nodeType = context ? context.nodeType : 9,
			i = 0;

		results = results || [];
		context = context || document;

		// 与完整选择器模块中的基本保护措施相同
		if (!selector || typeof selector !== "string") {
			return results;
		}

		// 如果 context 不是元素、文档或文档片段，则提前返回
		if (nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {
			return [];
		}

		if (seed) {
			while ((elem = seed[i++])) {
				if (jQuery.find.matchesSelector(elem, selector)) {
					results.push(elem);
				}
			}
		} else {

			newSelector = selector;
			newContext = context;

			// qSA 在评估 child 或
			// descendant 组合器，这不是我们想要的。
			// 在这种情况下，我们通过在
			// list 中引用 scope 上下文的 ID 选择器。
			// 当使用领先的运算器时，也必须使用该技术
			// 因此，querySelectorAll 无法识别 selector 。
			// 感谢 Andrew Dupont 的这项技术。
			if (nodeType === 1 &&
				(rdescend.test(selector) || rleadingCombinator.test(selector))) {

				// 展开同级选择器的上下文
				newContext = rsibling.test(selector) &&
					testContext(context.parentNode) ||
					context;

				// 在 IE 之外，如果我们不改变上下文，我们可以
				// 使用 ：scope 而不是 ID。
				if (newContext !== context || isIE) {

					// 捕获上下文 ID，必要时先设置
					if ((nid = context.getAttribute("id"))) {
						nid = jQuery.escapeSelector(nid);
					} else {
						context.setAttribute("id", (nid = jQuery.expando));
					}
				}

				// 为列表中的每个选择器添加前缀
				groups = tokenize(selector);
				i = groups.length;
				while (i--) {
					groups[i] = (nid ? "#" + nid : ":scope") + " " +
						toSelector(groups[i]);
				}
				newSelector = groups.join(",");
			}

			try {
				jQuery.merge(results, newContext.querySelectorAll(newSelector));
			} finally {
				if (nid === jQuery.expando) {
					context.removeAttribute("id");
				}
			}
		}

		return results;
	},
	expr: {

		// 可由用户调整
		cacheLength: 50,

		match: matchExpr,
		preFilter: preFilter
	}
});

jQuery.extend(jQuery.find, {
	matches: function (expr, elements) {
		return jQuery.find(expr, null, null, elements);
	},
	matchesSelector: function (elem, expr) {
		return matches.call(elem, expr);
	},
	tokenize: tokenize
});

export { jQuery, jQuery as $ };
