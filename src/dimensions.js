import { jQuery } from "./core.js";
import { access } from "./core/access.js";
import { isWindow } from "./var/isWindow.js";

import "./css.js";

// 创建 innerHeight、innerWidth、height、width、outerHeight 和 outerWidth 方法
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( {
		padding: "inner" + name,
		content: type,
		"": "outer" + name
	}, function( defaultExtra, funcName ) {

		// Margin 仅适用于 outerHeight、outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return access( this, function( elem, type, value ) {
				var doc;

				if ( isWindow( elem ) ) {

					// $（ window ）.outerWidth/Height 返回 w/h（包括滚动条） （gh-1729）
					return funcName.indexOf( "outer" ) === 0 ?
						elem[ "inner" + name ] :
						elem.document.documentElement[ "client" + name ];
				}

				// 获取文档宽度或高度
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// scroll[Width/Height] 或 offset[Width/Height] 或 client[Width/Height]，
// 以最大者为准
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?

					// 获取元素的 width 或 height，请求但不强制 parseFloat
					jQuery.css( elem, type, extra ) :

					// 设置元素的宽度或高度
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable );
		};
	} );
} );

export { jQuery, jQuery as $ };
