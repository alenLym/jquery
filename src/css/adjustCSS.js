import { jQuery } from "../core.js";
import { isAutoPx } from "./isAutoPx.js";
import { rcssNum } from "../var/rcssNum.js";

export function adjustCSS(elem, prop, valueParts, tween) {
	var adjusted, scale,
		maxIterations = 20,
		currentValue = tween ?
			function () {
				return tween.cur();
			} :
			function () {
				return jQuery.css(elem, prop, "");
			},
		initial = currentValue(),
		unit = valueParts && valueParts[3] || (isAutoPx(prop) ? "px" : ""),

		// 对于潜在的单位不匹配，需要计算起始值
		initialInUnit = elem.nodeType &&
			(!isAutoPx(prop) || unit !== "px" && +initial) &&
			rcssNum.exec(jQuery.css(elem, prop));

	if (initialInUnit && initialInUnit[3] !== unit) {

		// 支持： Firefox <=54 - 66+
		// 将迭代目标值减半以防止 CSS 上限的干扰 （gh-2144）
		initial = initial / 2;

		// jQuery.css 报告的信任单位
		unit = unit || initialInUnit[3];

		// 从非零起点迭代近似
		initialInUnit = +initial || 1;

		while (maxIterations--) {

			// 评估并更新我们的最佳猜测值（将猜测值加倍，将 0 个值）从 0 中扣除。
			// 如果刻度等于或超过 1，则完成（使旧产品*新产品为非正数）。
			jQuery.style(elem, prop, initialInUnit + unit);
			if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
				maxIterations = 0;
			}
			initialInUnit = initialInUnit / scale;

		}

		initialInUnit = initialInUnit * 2;
		jQuery.style(elem, prop, initialInUnit + unit);

		// 确保我们稍后更新 tween 属性
		valueParts = valueParts || [];
	}

	if (valueParts) {
		initialInUnit = +initialInUnit || +initial || 0;

		// 应用相对偏移量 （+=/-=） （如果指定）
		adjusted = valueParts[1] ?
			initialInUnit + (valueParts[1] + 1) * valueParts[2] :
			+valueParts[2];
		if (tween) {
			tween.unit = unit;
			tween.start = initialInUnit;
			tween.end = adjusted;
		}
	}
	return adjusted;
}
