import { jQuery } from "../core.js";
import { stripAndCollapse } from "../core/stripAndCollapse.js";

import "../core/parseHTML.js";
import "../ajax.js";
import "../traversing.js";
import "../manipulation.js";
import "../selector.js";

/**
 * 将 URL 加载到页面中
 */
jQuery.fn.load = function (url, params, callback) {
	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if (off > -1) {
		selector = stripAndCollapse(url.slice(off));
		url = url.slice(0, off);
	}

	// 如果它是一个函数
	if (typeof params === "function") {

		// 我们假设这是回调
		callback = params;
		params = undefined;

		// 否则，构建一个 param 字符串
	} else if (params && typeof params === "object") {
		type = "POST";
	}

	// 如果我们有要修改的元素，请提出请求
	if (self.length > 0) {
		jQuery.ajax({
			url: url,

			// 如果 “type” 变量未定义，则将使用 “GET” 方法。
			// 使该字段的值显式，因为
			// 用户可以通过 ajaxSetup 方法覆盖它
			type: type || "GET",
			dataType: "html",
			data: params
		}).done(function (responseText) {

			// 保存响应以用于完整回调
			response = arguments;

			self.html(selector ?

				// 如果指定了选择器，请在虚拟 div 中找到正确的元素
				// 排除脚本以避免 IE 出现“权限被拒绝”错误
				jQuery("<div>").append(jQuery.parseHTML(responseText)).find(selector) :

				// 否则使用完整结果
				responseText);

			// 如果请求成功，此函数将获取 “data”、“status”、“jqXHR”
			// 但是它们被忽略了，因为上面设置了 response。
			// 如果失败，此函数将获取 “jqXHR”、“status”、“error”
		}).always(callback && function (jqXHR, status) {
			self.each(function () {
				callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
			});
		});
	}

	return this;
};
