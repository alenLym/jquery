import { jQuery } from "./core.js";
import { getProto } from "./var/getProto.js";
import { indexOf } from "./var/indexOf.js";
import { dir } from "./traversing/var/dir.js";
import { siblings } from "./traversing/var/siblings.js";
import { rneedsContext } from "./traversing/var/rneedsContext.js";
import { nodeName } from "./core/nodeName.js";

import "./core/init.js";
import "./traversing/findFilter.js";
import "./selector.js";

var rparentsprev = /^(?:parents|prev(?:Until|All))/,

	// 保证在从唯一集开始时生成唯一集的方法
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	has: function (target) {
		var targets = jQuery(target, this),
			l = targets.length;

		return this.filter(function () {
			var i = 0;
			for (; i < l; i++) {
				if (jQuery.contains(this, targets[i])) {
					return true;
				}
			}
		});
	},

	closest: function (selectors, context) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			targets = typeof selectors !== "string" && jQuery(selectors);

		// 位置选择器永远不会匹配，因为没有 _selection_ 上下文
		if (!rneedsContext.test(selectors)) {
			for (; i < l; i++) {
				for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {

					// 始终跳过文档片段
					if (cur.nodeType < 11 && (targets ?
						targets.index(cur) > -1 :

						// 不要将非元素传递给 jQuery#find
						cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors))) {

						matched.push(cur);
						break;
					}
				}
			}
		}

		return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
	},

	// 确定元素在集合中的位置
	index: function (elem) {

		// 无参数，返回 parent 中的索引
		if (!elem) {
			return (this[0] && this[0].parentNode) ? this.first().prevAll().length : -1;
		}

		// 选择器中的索引
		if (typeof elem === "string") {
			return indexOf.call(jQuery(elem), this[0]);
		}

		// 找到所需元素的位置
		return indexOf.call(this,

			// 如果它接收到 jQuery 对象，则使用第一个元素
			elem.jquery ? elem[0] : elem
		);
	},

	add: function (selector, context) {
		return this.pushStack(
			jQuery.uniqueSort(
				jQuery.merge(this.get(), jQuery(selector, context))
			)
		);
	},

	addBack: function (selector) {
		return this.add(selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling(cur, dir) {
	while ((cur = cur[dir]) && cur.nodeType !== 1) { }
	return cur;
}

jQuery.each({
	parent: function (elem) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function (elem) {
		return dir(elem, "parentNode");
	},
	parentsUntil: function (elem, _i, until) {
		return dir(elem, "parentNode", until);
	},
	next: function (elem) {
		return sibling(elem, "nextSibling");
	},
	prev: function (elem) {
		return sibling(elem, "previousSibling");
	},
	nextAll: function (elem) {
		return dir(elem, "nextSibling");
	},
	prevAll: function (elem) {
		return dir(elem, "previousSibling");
	},
	nextUntil: function (elem, _i, until) {
		return dir(elem, "nextSibling", until);
	},
	prevUntil: function (elem, _i, until) {
		return dir(elem, "previousSibling", until);
	},
	siblings: function (elem) {
		return siblings((elem.parentNode || {}).firstChild, elem);
	},
	children: function (elem) {
		return siblings(elem.firstChild);
	},
	contents: function (elem) {
		if (elem.contentDocument != null &&

			// 支持：IE 11+
			// <object> 没有 'data' 属性的元素有一个对象
			// 'contentDocument' 替换为 'null' 原型。
			getProto(elem.contentDocument)) {

			return elem.contentDocument;
		}

		// 支持：IE 9 - 11+
		// 在以下浏览器中将 template 元素视为常规元素
		// 不支持它。
		if (nodeName(elem, "template")) {
			elem = elem.content || elem;
		}

		return jQuery.merge([], elem.childNodes);
	}
}, function (name, fn) {
	jQuery.fn[name] = function (until, selector) {
		var matched = jQuery.map(this, fn, until);

		if (name.slice(-5) !== "Until") {
			selector = until;
		}

		if (selector && typeof selector === "string") {
			matched = jQuery.filter(selector, matched);
		}

		if (this.length > 1) {

			// 删除重复项
			if (!guaranteedUnique[name]) {
				jQuery.uniqueSort(matched);
			}

			// 父级* 和 prev 导数的相反顺序
			if (rparentsprev.test(name)) {
				matched.reverse();
			}
		}

		return this.pushStack(matched);
	};
});

export { jQuery, jQuery as $ };
