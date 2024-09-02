import { document } from "../var/document.js";

var preservedScriptAttributes = {
	type: true,
	src: true,
	nonce: true,
	noModule: true
};
/**
 * 在文档中评估并执行给定的JavaScript代码
 * 此函数创建一个新的script元素，将给定的代码插入到该元素中，
 * 并将其临时添加到文档的head中以执行代码
 * 
 * @param {string} code 要评估和执行的JavaScript代码
 * @param {HTMLElement} node 可选参数，用于从该节点继承属性
 * @param {Document} doc 可选参数，指定要操作的文档，默认为当前文档
 */
export function DOMEval( code, node, doc ) {
	doc = doc || document;

	var i,
		script = doc.createElement( "script" );

	script.text = code;
	for ( i in preservedScriptAttributes ) {
		if ( node && node[ i ] ) {
			script[ i ] = node[ i ];
		}
	}

	if ( doc.head.appendChild( script ).parentNode ) {
		script.parentNode.removeChild( script );
	}
}
