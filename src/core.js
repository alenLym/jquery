import { arr } from "./var/arr.js";
import { getProto } from "./var/getProto.js";
import { slice } from "./var/slice.js";
import { flat } from "./var/flat.js";
import { push } from "./var/push.js";
import { indexOf } from "./var/indexOf.js";
import { class2type } from "./var/class2type.js";
import { toString } from "./var/toString.js";
import { hasOwn } from "./var/hasOwn.js";
import { fnToString } from "./var/fnToString.js";
import { ObjectFunctionString } from "./var/ObjectFunctionString.js";
import { support } from "./var/support.js";
import { isArrayLike } from "./core/isArrayLike.js";
import { DOMEval } from "./core/DOMEval.js";

var version = "@VERSION",

	rhtmlSuffix = /HTML$/i,

	// ---------------------------------------- factory  -------------------------------------


	// 定义 jQuery 的本地副本
	jQuery = function (selector, context) {

		// jQuery 对象实际上只是 init 构造函数 'enhanced'
		// 如果调用 jQuery，则需要 init（如果未包含 jQuery，则允许抛出错误）
		return new jQuery.fn.init(selector, context);
	};



// ----------------------------------------prototype -------------------------------------

jQuery.fn = jQuery.prototype = {

	// 正在使用的 jQuery 的当前版本
	jquery: version,

	constructor: jQuery,

	// jQuery 对象的默认长度为 0
	length: 0,

	toArray: function () {
		return slice.call(this);
	},

	// 获取匹配元素集中的第 N 个元素，或
	// 将整个匹配的元素集获取为干净的数组
	get: function (num) {

		// 返回干净数组中的所有元素
		if (num == null) {
			return slice.call(this);
		}

		// 仅返回集合中的一个元素
		return num < 0 ? this[num + this.length] : this[num];
	},

	// 获取元素数组并将其推送到堆栈上
	// （返回新的匹配元素集）
	pushStack: function (elems) {

		// 构建新的 jQuery 匹配元素集
		var ret = jQuery.merge(this.constructor(), elems);

		// 将旧对象添加到堆栈中（作为参考）
		ret.prevObject = this;

		// 返回新形成的元素集
		return ret;
	},

	// 为匹配集中的每个元素执行回调。
	each: function (callback) {
		return jQuery.each(this, callback);
	},

	map: function (callback) {
		return this.pushStack(jQuery.map(this, function (elem, i) {
			return callback.call(elem, i, elem);
		}));
	},

	slice: function () {
		return this.pushStack(slice.apply(this, arguments));
	},

	first: function () {
		return this.eq(0);
	},

	last: function () {
		return this.eq(-1);
	},

	even: function () {
		return this.pushStack(jQuery.grep(this, function (_elem, i) {
			return (i + 1) % 2;
		}));
	},

	odd: function () {
		return this.pushStack(jQuery.grep(this, function (_elem, i) {
			return i % 2;
		}));
	},

	eq: function (i) {
		var len = this.length,
			j = +i + (i < 0 ? len : 0);
		return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
	},

	end: function () {
		return this.prevObject || this.constructor();
	}
};



// ----------------------------------------extend  -------------------------------------

jQuery.extend = jQuery.fn.extend = function () {


	var options, // 目标对象
		name, // 属性名
		src, // 属性值
		copy, // 拷贝对象
		copyIsArray, // 拷贝对象是否为数组
		clone, // 拷贝对象
		target = arguments[0] || {},  // 目标对象
		i = 1,  // 当前属性索引
		length = arguments.length, // 参数长度
		deep = false;  // 是否深拷贝



	// 处理深拷贝情况
	if (typeof target === "boolean") {
		deep = target;

		// 跳过布尔值和目标
		target = arguments[i] || {};
		i++;
	}

	// 当 target 是字符串或其他内容时处理大小写（可能在深拷贝中）
	if (typeof target !== "object" && typeof target !== "function") {
		target = {};
	}

	// 如果只传递一个参数，则扩展 jQuery 本身
	if (i === length) {
		target = this;
		i--;
	}

	for (; i < length; i++) {

		// 仅处理非 null/undefined 值
		if ((options = arguments[i]) != null) {

			// 扩展基对象
			for (name in options) {
				copy = options[name];

				// 防止 Object.prototype 污染
				// 防止永无止境的循环
				if (name === "__proto__" || target === copy) {
					continue;
				}

				// 如果我们要合并普通对象或数组，则递归
				if (deep && copy && (jQuery.isPlainObject(copy) ||
					(copyIsArray = Array.isArray(copy)))) {
					src = target[name];

					// 确保源值的类型正确
					if (copyIsArray && !Array.isArray(src)) {
						clone = [];
					} else if (!copyIsArray && !jQuery.isPlainObject(src)) {
						clone = {};
					} else {
						clone = src;
					}
					copyIsArray = false;

					// 从不移动原始对象，克隆它们
					target[name] = jQuery.extend(deep, clone, copy);

					// 不要引入未定义的值
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}

	// 返回修改后的对象
	return target;
};

jQuery.extend({

	// 对于页面上的每个 jQuery 副本是唯一的
	expando: "jQuery" + (version + Math.random()).replace(/\D/g, ""),

	// 假设 jQuery 已准备就绪，但没有 ready 模块
	isReady: true,

	error: function (msg) {
		throw new Error(msg);
	},

	noop: function () { },

	isPlainObject: function (obj) {
		var proto, Ctor;

		// 检测明显的负面
		// 使用 toString 而不是 jQuery.type 捕获主机对象
		if (!obj || toString.call(obj) !== "[object Object]") {
			return false;
		}

		proto = getProto(obj);

		// 没有原型的对象（例如，'Object.create（ null ）'）是普通的
		if (!proto) {
			return true;
		}

		// 如果具有 prototype 的对象是由全局 Object 函数构造的，那么它们是普通的
		Ctor = hasOwn.call(proto, "constructor") && proto.constructor;
		return typeof Ctor === "function" && fnToString.call(Ctor) === ObjectFunctionString;
	},

	isEmptyObject: function (obj) {
		var name;

		for (name in obj) {
			return false;
		}
		return true;
	},

	// 在提供的上下文中评估脚本;回退到全局
	// 如果未指定。
	globalEval: function (code, options, doc) {
		DOMEval(code, { nonce: options && options.nonce }, doc);
	},

	each: function (obj, callback) {
		var length, i = 0;

		if (isArrayLike(obj)) {
			length = obj.length;
			for (; i < length; i++) {
				if (callback.call(obj[i], i, obj[i]) === false) {
					break;
				}
			}
		} else {
			for (i in obj) {
				if (callback.call(obj[i], i, obj[i]) === false) {
					break;
				}
			}
		}

		return obj;
	},


	// 检索 DOM 节点数组的 text 值
	text: function (elem) {
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		if (!nodeType) {

			// 如果没有 nodeType，则应为数组
			while ((node = elem[i++])) {

				// 不遍历注释节点
				ret += jQuery.text(node);
			}
		}
		if (nodeType === 1 || nodeType === 11) {
			return elem.textContent;
		}
		if (nodeType === 9) {
			return elem.documentElement.textContent;
		}
		if (nodeType === 3 || nodeType === 4) {
			return elem.nodeValue;
		}

		// 不包含 comment 或 processing instruction 节点

		return ret;
	},


	// results 仅供内部使用
	makeArray: function (arr, results) {
		var ret = results || [];

		if (arr != null) {
			if (isArrayLike(Object(arr))) {
				jQuery.merge(ret,
					typeof arr === "string" ?
						[arr] : arr
				);
			} else {
				push.call(ret, arr);
			}
		}

		return ret;
	},

	inArray: function (elem, arr, i) {
		return arr == null ? -1 : indexOf.call(arr, elem, i);
	},

	isXMLDoc: function (elem) {
		var namespace = elem && elem.namespaceURI,
			docElem = elem && (elem.ownerDocument || elem).documentElement;

		// 当 documentElement 尚不存在时，假设 HTML，例如在
		// 文档片段。
		return !rhtmlSuffix.test(namespace || docElem && docElem.nodeName || "HTML");
	},

	// 注意：元素不包含自身
	contains: function (a, b) {
		var bup = b && b.parentNode;

		return a === bup || !!(bup && bup.nodeType === 1 && (

			// 支持：IE 9 - 11+
			// IE 在 SVG 上没有 'contains'。
			a.contains ?
				a.contains(bup) :
				a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16
		));
	},

	merge: function (first, second) {
		var len = +second.length,
			j = 0,
			i = first.length;

		for (; j < len; j++) {
			first[i++] = second[j];
		}

		first.length = i;

		return first;
	},

	grep: function (elems, callback, invert) {
		var callbackInverse,
			matches = [],
			i = 0,
			length = elems.length,
			callbackExpect = !invert;

		// 遍历数组，仅保存项目
		// 传递验证器函数
		for (; i < length; i++) {
			callbackInverse = !callback(elems[i], i);
			if (callbackInverse !== callbackExpect) {
				matches.push(elems[i]);
			}
		}

		return matches;
	},

	// arg 仅供内部使用
	map: function (elems, callback, arg) {
		var length, value,
			i = 0,
			ret = [];

		// 遍历数组，将每个项目转换为其新值
		if (isArrayLike(elems)) {
			length = elems.length;
			for (; i < length; i++) {
				value = callback(elems[i], i, arg);

				if (value != null) {
					ret.push(value);
				}
			}

			// 遍历对象上的每个键，
		} else {
			for (i in elems) {
				value = callback(elems[i], i, arg);

				if (value != null) {
					ret.push(value);
				}
			}
		}

		// 展平任何嵌套数组
		return flat(ret);
	},

	// 对象的全局 GUID 计数器
	guid: 1,

	// jQuery.support 未在 Core 中使用，但其他项目将其
	// properties 的 URL 中，因此它需要存在。
	support: support
});

if (typeof Symbol === "function") {
	jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
}

// 填充 class2type 映射
jQuery.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
	function (_i, name) {
		class2type["[object " + name + "]"] = name.toLowerCase();
	});

export { jQuery, jQuery as $ };
