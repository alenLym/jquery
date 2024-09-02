import { jQuery } from "../core.js";
import { document } from "../var/document.js";
import { sort } from "../var/sort.js";
import { splice } from "../var/splice.js";
import { slice } from "../var/slice.js";

var hasDuplicate;

// 文档顺序排序
function sortOrder( a, b ) {

	// 重复删除的标记
	if ( a === b ) {
		hasDuplicate = true;
		return 0;
	}

	// 如果只有一个输入具有 compareDocumentPosition，则根据方法存在进行排序
	var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
	if ( compare ) {
		return compare;
	}

	// 如果两个输入属于同一文档，则计算位置
// 支持：IE 11+
// IE 在进行严格比较时有时会引发 “Permission denied” 错误
// 两份文件;肤浅的比较是有效的。
// eslint-disable-next-line eqeq
	compare = ( a.ownerDocument || a ) == ( b.ownerDocument || b ) ?
		a.compareDocumentPosition( b ) :

		// 否则，我们知道它们已断开连接
		1;

	// 断开连接的节点
	if ( compare & 1 ) {

		// 选择与文档相关的第一个元素
// 支持：IE 11+
// IE 在进行严格比较时有时会引发 “Permission denied” 错误
// 两份文件;肤浅的比较是有效的。
// eslint-disable-next-line eqeq
		if ( a == document || a.ownerDocument == document &&
			jQuery.contains( document, a ) ) {
			return -1;
		}

		// 支持：IE 11+
// IE 在进行严格比较时有时会引发 “Permission denied” 错误
// 两份文件;肤浅的比较是有效的。
// eslint-disable-next-line eqeq
		if ( b == document || b.ownerDocument == document &&
			jQuery.contains( document, b ) ) {
			return 1;
		}

		// Maintain original order
		return 0;
	}

	return compare & 4 ? -1 : 1;
}

/**
 * 文档排序和删除重复项
 * @param {ArrayLike} 结果
 */
jQuery.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	hasDuplicate = false;

	sort.call( results, sortOrder );

	if ( hasDuplicate ) {
		while ( ( elem = results[ i++ ] ) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			splice.call( results, duplicates[ j ], 1 );
		}
	}

	return results;
};

jQuery.fn.uniqueSort = function() {
	return this.pushStack( jQuery.uniqueSort( slice.apply( this ) ) );
};
