import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { renderWithHooks } from './fiberHooks';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	HostComponent,
	HostRoot,
	HostText
} from './workTags';

// 递归中的递节点
export const beginWork = (wip: FiberNode) => {
	// 比较，返回子 fiberNode
	switch (wip.tag) {
		// 根节点 HostRoot
		case HostRoot:
			return updateHostRoot(wip);
		// 常规 DOM 元素，<div>
		case HostComponent:
			return updateHostComponent(wip);
		// 文本节点 <div>123</div> 中的 123, 所以没有 children
		case HostText:
			return null;
		case FunctionComponent:
			return updateFunctionComponent(wip);
		default:
			if (__DEV__) {
				console.warn('beginwork 未实现的类型');
			}
			break;
	}
	return null;
};

function updateFunctionComponent(wip: FiberNode) {
	// 这里的 child 就是函数组件的返回值
	const nextChildren = renderWithHooks(wip);
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memoizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memoizedState;
	// 这里的 nextChildren 就是 reactdom.createRoot.render(<App />) 里传入的
	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
	// 这里传入的就是 <div><span></div> 的 span, 但是在 jsx 返回后的 reactElement 里就是 children 的形式
	const nextChildren = nextProps.children;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function reconcileChildren(wip: FiberNode, children?: ReactElementType) {
	const current = wip.alternate;
	if (current !== null) {
		// update 流程
		wip.child = reconcileChildFibers(wip, current?.child, children);
	} else {
		// mount 流程
		wip.child = mountChildFibers(wip, null, children);
	}
}
