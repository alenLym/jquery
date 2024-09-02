import { jQuery } from "./core.js";
import { slice } from "./var/slice.js";

import "./callbacks.js";

function Identity(v) {
	return v;
}
function Thrower(ex) {
	throw ex;
}

/**
 * JavaScript 中的函数 'adoptValue' 处理不同类型的值，包括 promise 和非 promise，以相应地解析或拒绝它们。
 * @param值 - 'adoptValue' 函数中的 'value' 参数表示需要
 * 被收养或加工。该值可以是 promise、thenable 或 non-thenable 值，其中
 * function 将根据其类型和属性进行处理。
 * @param resolve - “adoptValue”函数中的“resolve”参数是一个应为
 * 在成功解析或处理值时调用。它通常用于
 * 承诺表示异步操作已成功完成，并将
 * 该操作的结果复制到
 * @param reject - “adoptValue”函数中的“reject”参数是一个调用的函数
 * 当异步操作中出现错误或拒绝时。它用于处理
 * 拒绝 Promise 或 Thenable 失败。当在执行
 * 异步操作
 * @param noValue - 'adoptValue' 函数中的 'noValue' 参数用于控制
 * 'resolve' 参数。如果 'noValue' 为 'false'，则 '[value].slice（0）' 为
 * 用于将 'value' 传递给 'resolve' 函数。如果
 */
function adoptValue(value, resolve, reject, noValue) {
	var method;

	try {

		// 首先检查 promise 方面以特权同步行为
		if (value && typeof (method = value.promise) === "function") {
			method.call(value).done(resolve).fail(reject);

			// 其他 thenable
		} else if (value && typeof (method = value.then) === "function") {
			method.call(value, resolve, reject);

			// 其他 non-thenable
		} else {

			// 通过让 Array#slice 将布尔值 'noValue' 转换为整数来控制 'resolve' 参数： false： [ value ].slice（ 0 ） => resolve（ value ） true： [ value ].slice（ 1 ） => resolve（）
			resolve.apply(undefined, [value].slice(noValue));
		}

		// 对于 Promises/A+，将异常转换为拒绝
		// 由于 jQuery.when 不会解包可操作对象，因此我们可以跳过
		// Deferred#then 有条件地抑制 rejection。
	} catch (value) {
		reject(value);
	}
}

jQuery.extend({

	Deferred: function (func) {
		var tuples = [

			// 操作、添加侦听器、回调、
			// ... .then handlers、argument index、[最终状态]
			["notify", "progress", jQuery.Callbacks("memory"),
				jQuery.Callbacks("memory"), 2],
			["resolve", "done", jQuery.Callbacks("once memory"),
				jQuery.Callbacks("once memory"), 0, "resolved"],
			["reject", "fail", jQuery.Callbacks("once memory"),
				jQuery.Callbacks("once memory"), 1, "rejected"]
		],
			state = "pending",
			promise = {
				state: function () {
					return state;
				},
				always: function () {
					deferred.done(arguments).fail(arguments);
					return this;
				},
				catch: function (fn) {
					return promise.then(null, fn);
				},

				// 保留管道以进行反向兼容
				pipe: function ( /* fnDone, fnFail, fnProgress */) {
					var fns = arguments;

					return jQuery.Deferred(function (newDefer) {
						jQuery.each(tuples, function (_i, tuple) {

							// 将元组 （progress， done， fail） 映射到参数 （done， fail， progress）
							var fn = typeof fns[tuple[4]] === "function" &&
								fns[tuple[4]];

							// deferred.progress（function（） { 绑定到 newDefer 或 newDefer.notify }）
							// deferred.done（function（） { 绑定到 newDefer 或 newDefer.resolve }）
							// deferred.fail（function（） { 绑定到 newDefer 或 newDefer.reject }）
							deferred[tuple[1]](function () {
								var returned = fn && fn.apply(this, arguments);
								if (returned && typeof returned.promise === "function") {
									returned.promise()
										.progress(newDefer.notify)
										.done(newDefer.resolve)
										.fail(newDefer.reject);
								} else {
									newDefer[tuple[0] + "With"](
										this,
										fn ? [returned] : arguments
									);
								}
							});
						});
						fns = null;
					}).promise();
				},
				then: function (onFulfilled, onRejected, onProgress) {
					var maxDepth = 0;
					function resolve(depth, deferred, handler, special) {
						return function () {
							var that = this,
								args = arguments,
								mightThrow = function () {
									var returned, then;

									// Support: Promises/A+ section 2.3.3.3.3
									// https://promisesaplus.com/#point-59
									// Ignore double-resolution attempts
									if (depth < maxDepth) {
										return;
									}

									returned = handler.apply(that, args);

									// Support: Promises/A+ section 2.3.1
									// https://promisesaplus.com/#point-48
									if (returned === deferred.promise()) {
										throw new TypeError("Thenable self-resolution");
									}

									// Support: Promises/A+ sections 2.3.3.1, 3.5
									// https://promisesaplus.com/#point-54
									// https://promisesaplus.com/#point-75
									// Retrieve `then` only once
									then = returned &&

										// Support: Promises/A+ section 2.3.4
										// https://promisesaplus.com/#point-64
										// Only check objects and functions for thenability
										(typeof returned === "object" ||
											typeof returned === "function") &&
										returned.then;

									// 处理返回的 thenable
									if (typeof then === "function") {

										// 特殊处理器 （通知） 只需等待解决
										if (special) {
											then.call(
												returned,
												resolve(maxDepth, deferred, Identity, special),
												resolve(maxDepth, deferred, Thrower, special)
											);

											// 普通处理器 （resolve） 也会挂接到进度中
										} else {

											// ...并忽略较旧的分辨率值
											maxDepth++;

											then.call(
												returned,
												resolve(maxDepth, deferred, Identity, special),
												resolve(maxDepth, deferred, Thrower, special),
												resolve(maxDepth, deferred, Identity,
													deferred.notifyWith)
											);
										}

										// 处理所有其他返回值
									} else {

										// 只有 substitute 处理程序传递 context 和多个值（非 spec 行为）
										if (handler !== Identity) {
											that = undefined;
											args = [returned];
										}

										// 处理值
										// 默认进程为 resolve
										(special || deferred.resolveWith)(that, args);
									}
								},

								// 只有普通处理器 （resolve） 捕获和拒绝异常
								process = special ?
									mightThrow :
									function () {
										try {
											mightThrow();
										} catch (e) {

											if (jQuery.Deferred.exceptionHook) {
												jQuery.Deferred.exceptionHook(e,
													process.error);
											}

											// Support: Promises/A+ section 2.3.3.3.4.1
											// https://promisesaplus.com/#point-61
											// Ignore post-resolution exceptions
											if (depth + 1 >= maxDepth) {

												// 只有 substitute 处理程序传递 context 和多个值（非 spec 行为）
												if (handler !== Thrower) {
													that = undefined;
													args = [e];
												}

												deferred.rejectWith(that, args);
											}
										}
									};

							// 支持：Promises/A+ 第 2.3.3.3.1 节 https://promisesaplus.com/#point-57
							// 立即重新解决承诺，以避免后续错误的错误拒绝
							if (depth) {
								process();
							} else {

								// 调用一个可选的钩子来记录错误，以防出现异常，否则当执行变为异步时它会丢失
								if (jQuery.Deferred.getErrorHook) {
									process.error = jQuery.Deferred.getErrorHook();
								}
								window.setTimeout(process);
							}
						};
					}

					return jQuery.Deferred(function (newDefer) {

						// progress_handlers.add（ ... ）
						tuples[0][3].add(
							resolve(
								0,
								newDefer,
								typeof onProgress === "function" ?
									onProgress :
									Identity,
								newDefer.notifyWith
							)
						);

						// fulfilled_handlers.add( ... )
						tuples[1][3].add(
							resolve(
								0,
								newDefer,
								typeof onFulfilled === "function" ?
									onFulfilled :
									Identity
							)
						);

						// rejected_handlers.add( ... )
						tuples[2][3].add(
							resolve(
								0,
								newDefer,
								typeof onRejected === "function" ?
									onRejected :
									Thrower
							)
						);
					}).promise();
				},

				// 获取此 deferred 的 promise
				// 如果提供了 obj，则 promise 方面将添加到对象中
				promise: function (obj) {
					return obj != null ? jQuery.extend(obj, promise) : promise;
				}
			},
			deferred = {};

		// 添加特定于列表的方法
		jQuery.each(tuples, function (i, tuple) {
			var list = tuple[2],
				stateString = tuple[5];

			// promise.progress = list.add
			// promise.done = list.add
			// promise.fail = list.add
			promise[tuple[1]] = list.add;

			// Handle state
			if (stateString) {
				list.add(
					function () {

						// state = "resolved" (i.e., fulfilled)
						// state = "rejected"
						state = stateString;
					},

					// rejected_callbacks.disable
					// fulfilled_callbacks.disable
					tuples[3 - i][2].disable,

					// rejected_handlers.disable
					// fulfilled_handlers.disable
					tuples[3 - i][3].disable,

					// progress_callbacks.lock
					tuples[0][2].lock,

					// progress_handlers.lock
					tuples[0][3].lock
				);
			}

			// progress_handlers.fire
			// fulfilled_handlers.fire
			// rejected_handlers.fire
			list.add(tuple[3].fire);

			// deferred.notify = function() { deferred.notifyWith(...) }
			// deferred.resolve = function() { deferred.resolveWith(...) }
			// deferred.reject = function() { deferred.rejectWith(...) }
			deferred[tuple[0]] = function () {
				deferred[tuple[0] + "With"](this === deferred ? undefined : this, arguments);
				return this;
			};

			// deferred.notifyWith = list.fireWith
			// deferred.resolveWith = list.fireWith
			// deferred.rejectWith = list.fireWith
			deferred[tuple[0] + "With"] = list.fireWith;
		});

		// 将延迟视为 Promise
		promise.promise(deferred);

		// 如果有，则调用 given func
		if (func) {
			func.call(deferred, deferred);
		}

		// All done!
		return deferred;
	},

	// 延迟帮助程序
	when: function (singleValue) {
		var

			// 未完成的下属计数
			remaining = arguments.length,

			// 未处理参数的计数
			i = remaining,

			// 从属配送数据
			resolveContexts = Array(i),
			resolveValues = slice.call(arguments),

			// 主要 Deferred
			primary = jQuery.Deferred(),

			// Subordinate 回调工厂
			updateFunc = function (i) {
				return function (value) {
					resolveContexts[i] = this;
					resolveValues[i] = arguments.length > 1 ? slice.call(arguments) : value;
					if (!(--remaining)) {
						primary.resolveWith(resolveContexts, resolveValues);
					}
				};
			};

		// 采用单参数和空参数，如 Promise.resolve
		if (remaining <= 1) {
			adoptValue(singleValue, primary.done(updateFunc(i)).resolve, primary.reject,
				!remaining);

			// 使用 .then（） 解包辅助 thenables（参见 gh-3000）
			if (primary.state() === "pending" ||
				typeof (resolveValues[i] && resolveValues[i].then) === "function") {

				return primary.then();
			}
		}

		// 多个参数像 Promise.all 数组元素一样聚合
		while (i--) {
			adoptValue(resolveValues[i], updateFunc(i), primary.reject);
		}

		return primary.promise();
	}
});

export { jQuery, jQuery as $ };
