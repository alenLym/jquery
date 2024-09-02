// 一种快速换入/换出 CSS 属性以获得正确计算的方法。
export function swap( elem, options, callback ) {
	var ret, name,
		old = {};

	// 记住旧值，并插入新值
	for ( name in options ) {
		old[ name ] = elem.style[ name ];
		elem.style[ name ] = options[ name ];
	}

	ret = callback.call( elem );

	// 恢复旧值
	for ( name in options ) {
		elem.style[ name ] = old[ name ];
	}

	return ret;
}
