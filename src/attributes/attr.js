import { jQuery } from "../core.js";
import { access } from "../core/access.js";
import { nodeName } from "../core/nodeName.js";
import { rnothtmlwhite } from "../var/rnothtmlwhite.js";
import { isIE } from "../var/isIE.js";

jQuery.fn.extend( {
	attr: function( name, value ) {
		return access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each( function() {
			jQuery.removeAttr( this, name );
		} );
	}
} );

jQuery.extend( {
	attr: function( elem, name, value ) {
		var ret, hooks,
			nType = elem.nodeType;

		// 不要在文本、注释和属性节点上获取/设置属性
		if ( nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		// 当不支持 attribute 时回退到 prop
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		// 属性钩子由小写版本决定
// 抓住必要的钩子（如果已定义）
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			hooks = jQuery.attrHooks[ name.toLowerCase() ];
		}

		if ( value !== undefined ) {
			if ( value === null ||

				// 为了兼容先前对 boolean 属性的处理，
// 当 'false' 通过时删除。对于 ARIA 属性 -
// 其中许多识别 '“false”' 值 - 继续
// 像 jQuery <4 一样设置 '“false”' 值。
				( value === false && name.toLowerCase().indexOf( "aria-" ) !== 0 ) ) {

				jQuery.removeAttr( elem, name );
				return;
			}

			if ( hooks && "set" in hooks &&
				( ret = hooks.set( elem, value, name ) ) !== undefined ) {
				return ret;
			}

			elem.setAttribute( name, value );
			return value;
		}

		if ( hooks && "get" in hooks && ( ret = hooks.get( elem, name ) ) !== null ) {
			return ret;
		}

		ret = elem.getAttribute( name );

		// 不存在的属性返回 null，我们规范化为 undefined
		return ret == null ? undefined : ret;
	},

	attrHooks: {},

	removeAttr: function( elem, value ) {
		var name,
			i = 0,

			// 属性名称可以包含非 HTML 空白字符
// https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
			attrNames = value && value.match( rnothtmlwhite );

		if ( attrNames && elem.nodeType === 1 ) {
			while ( ( name = attrNames[ i++ ] ) ) {
				elem.removeAttribute( name );
			}
		}
	}
} );

// 支持：IE <=11+
// input 在成为 radio 后失去其值
if ( isIE ) {
	jQuery.attrHooks.type = {
		set: function( elem, value ) {
			if ( value === "radio" && nodeName( elem, "input" ) ) {
				var val = elem.value;
				elem.setAttribute( "type", value );
				if ( val ) {
					elem.value = val;
				}
				return value;
			}
		}
	};
}
