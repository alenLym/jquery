import { jQuery } from "./core.js";
import { access } from "./core/access.js";
import { documentElement } from "./var/documentElement.js";
import { isWindow } from "./var/isWindow.js";

import "./core/init.js";
import "./css.js";

jQuery.offset = {
	setOffset: function (elem, options, i) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css(elem, "position"),
			curElem = jQuery(elem),
			props = {};

		// 首先设置位置，如果 top/left 甚至在静态 elem 上设置也是如此
		if (position === "static") {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css(elem, "top");
		curCSSLeft = jQuery.css(elem, "left");
		calculatePosition = (position === "absolute" || position === "fixed") &&
			(curCSSTop + curCSSLeft).indexOf("auto") > -1;

		// 需要能够计算位置，如果
		// top 或 left 是 auto 的，position 是 absolute 或 fixed
		if (calculatePosition) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat(curCSSTop) || 0;
			curLeft = parseFloat(curCSSLeft) || 0;
		}

		if (typeof options === "function") {

			// 在此处使用 jQuery.extend 允许修改坐标参数 （gh-1848）
			options = options.call(elem, i, jQuery.extend({}, curOffset));
		}

		if (options.top != null) {
			props.top = (options.top - curOffset.top) + curTop;
		}
		if (options.left != null) {
			props.left = (options.left - curOffset.left) + curLeft;
		}

		if ("using" in options) {
			options.using.call(elem, props);

		} else {
			curElem.css(props);
		}
	}
};

jQuery.fn.extend({

	// offset（） 将元素的边框与文档原点相关联
	offset: function (options) {

		// 为 setter 保留链接
		if (arguments.length) {
			return options === undefined ?
				this :
				this.each(function (i) {
					jQuery.offset.setOffset(this, options, i);
				});
		}

		var rect, win,
			elem = this[0];

		if (!elem) {
			return;
		}

		// 为断开连接和隐藏的 （display： none） 元素返回零 （gh-2310）
		// 支持：IE <=11+
		// 在
		// IE 中的 disconnected 节点引发错误
		if (!elem.getClientRects().length) {
			return { top: 0, left: 0 };
		}

		// 通过将视区滚动添加到视区相对 gBCR 来获取文档相对位置
		rect = elem.getBoundingClientRect();
		win = elem.ownerDocument.defaultView;
		return {
			top: rect.top + win.pageYOffset,
			left: rect.left + win.pageXOffset
		};
	},

	// position（） 将元素的 margin 框与其 offset 父级的 padding box 相关联
	// 这与 CSS 绝对定位的行为相对应
	position: function () {
		if (!this[0]) {
			return;
		}

		var offsetParent, offset, doc,
			elem = this[0],
			parentOffset = { top: 0, left: 0 };

		// position：fixed 元素与视区的偏移量相同，而视区本身的偏移量始终为零
		if (jQuery.css(elem, "position") === "fixed") {

			// 假设 position：fixed 意味着 getBoundingClientRect 的可用性
			offset = elem.getBoundingClientRect();

		} else {
			offset = this.offset();

			// 考虑 *real* offset 父元素，它可以是 document 或其根元素
			// 标识静态定位的元素时
			doc = elem.ownerDocument;
			offsetParent = elem.offsetParent || doc.documentElement;
			while (offsetParent &&
				offsetParent !== doc.documentElement &&
				jQuery.css(offsetParent, "position") === "static") {

				offsetParent = offsetParent.offsetParent || doc.documentElement;
			}
			if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1 &&
				jQuery.css(offsetParent, "position") !== "static") {

				// 将边框合并到其偏移量中，因为它们位于其内容原点之外
				parentOffset = jQuery(offsetParent).offset();
				parentOffset.top += jQuery.css(offsetParent, "borderTopWidth", true);
				parentOffset.left += jQuery.css(offsetParent, "borderLeftWidth", true);
			}
		}

		// 减去父偏移量和元素边距
		return {
			top: offset.top - parentOffset.top - jQuery.css(elem, "marginTop", true),
			left: offset.left - parentOffset.left - jQuery.css(elem, "marginLeft", true)
		};
	},

	// 在以下情况下，此方法将返回 documentElement：
	// 1） 对于 iframe 内没有 offsetParent 的元素，该方法会返回
	//    documentElement 的父窗口
	// 2） 对于隐藏或分离的元素
	// 3） 对于 body 或 html 元素，即在 html 节点的情况下 - 它将返回自身
	//
	// 但这些例外从未作为现实生活中的用例呈现
	// ，并且可能被认为是更可取的结果。
	//
	// 但是，此逻辑无法保证，并且将来随时可能更改
	offsetParent: function () {
		return this.map(function () {
			var offsetParent = this.offsetParent;

			while (offsetParent && jQuery.css(offsetParent, "position") === "static") {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || documentElement;
		});
	}
});

// 创建 scrollLeft 和 scrollTop 方法
jQuery.each({ scrollLeft: "pageXOffset", scrollTop: "pageYOffset" }, function (method, prop) {
	var top = "pageYOffset" === prop;

	jQuery.fn[method] = function (val) {
		return access(this, function (elem, method, val) {

			// 合并文档和窗口
			var win;
			if (isWindow(elem)) {
				win = elem;
			} else if (elem.nodeType === 9) {
				win = elem.defaultView;
			}

			if (val === undefined) {
				return win ? win[prop] : elem[method];
			}

			if (win) {
				win.scrollTo(
					!top ? val : win.pageXOffset,
					top ? val : win.pageYOffset
				);

			} else {
				elem[method] = val;
			}
		}, method, val, arguments.length);
	};
});

export { jQuery, jQuery as $ };
