import { ReactElementType } from 'shared/ReactTypes';
import { mountChildFibers, reconcileChildFibers } from './childFibers';
import { FiberNode } from './fiber';
import { UpdateQueue, processUpdateQueue } from './updateQueue';
import { HostComponet, HostRoot, HostText } from './workTags';

// 递归中的递节点
export const beginWork = (wip: FiberNode) => {
	// 比较，返回子 fiberNode
	switch (wip.tag) {
		// 根节点 HostRoot
		case HostRoot:
			return updateHostRoot(wip);
		// 常规 DOM 元素，<div>
		case HostComponet:
			return updateHostComponent(wip);
		// 文本节点 <div>123</div> 中的 123, 所以没有 children
		case HostText:
			return null;
		default:
			if (__DEV__) {
				console.warn('beginwork 未实现的类型');
			}
			break;
	}
	return null;
};

function updateHostRoot(wip: FiberNode) {
	const baseState = wip.memoizedState;
	const updateQueue = wip.updateQueue as UpdateQueue<Element>;
	const pending = updateQueue.shared.pending;
	updateQueue.shared.pending = null;
	const { memorizedState } = processUpdateQueue(baseState, pending);
	wip.memoizedState = memorizedState;
	const nextChildren = wip.memoizedState;
	reconcileChildren(wip, nextChildren);
	return wip.child;
}

function updateHostComponent(wip: FiberNode) {
	const nextProps = wip.pendingProps;
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
