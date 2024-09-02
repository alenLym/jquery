import { jQuery } from "../core.js";
import { rcomma } from "./var/rcomma.js";
import { rleadingCombinator } from "./var/rleadingCombinator.js";
import { rtrimCSS } from "../var/rtrimCSS.js";
import { createCache } from "./createCache.js";
import { selectorError } from "./selectorError.js";
import { filterMatchExpr } from "./filterMatchExpr.js";

var tokenCache = createCache();

export function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = jQuery.expr.preFilter;

	while ( soFar ) {

		// 逗号和首次运行
		if ( !matched || ( match = rcomma.exec( soFar ) ) ) {
			if ( match ) {

				// 不要将尾随逗号用作有效
				soFar = soFar.slice( match[ 0 ].length ) || soFar;
			}
			groups.push( ( tokens = [] ) );
		}

		matched = false;

		// 运算器
		if ( ( match = rleadingCombinator.exec( soFar ) ) ) {
			matched = match.shift();
			tokens.push( {
				value: matched,

				// 将后代运算器强制转换为空间
				type: match[ 0 ].replace( rtrimCSS, " " )
			} );
			soFar = soFar.slice( matched.length );
		}

		// 过滤 器
		for ( type in filterMatchExpr ) {
			if ( ( match = jQuery.expr.match[ type ].exec( soFar ) ) && ( !preFilters[ type ] ||
				( match = preFilters[ type ]( match ) ) ) ) {
				matched = match.shift();
				tokens.push( {
					value: matched,
					type: type,
					matches: match
				} );
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// 返回无效超出的长度
// 如果我们只是解析
// 否则，抛出错误或返回令牌
	if ( parseOnly ) {
		return soFar.length;
	}

	return soFar ?
		selectorError( selector ) :

		// Cache the tokens
		tokenCache( selector, groups ).slice( 0 );
}
