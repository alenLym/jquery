import { jQuery } from "../core.js";

import "../queue.js";
import "../effects.js"; // 由于此依赖关系，延迟是可选的
// 基于 Clint Helfers 的插件，经许可。
jQuery.fn.delay = function (time, type) {
	time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
	type = type || "fx";

	return this.queue(type, function (next, hooks) {
		var timeout = window.setTimeout(next, time);
		hooks.stop = function () {
			window.clearTimeout(timeout);
		};
	});
};
