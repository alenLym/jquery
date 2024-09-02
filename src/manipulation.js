import { jQuery } from "./core.js";
import { isAttached } from "./core/isAttached.js";
import { isIE } from "./var/isIE.js";
import { push } from "./var/push.js";
import { access } from "./core/access.js";
import { rtagName } from "./manipulation/var/rtagName.js";
import { wrapMap } from "./manipulation/wrapMap.js";
import { getAll } from "./manipulation/getAll.js";
import { domManip } from "./manipulation/domManip.js";
import { setGlobalEval } from "./manipulation/setGlobalEval.js";
import { dataPriv } from "./data/var/dataPriv.js";
import { dataUser } from "./data/var/dataUser.js";
import { acceptData } from "./data/var/acceptData.js";
import { nodeName } from "./core/nodeName.js";

import "./core/init.js";
import "./traversing.js";
import "./event.js";

var

	// 支持： IE <=10 - 11+
	// 在 IE 中，在此处使用正则表达式组会导致严重的速度变慢。
	rnoInnerhtml = /<script|<style|<link/i;

// 在包含新行时，首选 tbody 而不是其父表
function manipulationTarget(elem, content) {
	if (nodeName(elem, "table") &&
		nodeName(content.nodeType !== 11 ? content : content.firstChild, "tr")) {

		return jQuery(elem).children("tbody")[0] || elem;
	}

	return elem;
}

/**
 * 将 copy 事件从源元素克隆到目标元素。
 * @param {Element} src - 要从中复制事件的源元素。
 * @param {Element} dest - 事件将复制到的目标元素。
 * @returns 无
 */
function cloneCopyEvent(src, dest) {
	var type, i, l,
		events = dataPriv.get(src, "events");

	if (dest.nodeType !== 1) {
		return;
	}

	// 1. 复制私有数据：事件、处理程序等。
	if (events) {
		dataPriv.remove(dest, "handle events");
		for (type in events) {
			for (i = 0, l = events[type].length; i < l; i++) {
				jQuery.event.add(dest, type, events[type][i]);
			}
		}
	}

	// 2. 复制用户数据
	if (dataUser.hasData(src)) {
		dataUser.set(dest, jQuery.extend({}, dataUser.get(src)));
	}
}

/**
 * 根据给定的选择器从 DOM 中删除元素。
 * @param {Element} elem - 要删除的一个或多个元素。
 * @param {string} selector - 用于筛选要删除的元素的选择器。
 * @param {boolean} keepData - 用于指示是否保持数据与元素关联的标志。
 * @returns {element} 删除后修改的元素。
 */
function remove(elem, selector, keepData) {
	var node,
		nodes = selector ? jQuery.filter(selector, elem) : elem,
		i = 0;

	for (; (node = nodes[i]) != null; i++) {
		if (!keepData && node.nodeType === 1) {
			jQuery.cleanData(getAll(node));
		}

		if (node.parentNode) {
			if (keepData && isAttached(node)) {
				setGlobalEval(getAll(node, "script"));
			}
			node.parentNode.removeChild(node);
		}
	}

	return elem;
}

jQuery.extend({
	htmlPrefilter: function (html) {
		return html;
	},

	/**
	 * 创建给定元素的深层副本，包括其 children 和 data。
	 * @param {Element} elem - 要克隆的元素。
	 * @param {boolean} [dataAndEvents] - 一个布尔值，指示是否复制元素的数据和事件。
	 * @param {boolean} [deepDataAndEvents] - 一个布尔值，指示是否递归复制元素的数据和事件。
	 * @returns {Element} 元素及其数据和事件的深层副本。
	 */
	clone: function (elem, dataAndEvents, deepDataAndEvents) {
		var i, l, srcElements, destElements,
			clone = elem.cloneNode(true),
			inPage = isAttached(elem);

		// Fix IE cloning issues
		if (isIE && (elem.nodeType === 1 || elem.nodeType === 11) &&
			!jQuery.isXMLDoc(elem)) {

			// 出于性能原因，我们在此处避免使用 jQuery#find：
			// https://jsperf.com/getall-vs-sizzle/2
			destElements = getAll(clone);
			srcElements = getAll(elem);

			for (i = 0, l = srcElements.length; i < l; i++) {

				// 支持：IE <=11+
				// IE 无法将 defaultValue 设置为正确的值
				// 克隆 TextAreas。
				if (nodeName(destElements[i], "textarea")) {
					destElements[i].defaultValue = srcElements[i].defaultValue;
				}
			}
		}

		// 将事件从原始事件复制到克隆
		if (dataAndEvents) {
			if (deepDataAndEvents) {
				srcElements = srcElements || getAll(elem);
				destElements = destElements || getAll(clone);

				for (i = 0, l = srcElements.length; i < l; i++) {
					cloneCopyEvent(srcElements[i], destElements[i]);
				}
			} else {
				cloneCopyEvent(elem, clone);
			}
		}

		// 保留脚本评估历史记录
		destElements = getAll(clone, "script");
		if (destElements.length > 0) {
			setGlobalEval(destElements, !inPage && getAll(elem, "script"));
		}

		// 返回克隆的集
		return clone;
	},

	/**
	 * 清理与给定元素关联的数据。
	 * @param {Array} elems - 要为其清理数据的元素数组。
	 * @returns 无
	 */
	cleanData: function (elems) {
		var data, elem, type,
			special = jQuery.event.special,
			i = 0;

		for (; (elem = elems[i]) !== undefined; i++) {
			if (acceptData(elem)) {
				if ((data = elem[dataPriv.expando])) {
					if (data.events) {
						for (type in data.events) {
							if (special[type]) {
								jQuery.event.remove(elem, type);

								// 这是避免 jQuery.event.remove 开销的快捷方式
							} else {
								jQuery.removeEvent(elem, type, data.handle);
							}
						}
					}

					// 支持：Chrome <=35 - 45+
					// assign undefined 而不是使用 delete，参见 Data#remove
					elem[dataPriv.expando] = undefined;
				}
				if (elem[dataUser.expando]) {

					// 支持：Chrome <=35 - 45+
					// assign undefined 而不是使用 delete，参见 Data#remove
					elem[dataUser.expando] = undefined;
				}
			}
		}
	}
});

jQuery.fn.extend({
	/**
	 * 从 DOM 中分离所选元素，而不删除其数据或事件处理程序。
	 * @param {string} selector - 要分离的元素的选择器。
	 * @returns 分离的元素。
	 */
	detach: function (selector) {
		return remove(this, selector, true);
	},

	/**
	 * 根据给定的选择器从 DOM 中删除元素。
	 * @param {string} 选择器 - 用于标识要删除的元素的 CSS 选择器。
	 * @returns 已删除的元素。
	 */
	remove: function (selector) {
		return remove(this, selector);
	},

	/**
	 * 设置或返回所选元素的文本内容的函数。
	 * 如果提供了值，则会将元素的文本内容设置为提供的值。
	 * 如果未提供任何值，则返回第一个选定元素的文本内容。
	 * @param {any} 值 - 要为所选元素设置的文本内容。
	 * @returns 所选元素的文本内容或将文本内容设置为提供的值。
	 */
	text: function (value) {
		return access(this, function (value) {
			return value === undefined ?
				jQuery.text(this) :
				this.empty().each(function () {
					if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
						this.textContent = value;
					}
				});
		}, null, value, arguments.length);
	},

	/**
	 * 将指定的元素附加到目标元素。
	 * @returns 无
	 */
	append: function () {
		return domManip(this, arguments, function (elem) {
			if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
				var target = manipulationTarget(this, elem);
				target.appendChild(elem);
			}
		});
	},

	/**
	 * 将指定的内容作为匹配元素集中每个元素的第一个子元素插入。
	 * @returns {Object} - 修改后的匹配元素集。
	 */
	prepend: function () {
		return domManip(this, arguments, function (elem) {
			if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
				var target = manipulationTarget(this, elem);
				target.insertBefore(elem, target.firstChild);
			}
		});
	},

	/**
	 * 在 DOM 中的当前元素之前插入指定的元素。
	 * @returns 无
	 */
	before: function () {
		return domManip(this, arguments, function (elem) {
			if (this.parentNode) {
				this.parentNode.insertBefore(elem, this);
			}
		});
	},

	/**
	 * 在匹配元素集中的每个元素后插入内容。
	 * @returns {Object} 返回修改后的匹配元素集。
	 */
	after: function () {
		return domManip(this, arguments, function (elem) {
			if (this.parentNode) {
				this.parentNode.insertBefore(elem, this.nextSibling);
			}
		});
	},

	/**
	 * 清空 jQuery 对象中每个元素的内容。
	 * @function
	 * @name 为空
	 * @memberof jQuery.fn
	 * @returns {jQuery} 用于链接的 jQuery 对象。
	 */
	empty: function () {
		var elem,
			i = 0;

		for (; (elem = this[i]) != null; i++) {
			if (elem.nodeType === 1) {

				// Prevent memory leaks
				jQuery.cleanData(getAll(elem, false));

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	/**
	 * 在 jQuery 对象中创建元素的深层副本。
	 * @param {boolean} [dataAndEvents=] - 一个布尔值，指示是否在克隆中包含数据和事件。
	 * @param {boolean} [deepDataAndEvents=] - 一个布尔值，指示是否执行深层复制。
	 * @returns {jQuery} 包含克隆元素的新 jQuery 对象。
	 */
	clone: function (dataAndEvents, deepDataAndEvents) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map(function () {
			return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
		});
	},

	/**
	 * 一个函数，用于处理 jQuery 对象中的 HTML 内容操作。
	 * @param {any} 值 - 要设置或检索的 HTML 内容。
	 * @returns jQuery 对象中操作的 HTML 内容。
	 */
	html: function (value) {
		return access(this, function (value) {
			var elem = this[0] || {},
				i = 0,
				l = this.length;

			if (value === undefined && elem.nodeType === 1) {
				return elem.innerHTML;
			}

			// 看看我们是否可以走捷径，只使用 innerHTML
			if (typeof value === "string" && !rnoInnerhtml.test(value) &&
				!wrapMap[(rtagName.exec(value) || ["", ""])[1].toLowerCase()]) {

				value = jQuery.htmlPrefilter(value);

				try {
					for (; i < l; i++) {
						elem = this[i] || {};

						// 删除元素节点并防止内存泄漏
						if (elem.nodeType === 1) {
							jQuery.cleanData(getAll(elem, false));
							elem.innerHTML = value;
						}
					}

					elem = 0;

					// 如果使用 innerHTML 引发异常，请使用 fallback 方法
				} catch (e) { }
			}

			if (elem) {
				this.empty().append(value);
			}
		}, null, value, arguments.length);
	},

	/**
	 * 将匹配元素集中的每个元素替换为提供的新内容。
	 * @param {Function} function - 要为每个元素执行的函数，将新内容作为参数。
	 * @returns 无
	 */
	replaceWith: function () {
		var ignored = [];

		// 进行更改，将每个未忽略的上下文元素替换为新内容
		return domManip(this, arguments, function (elem) {
			var parent = this.parentNode;

			if (jQuery.inArray(this, ignored) < 0) {
				jQuery.cleanData(getAll(this));
				if (parent) {
					parent.replaceChild(elem, this);
				}
			}

			// 强制回调调用
		}, ignored);
	}
});

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function (name, original) {
	jQuery.fn[name] = function (selector) {
		var elems,
			ret = [],
			insert = jQuery(selector),
			last = insert.length - 1,
			i = 0;

		for (; i <= last; i++) {
			elems = i === last ? this : this.clone(true);
			jQuery(insert[i])[original](elems);
			push.apply(ret, elems);
		}

		return this.pushStack(ret);
	};
});

export { jQuery, jQuery as $ };
