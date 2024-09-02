import { jQuery } from "../core.js";
import { nonce } from "./var/nonce.js";
import { rquery } from "./var/rquery.js";

import "../ajax.js";

var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// 默认 jsonp 设置
jQuery.ajaxSetup( {
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce.guid++ ) );
		this[ callback ] = true;
		return callback;
	}
} );

// 检测、规范化选项并安装 jsonp 请求的回调
jQuery.ajaxPrefilter( "jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" &&
				( s.contentType || "" )
					.indexOf( "application/x-www-form-urlencoded" ) === 0 &&
				rjsonp.test( s.data ) && "data"
		);

	// 获取回调名称，记住与之关联的预先存在的值
	callbackName = s.jsonpCallback = typeof s.jsonpCallback === "function" ?
		s.jsonpCallback() :
		s.jsonpCallback;

	// 将回调插入 url 或表单数据
	if ( jsonProp ) {
		s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
	} else if ( s.jsonp !== false ) {
		s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
	}

	// 在脚本执行后使用数据转换器检索 json
	s.converters[ "script json" ] = function() {
		if ( !responseContainer ) {
			jQuery.error( callbackName + " was not called" );
		}
		return responseContainer[ 0 ];
	};

	// 强制 json 数据类型
	s.dataTypes[ 0 ] = "json";

	// 安装回调
	overwritten = window[ callbackName ];
	window[ callbackName ] = function() {
		responseContainer = arguments;
	};

	// 清理功能（转换器后触发）
	jqXHR.always( function() {

		// 如果上一个值不存在 - 请将其删除
		if ( overwritten === undefined ) {
			jQuery( window ).removeProp( callbackName );

		// 否则恢复预先存在的值
		} else {
			window[ callbackName ] = overwritten;
		}

		// 免费另存
		if ( s[ callbackName ] ) {

			// 确保重复使用这些选项不会把事情搞砸
			s.jsonpCallback = originalSettings.jsonpCallback;

			// 保存回调名称以备将来使用
			oldCallbacks.push( callbackName );
		}

		// 如果它是一个函数，则调用 Call 并且我们有响应
		if ( responseContainer && typeof overwritten === "function" ) {
			overwritten( responseContainer[ 0 ] );
		}

		responseContainer = overwritten = undefined;
	} );

	// 委托给脚本
	return "script";
} );
