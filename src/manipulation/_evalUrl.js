import { jQuery } from "../ajax.js";

jQuery._evalUrl = function( url, options, doc ) {
	return jQuery.ajax( {
		url: url,

		// 将此内容明确，因为用户可以通过 ajaxSetup 覆盖此内容 （trac-11264）
		type: "GET",
		dataType: "script",
		cache: true,
		async: false,
		global: false,
		scriptAttrs: options.crossOrigin ? { "crossOrigin": options.crossOrigin } : undefined,

		// 仅在响应成功时评估响应 （gh-4126）
// dataFilter 不会为失败响应调用，因此请改用它
// 的默认转换器很笨拙，但它可以工作。
		converters: {
			"text script": function() {}
		},
		dataFilter: function( response ) {
			jQuery.globalEval( response, options, doc );
		}
	} );
};
