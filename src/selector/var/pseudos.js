import { identifier } from "./identifier.js";
import { attributes } from "./attributes.js";

export var pseudos = ":(" + identifier + ")(?:\\((" +

	// 要减少 preFilter 中需要 tokenize 的 selector 的数量，prefers参数：
// 1. 引用（捕获 3;捕获 4 或捕获 5）
	"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +

	// 2. 简单 （Capture 6）
	"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +

	// 3. 其他任何东西 （Capture 2）
	".*" +
	")\\)|)";
