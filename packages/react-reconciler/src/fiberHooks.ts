import { FiberNode } from './fiber';

export function renderWithHooks(wip: FiberNode) {
	// type 就是函数组件的本身，类似 jsx 方法的第一个参数
	const Component = wip.type;
	const props = wip.pendingProps;
	const children = Component(props);
	return children;
}
