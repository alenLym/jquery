import { rnothtmlwhite } from "../var/rnothtmlwhite.js";

// 根据 HTML 规范去除和折叠空格
// https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace
export function stripAndCollapse( value ) {
	var tokens = value.match( rnothtmlwhite ) || [];
	return tokens.join( " " );
}
