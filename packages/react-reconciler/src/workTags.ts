export type WorkTag =
	| typeof FunctionComponent
	| typeof HostRoot
	| typeof HostComponet
	| typeof HostText;

export const FunctionComponent = 0;
// react 挂载节点
export const HostRoot = 3;
// <div>
export const HostComponet = 5;
// <div>123</div>
export const HostText = 6;
