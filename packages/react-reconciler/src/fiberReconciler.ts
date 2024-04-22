import { Container } from 'hostConfig';
import { ReactElementType } from 'shared/ReactTypes';
import { FiberNode, FiberRootNode } from './fiber';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';
import { HostRoot } from './workTags';

// 创建了 FiberRootNode 和 HostRootFiber
export function createContainer(container: Container) {
	const hostRootFiber = new FiberNode(HostRoot, {}, null);
	const root = new FiberRootNode(container, hostRootFiber);
	hostRootFiber.updateQueue = createUpdateQueue();
	return root;
}

export function updateContainer(
	element: ReactElementType | null,
	root: FiberRootNode
) {
	const hostRootFiber = root.current;
	// 这里的 update 是一个 element 元素, 就是指根元素转化的 ReactElementType
	// 类似 render(<App />)
	const update = createUpdate<ReactElementType | null>(element);
	enqueueUpdate(
		hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
		update
	);
	// 在 hostRootFiber 上进行调度更新
	scheduleUpdateOnFiber(hostRootFiber);
	return element;
}
