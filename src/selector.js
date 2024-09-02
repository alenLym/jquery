import { jQuery } from "./core.js";
import { nodeName } from "./core/nodeName.js";
import { document as preferredDoc } from "./var/document.js";
import { indexOf } from "./var/indexOf.js";
import { pop } from "./var/pop.js";
import { push } from "./var/push.js";
import { whitespace } from "./var/whitespace.js";
import { rbuggyQSA } from "./selector/rbuggyQSA.js";
import { rtrimCSS } from "./var/rtrimCSS.js";
import { isIE } from "./var/isIE.js";
import { identifier } from "./selector/var/identifier.js";
import { rleadingCombinator } from "./selector/var/rleadingCombinator.js";
import { rdescend } from "./selector/var/rdescend.js";
import { rsibling } from "./selector/var/rsibling.js";
import { matches } from "./selector/var/matches.js";
import { createCache } from "./selector/createCache.js";
import { testContext } from "./selector/testContext.js";
import { filterMatchExpr } from "./selector/filterMatchExpr.js";
import { preFilter } from "./selector/preFilter.js";
import { selectorError } from "./selector/selectorError.js";
import { unescapeSelector } from "./selector/unescapeSelector.js";
import { tokenize } from "./selector/tokenize.js";
import { toSelector } from "./selector/toSelector.js";

// 以下 util 直接附加到 jQuery 对象。
import "./attributes/attr.js"; // jQuery.attr
import "./selector/escapeSelector.js";
import "./selector/uniqueSort.js";

var i,
	outermostContext,

	// 本地文档变量
	document,
	documentElement,
	documentIsHTML,

	// 特定于实例的数据
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	compilerCache = createCache(),
	nonnativeSelectorCache = createCache(),

	// 正则表达式
	// 前导和非转义尾随空格，捕获后者之前的一些非空格字符
	rwhitespace = new RegExp(whitespace + "+", "g"),

	ridentifier = new RegExp("^" + identifier + "$"),

	matchExpr = jQuery.extend({

		// 用于实现 .is（） 的库
		// 我们将其用于 'select' 中的 POS 匹配
		needsContext: new RegExp("^" + whitespace +
			"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
			"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i")
	}, filterMatchExpr),

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	// 易于解析/检索的 ID 或 TAG 或 CLASS 选择器
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	// 用于 iframe;参见 'setDocument'。
	// 支持：IE 9 - 11+
	// 删除函数包装器会导致 “Permission Denied”
	// IE 中的错误。
	unloadHandler = function () {
		setDocument();
	},

	inDisabledFieldset = addCombinator(
		function (elem) {
			return elem.disabled === true && nodeName(elem, "fieldset");
		},
		{ dir: "parentNode", next: "legend" }
	);

function find(selector, context, results, seed) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType 默认为 9，因为 context 默认为 document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// 从具有无效 selector 或 context 的调用中提前返回
	if (typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11) {

		return results;
	}

	// 尝试在 HTML 文档中执行快捷方式查找操作（而不是过滤器）
	if (!seed) {
		setDocument(context);
		context = context || document;

		if (documentIsHTML) {

			// 如果选择器足够简单，请尝试使用 “get*By*” DOM 方法
			// （DocumentFragment 上下文除外，其中方法不存在）
			if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {

				// ID selector
				if ((m = match[1])) {

					// Document context
					if (nodeType === 9) {
						if ((elem = context.getElementById(m))) {
							push.call(results, elem);
						}
						return results;

						// Element context
					} else {
						if (newContext && (elem = newContext.getElementById(m)) &&
							jQuery.contains(context, elem)) {

							push.call(results, elem);
							return results;
						}
					}

					// 类型选择器
				} else if (match[2]) {
					push.apply(results, context.getElementsByTagName(selector));
					return results;

					// 类选择器
				} else if ((m = match[3]) && context.getElementsByClassName) {
					push.apply(results, context.getElementsByClassName(m));
					return results;
				}
			}

			// 利用 querySelectorAll
			if (!nonnativeSelectorCache[selector + " "] &&
				(!rbuggyQSA || !rbuggyQSA.test(selector))) {

				newSelector = selector;
				newContext = context;

				// qSA 在评估 child 或
				// descendant 组合器，这不是我们想要的。
				// 在这种情况下，我们通过在
				// list 中引用 scope 上下文的 ID 选择器。
				// 当使用领先的运算器时，也必须使用该技术
				// 因此，querySelectorAll 无法识别 selector 。
				// 感谢 Andrew Dupont 的这项技术。
				if (nodeType === 1 &&
					(rdescend.test(selector) || rleadingCombinator.test(selector))) {

					// 展开同级选择器的上下文
					newContext = rsibling.test(selector) &&
						testContext(context.parentNode) ||
						context;

					// 在 IE 之外，如果我们不改变上下文，我们可以
					// 使用 ：scope 而不是 ID。
					// 支持：IE 11+
					// IE 在进行严格比较时有时会引发 “Permission denied” 错误
					// 两份文件;肤浅的比较是有效的。
					// eslint-disable-next-line eqeq
					if (newContext != context || isIE) {

						// 捕获上下文 ID，必要时先设置
						if ((nid = context.getAttribute("id"))) {
							nid = jQuery.escapeSelector(nid);
						} else {
							context.setAttribute("id", (nid = jQuery.expando));
						}
					}

					// 为列表中的每个选择器添加前缀
					groups = tokenize(selector);
					i = groups.length;
					while (i--) {
						groups[i] = (nid ? "#" + nid : ":scope") + " " +
							toSelector(groups[i]);
					}
					newSelector = groups.join(",");
				}

				try {
					push.apply(results,
						newContext.querySelectorAll(newSelector)
					);
					return results;
				} catch (qsaError) {
					nonnativeSelectorCache(selector, true);
				} finally {
					if (nid === jQuery.expando) {
						context.removeAttribute("id");
					}
				}
			}
		}
	}

	// All others
	return select(selector.replace(rtrimCSS, "$1"), context, results, seed);
}

/**
 * 标记 jQuery 选择器模块特殊使用的函数
 * @param {Function} fn 要标记的函数
 */
function markFunction(fn) {
	fn[jQuery.expando] = true;
	return fn;
}

/**
 * 返回要在输入类型的伪函数中使用的函数
 * @param {String} 类型
 */
function createInputPseudo(type) {
	return function (elem) {
		return nodeName(elem, "input") && elem.type === type;
	};
}

/**
 * 返回要在按钮的伪函数中使用的函数
 * @param {String} 类型
 */
function createButtonPseudo(type) {
	return function (elem) {
		return (nodeName(elem, "input") || nodeName(elem, "button")) &&
			elem.type === type;
	};
}

/**
 * 返回一个函数，用于 ：enabled/:d isabled 的伪函数
 * @param {Boolean} 为 :d isabled;false 表示 ：enabled
 */
function createDisabledPseudo(disabled) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function (elem) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ("form" in elem) {

			// 检查相关非禁用元素上的继承禁用性：
			// * 在 disabled 字段集中列出与表单关联的元素
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * 已禁用的 OptGroup 中的 option 元素
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// 所有这些元素都有一个 “form” 属性。
			if (elem.parentNode && elem.disabled === false) {

				// Option 元素遵循父 optgroup（如果存在）
				if ("label" in elem) {
					if ("label" in elem.parentNode) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// 支持： IE 6 - 11+
				// 使用 isDisabled 快捷方式属性检查已禁用的字段集祖先
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					elem.isDisabled !== !disabled &&
					inDisabledFieldset(elem) === disabled;
			}

			return elem.disabled === disabled;

			// 在信任 disabled 属性之前，尝试筛选出无法禁用的元素。
			// 一些受害者被我们的网（标签、图例、菜单、轨道）捕获，但不应该
			// 甚至存在于它们上，更不用说具有布尔值了。
		} else if ("label" in elem) {
			return elem.disabled === disabled;
		}

		// 其余元素既不是 ：enabled 也不是 :d isabled
		return false;
	};
}

/**
 * 返回一个函数，用于位置
 * @param {Function} fn
 */
function createPositionalPseudo(fn) {
	return markFunction(function (argument) {
		argument = +argument;
		return markFunction(function (seed, matches) {
			var j,
				matchIndexes = fn([], seed.length, argument),
				i = matchIndexes.length;

			// 匹配在指定索引中找到的元素
			while (i--) {
				if (seed[(j = matchIndexes[i])]) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * 根据当前文档设置一次与文档相关的变量
 * @param {element|Object} [node] 用于设置文档的元素或文档对象
 */
function setDocument(node) {
	var subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// 如果文档无效或已选择，请提前返回
	// 支持：IE 11+
	// IE 在进行严格比较时有时会引发 “Permission denied” 错误
	// 两份文件;肤浅的比较是有效的。
	// eslint-disable-next-line eqeq
	if (doc == document || doc.nodeType !== 9) {
		return;
	}

	// Update global variables
	document = doc;
	documentElement = document.documentElement;
	documentIsHTML = !jQuery.isXMLDoc(document);

	// 支持：IE 9 - 11+
	// 卸载后访问 iframe 文档会引发 “permission denied” 错误（请参阅 trac-13936）
	// 支持：IE 11+
	// IE 在进行严格比较时有时会引发 “Permission denied” 错误
	// 两份文件;肤浅的比较是有效的。
	// eslint-disable-next-line eqeq
	if (isIE && preferredDoc != document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow) {
		subWindow.addEventListener("unload", unloadHandler);
	}
}

find.matches = function (expr, elements) {
	return find(expr, null, null, elements);
};

find.matchesSelector = function (elem, expr) {
	setDocument(elem);

	if (documentIsHTML &&
		!nonnativeSelectorCache[expr + " "] &&
		(!rbuggyQSA || !rbuggyQSA.test(expr))) {

		try {
			return matches.call(elem, expr);
		} catch (e) {
			nonnativeSelectorCache(expr, true);
		}
	}

	return find(expr, document, null, [elem]).length > 0;
};

jQuery.expr = {

	// 可由用户调整
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	find: {
		ID: function (id, context) {
			if (typeof context.getElementById !== "undefined" && documentIsHTML) {
				var elem = context.getElementById(id);
				return elem ? [elem] : [];
			}
		},

		TAG: function (tag, context) {
			if (typeof context.getElementsByTagName !== "undefined") {
				return context.getElementsByTagName(tag);

				// DocumentFragment 节点没有 gEBTN
			} else {
				return context.querySelectorAll(tag);
			}
		},

		CLASS: function (className, context) {
			if (typeof context.getElementsByClassName !== "undefined" && documentIsHTML) {
				return context.getElementsByClassName(className);
			}
		}
	},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: preFilter,

	filter: {
		ID: function (id) {
			var attrId = unescapeSelector(id);
			return function (elem) {
				return elem.getAttribute("id") === attrId;
			};
		},

		TAG: function (nodeNameSelector) {
			var expectedNodeName = unescapeSelector(nodeNameSelector).toLowerCase();
			return nodeNameSelector === "*" ?

				function () {
					return true;
				} :

				function (elem) {
					return nodeName(elem, expectedNodeName);
				};
		},

		CLASS: function (className) {
			var pattern = classCache[className + " "];

			return pattern ||
				(pattern = new RegExp("(^|" + whitespace + ")" + className +
					"(" + whitespace + "|$)")) &&
				classCache(className, function (elem) {
					return pattern.test(
						typeof elem.className === "string" && elem.className ||
						typeof elem.getAttribute !== "undefined" &&
						elem.getAttribute("class") ||
						""
					);
				});
		},

		ATTR: function (name, operator, check) {
			return function (elem) {
				var result = jQuery.attr(elem, name);

				if (result == null) {
					return operator === "!=";
				}
				if (!operator) {
					return true;
				}

				result += "";

				if (operator === "=") {
					return result === check;
				}
				if (operator === "!=") {
					return result !== check;
				}
				if (operator === "^=") {
					return check && result.indexOf(check) === 0;
				}
				if (operator === "*=") {
					return check && result.indexOf(check) > -1;
				}
				if (operator === "$=") {
					return check && result.slice(-check.length) === check;
				}
				if (operator === "~=") {
					return (" " + result.replace(rwhitespace, " ") + " ")
						.indexOf(check) > -1;
				}
				if (operator === "|=") {
					return result === check || result.slice(0, check.length + 1) === check + "-";
				}

				return false;
			};
		},

		CHILD: function (type, what, _argument, first, last) {
			var simple = type.slice(0, 3) !== "nth",
				forward = type.slice(-4) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// 快捷键 ：nth-*（n）
				function (elem) {
					return !!elem.parentNode;
				} :

				function (elem, _context, xml) {
					var cache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if (parent) {

						// :(first|last|only)-(child|of-type)
						if (simple) {
							while (dir) {
								node = elem;
								while ((node = node[dir])) {
									if (ofType ?
										nodeName(node, name) :
										node.nodeType === 1) {

										return false;
									}
								}

								// 反转 ：only-* 的方向 （如果我们还没有这样做）
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [forward ? parent.firstChild : parent.lastChild];

						// non-xml ：nth-child（...） 将缓存数据存储在 'parent' 上
						if (forward && useCache) {

							// 从以前缓存的索引中查找 'elem'
							outerCache = parent[jQuery.expando] ||
								(parent[jQuery.expando] = {});
							cache = outerCache[type] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = nodeIndex && cache[2];
							node = nodeIndex && parent.childNodes[nodeIndex];

							while ((node = ++nodeIndex && node && node[dir] ||

								// 回退到从一开始就寻找 'elem'
								(diff = nodeIndex = 0) || start.pop())) {

								// 找到后，在 'parent' 和 break 上缓存索引
								if (node.nodeType === 1 && ++diff && node === elem) {
									outerCache[type] = [dirruns, nodeIndex, diff];
									break;
								}
							}

						} else {

							// 使用以前缓存的元素索引（如果可用）
							if (useCache) {
								outerCache = elem[jQuery.expando] ||
									(elem[jQuery.expando] = {});
								cache = outerCache[type] || [];
								nodeIndex = cache[0] === dirruns && cache[1];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if (diff === false) {

								// 使用与上述相同的循环从头开始查找 'elem'
								while ((node = ++nodeIndex && node && node[dir] ||
									(diff = nodeIndex = 0) || start.pop())) {

									if ((ofType ?
										nodeName(node, name) :
										node.nodeType === 1) &&
										++diff) {

										// 缓存每个遇到的元素的索引
										if (useCache) {
											outerCache = node[jQuery.expando] ||
												(node[jQuery.expando] = {});
											outerCache[type] = [dirruns, diff];
										}

										if (node === elem) {
											break;
										}
									}
								}
							}
						}

						// 合并偏移量，然后检查周期大小
						diff -= last;
						return diff === first || (diff % first === 0 && diff / first >= 0);
					}
				};
		},

		PSEUDO: function (pseudo, argument) {

			// 伪类名不区分大小写
			// https://www.w3.org/TR/selectors/#pseudo-classes
			// 按区分大小写确定优先级，以防添加带有大写字母的自定义伪文件
			// 请记住，setFilters 继承自伪
			var fn = jQuery.expr.pseudos[pseudo] ||
				jQuery.expr.setFilters[pseudo.toLowerCase()] ||
				selectorError("unsupported pseudo: " + pseudo);

			// 用户可以使用 createPseudo 来指示
			// 创建 Filter 函数需要参数
			// 就像 jQuery 一样
			if (fn[jQuery.expando]) {
				return fn(argument);
			}

			return fn;
		}
	},

	pseudos: {

		// 潜在复杂的伪
		not: markFunction(function (selector) {

			// 修剪传递给 compile 的选择器
			// 避免处理前导和尾随
			// spaces 作为运算器
			var input = [],
				results = [],
				matcher = compile(selector.replace(rtrimCSS, "$1"));

			return matcher[jQuery.expando] ?
				markFunction(function (seed, matches, _context, xml) {
					var elem,
						unmatched = matcher(seed, null, xml, []),
						i = seed.length;

					// match 与 'matcher' 不匹配的元素
					while (i--) {
						if ((elem = unmatched[i])) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function (elem, _context, xml) {
					input[0] = elem;
					matcher(input, null, xml, results);

					// Don't keep the element
					// (see https://github.com/jquery/sizzle/issues/299)
					input[0] = null;
					return !results.pop();
				};
		}),

		has: markFunction(function (selector) {
			return function (elem) {
				return find(selector, elem).length > 0;
			};
		}),

		contains: markFunction(function (text) {
			text = unescapeSelector(text);
			return function (elem) {
				return (elem.textContent || jQuery.text(elem)).indexOf(text) > -1;
			};
		}),

		// “元素是否由 ：lang（） 选择器表示
		// 仅基于元素的 language 值
		// 等于标识符 C，
		// 或以标识符 C 开头，后跟 “-”。
		// C 与元素的 language 值的匹配不区分大小写。
		// 标识符 C 不必是有效的语言名称。
		// https://www.w3.org/TR/selectors/#lang-pseudo
		lang: markFunction(function (lang) {

			// lang value must be a valid identifier
			if (!ridentifier.test(lang || "")) {
				selectorError("unsupported lang: " + lang);
			}
			lang = unescapeSelector(lang).toLowerCase();
			return function (elem) {
				var elemLang;
				do {
					if ((elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang"))) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf(lang + "-") === 0;
					}
				} while ((elem = elem.parentNode) && elem.nodeType === 1);
				return false;
			};
		}),

		// 杂项
		target: function (elem) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice(1) === elem.id;
		},

		root: function (elem) {
			return elem === documentElement;
		},

		focus: function (elem) {
			return elem === document.activeElement &&
				document.hasFocus() &&
				!!(elem.type || elem.href || ~elem.tabIndex);
		},

		// 布尔属性
		enabled: createDisabledPseudo(false),
		disabled: createDisabledPseudo(true),

		checked: function (elem) {

			// In CSS3, :checked should return both checked and selected elements
			// https://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			return (nodeName(elem, "input") && !!elem.checked) ||
				(nodeName(elem, "option") && !!elem.selected);
		},

		selected: function (elem) {

			// 支持：IE <=11+
			// 访问 selectedIndex 属性
			// 强制浏览器将 default 选项视为
			// 在 OptGroup 中时被选中。
			if (isIE && elem.parentNode) {
				// eslint-disable-next-line no-unused-expressions
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// 内容
		empty: function (elem) {

			// https://www.w3.org/TR/selectors/#empty-pseudo
			// ：empty 被元素 （1） 或内容节点（文本：3;cdata：4;实体引用：5）否定，
			//   但其他人没有（评论：8;加工指令：7;等等）
			// nodeType < 6 有效，因为属性 （2） 不显示为子项
			for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
				if (elem.nodeType < 6) {
					return false;
				}
			}
			return true;
		},

		parent: function (elem) {
			return !jQuery.expr.pseudos.empty(elem);
		},

		// 元素/输入类型
		header: function (elem) {
			return rheader.test(elem.nodeName);
		},

		input: function (elem) {
			return rinputs.test(elem.nodeName);
		},

		button: function (elem) {
			return nodeName(elem, "input") && elem.type === "button" ||
				nodeName(elem, "button");
		},

		text: function (elem) {
			return nodeName(elem, "input") && elem.type === "text";
		},

		// 在集合中的位置
		first: createPositionalPseudo(function () {
			return [0];
		}),

		last: createPositionalPseudo(function (_matchIndexes, length) {
			return [length - 1];
		}),

		eq: createPositionalPseudo(function (_matchIndexes, length, argument) {
			return [argument < 0 ? argument + length : argument];
		}),

		even: createPositionalPseudo(function (matchIndexes, length) {
			var i = 0;
			for (; i < length; i += 2) {
				matchIndexes.push(i);
			}
			return matchIndexes;
		}),

		odd: createPositionalPseudo(function (matchIndexes, length) {
			var i = 1;
			for (; i < length; i += 2) {
				matchIndexes.push(i);
			}
			return matchIndexes;
		}),

		lt: createPositionalPseudo(function (matchIndexes, length, argument) {
			var i;

			if (argument < 0) {
				i = argument + length;
			} else if (argument > length) {
				i = length;
			} else {
				i = argument;
			}

			for (; --i >= 0;) {
				matchIndexes.push(i);
			}
			return matchIndexes;
		}),

		gt: createPositionalPseudo(function (matchIndexes, length, argument) {
			var i = argument < 0 ? argument + length : argument;
			for (; ++i < length;) {
				matchIndexes.push(i);
			}
			return matchIndexes;
		})
	}
};

jQuery.expr.pseudos.nth = jQuery.expr.pseudos.eq;

// 添加按钮/输入类型伪对象
for (i in { radio: true, checkbox: true, file: true, password: true, image: true }) {
	jQuery.expr.pseudos[i] = createInputPseudo(i);
}
for (i in { submit: true, reset: true }) {
	jQuery.expr.pseudos[i] = createButtonPseudo(i);
}

// 用于创建新 setFilter 的简单 API
function setFilters() { }
setFilters.prototype = jQuery.expr.filters = jQuery.expr.pseudos;
jQuery.expr.setFilters = new setFilters();

function addCombinator(matcher, combinator, base) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?

		// 检查最近的上级/前一个元素
		function (elem, context, xml) {
			while ((elem = elem[dir])) {
				if (elem.nodeType === 1 || checkNonElements) {
					return matcher(elem, context, xml);
				}
			}
			return false;
		} :

		// 检查所有上级/前面的元素
		function (elem, context, xml) {
			var oldCache, outerCache,
				newCache = [dirruns, doneName];

			// 我们不能在 XML 节点上设置任意数据，因此它们不会从 combinator 缓存中受益
			if (xml) {
				while ((elem = elem[dir])) {
					if (elem.nodeType === 1 || checkNonElements) {
						if (matcher(elem, context, xml)) {
							return true;
						}
					}
				}
			} else {
				while ((elem = elem[dir])) {
					if (elem.nodeType === 1 || checkNonElements) {
						outerCache = elem[jQuery.expando] || (elem[jQuery.expando] = {});

						if (skip && nodeName(elem, skip)) {
							elem = elem[dir] || elem;
						} else if ((oldCache = outerCache[key]) &&
							oldCache[0] === dirruns && oldCache[1] === doneName) {

							// 分配给 newCache，以便结果反向传播到以前的元素
							return (newCache[2] = oldCache[2]);
						} else {

							// 重用 newcache，以便结果反向传播到以前的元素
							outerCache[key] = newCache;

							// 匹配意味着我们结束了;失败意味着我们必须继续检查
							if ((newCache[2] = matcher(elem, context, xml))) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher(matchers) {
	return matchers.length > 1 ?
		function (elem, context, xml) {
			var i = matchers.length;
			while (i--) {
				if (!matchers[i](elem, context, xml)) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts(selector, contexts, results) {
	var i = 0,
		len = contexts.length;
	for (; i < len; i++) {
		find(selector, contexts[i], results);
	}
	return results;
}

function condense(unmatched, map, filter, context, xml) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for (; i < len; i++) {
		if ((elem = unmatched[i])) {
			if (!filter || filter(elem, context, xml)) {
				newUnmatched.push(elem);
				if (mapped) {
					map.push(i);
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
	if (postFilter && !postFilter[jQuery.expando]) {
		postFilter = setMatcher(postFilter);
	}
	if (postFinder && !postFinder[jQuery.expando]) {
		postFinder = setMatcher(postFinder, postSelector);
	}
	return markFunction(function (seed, results, context, xml) {
		var temp, i, elem, matcherOut,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// 从种子或上下文中获取初始元素
			elems = seed ||
				multipleContexts(selector || "*",
					context.nodeType ? [context] : context, []),

			// 用于获取匹配器输入的预过滤器，保留用于种子结果同步的映射
			matcherIn = preFilter && (seed || !selector) ?
				condense(elems, preMap, preFilter, context, xml) :
				elems;

		if (matcher) {

			// 如果我们有一个 postFinder，或者过滤的种子，或者非种子 postFilter
			// 或预先存在的结果，
			matcherOut = postFinder || (seed ? preFilter : preexisting || postFilter) ?

				// ...需要中间处理
				[] :

				// ...否则直接使用 results
				results;

			// 查找主要匹配项
			matcher(matcherIn, matcherOut, context, xml);
		} else {
			matcherOut = matcherIn;
		}

		// 应用 postFilter
		if (postFilter) {
			temp = condense(matcherOut, postMap);
			postFilter(temp, [], context, xml);

			// 通过将失败的元素移回 matcherIn 来取消匹配失败的元素
			i = temp.length;
			while (i--) {
				if ((elem = temp[i])) {
					matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
				}
			}
		}

		if (seed) {
			if (postFinder || preFilter) {
				if (postFinder) {

					// 通过将这个中间体压缩到 postFinder 上下文中来获取最终的 matcherOut
					temp = [];
					i = matcherOut.length;
					while (i--) {
						if ((elem = matcherOut[i])) {

							// 恢复 matcherIn，因为 elem 还不是最终匹配项
							temp.push((matcherIn[i] = elem));
						}
					}
					postFinder(null, (matcherOut = []), temp, xml);
				}

				// 将匹配的元素从种子移动到结果，以保持同步
				i = matcherOut.length;
				while (i--) {
					if ((elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call(seed, elem) : preMap[i]) > -1) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

			// 通过 postFinder 将元素添加到结果中（如果已定义）
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice(preexisting, matcherOut.length) :
					matcherOut
			);
			if (postFinder) {
				postFinder(null, results, matcherOut, xml);
			} else {
				push.apply(results, matcherOut);
			}
		}
	});
}

function matcherFromTokens(tokens) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = jQuery.expr.relative[tokens[0].type],
		implicitRelative = leadingRelative || jQuery.expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// 基础匹配器确保可以从顶级上下文访问元素
		matchContext = addCombinator(function (elem) {
			return elem === checkContext;
		}, implicitRelative, true),
		matchAnyContext = addCombinator(function (elem) {
			return indexOf.call(checkContext, elem) > -1;
		}, implicitRelative, true),
		matchers = [function (elem, context, xml) {

			// 支持：IE 11+
			// IE 在进行严格比较时有时会引发 “Permission denied” 错误
			// 两份文件;肤浅的比较是有效的。
			// eslint-disable-next-line eqeq
			var ret = (!leadingRelative && (xml || context != outermostContext)) || (
				(checkContext = context).nodeType ?
					matchContext(elem, context, xml) :
					matchAnyContext(elem, context, xml));

			// 避免挂在元件上
			// （见 https://github.com/jquery/sizzle/issues/299）
			checkContext = null;
			return ret;
		}];

	for (; i < len; i++) {
		if ((matcher = jQuery.expr.relative[tokens[i].type])) {
			matchers = [addCombinator(elementMatcher(matchers), matcher)];
		} else {
			matcher = jQuery.expr.filter[tokens[i].type].apply(null, tokens[i].matches);

			// 在看到位置匹配器时返回 special
			if (matcher[jQuery.expando]) {

				// 找到下一个相对运算符（如果有）以进行正确处理
				j = ++i;
				for (; j < len; j++) {
					if (jQuery.expr.relative[tokens[j].type]) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher(matchers),
					i > 1 && toSelector(

						// 如果前面的标记是后代组合器，则插入隐式任意元素 '*'
						tokens.slice(0, i - 1)
							.concat({ value: tokens[i - 2].type === " " ? "*" : "" })
					).replace(rtrimCSS, "$1"),
					matcher,
					i < j && matcherFromTokens(tokens.slice(i, j)),
					j < len && matcherFromTokens((tokens = tokens.slice(j))),
					j < len && toSelector(tokens)
				);
			}
			matchers.push(matcher);
		}
	}

	return elementMatcher(matchers);
}

function matcherFromGroupMatchers(elementMatchers, setMatchers) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function (seed, context, xml, results, outermost) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,

				// 我们必须始终具有种子元素或最外层上下文
				elems = seed || byElement && jQuery.expr.find.TAG("*", outermost),

				// 如果这是最外层的匹配器，则使用 integer dirruns
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if (outermost) {

				// 支持：IE 11+
				// IE 在进行严格比较时有时会引发 “Permission denied” 错误
				// 两份文件;肤浅的比较是有效的。
				// eslint-disable-next-line eqeq
				outermostContext = context == document || context || outermost;
			}

			// 添加将 elementMatchers 直接传递给结果的元素
			for (; (elem = elems[i]) != null; i++) {
				if (byElement && elem) {
					j = 0;

					// 支持：IE 11+
					// IE 在进行严格比较时有时会引发 “Permission denied” 错误
					// 两份文件;肤浅的比较是有效的。
					// eslint-disable-next-line eqeq
					if (!context && elem.ownerDocument != document) {
						setDocument(elem);
						xml = !documentIsHTML;
					}
					while ((matcher = elementMatchers[j++])) {
						if (matcher(elem, context || document, xml)) {
							push.call(results, elem);
							break;
						}
					}
					if (outermost) {
						dirruns = dirrunsUnique;
					}
				}

				// 跟踪设置过滤器的不匹配元素
				if (bySet) {

					// 他们将通过所有可能的匹配器
					if ((elem = !matcher && elem)) {
						matchedCount--;
					}

					// 延长每个元素的数组，无论匹配与否
					if (seed) {
						unmatched.push(elem);
					}
				}
			}

			// 'i' 现在是上面访问的元素计数，并将其添加到 'matchedCount'
			// 使后者为非负数。
			matchedCount += i;

			// 将集过滤器应用于不匹配的元素
			// 注意：如果没有不匹配的元素（即 'matchedCount'
			// 等于 'i'），除非我们没有访问上述循环中的 _any_ 元素，因为我们有
			// 没有元素匹配器，也没有种子。
			// 递增初始字符串 “0” 'i' 允许 'i' 仅保留字符串，因为
			// case 的 v，这将导致 “00” 'matchedCount' 不同于 'i' ，但也
			// 数值为零。
			if (bySet && i !== matchedCount) {
				j = 0;
				while ((matcher = setMatchers[j++])) {
					matcher(unmatched, setMatched, context, xml);
				}

				if (seed) {

					// 重新集成元素匹配项，无需排序
					if (matchedCount > 0) {
						while (i--) {
							if (!(unmatched[i] || setMatched[i])) {
								setMatched[i] = pop.call(results);
							}
						}
					}

					// 丢弃索引占位符值以仅获取实际匹配项
					setMatched = condense(setMatched);
				}

				// 向结果添加匹配项
				push.apply(results, setMatched);

				// 多个成功匹配器之后的无种子集匹配规定了排序
				if (outermost && !seed && setMatched.length > 0 &&
					(matchedCount + setMatchers.length) > 1) {

					jQuery.uniqueSort(results);
				}
			}

			// 覆盖嵌套匹配器对全局变量的操作
			if (outermost) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction(superMatcher) :
		superMatcher;
}

function compile(selector, match /* Internal Use Only */) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[selector + " "];

	if (!cached) {

		// 生成一个递归函数函数，可用于检查每个元素
		if (!match) {
			match = tokenize(selector);
		}
		i = match.length;
		while (i--) {
			cached = matcherFromTokens(match[i]);
			if (cached[jQuery.expando]) {
				setMatchers.push(cached);
			} else {
				elementMatchers.push(cached);
			}
		}

		// 缓存编译后的函数
		cached = compilerCache(selector,
			matcherFromGroupMatchers(elementMatchers, setMatchers));

		// 保存选择器和标记化
		cached.selector = selector;
	}
	return cached;
}

/**
 * 一个低级选择函数，与 jQuery 的编译
 *  选择器函数
 * @param {string|函数} selector 选择器或预编译的
 *  使用 jQuery selector compile 构建的 selector 函数
 * @param {element} 上下文
 * @param {Array} [结果]
 * @param {Array} [seed] 要匹配的一组元素
 */
function select(selector, context, results, seed) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize((selector = compiled.selector || selector));

	results = results || [];

	// 如果列表中只有一个 selector 且没有种子，请尝试最小化操作
	// （后者为我们提供了背景信息）
	if (match.length === 1) {

		// 如果前导化合物选择器是 ID，则减少上下文
		tokens = match[0] = match[0].slice(0);
		if (tokens.length > 2 && (token = tokens[0]).type === "ID" &&
			context.nodeType === 9 && documentIsHTML &&
			jQuery.expr.relative[tokens[1].type]) {

			context = (jQuery.expr.find.ID(
				unescapeSelector(token.matches[0]),
				context
			) || [])[0];
			if (!context) {
				return results;

				// 预编译的匹配器仍将验证 ancestry，因此请更上一层楼
			} else if (compiled) {
				context = context.parentNode;
			}

			selector = selector.slice(tokens.shift().value.length);
		}

		// 获取种子集以进行从右到左的匹配
		i = matchExpr.needsContext.test(selector) ? 0 : tokens.length;
		while (i--) {
			token = tokens[i];

			// 如果我们命中运算器，则中止
			if (jQuery.expr.relative[(type = token.type)]) {
				break;
			}
			if ((find = jQuery.expr.find[type])) {

				// 搜索，扩展主要同级运算器的上下文
				if ((seed = find(
					unescapeSelector(token.matches[0]),
					rsibling.test(tokens[0].type) &&
					testContext(context.parentNode) || context
				))) {

					// 如果 seed 为空或没有剩余的 token，我们可以提前返回
					tokens.splice(i, 1);
					selector = seed.length && toSelector(tokens);
					if (!selector) {
						push.apply(results, seed);
						return results;
					}

					break;
				}
			}
		}
	}

	// 编译并执行过滤函数（如果未提供）
	// 如果我们修改了上面的选择器，请提供 'match' 以避免重新分词
	(compiled || compile(selector, match))(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test(selector) && testContext(context.parentNode) || context
	);
	return results;
}

// Initialize against the default document
setDocument();

jQuery.find = find;

// 这些一直是私有的，但它们曾经被记录为
// Sizzle，所以为了向后兼容，我们现在维护它们。
find.compile = compile;
find.select = select;
find.setDocument = setDocument;
find.tokenize = tokenize;

export { jQuery, jQuery as $ };
