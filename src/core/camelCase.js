// 匹配虚线字符串以进行驼峰化
var rdashAlpha = /-([a-z])/g;

// 被 camelCase 用作 replace（） 的回调
function fcamelCase( _all, letter ) {
	return letter.toUpperCase();
}

// 将虚线转换为 camelCase
export function camelCase( string ) {
	return string.replace( rdashAlpha, fcamelCase );
}
