import { jQuery } from "../core.js";
import { toType } from "../core/toType.js";
import { isAttached } from "../core/isAttached.js";
import { arr } from "../var/arr.js";
import { rtagName } from "./var/rtagName.js";
import { rscriptType } from "./var/rscriptType.js";
import { wrapMap } from "./wrapMap.js";
import { getAll } from "./getAll.js";
import { setGlobalEval } from "./setGlobalEval.js";
import { isArrayLike } from "../core/isArrayLike.js";

var rhtml = /<|&#?\w+;/;

export function buildFragment( elems, context, scripts, selection, ignored ) {
	var elem, tmp, tag, wrap, attached, j,
		fragment = context.createDocumentFragment(),
		nodes = [],
		i = 0,
		l = elems.length;

	for ( ; i < l; i++ ) {
		elem = elems[ i ];

		if ( elem || elem === 0 ) {

			// 直接添加节点
			if ( toType( elem ) === "object" && ( elem.nodeType || isArrayLike( elem ) ) ) {
				jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

			// 将非 html 转换为文本节点
			} else if ( !rhtml.test( elem ) ) {
				nodes.push( context.createTextNode( elem ) );

			// 将 html 转换为 DOM 节点
			} else {
				tmp = tmp || fragment.appendChild( context.createElement( "div" ) );

				// 反序列化标准表示
				tag = ( rtagName.exec( elem ) || [ "", "" ] )[ 1 ].toLowerCase();
				wrap = wrapMap[ tag ] || arr;

				// 创建包装并深入其中。
				j = wrap.length;
				while ( --j > -1 ) {
					tmp = tmp.appendChild( context.createElement( wrap[ j ] ) );
				}

				tmp.innerHTML = jQuery.htmlPrefilter( elem );

				jQuery.merge( nodes, tmp.childNodes );

				// 记住顶级容器
				tmp = fragment.firstChild;

				// 确保创建的节点是孤立的 （trac-12392）
				tmp.textContent = "";
			}
		}
	}

	// 从 fragment 中删除包装器
	fragment.textContent = "";

	i = 0;
	while ( ( elem = nodes[ i++ ] ) ) {

		// 跳过上下文集合中已有的元素 （trac-4087）
		if ( selection && jQuery.inArray( elem, selection ) > -1 ) {
			if ( ignored ) {
				ignored.push( elem );
			}
			continue;
		}

		attached = isAttached( elem );

		// 附加到片段
		tmp = getAll( fragment.appendChild( elem ), "script" );

		// 保留脚本评估历史记录
		if ( attached ) {
			setGlobalEval( tmp );
		}

		// 捕获可执行文件
		if ( scripts ) {
			j = 0;
			while ( ( elem = tmp[ j++ ] ) ) {
				if ( rscriptType.test( elem.type || "" ) ) {
					scripts.push( elem );
				}
			}
		}
	}

	return fragment;
}
