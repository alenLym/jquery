import { document } from "../var/document.js";
import { support } from "../var/support.js";

// 支持：仅限 Chrome 105 - 111，仅限 Safari 15.4 - 16.3
// 确保 '：has（）' 参数被无情地解析。
// 我们在测试中包含 '*' 以检测
// _selectively_ 宽恕（特别是当列表至少包括
// 一个有效的选择器）。
// 注意，我们把完全不支持 '：has（）' 看作是
// 符合规范的支持，这很好，因为在这样的
// 环境将在 qSA 路径中失败并回退到 jQuery 遍历
// 无论如何。
try {
	document.querySelector( ":has(*,:jqfake)" );
	support.cssHas = false;
} catch ( e ) {
	support.cssHas = true;
}

export { support };
