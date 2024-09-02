import { jQuery } from "../core.js";
import { toType } from "../core/toType.js";

// 用于获取和设置集合值的多功能方法
// 如果 value/s 是一个函数，则可以选择执行 value/s
export function access( elems, fn, key, value, chainable, emptyGet, raw ) {
	var i = 0,
		len = elems.length,
		bulk = key == null;

	// 设置许多值
	if ( toType( key ) === "object" ) {
		chainable = true;
		for ( i in key ) {
			access( elems, fn, i, key[ i ], true, emptyGet, raw );
		}

	// 设置一个值
	} else if ( value !== undefined ) {
		chainable = true;

		if ( typeof value !== "function" ) {
			raw = true;
		}

		if ( bulk ) {

			// 批量操作针对整个集运行
			if ( raw ) {
				fn.call( elems, value );
				fn = null;

			// ...执行函数值时除外
			} else {
				bulk = fn;
				fn = function( elem, _key, value ) {
					return bulk.call( jQuery( elem ), value );
				};
			}
		}

		if ( fn ) {
			for ( ; i < len; i++ ) {
				fn(
					elems[ i ], key, raw ?
						value :
						value.call( elems[ i ], i, fn( elems[ i ], key ) )
				);
			}
		}
	}

	if ( chainable ) {
		return elems;
	}

	// Gets
	if ( bulk ) {
		return fn.call( elems );
	}

	return len ? fn( elems[ 0 ], key ) : emptyGet;
}
