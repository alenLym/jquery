import { jQuery } from "./core.js";
import { toType } from "./core/toType.js";
import { rcheckableType } from "./var/rcheckableType.js";

import "./core/init.js";
import "./traversing.js"; // filter
import "./attributes/prop.js";

var
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
	rsubmittable = /^(?:input|select|textarea|keygen)/i;

function buildParams(prefix, obj, traditional, add) {
	var name;

	if (Array.isArray(obj)) {

		// 序列化数组项。
		jQuery.each(obj, function (i, v) {
			if (traditional || rbracket.test(prefix)) {

				// 将每个数组项视为一个标量。
				add(prefix, v);

			} else {

				// Item 是非标量 （数组或对象） ，对其数值索引进行编码。
				buildParams(
					prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
					v,
					traditional,
					add
				);
			}
		});

	} else if (!traditional && toType(obj) === "object") {

		// 序列化对象项。
		for (name in obj) {
			buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
		}

	} else {

		// 序列化标量项。
		add(prefix, obj);
	}
}

// 序列化一组表单元素或一组
// key/values 添加到查询字符串中
jQuery.param = function (a, traditional) {
	var prefix,
		s = [],
		add = function (key, valueOrFunction) {

			// 如果 value 是一个函数，则调用它并使用其返回值
			var value = typeof valueOrFunction === "function" ?
				valueOrFunction() :
				valueOrFunction;

			s[s.length] = encodeURIComponent(key) + "=" +
				encodeURIComponent(value == null ? "" : value);
		};

	if (a == null) {
		return "";
	}

	// 如果传入了数组，则假定它是表单元素的数组。
	if (Array.isArray(a) || (a.jquery && !jQuery.isPlainObject(a))) {

		// Serialize the form elements
		jQuery.each(a, function () {
			add(this.name, this.value);
		});

	} else {

		// 如果是 traditional，则以 “old” 方式编码（1.3.2 或更早版本的方式
		// 做到了），否则递归编码 params。
		for (prefix in a) {
			buildParams(prefix, a[prefix], traditional, add);
		}
	}

	// 返回生成的序列化
	return s.join("&");
};

jQuery.fn.extend({
	serialize: function () {
		return jQuery.param(this.serializeArray());
	},
	serializeArray: function () {
		return this.map(function () {

			// 可以为 “elements” 添加 propHook 来过滤或添加表单元素
			var elements = jQuery.prop(this, "elements");
			return elements ? jQuery.makeArray(elements) : this;
		}).filter(function () {
			var type = this.type;

			// 使用 .is（ “:d isabled” ） 使 fieldset[disabled] 工作
			return this.name && !jQuery(this).is(":disabled") &&
				rsubmittable.test(this.nodeName) && !rsubmitterTypes.test(type) &&
				(this.checked || !rcheckableType.test(type));
		}).map(function (_i, elem) {
			var val = jQuery(this).val();

			if (val == null) {
				return null;
			}

			if (Array.isArray(val)) {
				return jQuery.map(val, function (val) {
					return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
				});
			}

			return { name: elem.name, value: val.replace(rCRLF, "\r\n") };
		}).get();
	}
});

export { jQuery, jQuery as $ };
