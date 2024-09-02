import { isIE } from "../var/isIE.js";
import { whitespace } from "../var/whitespace.js";
import { support } from "./support.js";

// 构建 QSA 正则表达式。
// 采用 Diego Perini 的正则表达式策略。
export var rbuggyQSA = [];

if ( isIE ) {
	rbuggyQSA.push(

		// 支持：IE 9 - 11+
// IE 的 :d isabled 选择器不选取已禁用字段集的子项
		":enabled",
		":disabled",

		// 支持：IE 11+
// 在某些情况下，IE 11 在 '[name='']' 查询中找不到元素。
// 在选择工作之前向文档添加临时属性
// 围绕问题。
		"\\[" + whitespace + "*name" + whitespace + "*=" +
			whitespace + "*(?:''|\"\")"
	);
}

if ( !support.cssHas ) {

	// 支持： Chrome 105 - 110+， Safari 15.4 - 16.3+
// 我们常规的 'try-catch' 机制无法检测到原生不支持的
// '：has（）' 中的伪类 （例如 '：has（：contains（“Foo”））'）
// 在将 '：has（）' 参数解析为宽容的选择器列表的浏览器中。
// https://drafts.csswg.org/selectors/#relational 现在需要 argument
// 被无情地解析，但浏览器尚未完全调整。
	rbuggyQSA.push( ":has" );
}

rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join( "|" ) );
