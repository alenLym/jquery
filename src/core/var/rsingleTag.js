// rsingleTag 匹配由单个 HTML 元素组成的字符串，该元素没有属性
// 并捕获元素的名称
export var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i;
