import { jQuery } from "../core.js";
import { camelCase } from "../core/camelCase.js";
import { rnothtmlwhite } from "../var/rnothtmlwhite.js";
import { acceptData } from "./var/acceptData.js";

export function Data() {
	this.expando = jQuery.expando + Data.uid++;
}

Data.uid = 1;

Data.prototype = {

	cache: function( owner ) {

		// 检查所有者对象是否已经有缓存
		var value = owner[ this.expando ];

		// 如果没有，请创建一个
		if ( !value ) {
			value = Object.create( null );

			// 我们可以在现代浏览器中接受非元素节点的数据，
// 但我们不应该，参见 TRAC-8335。
// 始终返回空对象。
			if ( acceptData( owner ) ) {

				// 如果它是一个不太可能被字符串化或循环的节点
// 使用普通赋值
				if ( owner.nodeType ) {
					owner[ this.expando ] = value;

				// 否则，将其保存在不可枚举的属性中
// configurable 必须为 true 才能允许该属性为
// 删除数据时已删除
				} else {
					Object.defineProperty( owner, this.expando, {
						value: value,
						configurable: true
					} );
				}
			}
		}

		return value;
	},
	set: function( owner, data, value ) {
		var prop,
			cache = this.cache( owner );

		// 句柄： [ owner， key， value ] args
// 始终使用 camelCase 键 （gh-2257）
		if ( typeof data === "string" ) {
			cache[ camelCase( data ) ] = value;

		// 句柄： [ owner， { properties } ] args
		} else {

			// 将属性逐个复制到缓存对象
			for ( prop in data ) {
				cache[ camelCase( prop ) ] = data[ prop ];
			}
		}
		return value;
	},
	get: function( owner, key ) {
		return key === undefined ?
			this.cache( owner ) :

			// 始终使用 camelCase 键 （gh-2257）
			owner[ this.expando ] && owner[ this.expando ][ camelCase( key ) ];
	},
	access: function( owner, key, value ) {

		// 在以下情况下：
//
//   1. 未指定键
//   2. 指定了字符串键，但未提供任何值
//
// 采用 “read” 路径，并允许 get 方法确定
// 返回哪个值，分别是：
//
//   1. 整个缓存对象
//   2. 存储在 key 上的数据
//
		if ( key === undefined ||
				( ( key && typeof key === "string" ) && value === undefined ) ) {

			return this.get( owner, key );
		}

		// 当 key 不是字符串，或者同时是 key 和 value 时
// 使用以下任一方式指定、设置或扩展 （现有对象）：
//
//   1. 属性对象
//   2. 键和值
//
		this.set( owner, key, value );

		// 由于 “set” 路径可以有两个可能的入口点
// 根据所采用的路径返回预期数据[*]
		return value !== undefined ? value : key;
	},
	remove: function( owner, key ) {
		var i,
			cache = owner[ this.expando ];

		if ( cache === undefined ) {
			return;
		}

		if ( key !== undefined ) {

			// 支持数组或空格分隔的键字符串
			if ( Array.isArray( key ) ) {

				// 如果 key 是一组 key...
// 我们总是设置 camelCase 键，所以请删除它。
				key = key.map( camelCase );
			} else {
				key = camelCase( key );

				// 如果存在带空格的键，请使用它。
// 否则，通过匹配非空格来创建数组
				key = key in cache ?
					[ key ] :
					( key.match( rnothtmlwhite ) || [] );
			}

			i = key.length;

			while ( i-- ) {
				delete cache[ key[ i ] ];
			}
		}

		// 如果没有更多数据，请删除 expando
		if ( key === undefined || jQuery.isEmptyObject( cache ) ) {

			// 支持：Chrome <=35 - 45+
// 删除属性时，Webkit和Blink性能会受到影响
// 从 DOM 节点，因此改为 undefined
// https://bugs.chromium.org/p/chromium/issues/detail?id=378607 （错误受限）
			if ( owner.nodeType ) {
				owner[ this.expando ] = undefined;
			} else {
				delete owner[ this.expando ];
			}
		}
	},
	hasData: function( owner ) {
		var cache = owner[ this.expando ];
		return cache !== undefined && !jQuery.isEmptyObject( cache );
	}
};
