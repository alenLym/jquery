import { jQuery } from "../core.js";
import { flat } from "../var/flat.js";
import { rscriptType } from "./var/rscriptType.js";
import { getAll } from "./getAll.js";
import { buildFragment } from "./buildFragment.js";
import { dataPriv } from "../data/var/dataPriv.js";
import { DOMEval } from "../core/DOMEval.js";

// 替换/恢复脚本元素的 type 属性以实现安全的 DOM 操作
function disableScript( elem ) {
	elem.type = ( elem.getAttribute( "type" ) !== null ) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	if ( ( elem.type || "" ).slice( 0, 5 ) === "true/" ) {
		elem.type = elem.type.slice( 5 );
	} else {
		elem.removeAttribute( "type" );
	}

	return elem;
}

export function domManip( collection, args, callback, ignored ) {

	// 展平任何嵌套数组
	args = flat( args );

	var fragment, first, scripts, hasScripts, node, doc,
		i = 0,
		l = collection.length,
		iNoClone = l - 1,
		value = args[ 0 ],
		valueIsFunction = typeof value === "function";

	if ( valueIsFunction ) {
		return collection.each( function( index ) {
			var self = collection.eq( index );
			args[ 0 ] = value.call( this, index, self.html() );
			domManip( self, args, callback, ignored );
		} );
	}

	if ( l ) {
		fragment = buildFragment( args, collection[ 0 ].ownerDocument, false, collection, ignored );
		first = fragment.firstChild;

		if ( fragment.childNodes.length === 1 ) {
			fragment = first;
		}

		// 需要新内容或对忽略的元素感兴趣才能调用回调
		if ( first || ignored ) {
			scripts = jQuery.map( getAll( fragment, "script" ), disableScript );
			hasScripts = scripts.length;

			// 将原始 fragment 用于最后一项
// 而不是第一个，因为它可能最终
// 在某些情况下被错误地清空 （TRAC-8070）。
			for ( ; i < l; i++ ) {
				node = fragment;

				if ( i !== iNoClone ) {
					node = jQuery.clone( node, true, true );

					// 保留对克隆脚本的引用以供以后恢复
					if ( hasScripts ) {
						jQuery.merge( scripts, getAll( node, "script" ) );
					}
				}

				callback.call( collection[ i ], node, i );
			}

			if ( hasScripts ) {
				doc = scripts[ scripts.length - 1 ].ownerDocument;

				// Re-enable scripts
				jQuery.map( scripts, restoreScript );

				// 在首次插入文档时评估可执行脚本
				for ( i = 0; i < hasScripts; i++ ) {
					node = scripts[ i ];
					if ( rscriptType.test( node.type || "" ) &&
						!dataPriv.get( node, "globalEval" ) &&
						jQuery.contains( doc, node ) ) {

						if ( node.src && ( node.type || "" ).toLowerCase()  !== "module" ) {

							// 可选的 AJAX 依赖项，但如果不存在，则不会运行脚本
							if ( jQuery._evalUrl && !node.noModule ) {
								jQuery._evalUrl( node.src, {
									nonce: node.nonce,
									crossOrigin: node.crossOrigin
								}, doc );
							}
						} else {
							DOMEval( node.textContent, node, doc );
						}
					}
				}
			}
		}
	}

	return collection;
}
