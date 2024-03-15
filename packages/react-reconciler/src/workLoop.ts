import { beginWork } from './beginWork';
import { commitMutationEffects } from './commitWork';
import { completeWork } from './completeWork';
import { FiberNode, FiberRootNode, createWorkInProgress } from './fiber';
import { MutationMask, NoFlags } from './fiberFlags';
import { HostRoot } from './workTags';

let workInProgress: FiberNode | null = null;

function prepareFreshStack(root: FiberRootNode) {
	// 根据 current 树，创建 wip 树
	workInProgress = createWorkInProgress(root.current, {});
}

export function scheduleUpdateOnFiber(fiber: FiberNode) {
	// 调度功能, 从 fiberRootNode 开始
	const root = markUpdateFromFiberToRoot(fiber);
	renderRoot(root);
}

// 从任何一个 fiber 节点中找到 FiberRootNode
function markUpdateFromFiberToRoot(fiber: FiberNode) {
	let node = fiber;
	let parent = node.return;
	while (parent !== null) {
		node = parent;
		parent = node.return;
	}
	if (node.tag === HostRoot) {
		return node.stateNode;
	}
	return null;
}

function renderRoot(root: FiberRootNode) {
	// 创建 workInProgress 树, wip 指向第一个 fiberNode
	prepareFreshStack(root);

	do {
		try {
			// 进入 workLoop 循环
			workLoop();
			break;
		} catch (e) {
			if (__DEV__) {
				console.warn('workLoop 发生错误', e);
			}
			workInProgress = null;
		}
	} while (true);

	const finishedWork = root.current.alternate;
	root.finishedWork = finishedWork;

	// wip fiberNode 树 树中的 flags
	commitRoot(root);
}

function commitRoot(root: FiberRootNode) {
	const finishedWork = root.finishedWork;

	if (finishedWork === null) {
		return;
	}

	if (__DEV__) {
		console.warn('commit 阶段开始', finishedWork);
	}

	// 重置
	root.finishedWork = null;

	// 判断是否存在 3 个子阶段需要操作
	// root flags root subtreeFlags
	const subtreeHasEffect =
		(finishedWork.subtreeFlags & MutationMask) !== NoFlags;
	const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;

	if (subtreeHasEffect || rootHasEffect) {
		// before Mutation
		// mutation Placement
		commitMutationEffects(finishedWork);
		// finishedWork 就是本次生成的 wip 树，进行双缓存树的切换
		root.current = finishedWork;
		// layout
	} else {
		root.current = finishedWork;
	}
}

function workLoop() {
	while (workInProgress !== null) {
		// 按照深度优先的方式去遍历 wip 树
		performUnitOfWork(workInProgress);
	}
}

function performUnitOfWork(fiber: FiberNode) {
	// 递归的递的过程，next 是子 fiber 或者是 null
	const next = beginWork(fiber);
	// 工作完成，将当前的 memoizedProps 设置成 pendingProps
	fiber.memoizedProps = fiber.pendingProps;
	if (next === null) {
		// 如果这个 fiber 没有 next 节点了，就会执行归的过程
		completeUnitOfWork(fiber);
	} else {
		// wip 树指向 next
		workInProgress = next;
	}
}

function completeUnitOfWork(fiber: FiberNode) {
	let node: FiberNode | null = fiber;
	do {
		completeWork(node);
		const sibling = node.sibling;
		if (sibling !== null) {
			// 如果有兄弟节点， wip 指向兄弟节点
			workInProgress = sibling;
			return;
		}
		// node 指向 node 的父节点
		node = node.return;
		workInProgress = node;
	} while (node !== null);
}
