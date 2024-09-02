import { jQuery } from "../core.js";

/**
 * 创建有限大小的键值缓存
 * @returns {function（string， object）} 返回 Object 数据存储后的数据
 *	属性名称：（以空格为后缀的）字符串，以及（如果缓存大于 Expr.cacheLength）
 *	删除最早的条目
 */
export function createCache() {
	var keys = [];

	function cache( key, value ) {

		// 使用 （key + “ ”） 可避免与本机原型属性发生冲突
// （见 https://github.com/jquery/sizzle/issues/157）
		if ( keys.push( key + " " ) > jQuery.expr.cacheLength ) {

			// 仅保留最新的条目
			delete cache[ keys.shift() ];
		}
		return ( cache[ key + " " ] = value );
	}
	return cache;
}
