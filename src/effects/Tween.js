import { jQuery } from "../core.js";
import { isAutoPx } from "../css/isAutoPx.js";
import { finalPropName } from "../css/finalPropName.js";

import "../css.js";

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || jQuery.easing._default;
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( isAutoPx( prop ) ? "px" : "" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			// 当元素不是 DOM 元素时，直接在元素上使用属性，
// 或者当不存在匹配的 style 属性时。
			if ( tween.elem.nodeType !== 1 ||
				tween.elem[ tween.prop ] != null && tween.elem.style[ tween.prop ] == null ) {
				return tween.elem[ tween.prop ];
			}

			// 将空字符串作为第 3 个参数传递给 .css 将自动
// 尝试 parseFloat 并在解析失败时回退到字符串。
// 简单值（如 “10px” ）被解析为 Float;
// 复杂值（如 “rotate（1rad）”） 按原样返回。
			result = jQuery.css( tween.elem, tween.prop, "" );

			// 空字符串、null、undefined 和 “auto” 将转换为 0。
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {

			// 使用 step hook 进行 back compat。
// 如果有，请使用 cssHook。
// 如果可用，请使用 .style，并在可用时使用 plain 属性。
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.nodeType === 1 && (
				jQuery.cssHooks[ tween.prop ] ||
					tween.elem.style[ finalPropName( tween.prop ) ] != null ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p * Math.PI ) / 2;
	},
	_default: "swing"
};

jQuery.fx = Tween.prototype.init;

// 后兼容 <1.8 扩展点
jQuery.fx.step = {};
