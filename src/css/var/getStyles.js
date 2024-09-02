export function getStyles( elem ) {

	// 支持： IE <=11+ （trac-14150）
// 在 IE 中，弹出窗口的 'window' 是打开窗口，它使 'window.getComputedStyle（ elem ）'
// 破。使用 'elem.ownerDocument.defaultView' 可避免此问题。
	var view = elem.ownerDocument.defaultView;

	// 'document.implementation.createHTMLDocument（ “” ）' 有一个 'null' 'defaultView'
// 财产;在这种情况下，检查 'defaultView' 的真实性以回退到 window。
	if ( !view ) {
		view = window;
	}

	return view.getComputedStyle( elem );
}
