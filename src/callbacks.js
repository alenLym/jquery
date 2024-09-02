import { jQuery } from "./core.js";
import { toType } from "./core/toType.js";
import { rnothtmlwhite } from "./var/rnothtmlwhite.js";

// 将字符串格式的选项转换为 Object 格式的选项
function createOptions(options) {
	var object = {};
	jQuery.each(options.match(rnothtmlwhite) || [], function (_, flag) {
		object[flag] = true;
	});
	return object;
}

/*
 * 使用以下参数创建回调列表：
 *
 *	options：一个可选的空格分隔选项列表，将更改方式
 *			回调列表行为或更传统的 Option 对象
 *
 * 默认情况下，回调列表的作用类似于事件回调列表，并且可以
 * 多次“fired”。
 *
 * 可能的选项：
 *
 *	once：将确保回调列表只能触发一次（如 Deferred）
 *
 *	memory：将跟踪以前的值，并将调用添加的任何回调
 *					在列表被立即触发后，使用最新的 “memorized”
 *					值（如 Deferred）
 *
 *	unique：将确保回调只能添加一次（列表中没有重复项）
 *
 *	stopOnFalse： 当回调返回 false 时中断调用
 *
 */
jQuery.Callbacks = function (options) {

	// 如果需要，将选项从 String-formated（字符串格式）转换为 Object-formated（对象格式）
	// （我们首先检查 CACHE）
	options = typeof options === "string" ?
		createOptions(options) :
		jQuery.extend({}, options);

	var // 标记以了解列表当前是否正在触发
		firing,

		// 不可遗忘列表的 Last fire 值
		memory,

		// 标记以了解列表是否已触发
		fired,

		// 用于防止触发的标志
		locked,

		// 实际回调列表
		list = [],

		// 可重复列表的执行数据队列
		queue = [],

		// 当前触发回调的索引（根据需要通过 add/remove 进行修改）
		firingIndex = -1,

		// 触发回调
		fire = function () {

			// Enforce single-firing
			locked = locked || options.once;

			// 执行所有待处理执行的回调，
			// 遵循 firingIndex 覆盖和运行时更改
			fired = firing = true;
			for (; queue.length; firingIndex = -1) {
				memory = queue.shift();
				while (++firingIndex < list.length) {

					// 运行 callback 并检查是否提前终止
					if (list[firingIndex].apply(memory[0], memory[1]) === false &&
						options.stopOnFalse) {

						// 跳转到末尾并忘记数据，这样 .add 就不会重新触发
						firingIndex = list.length;
						memory = false;
					}
				}
			}

			// 如果我们用完了数据，就忘记它
			if (!options.memory) {
				memory = false;
			}

			firing = false;

			// 如果我们永远结束了解雇，请清理
			if (locked) {

				// 如果我们有数据用于将来的 add 调用，请保留一个空列表
				if (memory) {
					list = [];

					// 否则，此对象将花费
				} else {
					list = "";
				}
			}
		},

		// Actual Callbacks 对象
		self = {

			// 将回调或回调集合添加到列表中
			add: function () {
				if (list) {

					// 如果我们有过去运行的内存，我们应该在添加
					if (memory && !firing) {
						firingIndex = list.length - 1;
						queue.push(memory);
					}

					(function add(args) {
						jQuery.each(args, function (_, arg) {
							if (typeof arg === "function") {
								if (!options.unique || !self.has(arg)) {
									list.push(arg);
								}
							} else if (arg && arg.length && toType(arg) !== "string") {

								// 递归检查
								add(arg);
							}
						});
					})(arguments);

					if (memory && !firing) {
						fire();
					}
				}
				return this;
			},

			// 从列表中删除回调
			remove: function () {
				jQuery.each(arguments, function (_, arg) {
					var index;
					while ((index = jQuery.inArray(arg, list, index)) > -1) {
						list.splice(index, 1);

						// 处理触发索引
						if (index <= firingIndex) {
							firingIndex--;
						}
					}
				});
				return this;
			},

			// 检查给定的回调是否在列表中。
			// 如果未给出参数，则返回 list 是否附加了回调。
			has: function (fn) {
				return fn ?
					jQuery.inArray(fn, list) > -1 :
					list.length > 0;
			},

			// 从列表中删除所有回调
			empty: function () {
				if (list) {
					list = [];
				}
				return this;
			},

			// 禁用 .fire 和 .add
			// 中止任何当前/待处理的执行
			// 清除所有回调和值
			disable: function () {
				locked = queue = [];
				list = memory = "";
				return this;
			},
			disabled: function () {
				return !list;
			},

			// 禁用 .fire
			// 除非我们有内存，否则请禁用 .add（因为它不会产生任何影响）
			// 中止任何待处理的执行
			lock: function () {
				locked = queue = [];
				if (!memory && !firing) {
					list = memory = "";
				}
				return this;
			},
			locked: function () {
				return !!locked;
			},

			// 使用给定的上下文和参数调用所有回调
			fireWith: function (context, args) {
				if (!locked) {
					args = args || [];
					args = [context, args.slice ? args.slice() : args];
					queue.push(args);
					if (!firing) {
						fire();
					}
				}
				return this;
			},

			// 使用给定参数调用所有回调
			fire: function () {
				self.fireWith(this, arguments);
				return this;
			},

			// 了解回调是否至少被调用过一次
			fired: function () {
				return !!fired;
			}
		};

	return self;
};

export { jQuery, jQuery as $ };
