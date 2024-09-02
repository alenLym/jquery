import { jQuery } from "../core.js";
import { indexOf } from "../var/indexOf.js";
import { rneedsContext } from "./var/rneedsContext.js";

import "../selector.js";

// 为 filter 和 not 实现相同的功能
function winnow(elements, qualifier, not) {
	if (typeof qualifier === "function") {
		return jQuery.grep(elements, function (elem, i) {
			return !!qualifier.call(elem, i, elem) !== not;
		});
	}

	// 单元件
	if (qualifier.nodeType) {
		return jQuery.grep(elements, function (elem) {
			return (elem === qualifier) !== not;
		});
	}

	// 元素的数组类（jQuery、参数、数组）
	if (typeof qualifier !== "string") {
		return jQuery.grep(elements, function (elem) {
			return (indexOf.call(qualifier, elem) > -1) !== not;
		});
	}

	// 直接过滤简单和复杂选择器
	return jQuery.filter(qualifier, elements, not);
}

jQuery.filter = function (expr, elems, not) {
	var elem = elems[0];

	if (not) {
		expr = ":not(" + expr + ")";
	}

	if (elems.length === 1 && elem.nodeType === 1) {
		return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
	}

	return jQuery.find.matches(expr, jQuery.grep(elems, function (elem) {
		return elem.nodeType === 1;
	}));
};

jQuery.fn.extend({
	find: function (selector) {
		var i, ret,
			len = this.length,
			self = this;

		if (typeof selector !== "string") {
			return this.pushStack(jQuery(selector).filter(function () {
				for (i = 0; i < len; i++) {
					if (jQuery.contains(self[i], this)) {
						return true;
					}
				}
			}));
		}

		ret = this.pushStack([]);

		for (i = 0; i < len; i++) {
			jQuery.find(selector, self[i], ret);
		}

		return len > 1 ? jQuery.uniqueSort(ret) : ret;
	},
	filter: function (selector) {
		return this.pushStack(winnow(this, selector || [], false));
	},
	not: function (selector) {
		return this.pushStack(winnow(this, selector || [], true));
	},
	is: function (selector) {
		return !!winnow(
			this,

			// 如果这是位置/相对选择器，请检查返回集中的成员身份
			// 所以 $（“p：first”）.is（“p：last”） 不会为包含两个 “p” 的文档返回 true。
			typeof selector === "string" && rneedsContext.test(selector) ?
				jQuery(selector) :
				selector || [],
			false
		).length;
	}
});
