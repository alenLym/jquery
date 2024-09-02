import { jQuery } from "../core.js";
import { isAttached } from "../core/isAttached.js";
import { getStyles } from "./var/getStyles.js";
import { rcustomProp } from "./var/rcustomProp.js";
import { rtrimCSS } from "../var/rtrimCSS.js";

export function curCSS(elem, name, computed) {
	var ret,
		isCustomProp = rcustomProp.test(name);

	computed = computed || getStyles(elem);

	// “.css（'--customProperty'）'需要 getPropertyValue （gh-3144）
	if (computed) {

		// 需要回退到直接属性访问作为 'computed' ，即
		// 'getComputedStyle' 的输出包含 camelCased 键和
		// 'getPropertyValue' 需要 kebab-case 的。
		//
		// 支持：IE <=9 - 11+
		// IE 仅支持 'getPropertyValue' 中的 '“float”' ;在计算样式中
		// 它只能作为 '“cssFloat”' 使用。我们不再修改属性
		// 发送到 '.css（）' 之外，因此我们需要同时检查两者。
		// 通常，这会产生行为差异：如果
		// 'getPropertyValue' 返回一个空字符串，返回值
		// 通过 '.css（）' 将是 'undefined'。这通常是
		// disconnected 元素。然而，在 IE 中，甚至连断开连接的元素
		// 如果没有样式，则返回 'getPropertyValue（ “float” ）' 的 '“none”'
		ret = computed.getPropertyValue(name) || computed[name];

		if (isCustomProp && ret) {

			// 支持：Firefox 105+、Chrome <=105+
			// 规范要求修剪自定义属性的空白区域 （gh-4926）。
			// Firefox 只修剪前导空格。Chrome 只是崩溃
			// 无论是前导还是尾随空格都指向一个空格。
			//
			// 如果返回空字符串，则回退到 'undefined'。
			// 这将折叠定义了 property 的缺失定义
			// 并设置为空字符串，但没有标准 API
			// 使我们能够在不牺牲性能的情况下区分它们
			// 返回 'undefined' 与旧的 jQuery 一致。
			//
			// rtrimCSS 处理 U+000D CARRIAGE RETURN 和 U+000C 换表
			// 替换为空格，而 CSS 则没有，但这不是问题
			// 因为 CSS 预处理将它们替换为 U+000A 换行
			// （即 CSS 空格）
			// https://www.w3.org/TR/css-syntax-3/#input-preprocessing
			ret = ret.replace(rtrimCSS, "$1") || undefined;
		}

		if (ret === "" && !isAttached(elem)) {
			ret = jQuery.style(elem, name);
		}
	}

	return ret !== undefined ?

		// 支持：IE <=9 - 11+
		// IE 以整数形式返回 zIndex 值。
		ret + "" :
		ret;
}
