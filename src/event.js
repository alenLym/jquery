import { jQuery } from "./core.js";
import { documentElement } from "./var/documentElement.js";
import { rnothtmlwhite } from "./var/rnothtmlwhite.js";
import { rcheckableType } from "./var/rcheckableType.js";
import { slice } from "./var/slice.js";
import { isIE } from "./var/isIE.js";
import { acceptData } from "./data/var/acceptData.js";
import { dataPriv } from "./data/var/dataPriv.js";
import { nodeName } from "./core/nodeName.js";

import "./core/init.js";
import "./selector.js";

var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function on(elem, types, selector, data, fn, one) {
	var origFn, type;

	// 类型可以是类型/处理程序的映射
	if (typeof types === "object") {

		// ( types-Object, selector, data )
		if (typeof selector !== "string") {

			// ( types-Object, data )
			data = data || selector;
			selector = undefined;
		}
		for (type in types) {
			on(elem, type, selector, data, types[type], one);
		}
		return elem;
	}

	if (data == null && fn == null) {

		// ( types, fn )
		fn = selector;
		data = selector = undefined;
	} else if (fn == null) {
		if (typeof selector === "string") {

			// ( types, selector, fn )
			fn = data;
			data = undefined;
		} else {

			// ( types, data, fn )
			fn = data;
			data = selector;
			selector = undefined;
		}
	}
	if (fn === false) {
		fn = returnFalse;
	} else if (!fn) {
		return elem;
	}

	if (one === 1) {
		origFn = fn;
		fn = function (event) {

			// 可以使用空集，因为 event 包含信息
			jQuery().off(event);
			return origFn.apply(this, arguments);
		};

		// 使用相同的 guid，以便调用方可以使用 origFn 删除
		fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
	}
	return elem.each(function () {
		jQuery.event.add(this, types, fn, data, selector);
	});
}

/*
 * 用于管理事件的帮助程序函数 -- 不是公共接口的一部分。
 * Props 添加到 Dean Edwards 的 addEvent 库中，以获取许多想法。
 */
jQuery.event = {

	add: function (elem, types, handler, data, selector) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.get(elem);

		// 仅将事件附加到接受数据的对象
		if (!acceptData(elem)) {
			return;
		}

		// 调用方可以传入自定义数据的对象来代替处理程序
		if (handler.handler) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// 确保无效的 selector 在附加时抛出异常
		// 如果 elem 是非元素节点（例如，document），则针对 documentElement 进行评估
		if (selector) {
			jQuery.find.matchesSelector(documentElement, selector);
		}

		// 确保处理程序具有唯一 ID，用于稍后查找/删除它
		if (!handler.guid) {
			handler.guid = jQuery.guid++;
		}

		// 初始化元素的事件结构和 main 处理程序（如果这是第一个
		if (!(events = elemData.events)) {
			events = elemData.events = Object.create(null);
		}
		if (!(eventHandle = elemData.handle)) {
			eventHandle = elemData.handle = function (e) {

				// 丢弃 jQuery.event.trigger（） 的第二个事件，并且
				// 在页面卸载后调用事件时
				return typeof jQuery !== "undefined" && jQuery.event.triggered !== e.type ?
					jQuery.event.dispatch.apply(elem, arguments) : undefined;
			};
		}

		// 处理由空格分隔的多个事件
		types = (types || "").match(rnothtmlwhite) || [""];
		t = types.length;
		while (t--) {
			tmp = rtypenamespace.exec(types[t]) || [];
			type = origType = tmp[1];
			namespaces = (tmp[2] || "").split(".").sort();

			// 必须有一个类型，没有附加仅限命名空间的处理程序
			if (!type) {
				continue;
			}

			// 如果 event 更改了其类型，则对更改的类型使用特殊的事件处理程序
			special = jQuery.event.special[type] || {};

			// 如果定义了 selector，则确定特殊事件 api 类型，否则给定 type
			type = (selector ? special.delegateType : special.bindType) || type;

			// 根据新重置的类型更新特殊
			special = jQuery.event.special[type] || {};

			// handleObj 传递给所有事件处理程序
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test(selector),
				namespace: namespaces.join(".")
			}, handleObjIn);

			// 如果我们是第一个，则初始化事件处理程序队列
			if (!(handlers = events[type])) {
				handlers = events[type] = [];
				handlers.delegateCount = 0;

				// 仅当特殊事件处理程序返回 false 时，才使用 addEventListener
				if (!special.setup ||
					special.setup.call(elem, data, namespaces, eventHandle) === false) {

					if (elem.addEventListener) {
						elem.addEventListener(type, eventHandle);
					}
				}
			}

			if (special.add) {
				special.add.call(elem, handleObj);

				if (!handleObj.handler.guid) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// 添加到元素的处理程序列表中，delegates 在前面
			if (selector) {
				handlers.splice(handlers.delegateCount++, 0, handleObj);
			} else {
				handlers.push(handleObj);
			}
		}

	},

	// 从元素中分离一个事件或一组事件
	remove: function (elem, types, handler, selector, mappedTypes) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = dataPriv.hasData(elem) && dataPriv.get(elem);

		if (!elemData || !(events = elemData.events)) {
			return;
		}

		// 对 types 中的每个 type.namespace 执行一次;type 可以省略
		types = (types || "").match(rnothtmlwhite) || [""];
		t = types.length;
		while (t--) {
			tmp = rtypenamespace.exec(types[t]) || [];
			type = origType = tmp[1];
			namespaces = (tmp[2] || "").split(".").sort();

			// 取消绑定元素的所有事件（在此命名空间上，如果提供）
			if (!type) {
				for (type in events) {
					jQuery.event.remove(elem, type + types[t], handler, selector, true);
				}
				continue;
			}

			special = jQuery.event.special[type] || {};
			type = (selector ? special.delegateType : special.bindType) || type;
			handlers = events[type] || [];
			tmp = tmp[2] &&
				new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)");

			// 删除匹配的事件
			origCount = j = handlers.length;
			while (j--) {
				handleObj = handlers[j];

				if ((mappedTypes || origType === handleObj.origType) &&
					(!handler || handler.guid === handleObj.guid) &&
					(!tmp || tmp.test(handleObj.namespace)) &&
					(!selector || selector === handleObj.selector ||
						selector === "**" && handleObj.selector)) {
					handlers.splice(j, 1);

					if (handleObj.selector) {
						handlers.delegateCount--;
					}
					if (special.remove) {
						special.remove.call(elem, handleObj);
					}
				}
			}

			// 如果我们删除了某些内容并且不再存在处理程序，请删除泛型事件处理程序
			// （避免在删除特殊事件处理程序期间出现无限递归的可能性）
			if (origCount && !handlers.length) {
				if (!special.teardown ||
					special.teardown.call(elem, namespaces, elemData.handle) === false) {

					jQuery.removeEvent(elem, type, elemData.handle);
				}

				delete events[type];
			}
		}

		// 删除数据和 expando（如果不再使用）
		if (jQuery.isEmptyObject(events)) {
			dataPriv.remove(elem, "handle events");
		}
	},

	dispatch: function (nativeEvent) {

		var i, j, ret, matched, handleObj, handlerQueue,
			args = new Array(arguments.length),

			// 从本机事件对象创建可写的 jQuery.Event
			event = jQuery.event.fix(nativeEvent),

			handlers = (
				dataPriv.get(this, "events") || Object.create(null)
			)[event.type] || [],
			special = jQuery.event.special[event.type] || {};

		// 使用修复的 jQuery.Event，而不是（只读的）本机事件
		args[0] = event;

		for (i = 1; i < arguments.length; i++) {
			args[i] = arguments[i];
		}

		event.delegateTarget = this;

		// 调用 mapped 类型的 preDispatch 钩子，并在需要时让它 bail
		if (special.preDispatch && special.preDispatch.call(this, event) === false) {
			return;
		}

		// 确定处理程序
		handlerQueue = jQuery.event.handlers.call(this, event, handlers);

		// 首先运行委托;他们可能想阻止我们下方的传播
		i = 0;
		while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
			event.currentTarget = matched.elem;

			j = 0;
			while ((handleObj = matched.handlers[j++]) &&
				!event.isImmediatePropagationStopped()) {

				// 如果事件是命名空间的，则每个处理程序仅在
				// 具体来说，Universal 或其命名空间是事件的超集。
				if (!event.rnamespace || handleObj.namespace === false ||
					event.rnamespace.test(handleObj.namespace)) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ((jQuery.event.special[handleObj.origType] || {}).handle ||
						handleObj.handler).apply(matched.elem, args);

					if (ret !== undefined) {
						if ((event.result = ret) === false) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// 调用 map 类型的 postDispatch 钩子
		if (special.postDispatch) {
			special.postDispatch.call(this, event);
		}

		return event.result;
	},

	handlers: function (event, handlers) {
		var i, handleObj, sel, matchedHandlers, matchedSelectors,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		if (delegateCount &&

			// 支持： Firefox <=42 - 66+
			// 抑制指示非主指针按钮的违反规范的单击 （trac-3861）
			// https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
			// 支持：IE 11+
			// ...但不包括单选输入的箭头键“点击”，它可以具有“按钮”-1 （GH-2343）
			!(event.type === "click" && event.button >= 1)) {

			for (; cur !== this; cur = cur.parentNode || this) {

				// 不检查非元素 （trac-13208）
				// 不处理对已禁用元素的点击（trac-6911、trac-8165、trac-11382、trac-11764）
				if (cur.nodeType === 1 && !(event.type === "click" && cur.disabled === true)) {
					matchedHandlers = [];
					matchedSelectors = {};
					for (i = 0; i < delegateCount; i++) {
						handleObj = handlers[i];

						// 不要与 Object.prototype 属性冲突 （trac-13203）
						sel = handleObj.selector + " ";

						if (matchedSelectors[sel] === undefined) {
							matchedSelectors[sel] = handleObj.needsContext ?
								jQuery(sel, this).index(cur) > -1 :
								jQuery.find(sel, this, null, [cur]).length;
						}
						if (matchedSelectors[sel]) {
							matchedHandlers.push(handleObj);
						}
					}
					if (matchedHandlers.length) {
						handlerQueue.push({ elem: cur, handlers: matchedHandlers });
					}
				}
			}
		}

		// 添加其余 （直接绑定） 处理程序
		cur = this;
		if (delegateCount < handlers.length) {
			handlerQueue.push({ elem: cur, handlers: handlers.slice(delegateCount) });
		}

		return handlerQueue;
	},

	addProp: function (name, hook) {
		Object.defineProperty(jQuery.Event.prototype, name, {
			enumerable: true,
			configurable: true,

			get: typeof hook === "function" ?
				function () {
					if (this.originalEvent) {
						return hook(this.originalEvent);
					}
				} :
				function () {
					if (this.originalEvent) {
						return this.originalEvent[name];
					}
				},

			set: function (value) {
				Object.defineProperty(this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value: value
				});
			}
		});
	},

	fix: function (originalEvent) {
		return originalEvent[jQuery.expando] ?
			originalEvent :
			new jQuery.Event(originalEvent);
	},

	special: jQuery.extend(Object.create(null), {
		load: {

			// 防止触发的 image.load 事件冒泡到 window.load
			noBubble: true
		},
		click: {

			// 利用本机事件来确保可检查输入的正确状态
			setup: function (data) {

				// 为了实现与 _default 的相互压缩性，请将 'this' 访问权限替换为本地 var。
				// `||data“是死代码，仅用于通过缩小来保留变量。
				var el = this || data;

				// 领取第一个处理程序
				if (rcheckableType.test(el.type) &&
					el.click && nodeName(el, "input")) {

					// dataPriv.set( el, "click", ... )
					leverageNative(el, "click", true);
				}

				// 返回 false 以允许在调用方中进行正常处理
				return false;
			},
			trigger: function (data) {

				// 为了实现与 _default 的相互压缩性，请将 'this' 访问权限替换为本地 var。
				// `||data“是死代码，仅用于通过缩小来保留变量。
				var el = this || data;

				// 在触发点击之前强制设置
				if (rcheckableType.test(el.type) &&
					el.click && nodeName(el, "input")) {

					leverageNative(el, "click");
				}

				// 返回非 false 以允许正常的事件路径传播
				return true;
			},

			// 为了实现跨浏览器的一致性，请在链接上禁止使用原生 .click（）
			// 如果我们当前处于利用的原生事件堆栈中，也可以阻止它
			_default: function (event) {
				var target = event.target;
				return rcheckableType.test(target.type) &&
					target.click && nodeName(target, "input") &&
					dataPriv.get(target, "click") ||
					nodeName(target, "a");
			}
		},

		beforeunload: {
			postDispatch: function (event) {

				// 支持：Chrome <=73+
				// Chrome 不会对“event.preventDefault（）”发出提醒
				// 作为标准要求。
				if (event.result !== undefined && event.originalEvent) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	})
};

// 确保存在处理手动触发的事件侦听器
// 合成事件，方法是中断进度，直到重新调用以响应
// *native* 事件，确保 state changes 具有
// 已经发生。
function leverageNative(el, type, isSetup) {

	// 缺少 'isSetup' 表示触发器调用，该调用必须通过 jQuery.event.add 强制设置
	if (!isSetup) {
		if (dataPriv.get(el, type) === undefined) {
			jQuery.event.add(el, type, returnTrue);
		}
		return;
	}

	// 将控制器注册为所有事件命名空间的特殊通用处理程序
	dataPriv.set(el, type, false);
	jQuery.event.add(el, type, {
		namespace: false,
		handler: function (event) {
			var result,
				saved = dataPriv.get(this, type);

			// 此控制器函数在多种情况下调用，
			// 通过 'saved' 中的存储值进行区分：
			// 1. 对于外部合成 '.trigger（）' 事件（由
			//    'event.isTrigger & 1' 和非数组 'saved'），它记录参数
			//    作为数组，并触发 [inner] 本机事件以提示状态
			//    已注册的侦听器应观察到的更改（例如
			//    复选框切换和焦点更新），然后清除存储的值。
			// 2. 对于 [内部] 原生事件（由 'saved' being 检测
			//    一个数组），它会触发一个内部合成事件，记录
			//    result，并抢占传播到更多的 jQuery 侦听器。
			// 3. 对于内部合成事件（由 'event.isTrigger & 1' 和
			//    数组 'saved'），它可以防止代理事件的双重传播
			//    但否则允许所有内容继续进行（特别是包括
			//    further listeners） 的 Ly。
			// 可能的“已保存”数据形状：“[...]、'{ value }'、'false'。
			if ((event.isTrigger & 1) && this[type]) {

				// 外部合成 .trigger（） ed 事件的中断处理
				if (!saved.length) {

					// 存储参数，以便在处理内部本机事件时使用
					// 总是至少有一个参数（事件对象），
					// 因此，此数组不会与剩余的 Capture 对象混淆。
					saved = slice.call(arguments);
					dataPriv.set(this, type, saved);

					// 触发本机事件并捕获其结果
					this[type]();
					result = dataPriv.get(this, type);
					dataPriv.set(this, type, false);

					if (saved !== result) {

						// 取消外部合成事件
						event.stopImmediatePropagation();
						event.preventDefault();

						// 支持：Chrome 86+
						// 在 Chrome 中，如果具有 focusout 处理程序的元素是
						// blur 的 URL，它会调用
						// 同步。如果该处理程序在
						// 元素中，数据被清除，留下 'result'
						// 定义。我们需要防范这种情况。
						return result && result.value;
					}

					// 如果这是具有冒泡的事件的内部合成事件
					// 代理项 （焦点或模糊） ），假设代理项已经
					// propagated 触发本机事件，并防止
					// 避免在这里再次发生。
				} else if ((jQuery.event.special[type] || {}).delegateType) {
					event.stopPropagation();
				}

				// 如果这是上面触发的原生事件，则现在一切都井井有条。
				// 使用原始参数触发内部合成事件。
			} else if (saved.length) {

				// ...并捕获结果
				dataPriv.set(this, type, {
					value: jQuery.event.trigger(
						saved[0],
						saved.slice(1),
						this
					)
				});

				// 中止所有 jQuery 处理程序对本机事件的处理，同时允许
				// native handlers 来运行。在目标上，这已经实现
				// 通过仅在 jQuery 事件上停止立即传播。然而
				// native 事件由 jQuery one 在
				// 传播，因此为 jQuery 停止它的唯一方法是停止它
				// everyone 通过本机 'stopPropagation（）' 进行。这不是问题
				// focus/blur 不会冒泡，但它也会停止点击复选框
				// 和收音机。我们接受此限制。
				event.stopPropagation();
				event.isImmediatePropagationStopped = returnTrue;
			}
		}
	});
}

jQuery.removeEvent = function (elem, type, handle) {

	// 这个 “if” 对于普通对象是必需的
	if (elem.removeEventListener) {
		elem.removeEventListener(type, handle);
	}
};

jQuery.Event = function (src, props) {

	// 允许在没有 'new' 关键字的情况下进行实例化
	if (!(this instanceof jQuery.Event)) {
		return new jQuery.Event(src, props);
	}

	// Event 对象
	if (src && src.type) {
		this.originalEvent = src;
		this.type = src.type;

		// 文档冒泡的事件可能已标记为已阻止
		// 由树下部的处理者;反映正确的值。
		this.isDefaultPrevented = src.defaultPrevented ?
			returnTrue :
			returnFalse;

		// 创建目标属性
		this.target = src.target;
		this.currentTarget = src.currentTarget;
		this.relatedTarget = src.relatedTarget;

		// 事件类型
	} else {
		this.type = src;
	}

	// 将显式提供的属性放到事件对象上
	if (props) {
		jQuery.extend(this, props);
	}

	// 如果传入事件没有时间戳，请创建时间戳
	this.timeStamp = src && src.timeStamp || Date.now();

	// Mark it as fixed
	this[jQuery.expando] = true;
};

// jQuery.Event 基于 ECMAScript 语言绑定指定的 DOM3 事件
// https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	constructor: jQuery.Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,
	isSimulated: false,

	preventDefault: function () {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if (e && !this.isSimulated) {
			e.preventDefault();
		}
	},
	stopPropagation: function () {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if (e && !this.isSimulated) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function () {
		var e = this.originalEvent;

		this.isImmediatePropagationStopped = returnTrue;

		if (e && !this.isSimulated) {
			e.stopImmediatePropagation();
		}

		this.stopPropagation();
	}
};

// 包括所有常见的事件 props，包括 KeyEvent 和 MouseEvent 特定的 props
jQuery.each({
	altKey: true,
	bubbles: true,
	cancelable: true,
	changedTouches: true,
	ctrlKey: true,
	detail: true,
	eventPhase: true,
	metaKey: true,
	pageX: true,
	pageY: true,
	shiftKey: true,
	view: true,
	"char": true,
	code: true,
	charCode: true,
	key: true,
	keyCode: true,
	button: true,
	buttons: true,
	clientX: true,
	clientY: true,
	offsetX: true,
	offsetY: true,
	pointerId: true,
	pointerType: true,
	screenX: true,
	screenY: true,
	targetTouches: true,
	toElement: true,
	touches: true,
	which: true
}, jQuery.event.addProp);

jQuery.each({ focus: "focusin", blur: "focusout" }, function (type, delegateType) {

	// 支持：IE 11+
	// 在文档上附加一个 focusin/focusout 处理程序，而有人想要 focus/blur。
	// 这是因为前者在 IE 中是同步的，而后者是异步的。 在其他浏览器中，所有这些处理程序都是同步调用的。
	function focusMappedHandler(nativeEvent) {

		// 'eventHandle' 已经包装了事件，但我们需要在此处更改 'type'。
		var event = jQuery.event.fix(nativeEvent);
		event.type = nativeEvent.type === "focusin" ? "focus" : "blur";
		event.isSimulated = true;

		// focus/blur 不会冒泡，而 focusIn/focusOut 会冒泡;仅模拟前者
		// 在较低级别调用 handler。
		if (event.target === event.currentTarget) {

			// 设置部分调用 'leverageNative'，而 'leverageNative' 又调用
			// 'jQuery.event.add'，因此事件句柄已经设置好了
			// 到这一点。
			dataPriv.get(this, "handle")(event);
		}
	}

	jQuery.event.special[type] = {

		// 如果可能，请使用本机事件，以便模糊/聚焦序列正确
		setup: function () {

			// 领取第一个处理程序
			// dataPriv.set（ this， “焦点”， ... ）
			// dataPriv.set（ this， “模糊”， ... ）
			leverageNative(this, type, true);

			if (isIE) {
				this.addEventListener(delegateType, focusMappedHandler);
			} else {

				// 返回 false 以允许在调用方中进行正常处理
				return false;
			}
		},
		trigger: function () {

			// 触发前强制设置
			leverageNative(this, type);

			// 返回非 false 以允许正常的事件路径传播
			return true;
		},

		teardown: function () {
			if (isIE) {
				this.removeEventListener(delegateType, focusMappedHandler);
			} else {

				// 返回 false 以指示应应用标准拆解
				return false;
			}
		},

		// 如果我们当前在内部，则抑制本机焦点或模糊
		// 利用的原生事件堆栈
		_default: function (event) {
			return dataPriv.get(event.target, type);
		},

		delegateType: delegateType
	};
});

// 使用 mouseover/out 和事件时间检查创建 mouseenter/leave 事件
// 以便事件委派在 jQuery 中工作。
// 对 pointerenter/pointerleave 和 pointerover/pointerout 执行相同的操作
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout",
	pointerenter: "pointerover",
	pointerleave: "pointerout"
}, function (orig, fix) {
	jQuery.event.special[orig] = {
		delegateType: fix,
		bindType: fix,

		handle: function (event) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// 对于 mouseenter/leave，如果 related 在目标之外，则调用处理程序。
			// 注意：如果鼠标离开/进入浏览器窗口，则没有 relatedTarget
			if (!related || (related !== target && !jQuery.contains(target, related))) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply(this, arguments);
				event.type = fix;
			}
			return ret;
		}
	};
});

jQuery.fn.extend({

	on: function (types, selector, data, fn) {
		return on(this, types, selector, data, fn);
	},
	one: function (types, selector, data, fn) {
		return on(this, types, selector, data, fn, 1);
	},
	off: function (types, selector, fn) {
		var handleObj, type;
		if (types && types.preventDefault && types.handleObj) {

			// （ 事件 ） dispatch 的 jQuery.Event
			handleObj = types.handleObj;
			jQuery(types.delegateTarget).off(
				handleObj.namespace ?
					handleObj.origType + "." + handleObj.namespace :
					handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if (typeof types === "object") {

			// （类型对象 [，选择器] ）
			for (type in types) {
				this.off(type, selector, types[type]);
			}
			return this;
		}
		if (selector === false || typeof selector === "function") {

			// （类型 [， fn] ）
			fn = selector;
			selector = undefined;
		}
		if (fn === false) {
			fn = returnFalse;
		}
		return this.each(function () {
			jQuery.event.remove(this, types, fn, selector);
		});
	}
});

export { jQuery, jQuery as $ };
