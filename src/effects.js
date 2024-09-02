import { jQuery } from "./core.js";
import { document } from "./var/document.js";
import { rcssNum } from "./var/rcssNum.js";
import { rnothtmlwhite } from "./var/rnothtmlwhite.js";
import { cssExpand } from "./css/var/cssExpand.js";
import { isHiddenWithinTree } from "./css/var/isHiddenWithinTree.js";
import { adjustCSS } from "./css/adjustCSS.js";
import { cssCamelCase } from "./css/cssCamelCase.js";
import { dataPriv } from "./data/var/dataPriv.js";
import { showHide } from "./css/showHide.js";

import "./core/init.js";
import "./queue.js";
import "./deferred.js";
import "./traversing.js";
import "./manipulation.js";
import "./css.js";
import "./effects/Tween.js";

var
	fxNow, inProgress,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rrun = /queueHooks$/;

/**
 * 根据文档可见性使用 requestAnimationFrame 或 setTimeout 计划动画帧的函数。
 * @returns 无
 */
function schedule() {
	if (inProgress) {
		if (document.hidden === false && window.requestAnimationFrame) {
			window.requestAnimationFrame(schedule);
		} else {
			window.setTimeout(schedule, 13);
		}

		jQuery.fx.tick();
	}
}

// 同步创建的动画将同步运行
/**
 * 创建一个时间戳，表示自 Unix 纪元以来的当前时间（以毫秒为单位）。
 * 将 fxNow 变量设置为当前时间戳并返回它。
 * @returns {number} 当前时间戳（以毫秒为单位）。
 */
function createFxNow() {
	window.setTimeout(function () {
		fxNow = undefined;
	});
	return (fxNow = Date.now());
}

// 生成参数以创建标准动画
/**
 * 根据给定的类型和 includeWidth 标志生成 CSS 属性。
 * @param {string} type - 要为高度、边距、填充、宽度和不透明度设置的值。
 * @param {boolean} includeWidth - 用于确定是否应包含宽度和不透明度的标志。
 * @returns 包含基于输入类型和 includeWidth 标志的 CSS 属性的对象。
 */
function genFx(type, includeWidth) {
	var which,
		i = 0,
		attrs = { height: type };

	// 如果我们包括 width，则 step 值为 1 以执行所有 cssExpand 值，
	// 否则步长值为 2 以跳过 Left 和 Right
	includeWidth = includeWidth ? 1 : 0;
	for (; i < 4; i += 2 - includeWidth) {
		which = cssExpand[i];
		attrs["margin" + which] = attrs["padding" + which] = type;
	}

	if (includeWidth) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

/**
 * 为给定的值和属性创建补间动画。
 * @param {any} 值 - 要进行动画处理的值。
 * @param {string} prop - 要进行动画处理的属性。
 * @param {Animation} animation - 动画对象。
 * @returns 给定值和属性的补间动画。
 */
function createTween(value, prop, animation) {
	var tween,
		collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners["*"]),
		index = 0,
		length = collection.length;
	for (; index < length; index++) {
		if ((tween = collection[index].call(animation, prop, value))) {

			// 我们已完成此属性
			return tween;
		}
	}
}

/**
 * 默认预筛选函数，用于处理动画的元素属性和选项。
 * @param {Element} elem - 要应用预过滤器的元素。
 * @param {Object} props - 要进行动画处理的属性。
 * @param {Object} opts - 动画的选项。
 * @returns 无
 */
function defaultPrefilter(elem, props, opts) {
	var prop, value, toggle, hooks, oldfire, propTween, restoreDisplay, display,
		isBox = "width" in props || "height" in props,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHiddenWithinTree(elem),
		dataShow = dataPriv.get(elem, "fxshow");

	// 跳过队列的动画劫持了 fx 钩子
	if (!opts.queue) {
		hooks = jQuery._queueHooks(elem, "fx");
		if (hooks.unqueued == null) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function () {
				if (!hooks.unqueued) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function () {

			// 确保在完成之前调用 complete 处理程序
			anim.always(function () {
				hooks.unqueued--;
				if (!jQuery.queue(elem, "fx").length) {
					hooks.empty.fire();
				}
			});
		});
	}

	// 检测显示/隐藏动画
	for (prop in props) {
		value = props[prop];
		if (rfxtypes.test(value)) {
			delete props[prop];
			toggle = toggle || value === "toggle";
			if (value === (hidden ? "hide" : "show")) {

				// 如果这是一场“表演”，则假装隐藏起来，并且
				// 仍有来自已停止显示/隐藏的数据
				if (value === "show" && dataShow && dataShow[prop] !== undefined) {
					hidden = true;

					// 忽略所有其他无操作显示/隐藏数据
				} else {
					continue;
				}
			}
			orig[prop] = dataShow && dataShow[prop] || jQuery.style(elem, prop);
		}
	}

	// 如果这是像 .hide（）.hide（） 这样的无操作，请退出
	propTween = !jQuery.isEmptyObject(props);
	if (!propTween && jQuery.isEmptyObject(orig)) {
		return;
	}

	// 在框动画期间限制 “overflow” 和 “display” 样式
	if (isBox && elem.nodeType === 1) {

		// 支持：IE <=9 - 11+
		// 记录所有 3 个溢出属性，因为 IE 不会推断速记
		// 从同值 overflowX 和 overflowY 开始。
		opts.overflow = [style.overflow, style.overflowX, style.overflowY];

		// 确定显示类型，优先使用旧的显示/隐藏数据而不是 CSS 级联
		restoreDisplay = dataShow && dataShow.display;
		if (restoreDisplay == null) {
			restoreDisplay = dataPriv.get(elem, "display");
		}
		display = jQuery.css(elem, "display");
		if (display === "none") {
			if (restoreDisplay) {
				display = restoreDisplay;
			} else {

				// 通过临时强制可见性获取非空值
				showHide([elem], true);
				restoreDisplay = elem.style.display || restoreDisplay;
				display = jQuery.css(elem, "display");
				showHide([elem]);
			}
		}

		// 将内联元素作为内联块进行动画处理
		if (display === "inline" || display === "inline-block" && restoreDisplay != null) {
			if (jQuery.css(elem, "float") === "none") {

				// 恢复纯显示/隐藏动画结束时的原始显示值
				if (!propTween) {
					anim.done(function () {
						style.display = restoreDisplay;
					});
					if (restoreDisplay == null) {
						display = style.display;
						restoreDisplay = display === "none" ? "" : display;
					}
				}
				style.display = "inline-block";
			}
		}
	}

	if (opts.overflow) {
		style.overflow = "hidden";
		anim.always(function () {
			style.overflow = opts.overflow[0];
			style.overflowX = opts.overflow[1];
			style.overflowY = opts.overflow[2];
		});
	}

	// 实现显示/隐藏动画
	propTween = false;
	for (prop in orig) {

		// 此元素动画的常规显示/隐藏设置
		if (!propTween) {
			if (dataShow) {
				if ("hidden" in dataShow) {
					hidden = dataShow.hidden;
				}
			} else {
				dataShow = dataPriv.set(elem, "fxshow", { display: restoreDisplay });
			}

			// 存储隐藏/可见以进行切换，因此 '.stop（）.toggle（）' “反转”
			if (toggle) {
				dataShow.hidden = !hidden;
			}

			// 在为元素添加动画之前显示元素
			if (hidden) {
				showHide([elem], true);
			}

			// eslint-disable-next-line no-loop-func
			anim.done(function () {

				// “隐藏”动画的最后一步实际上是隐藏元素
				if (!hidden) {
					showHide([elem]);
				}
				dataPriv.remove(elem, "fxshow");
				for (prop in orig) {
					jQuery.style(elem, prop, orig[prop]);
				}
			});
		}

		// 按属性设置
		propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);
		if (!(prop in dataShow)) {
			dataShow[prop] = propTween.start;
			if (hidden) {
				propTween.end = propTween.start;
				propTween.start = 0;
			}
		}
	}
}

/**
 * 筛选和处理 CSS 动画的属性和特殊缓动。
 * @param {Object} props - 包含 CSS 属性的 properties 对象。
 * @param {Object} specialEasing - 用于 CSS 动画的特殊缓动对象。
 * @returns 无
 */
function propFilter(props, specialEasing) {
	var index, name, easing, value, hooks;

	// camelCase、specialEasing 和扩展 cssHook pass
	for (index in props) {
		name = cssCamelCase(index);
		easing = specialEasing[name];
		value = props[index];
		if (Array.isArray(value)) {
			easing = value[1];
			value = props[index] = value[0];
		}

		if (index !== name) {
			props[name] = value;
			delete props[index];
		}

		hooks = jQuery.cssHooks[name];
		if (hooks && "expand" in hooks) {
			value = hooks.expand(value);
			delete props[name];

			// 不完全是 $.extend，这不会覆盖现有的键。
			// 重用 'index' 因为我们有正确的 “name”
			for (index in value) {
				if (!(index in props)) {
					props[index] = value[index];
					specialEasing[index] = easing;
				}
			}
		} else {
			specialEasing[name] = easing;
		}
	}
}

/**
 * 表示具有指定属性和选项的给定元素上的动画。
 * @param {Element} elem - 要应用动画的元素。
 * @param {Object} 属性 - 要在元素上进行动画处理的属性。
 * @param {Object} 选项 - 动画的其他选项。
 * @returns 可用于控制动画的动画对象。
 */
function Animation(elem, properties, options) {
	var result,
		stopped,
		index = 0,
		length = Animation.prefilters.length,
		deferred = jQuery.Deferred().always(function () {

			// 不匹配 ：animated 选择器中的 elem
			delete tick.elem;
		}),
		tick = function () {
			if (stopped) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max(0, animation.startTime + animation.duration - currentTime),

				percent = 1 - (remaining / animation.duration || 0),
				index = 0,
				length = animation.tweens.length;

			for (; index < length; index++) {
				animation.tweens[index].run(percent);
			}

			deferred.notifyWith(elem, [animation, percent, remaining]);

			// 如果还有更多工作要做，请 yield
			if (percent < 1 && length) {
				return remaining;
			}

			// 如果这是一个空动画，则合成最终进度通知
			if (!length) {
				deferred.notifyWith(elem, [animation, 1, 0]);
			}

			// 解决动画并报告其结论
			deferred.resolveWith(elem, [animation]);
			return false;
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend({}, properties),
			opts: jQuery.extend(true, {
				specialEasing: {},
				easing: jQuery.easing._default
			}, options),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function (prop, end) {
				var tween = jQuery.Tween(elem, animation.opts, prop, end,
					animation.opts.specialEasing[prop] || animation.opts.easing);
				animation.tweens.push(tween);
				return tween;
			},
			stop: function (gotoEnd) {
				var index = 0,

					// 如果我们要走到最后，我们想运行所有的补间
					// 否则我们将跳过这部分
					length = gotoEnd ? animation.tweens.length : 0;
				if (stopped) {
					return this;
				}
				stopped = true;
				for (; index < length; index++) {
					animation.tweens[index].run(1);
				}

				// Resolve （解决） 何时播放最后一帧;否则，reject
				if (gotoEnd) {
					deferred.notifyWith(elem, [animation, 1, 0]);
					deferred.resolveWith(elem, [animation, gotoEnd]);
				} else {
					deferred.rejectWith(elem, [animation, gotoEnd]);
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter(props, animation.opts.specialEasing);

	for (; index < length; index++) {
		result = Animation.prefilters[index].call(animation, elem, props, animation.opts);
		if (result) {
			if (typeof result.stop === "function") {
				jQuery._queueHooks(animation.elem, animation.opts.queue).stop =
					result.stop.bind(result);
			}
			return result;
		}
	}

	jQuery.map(props, createTween, animation);

	if (typeof animation.opts.start === "function") {
		animation.opts.start.call(elem, animation);
	}

	// 从 options 附加回调
	animation
		.progress(animation.opts.progress)
		.done(animation.opts.done, animation.opts.complete)
		.fail(animation.opts.fail)
		.always(animation.opts.always);

	jQuery.fx.timer(
		jQuery.extend(tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	return animation;
}

jQuery.Animation = jQuery.extend(Animation, {

	tweeners: {
		"*": [function (prop, value) {
			var tween = this.createTween(prop, value);
			adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
			return tween;
		}]
	},

	tweener: function (props, callback) {
		if (typeof props === "function") {
			callback = props;
			props = ["*"];
		} else {
			props = props.match(rnothtmlwhite);
		}

		var prop,
			index = 0,
			length = props.length;

		for (; index < length; index++) {
			prop = props[index];
			Animation.tweeners[prop] = Animation.tweeners[prop] || [];
			Animation.tweeners[prop].unshift(callback);
		}
	},

	prefilters: [defaultPrefilter],

	prefilter: function (callback, prepend) {
		if (prepend) {
			Animation.prefilters.unshift(callback);
		} else {
			Animation.prefilters.push(callback);
		}
	}
});

jQuery.speed = function (speed, easing, fn) {
	var opt = speed && typeof speed === "object" ? jQuery.extend({}, speed) : {
		complete: fn || easing ||
			typeof speed === "function" && speed,
		duration: speed,
		easing: fn && easing || easing && typeof easing !== "function" && easing
	};

	// 如果 fx 关闭，则转到 end 状态
	if (jQuery.fx.off) {
		opt.duration = 0;

	} else {
		if (typeof opt.duration !== "number") {
			if (opt.duration in jQuery.fx.speeds) {
				opt.duration = jQuery.fx.speeds[opt.duration];

			} else {
				opt.duration = jQuery.fx.speeds._default;
			}
		}
	}

	// 规范化 opt.queue - true/undefined/null -> “fx”
	if (opt.queue == null || opt.queue === true) {
		opt.queue = "fx";
	}

	// 排队
	opt.old = opt.complete;

	opt.complete = function () {
		if (typeof opt.old === "function") {
			opt.old.call(this);
		}

		if (opt.queue) {
			jQuery.dequeue(this, opt.queue);
		}
	};

	return opt;
};

jQuery.fn.extend({
 /**
  * 在给定的持续时间内将所选元素的不透明度动画化为指定值。
  * @param {number} speed - 动画的持续时间（以毫秒为单位）。
  * @param {number} to - 要进行动画处理的目标不透明度值。
  * @param {string} 缓动 - 用于动画的缓动函数。
  * @param {Function} callback - 动画完成后要调用的函数。
  * @returns 用于方法链接的 jQuery 对象。
  */
	fadeTo: function (speed, to, easing, callback) {

		// 将 opacity 设置为 0 后显示任何隐藏的元素
		return this.filter(isHiddenWithinTree).css("opacity", 0).show()

			// 动画制作到指定的值
			.end().animate({ opacity: to }, speed, easing, callback);
	},
 /**
  * 使用指定的 speed、easing function 和 callback 对给定属性进行动画处理。
  * @param {Object} prop - 要进行动画处理的属性。
  * @param {number} speed - 动画的速度。
  * @param {string} 缓动 - 动画的缓动函数。
  * @param {Function} callback - 动画完成后要执行的回调函数。
  * @returns 用于方法链接的 jQuery 对象。
  */
	animate: function (prop, speed, easing, callback) {
		var empty = jQuery.isEmptyObject(prop),
			optall = jQuery.speed(speed, easing, callback),
			doAnimation = function () {

				// 对 prop 的副本进行操作，这样每个属性的缓动就不会丢失
				var anim = Animation(this, jQuery.extend({}, prop), optall);

				// 空动画或完成立即解决
				if (empty || dataPriv.get(this, "finish")) {
					anim.stop(true);
				}
			};

		doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each(doAnimation) :
			this.queue(optall.queue, doAnimation);
	},
 /**
  * 停止所选元素上的动画。
  * @param {string} type - 要停止的动画类型。
  * @param {boolean} clearQueue - 一个布尔值，指示是否清除动画队列。
  * @param {boolean} gotoEnd - 一个布尔值，指示是否跳转到动画的结尾。
  * @returns 无
  */
	stop: function (type, clearQueue, gotoEnd) {
		var stopQueue = function (hooks) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop(gotoEnd);
		};

		if (typeof type !== "string") {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if (clearQueue) {
			this.queue(type || "fx", []);
		}

		return this.each(function () {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = dataPriv.get(this);

			if (index) {
				if (data[index] && data[index].stop) {
					stopQueue(data[index]);
				}
			} else {
				for (index in data) {
					if (data[index] && data[index].stop && rrun.test(index)) {
						stopQueue(data[index]);
					}
				}
			}

			for (index = timers.length; index--;) {
				if (timers[index].elem === this &&
					(type == null || timers[index].queue === type)) {

					timers[index].anim.stop(gotoEnd);
					dequeue = false;
					timers.splice(index, 1);
				}
			}

			// 如果未强制执行最后一步，则开始队列中的下一个步骤。
			// 计时器当前将调用其完整的回调，该回调
			// 将取消排队，但前提是它们是 gotoEnd 的。
			if (dequeue || !gotoEnd) {
				jQuery.dequeue(this, type);
			}
		});
	},
 /**
  * 完成所选元素的动画。
  * @param {string} type - 要完成的动画类型。
  * @returns 动画完成的选定元素。
  */
	finish: function (type) {
		if (type !== false) {
			type = type || "fx";
		}
		return this.each(function () {
			var index,
				data = dataPriv.get(this),
				queue = data[type + "queue"],
				hooks = data[type + "queueHooks"],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// 对私有数据启用完成标志
			data.finish = true;

			// 先清空队列
			jQuery.queue(this, type, []);

			if (hooks && hooks.stop) {
				hooks.stop.call(this, true);
			}

			// 查找任何活动的动画，并完成它们
			for (index = timers.length; index--;) {
				if (timers[index].elem === this && timers[index].queue === type) {
					timers[index].anim.stop(true);
					timers.splice(index, 1);
				}
			}

			// 在旧队列中查找任何动画并完成它们
			for (index = 0; index < length; index++) {
				if (queue[index] && queue[index].finish) {
					queue[index].finish.call(this);
				}
			}

			// 关闭 finishing 标志
			delete data.finish;
		});
	}
});

/**
 * 通过向 CSS 属性添加动画功能来扩展 jQuery 库。
 * @param {number} _i - 索引参数。
 * @param {string} name - 要进行动画处理的 CSS 属性的名称。
 * @returns 无
 */
jQuery.each(["toggle", "show", "hide"], function (_i, name) {
	var cssFn = jQuery.fn[name];
	jQuery.fn[name] = function (speed, easing, callback) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply(this, arguments) :
			this.animate(genFx(name, true), speed, easing, callback);
	};
});

// 为自定义动画生成快捷方式
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function (name, props) {
	jQuery.fn[name] = function (speed, easing, callback) {
		return this.animate(props, speed, easing, callback);
	};
});

jQuery.timers = [];
/**
 * jQuery 动画 tick 函数的自定义实现。
 * 此函数遍历 jQuery timers 数组并执行每个计时器函数。
 * 如果 timer 函数返回 false，则会将其从 timers 数组中删除。
 * 如果没有剩余的计时器，jQuery 动画将停止。
 * @returns 无
 */
jQuery.fx.tick = function () {
	var timer,
		i = 0,
		timers = jQuery.timers;

	fxNow = Date.now();

	for (; i < timers.length; i++) {
		timer = timers[i];

		// 运行计时器并在完成后安全地将其删除（允许外部删除）
		if (!timer() && timers[i] === timer) {
			timers.splice(i--, 1);
		}
	}

	if (!timers.length) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

/**
 * 将计时器添加到 jQuery timers 数组并启动 jQuery 效果队列。
 * @param {Function} timer - 要添加到 timers 数组的 timer 函数。
 * @returns 无
 */
jQuery.fx.timer = function (timer) {
	jQuery.timers.push(timer);
	jQuery.fx.start();
};

/**
 * 此函数检查进程是否已在进行中。如果不是，它将 inProgress 标志设置为 true，
 * 指示进程现在正在进行中，然后调用 Schedule 函数。
 * 如果进程已在进行中，则它不执行任何操作。
 */
jQuery.fx.start = function () {
	if (inProgress) {
		return;
	}

	inProgress = true;
	schedule();
};

/**
 * 此函数将 inProgress 变量设置为 null。
 * @returns 无
 */
jQuery.fx.stop = function () {
	inProgress = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,

	// 默认速度
	_default: 400
};

export { jQuery, jQuery as $ };
