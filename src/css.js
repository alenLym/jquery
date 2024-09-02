import { jQuery } from "./core.js";
import { access } from "./core/access.js";
import { nodeName } from "./core/nodeName.js";
import { rcssNum } from "./var/rcssNum.js";
import { isIE } from "./var/isIE.js";
import { rnumnonpx } from "./css/var/rnumnonpx.js";
import { rcustomProp } from "./css/var/rcustomProp.js";
import { cssExpand } from "./css/var/cssExpand.js";
import { isAutoPx } from "./css/isAutoPx.js";
import { cssCamelCase } from "./css/cssCamelCase.js";
import { getStyles } from "./css/var/getStyles.js";
import { swap } from "./css/var/swap.js";
import { curCSS } from "./css/curCSS.js";
import { adjustCSS } from "./css/adjustCSS.js";
import { finalPropName } from "./css/finalPropName.js";
import { support } from "./css/support.js";

import "./core/init.js";
import "./core/ready.js";

var

	// 如果 display 为 none 或 starts with table，则可交换
	// 除了 “table”、“table-cell” 或 “table-caption”
	// 有关显示值，请参阅此处：https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: "0",
		fontWeight: "400"
	};


/**
 * 根据 value 和 subtract 值为给定元素设置一个正数。
 * @param {any} _elem - 要为其设置正数的元素。
 * @param {string} value - 要处理的值。
 * @param {number} subtract - 要从已处理值中减去的值（默认值为 0）。
 * @returns 具有适当单位的已处理正数。
 */
function setPositiveNumber(_elem, value, subtract) {

	// 任何相对 （+/-） 值都已
	// 此时归一化
	var matches = rcssNum.exec(value);
	return matches ?

		// 防止未定义的 “subtract”，例如，在 cssHooks 中使用时
		Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || "px") :
		value;
}

/**
 * 根据指定的参数调整元素的框模型。
 * @param {Element} elem - 要调整其盒模型的元素。
 * @param {string} dimension - 要调整的维度（宽度或高度）。
 * @param {string} box - 要调整的框模型（内容、填充、边框、边距）。
 * @param {boolean} isBorderBox - 元素是否使用边框大小调整。
 * @param {object} styles - 元素的样式。
 * @param {number} computedVal - 维度的计算值。
 * @returns {number} 箱体模型的调整后增量值。
 */
function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
	var i = dimension === "width" ? 1 : 0,
		extra = 0,
		delta = 0,
		marginDelta = 0;

	// 可能不需要调整
	if (box === (isBorderBox ? "border" : "content")) {
		return 0;
	}

	for (; i < 4; i += 2) {

		// 两种箱式模型均不包括边距
		// 单独计算边距增量，以便仅在滚动间距调整后添加它。
		// 这是使负边距与 'outerHeight（ true ）' 一起使用所必需的 （gh-3982）。
		if (box === "margin") {
			marginDelta += jQuery.css(elem, box + cssExpand[i], true, styles);
		}

		// 如果我们用内容框到达这里，我们正在寻找 “padding” 或 “border” 或 “margin”
		if (!isBorderBox) {

			// 添加内边距
			delta += jQuery.css(elem, "padding" + cssExpand[i], true, styles);

			// 对于 “border” 或 “margin”，添加边框
			if (box !== "padding") {
				delta += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);

				// 但还是要跟踪它
			} else {
				extra += jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
			}

			// 如果我们使用边框 （content + padding + border） 到达此处，则我们正在搜索 “content” 或
			// “padding” 或 “margin”
		} else {

			// 对于 “content”，减去填充
			if (box === "content") {
				delta -= jQuery.css(elem, "padding" + cssExpand[i], true, styles);
			}

			// 对于 “content” 或 “padding”，减去 border
			if (box !== "margin") {
				delta -= jQuery.css(elem, "border" + cssExpand[i] + "Width", true, styles);
			}
		}
	}

	// 通过提供 computedVal 在请求时考虑正内容框滚动装订线
	if (!isBorderBox && computedVal >= 0) {

		// offsetWidth/offsetHeight 是内容、内边距、滚动装订线和边框的四舍五入之和
		// 假设整数滚动装订线，减去其余部分并向下舍入
		delta += Math.max(0, Math.ceil(
			elem["offset" + dimension[0].toUpperCase() + dimension.slice(1)] -
			computedVal -
			delta -
			extra -
			0.5

			// 如果 offsetWidth/offsetHeight 未知，则我们无法确定内容框滚动间距
			// 使用显式零来避免 NaN （gh-3964）
		)) || 0;
	}

	return delta + marginDelta;
}

/**
 * 根据指定的维度和额外参数获取元素的宽度或高度。
 * @param {Element} elem - 要获取其宽度或高度的元素。
 * @param {string} dimension - 要检索的维度（宽度/高度）。
 * @param {string} extra - 用于确定框大小的附加参数。
 * @returns 元素的宽度或高度（以像素为单位）。
 */
function getWidthOrHeight(elem, dimension, extra) {

	// 从计算样式开始
	var styles = getStyles(elem),

		// 为避免强制重排，请仅在需要时获取 boxSizing （gh-4322）。
		// 伪造 content-box，直到我们知道需要知道真正的值。
		boxSizingNeeded = isIE || extra,
		isBorderBox = boxSizingNeeded &&
			jQuery.css(elem, "boxSizing", false, styles) === "border-box",
		valueIsBorderBox = isBorderBox,

		val = curCSS(elem, dimension, styles),
		offsetProp = "offset" + dimension[0].toUpperCase() + dimension.slice(1);

	// 根据需要返回一个混淆的非像素值或假装无知。
	if (rnumnonpx.test(val)) {
		if (!extra) {
			return val;
		}
		val = "auto";
	}


	if ((

		// 当值为 “auto” 时，回退到 offsetWidth/offsetHeight
		// 对于没有明确设置的内联元素，会发生这种情况 （gh-3571）
		val === "auto" ||

		// 支持：IE 9 - 11+
		// 当框大小不可靠时，请使用 offsetWidth/offsetHeight。
		// 在这些情况下，可以信任计算的值为 border-box。
		(isIE && isBorderBox) ||

		// 支持： IE 10 - 11+
		// IE 错误地报告了具有宽度/高度的表格行的“getComputedStyle”
		// set while 'offset*' 属性报告正确的值。
		// 支持：Firefox 70+
		// Firefox 包括边框宽度
		// 在 Table Rows 的计算维度中。（GH-4529）
		(!support.reliableTrDimensions() && nodeName(elem, "tr"))) &&

		// 确保元素可见且已连接
		elem.getClientRects().length) {

		isBorderBox = jQuery.css(elem, "boxSizing", false, styles) === "border-box";

		// 如果可用，offsetWidth/offsetHeight 近似于边框框尺寸。
		// 如果不可用（例如，SVG），则假设 box-sizing 不可靠，并解释
		// Retrieved 值作为内容框维度。
		valueIsBorderBox = offsetProp in elem;
		if (valueIsBorderBox) {
			val = elem[offsetProp];
		}
	}

	// 规范化 “” 和 auto
	val = parseFloat(val) || 0;

	// 针对元素的 box 模型进行调整
	return (val +
		boxModelAdjustment(
			elem,
			dimension,
			extra || (isBorderBox ? "border" : "content"),
			valueIsBorderBox,
			styles,

			// 提供当前计算的大小以请求滚动间距计算 （gh-3589）
			val
		)
	) + "px";
}

jQuery.extend({

	// 添加 style 属性钩子以覆盖默认值
// 获取和设置 Style 属性的行为
	cssHooks: {},

	// 获取并设置 DOM 节点上的 style 属性
	/**
	 * 获取给定元素的特定 CSS 属性的计算样式值。
	 * @param {Element} elem - 要获取其样式的元素。
	 * @param {string} name - 要获取其值的 CSS 属性名称。
	 * @param {string} 值 - CSS 属性的值。
	 * @param {string} extra - 样式所需的任何额外信息。
	 * @returns 元素的指定 CSS 属性的计算样式值。
	 */
	style: function (elem, name, value, extra) {

		// 不要在文本和注释节点上设置样式
		if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
			return;
		}

		// 确保我们使用正确的名称
		var ret, type, hooks,
			origName = cssCamelCase(name),
			isCustomProp = rcustomProp.test(name),
			style = elem.style;

		// 确保我们使用正确的名称。我们没有
// 想要查询值是否为 CSS 自定义属性
// 因为它们是用户定义的。
		if (!isCustomProp) {
			name = finalPropName(origName);
		}

		// 获取带前缀版本的钩子，然后获取无前缀版本
		hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];

		// 检查我们是否设置了一个值
		if (value !== undefined) {
			type = typeof value;

			// 将 “+=” 或 “-=” 转换为相对数字 （trac-7345）
			if (type === "string" && (ret = rcssNum.exec(value)) && ret[1]) {
				value = adjustCSS(elem, name, ret);

				// Fixes bug trac-9237
				type = "number";
			}

			// 确保未设置 null 和 NaN 值 （trac-7116）
			if (value == null || value !== value) {
				return;
			}

			// 如果值为数字，则为某些 CSS 属性添加 'px'
			if (type === "number") {
				value += ret && ret[3] || (isAutoPx(origName) ? "px" : "");
			}

			// 支持：IE <=9 - 11+
// 克隆元素的 background-* props 会影响源元素 （trac-8908）
			if (isIE && value === "" && name.indexOf("background") === 0) {
				style[name] = "inherit";
			}

			// 如果提供了钩子，请使用该值，否则只需设置指定的值
			if (!hooks || !("set" in hooks) ||
				(value = hooks.set(elem, value, extra)) !== undefined) {

				if (isCustomProp) {
					style.setProperty(name, value);
				} else {
					style[name] = value;
				}
			}

		} else {

			// 如果提供了钩子，则从那里获取 non-computed 值
			if (hooks && "get" in hooks &&
				(ret = hooks.get(elem, false, extra)) !== undefined) {

				return ret;
			}

			// 否则，只需从 style 对象中获取值
			return style[name];
		}
	},

	/**
	 * 计算给定元素和属性的 CSS 值的函数。
	 * @param {Element} elem - 要为其计算 CSS 值的元素。
	 * @param {string} name - CSS 属性的名称。
	 * @param {string} extra - 用于计算 CSS 值的其他信息。
	 * @param {object} styles - 包含 CSS 属性和值的 styles 对象。
	 * @returns 给定元素和属性的计算 CSS 值。
	 */
	css: function (elem, name, extra, styles) {
		var val, num, hooks,
			origName = cssCamelCase(name),
			isCustomProp = rcustomProp.test(name);

		// 确保我们使用正确的名称。我们没有
// 如果值是 CSS 自定义属性，则想要修改该值
// 因为它们是用户定义的。
		if (!isCustomProp) {
			name = finalPropName(origName);
		}

		// 尝试带前缀的 name 后跟无前缀的 name
		hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName];

		// 如果提供了钩子，则从那里获取计算的值
		if (hooks && "get" in hooks) {
			val = hooks.get(elem, true, extra);
		}

		// 否则，如果存在获取计算值的方法，请使用该
		if (val === undefined) {
			val = curCSS(elem, name, styles);
		}

		// 将 “normal” 转换为 computed 值
		if (val === "normal" && name in cssNormalTransform) {
			val = cssNormalTransform[name];
		}

		// 如果强制或提供了限定符，则设为 numeric，并且 val 看起来是 numeric
		if (extra === "" || extra) {
			num = parseFloat(val);
			return extra === true || isFinite(num) ? num || 0 : val;
		}

		return val;
	}
});

/**
 * 使用 jQuery 为 “height” 和 “width” 属性添加自定义 CSS 挂钩。
 * @param {number} _i - 数组中当前元素的索引。
 * @param {string} 维度 - 正在处理的维度（“高度”或“宽度”）。
 * @returns 无
 */
jQuery.each(["height", "width"], function (_i, dimension) {
	jQuery.cssHooks[dimension] = {
		get: function (elem, computed, extra) {
			if (computed) {

				// 如果我们无形地显示某些元素，它们可以具有维度信息
// 但它必须具有有益的当前显示样式
				return rdisplayswap.test(jQuery.css(elem, "display")) &&

					// 支持：Safari <=8 - 12+，Chrome <=73+
// WebKit/Blink中的表格列具有非零offsetWidth和零
// getBoundingClientRect（）.width 的 intent 的 x 的 x
// 支持：IE <=11+
// 在断开连接的节点上运行 getBoundingClientRect
// 在 IE 中引发错误。
					(!elem.getClientRects().length || !elem.getBoundingClientRect().width) ?
					swap(elem, cssShow, function () {
						return getWidthOrHeight(elem, dimension, extra);
					}) :
					getWidthOrHeight(elem, dimension, extra);
			}
		},

		set: function (elem, value, extra) {
			var matches,
				styles = getStyles(elem),

				// 为避免强制重排，请仅在需要时获取 boxSizing （gh-3991）
				isBorderBox = extra &&
					jQuery.css(elem, "boxSizing", false, styles) === "border-box",
				subtract = extra ?
					boxModelAdjustment(
						elem,
						dimension,
						extra,
						isBorderBox,
						styles
					) :
					0;

			// 如果需要调整值，则转换为像素
			if (subtract && (matches = rcssNum.exec(value)) &&
				(matches[3] || "px") !== "px") {

				elem.style[dimension] = value;
				value = jQuery.css(elem, dimension);
			}

			return setPositiveNumber(elem, value, subtract);
		}
	};
});

// animate 使用这些钩子来扩展属性
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
	/**
	 * 此函数为具有给定前缀和后缀的特定属性创建 CSS 挂钩。
	 * 它扩展属性的值，如果前缀不是 “margin”，则设置一个正数。
	 * @param {string} prefix - CSS 属性的前缀。
	 * @param {string} suffix - CSS 属性的后缀。
	 * @returns 无
	 */
}, function (prefix, suffix) {
	jQuery.cssHooks[prefix + suffix] = {
		expand: function (value) {
			var i = 0,
				expanded = {},

				// 如果不是字符串，则假定单个数字
				parts = typeof value === "string" ? value.split(" ") : [value];

			for (; i < 4; i++) {
				expanded[prefix + cssExpand[i] + suffix] =
					parts[i] || parts[i - 2] || parts[0];
			}

			return expanded;
		}
	};

	if (prefix !== "margin") {
		jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
	}
});

jQuery.fn.extend({
	/**
	 * 一个处理给定元素的 CSS 样式的函数。
	 * @param {string} name - 要设置或获取的 CSS 属性名称。
	 * @param {string} value - 要为 CSS 属性设置的值。
	 * @returns {object} - 包含 CSS 属性名称及其相应值的对象。
	 */
	css: function (name, value) {
		return access(this, function (elem, name, value) {
			var styles, len,
				map = {},
				i = 0;

			if (Array.isArray(name)) {
				styles = getStyles(elem);
				len = name.length;

				for (; i < len; i++) {
					map[name[i]] = jQuery.css(elem, name[i], false, styles);
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style(elem, name, value) :
				jQuery.css(elem, name);
		}, name, value, arguments.length > 1);
	}
});

export { jQuery, jQuery as $ };
