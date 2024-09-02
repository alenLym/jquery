import { jQuery } from "../core.js";
import { document } from "../var/document.js";
import { dataPriv } from "../data/var/dataPriv.js";
import { acceptData } from "../data/var/acceptData.js";
import { hasOwn } from "../var/hasOwn.js";
import { isWindow } from "../var/isWindow.js";

import "../event.js";

var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	stopPropagationCallback = function( e ) {
		e.stopPropagation();
	};

jQuery.extend( jQuery.event, {

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special, lastElement,
			eventPath = [ elem || document ],
			type = hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = hasOwn.call( event, "namespace" ) ? event.namespace.split( "." ) : [];

		cur = lastElement = tmp = elem = elem || document;

		// 不要在文本和注释节点上执行事件
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// 聚焦/模糊变形为 focusin/out;确保我们现在不会解雇他们
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "." ) > -1 ) {

			// 命名空间触发器;在 handle（） 中创建一个 RegExp 以匹配事件类型
			namespaces = type.split( "." );
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf( ":" ) < 0 && "on" + type;

		// 调用方可以传入 jQuery.Event 对象、Object 或仅传入事件类型字符串
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// 触发位掩码：& 1 用于本地处理程序;& 2 代表 jQuery（始终为真）
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join( "." );
		event.rnamespace = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join( "\\.(?:.*\\.|)" ) + "(\\.|$)" ) :
			null;

		// 清理事件以防它被重复使用
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// 克隆任何传入数据并预置事件，创建处理程序 arg 列表
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// 允许特殊事件绘制线条之外
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// 根据 W3C 事件规范 （trac-9951） 提前确定事件传播路径
// 向上冒泡到文档，然后到窗口;监视全局 ownerDocument var （trac-9724）
		if ( !onlyHandlers && !special.noBubble && !isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// 仅在我们到达文档时添加窗口（例如，不是普通的 obj 或分离的 DOM）
			if ( tmp === ( elem.ownerDocument || document ) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// 事件路径上的 Fire 处理程序
		i = 0;
		while ( ( cur = eventPath[ i++ ] ) && !event.isPropagationStopped() ) {
			lastElement = cur;
			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery 处理程序
			handle = ( dataPriv.get( cur, "events" ) || Object.create( null ) )[ event.type ] &&
				dataPriv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// 本机处理程序
			handle = ontype && cur[ ontype ];
			if ( handle && handle.apply && acceptData( cur ) ) {
				event.result = handle.apply( cur, data );
				if ( event.result === false ) {
					event.preventDefault();
				}
			}
		}
		event.type = type;

		// 如果没有人阻止默认操作，请立即执行
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( ( !special._default ||
				special._default.apply( eventPath.pop(), data ) === false ) &&
				acceptData( elem ) ) {

				// 在目标上调用与事件同名的本机 DOM 方法。
// 不要对 window 执行默认操作，这就是全局变量的位置 （trac-6170）
				if ( ontype && typeof elem[ type ] === "function" && !isWindow( elem ) ) {

					// 当我们调用 onFOO 的 FOO（） 方法时，不要重新触发 onFOO 事件
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// 防止重新触发同一事件，因为我们已经在上面冒泡了它
					jQuery.event.triggered = type;

					if ( event.isPropagationStopped() ) {
						lastElement.addEventListener( type, stopPropagationCallback );
					}

					elem[ type ]();

					if ( event.isPropagationStopped() ) {
						lastElement.removeEventListener( type, stopPropagationCallback );
					}

					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	// 捎带一个捐赠者事件来模拟不同的捐赠者事件
// 仅用于 'focus（in | out）' 事件
	simulate: function( type, elem, event ) {
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true
			}
		);

		jQuery.event.trigger( e, null, elem );
	}

} );

jQuery.fn.extend( {

	trigger: function( type, data ) {
		return this.each( function() {
			jQuery.event.trigger( type, data, this );
		} );
	},
	triggerHandler: function( type, data ) {
		var elem = this[ 0 ];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
} );
