/*!
 * jQuery JavaScript 库 v@VERSION
 * https://jquery.com/
 *
 * 版权所有 OpenJS 基金会和其他贡献者
 * 在 MIT 许可证下发布
 * https://jquery.org/license
 *
 * 日期：@DATE
 */
// 将工厂公开为 'jQueryFactory'。针对没有
// 一个真正的 'window' 需要构建一个模拟的窗口。例：
//
//     import { jQueryFactory } from “jquery/factory”;
//     const jQuery = jQueryFactory（ window ）;
//
// 有关更多信息，请参见 ticket trac-14549。
function jQueryFactoryWrapper( window, noGlobal ) {

if ( !window.document ) {
	throw new Error( "jQuery requires a window with a document" );
}

// @CODE
// build.js inserts compiled jQuery here

return jQuery;

}

export function jQueryFactory( window ) {
	return jQueryFactoryWrapper( window, true );
}
