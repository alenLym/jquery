import { camelCase } from "../core/camelCase.js";

// 匹配虚线字符串以进行驼峰化
var rmsPrefix = /^-ms-/;

// 将虚线转换为 camelCase，处理供应商前缀。
// 由css和effects模块使用。
// 支持：IE <=9 - 11+
// Microsoft 忘记使用其供应商前缀 （trac-9572）
export function cssCamelCase( string ) {
	return camelCase( string.replace( rmsPrefix, "ms-" ) );
}
