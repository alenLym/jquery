import { jQuery } from "./core.js";
import { access } from "./core/access.js";
import { camelCase } from "./core/camelCase.js";
import { dataPriv } from "./data/var/dataPriv.js";
import { dataUser } from "./data/var/dataUser.js";

//	实现摘要
//
//	1. 强制 API Surface 和语义与 1.9.x 分支兼容
//	2. 通过减少存储空间来提高模块的可维护性
//		paths 到单个机制。
//	3. 使用相同的单一机制来支持 “私有” 和 “用户” 数据。
//	4. _从不_向用户代码公开“私有”数据（TODO： Drop _data， _removeData）
//	5. 避免暴露用户对象的实现细节（例如 expando 属性）
//	6. 为 2014 年升级到 WeakMap 提供清晰的实施路径

var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
	rmultiDash = /[A-Z]/g;

/**
 * 解析输入数据并返回相应的 JavaScript 数据类型。
 * @param {string} data - 要解析的数据。
 * @returns {boolean|number|string|object} 根据其类型解析的数据。
 */
function getData(data) {
	if (data === "true") {
		return true;
	}

	if (data === "false") {
		return false;
	}

	if (data === "null") {
		return null;
	}

	// 仅当不更改字符串时才转换为数字
	if (data === +data + "") {
		return +data;
	}

	if (rbrace.test(data)) {
		return JSON.parse(data);
	}

	return data;
}

/**
 * 检索或设置给定元素的 data 属性的值。
 * 如果未提供 data 属性，它将检索 data 属性的值。
 * 如果提供了 data 属性，则设置 data 属性的值。
 * @param {Element} elem - 数据属性所在的元素。
 * @param {string} key - 数据属性的键。
 * @param {any} data - 要为 data 属性设置的数据。
 * @returns data 属性的值。
 */
function dataAttr(elem, key, data) {
	var name;

	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if (data === undefined && elem.nodeType === 1) {
		name = "data-" + key.replace(rmultiDash, "-$&").toLowerCase();
		data = elem.getAttribute(name);

		if (typeof data === "string") {
			try {
				data = getData(data);
			} catch (e) { }

			// 确保我们设置了数据，以便以后不会更改它
			dataUser.set(elem, key, data);
		} else {
			data = undefined;
		}
	}
	return data;
}

jQuery.extend({
	hasData: function (elem) {
		return dataUser.hasData(elem) || dataPriv.hasData(elem);
	},

	data: function (elem, name, data) {
		return dataUser.access(elem, name, data);
	},

	removeData: function (elem, name) {
		dataUser.remove(elem, name);
	},

	// TODO：现在，对 _data 和 _removeData 的所有调用都已替换
	// 通过直接调用 dataPriv 方法，这些方法可以被弃用。
	_data: function (elem, name, data) {
		return dataPriv.access(elem, name, data);
	},

	_removeData: function (elem, name) {
		dataPriv.remove(elem, name);
	}
});

jQuery.fn.extend({
	data: function (key, value) {
		var i, name, data,
			elem = this[0],
			attrs = elem && elem.attributes;

		// 获取所有值
		if (key === undefined) {
			if (this.length) {
				data = dataUser.get(elem);

				if (elem.nodeType === 1 && !dataPriv.get(elem, "hasDataAttrs")) {
					i = attrs.length;
					while (i--) {

						// 支持：IE 11+
						// attrs 元素可以为 null （trac-14894）
						if (attrs[i]) {
							name = attrs[i].name;
							if (name.indexOf("data-") === 0) {
								name = camelCase(name.slice(5));
								dataAttr(elem, name, data[name]);
							}
						}
					}
					dataPriv.set(elem, "hasDataAttrs", true);
				}
			}

			return data;
		}

		// 设置多个值
		if (typeof key === "object") {
			return this.each(function () {
				dataUser.set(this, key);
			});
		}

		return access(this, function (value) {
			var data;

			// 调用 jQuery 对象（元素匹配）不为空
			// （因此有一个元素出现在 this[ 0 ] 处），并且
			// 'value' 参数未定义。空 jQuery 对象
			// 将导致 elem = this[ 0 ] 的 'undefined' ，这将
			// 如果尝试读取数据缓存，则引发异常。
			if (elem && value === undefined) {

				// 尝试从缓存中获取数据
				// 键将始终在 Data 中为 camelCased
				data = dataUser.get(elem, key);
				if (data !== undefined) {
					return data;
				}

				// 尝试 “发现” 中的数据
				// HTML5 自定义 data-* attrs
				data = dataAttr(elem, key);
				if (data !== undefined) {
					return data;
				}

				// 我们真的很努力，但数据不存在。
				return;
			}

			// 设置数据...
			this.each(function () {

				// 我们始终存储 camelCased 密钥
				dataUser.set(this, key, value);
			});
		}, null, value, arguments.length > 1, null, true);
	},

	removeData: function (key) {
		return this.each(function () {
			dataUser.remove(this, key);
		});
	}
});

export { jQuery, jQuery as $ };
