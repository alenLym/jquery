import { document } from "../var/document.js";
import { documentElement } from "../var/documentElement.js";
import { support } from "../var/support.js";

( function() {

var reliableTrDimensionsVal,
	div = document.createElement( "div" );

// 在有限 （非浏览器） 环境中提前完成
if ( !div.style ) {
	return;
}

// 支持： IE 10 - 11+
// IE 错误地报告了具有宽度/高度的表格行的“getComputedStyle”
// set while 'offset*' 属性报告正确的值。
// 支持：Firefox 70+
// 只有 Firefox 包含边框宽度
// 在计算维度中。（GH-4529）
support.reliableTrDimensions = function() {
	var table, tr, trStyle;
	if ( reliableTrDimensionsVal == null ) {
		table = document.createElement( "table" );
		tr = document.createElement( "tr" );

		table.style.cssText = "position:absolute;left:-11111px;border-collapse:separate";
		tr.style.cssText = "box-sizing:content-box;border:1px solid";

		// 支持：Chrome 86+
// 通过 cssText 设置的高度不会被应用。
// 然后计算出的高度返回为 0。
		tr.style.height = "1px";
		div.style.height = "9px";

		// 支持：Android Chrome 86+
// 在我们的 bodyBackground.html iframe 中，
// display for all div elements 设置为 “inline”，
// 这仅在 Android Chrome 中会导致问题，但
// 在所有设备上不一致。
// 确保 div 为 'display： block'
// 解决了这个问题。
		div.style.display = "block";

		documentElement
			.appendChild( table )
			.appendChild( tr )
			.appendChild( div );

		// 在窗口可见之前不要运行
		if ( table.offsetWidth === 0 ) {
			documentElement.removeChild( table );
			return;
		}

		trStyle = window.getComputedStyle( tr );
		reliableTrDimensionsVal = ( Math.round( parseFloat( trStyle.height ) ) +
			Math.round( parseFloat( trStyle.borderTopWidth ) ) +
			Math.round( parseFloat( trStyle.borderBottomWidth ) ) ) === tr.offsetHeight;

		documentElement.removeChild( table );
	}
	return reliableTrDimensionsVal;
};
} )();

export { support };
