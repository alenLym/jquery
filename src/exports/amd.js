import { jQuery } from "../core.js";

// 注册为命名的 AMD 模块，因为 jQuery 可以与其他
// 可以使用 define 的文件，但不能通过适当的串联脚本
// 了解匿名 AMD 模块。命名的 AMD 是最安全、最稳健的
// 注册方式。使用小写 jquery，因为 AMD 模块名称是
// 派生自文件名，jQuery 通常以小写形式提供
// 文件名。在创建全局后执行此操作，以便如果 AMD 模块希望
// 调用 noConflict 来隐藏此版本的 jQuery，它将起作用。
// 请注意，为了获得最大的可移植性，非 jQuery 的库应该
// 将自己声明为匿名模块，并避免在
// 存在 AMD 加载程序。jQuery 是一种特殊情况。有关更多信息，请参阅
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

if ( typeof define === "function" && define.amd ) {
	define( "jquery", [], function() {
		return jQuery;
	} );
}
