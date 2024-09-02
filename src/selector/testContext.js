/**
 * 检查节点作为 jQuery 选择器上下文的有效性
 * @param {element|Object=} 上下文
 * @returns {元素|对象 |Boolean} 如果可接受，则为输入节点，否则为假值
 */
export function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}
