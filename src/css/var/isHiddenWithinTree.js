import { jQuery } from "../../core.js";

// isHiddenWithinTree 报告元素是否具有非 “none” 显示样式（内联和/或
// 通过 CSS 级联），这对于决定是否使其可见非常有用。
// 它与 ：hidden 选择器 （jQuery.expr.pseudos.hidden） 有两个重要区别：
// * 隐藏的上级不会强制将元素分类为隐藏元素。
// * 与文档断开连接不会强制将元素分类为隐藏元素。
// 这些差异改进了 .toggle（） 等人在应用于
// 分离或包含在隐藏的祖先 （GH-2404、GH-2863） 中。
export function isHiddenWithinTree( elem, el ) {

	// isHiddenWithinTree 可以从 jQuery#filter 函数中调用;
// 在这种情况下，element 将是第二个参数
	elem = el || elem;

	// 内联样式胜过一切
	return elem.style.display === "none" ||
		elem.style.display === "" &&
		jQuery.css( elem, "display" ) === "none";
}
