import { rpseudo } from "./var/rpseudo.js";
import { filterMatchExpr } from "./filterMatchExpr.js";
import { unescapeSelector } from "./unescapeSelector.js";
import { selectorError } from "./selectorError.js";
import { tokenize } from "./tokenize.js";

export var preFilter = {
	ATTR: function( match ) {
		match[ 1 ] = unescapeSelector( match[ 1 ] );

		// 移动给定值以匹配 [3] 无论是有引号的还是无引号的
		match[ 3 ] = unescapeSelector( match[ 3 ] || match[ 4 ] || match[ 5 ] || "" );

		if ( match[ 2 ] === "~=" ) {
			match[ 3 ] = " " + match[ 3 ] + " ";
		}

		return match.slice( 0, 4 );
	},

	CHILD: function( match ) {

		/* 来自 filterMatchExpr[“CHILD”] 的匹配项
			1 种类型 （only|nth|...）
			2 what （child|of-type）
			3 参数 （偶数|奇数|\d*|\d*n（[+-]\d+）？|...)
			xn+y 参数的 4 个 xn 分量 （[+-]？\d*n|）
			xn-component 的 5 号
			xn 分量的 6 倍
			Y 分量的 7 符号
			Y 分量的 8 y
		*/
		match[ 1 ] = match[ 1 ].toLowerCase();

		if ( match[ 1 ].slice( 0, 3 ) === "nth" ) {

			// nth-* requires 参数
			if ( !match[ 3 ] ) {
				selectorError( match[ 0 ] );
			}

			// jQuery.expr.filter.CHILD 的数字 x 和 y 参数
// 请记住，false/true 分别转换为 0/1
			match[ 4 ] = +( match[ 4 ] ?
				match[ 5 ] + ( match[ 6 ] || 1 ) :
				2 * ( match[ 3 ] === "even" || match[ 3 ] === "odd" )
			);
			match[ 5 ] = +( ( match[ 7 ] + match[ 8 ] ) || match[ 3 ] === "odd" );

		// 其他类型禁止参数
		} else if ( match[ 3 ] ) {
			selectorError( match[ 0 ] );
		}

		return match;
	},

	PSEUDO: function( match ) {
		var excess,
			unquoted = !match[ 6 ] && match[ 2 ];

		if ( filterMatchExpr.CHILD.test( match[ 0 ] ) ) {
			return null;
		}

		// 按原样接受带引号的参数
		if ( match[ 3 ] ) {
			match[ 2 ] = match[ 4 ] || match[ 5 ] || "";

		// 从未加引号的参数中去除多余的字符
		} else if ( unquoted && rpseudo.test( unquoted ) &&

			// 从 tokenize 获取超额（递归）
			( excess = tokenize( unquoted, true ) ) &&

			// 前进到下一个右括号
			( excess = unquoted.indexOf( ")", unquoted.length - excess ) -
				unquoted.length ) ) {

			// excess 是负指数
			match[ 0 ] = match[ 0 ].slice( 0, excess );
			match[ 2 ] = unquoted.slice( 0, excess );
		}

		// 仅返回伪 filter 方法（类型和参数）所需的捕获
		return match.slice( 0, 3 );
	}
};
