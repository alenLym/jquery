import { jQuery } from "./core.js";
import { dataPriv } from "./data/var/dataPriv.js";

import "./deferred.js";
import "./callbacks.js";

jQuery.extend({
	queue: function (elem, type, data) {
		var queue;

		if (elem) {
			type = (type || "fx") + "queue";
			queue = dataPriv.get(elem, type);

			// 如果这只是一个查找，请通过快速退出来加快取消排队的速度
			if (data) {
				if (!queue || Array.isArray(data)) {
					queue = dataPriv.set(elem, type, jQuery.makeArray(data));
				} else {
					queue.push(data);
				}
			}
			return queue || [];
		}
	},

	dequeue: function (elem, type) {
		type = type || "fx";

		var queue = jQuery.queue(elem, type),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks(elem, type),
			next = function () {
				jQuery.dequeue(elem, type);
			};

		// 如果 fx 队列已出队，则始终删除进度 sentinel
		if (fn === "inprogress") {
			fn = queue.shift();
			startLength--;
		}

		if (fn) {

			// 添加进度哨兵以防止 fx 队列
			// 自动取消排队
			if (type === "fx") {
				queue.unshift("inprogress");
			}

			// 清除最后一个队列停止功能
			delete hooks.stop;
			fn.call(elem, next, hooks);
		}

		if (!startLength && hooks) {
			hooks.empty.fire();
		}
	},

	// 非公共 - 生成 queueHooks 对象，或返回当前对象
	_queueHooks: function (elem, type) {
		var key = type + "queueHooks";
		return dataPriv.get(elem, key) || dataPriv.set(elem, key, {
			empty: jQuery.Callbacks("once memory").add(function () {
				dataPriv.remove(elem, [type + "queue", key]);
			})
		});
	}
});

jQuery.fn.extend({
	queue: function (type, data) {
		var setter = 2;

		if (typeof type !== "string") {
			data = type;
			type = "fx";
			setter--;
		}

		if (arguments.length < setter) {
			return jQuery.queue(this[0], type);
		}

		return data === undefined ?
			this :
			this.each(function () {
				var queue = jQuery.queue(this, type, data);

				// 确保此队列的钩子
				jQuery._queueHooks(this, type);

				if (type === "fx" && queue[0] !== "inprogress") {
					jQuery.dequeue(this, type);
				}
			});
	},
	dequeue: function (type) {
		return this.each(function () {
			jQuery.dequeue(this, type);
		});
	},
	clearQueue: function (type) {
		return this.queue(type || "fx", []);
	},

	// 在某种类型的队列时解析 Promise
	// 被清空（fx 是默认类型）
	promise: function (type, obj) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function () {
				if (!(--count)) {
					defer.resolveWith(elements, [elements]);
				}
			};

		if (typeof type !== "string") {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while (i--) {
			tmp = dataPriv.get(elements[i], type + "queueHooks");
			if (tmp && tmp.empty) {
				count++;
				tmp.empty.add(resolve);
			}
		}
		resolve();
		return defer.promise(obj);
	}
});

export { jQuery, jQuery as $ };
