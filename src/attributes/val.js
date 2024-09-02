import { jQuery } from "../core.js";
import { isIE } from "../var/isIE.js";
import { stripAndCollapse } from "../core/stripAndCollapse.js";
import { nodeName } from "../core/nodeName.js";

import "../core/init.js";

jQuery.fn.extend( {
	val: function( value ) {
		var hooks, ret, valueIsFunction,
			elem = this[ 0 ];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] ||
					jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks &&
					"get" in hooks &&
					( ret = hooks.get( elem, "value" ) ) !== undefined
				) {
					return ret;
				}

				ret = elem.value;

				// 处理 value 为 null/undef 或 number 的情况
				return ret == null ? "" : ret;
			}

			return;
		}

		valueIsFunction = typeof value === "function";

		return this.each( function( i ) {
			var val;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( valueIsFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} else {
				val = value;
			}

			// 将 null/undefined 视为 “”;将数字转换为字符串
			if ( val == null ) {
				val = "";

			} else if ( typeof val === "number" ) {
				val += "";

			} else if ( Array.isArray( val ) ) {
				val = jQuery.map( val, function( value ) {
					return value == null ? "" : value + "";
				} );
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// 如果 set 返回 undefined，则回退到正常设置
			if ( !hooks || !( "set" in hooks ) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		} );
	}
} );

jQuery.extend( {
	valHooks: {
		select: {
			get: function( elem ) {
				var value, option, i,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one",
					values = one ? null : [],
					max = one ? index + 1 : options.length;

				if ( index < 0 ) {
					i = max;

				} else {
					i = one ? index : 0;
				}

				// 循环浏览所有选定的选项
				for ( ; i < max; i++ ) {
					option = options[ i ];

					if ( option.selected &&

							// 不返回已禁用或位于已禁用 optgroup 中的选项
							!option.disabled &&
							( !option.parentNode.disabled ||
								!nodeName( option.parentNode, "optgroup" ) ) ) {

						// 获取选项的特定值
						value = jQuery( option ).val();

						// 我们不需要一个 select 的数组
						if ( one ) {
							return value;
						}

						// Multi-Selects 返回一个数组
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];

					if ( ( option.selected =
						jQuery.inArray( jQuery( option ).val(), values ) > -1
					) ) {
						optionSet = true;
					}
				}

				// 强制浏览器在设置不匹配值时保持一致的行为
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	}
} );

if ( isIE ) {
	jQuery.valHooks.option = {
		get: function( elem ) {

			var val = elem.getAttribute( "value" );
			return val != null ?
				val :

				// 支持： IE <=10 - 11+
// option.text 引发异常（Trac-14686、Trac-14858）
// 去除和折叠空格
// https://html.spec.whatwg.org/#strip-and-collapse-whitespace
				stripAndCollapse( jQuery.text( elem ) );
		}
	};
}

// 单选和复选框 getter/setter
jQuery.each( [ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		set: function( elem, value ) {
			if ( Array.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery( elem ).val(), value ) > -1 );
			}
		}
	};
} );
