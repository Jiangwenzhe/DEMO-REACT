import { Props, ReactElementType } from 'shared/ReactTypes';
import { REACT_ELEMENT_TYPE } from '../../shared/ReactSymbols';
import {
	FiberNode,
	createFiberFromElement,
	createWorkInProgress
} from './fiber';
import { Placement, childDeletion } from './fiberFlags';
import { HostText } from './workTags';

function ChildReconciler(shouldTrackEffects: boolean) {
	function deleteChild(returnFiber: FiberNode, childToDelete: FiberNode) {
		if (!shouldTrackEffects) {
			return;
		}
		const deletions = returnFiber.deletions;
		if (deletions === null) {
			returnFiber.deletions = [childToDelete];
			returnFiber.flags |= childDeletion;
		} else {
			deletions.push(childToDelete);
		}
	}

	function reconcileSingleElement(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		element: ReactElementType
	) {
		const key = element.key;
		work: if (currentFiber != null) {
			// update 情况
			if (currentFiber.key === key) {
				// key 相同
				if (element.$$typeof === REACT_ELEMENT_TYPE) {
					if (currentFiber.type === element.type) {
						// type 相同
						const existing = useFiber(currentFiber, element.props);
						existing.return = returnFiber;
						return existing;
					} else {
						// key 相同, type 不同，也要删除
						deleteChild(returnFiber, currentFiber);
						break work;
					}
				} else {
					if (__DEV__) {
						console.warn('还未实现的 react 类型', element);
						break work;
					}
				}
			} else {
				// 删掉旧的
				deleteChild(returnFiber, currentFiber);
			}
		}
		// 根据 element 创建 fiber
		const fiber = createFiberFromElement(element);
		// 父节点指向 returnFiber
		fiber.return = returnFiber;
		return fiber;
	}

	function reconcileSingleTextNode(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		content: string | number
	) {
		if (currentFiber !== null) {
			// update
			if (currentFiber.tag === HostText) {
				// 类型没变，可以复用
				const existing = useFiber(currentFiber, { content });
				existing.return = returnFiber;
				return existing;
			}
			deleteChild(returnFiber, currentFiber);
		}
		const fiber = new FiberNode(HostText, { content }, null);
		fiber.return = returnFiber;
		return fiber;
	}

	function placeSingleChild(fiber: FiberNode) {
		// 当前应该追踪副作用 && 传入的是 wip
		// wip.alternate 就是 current, current 是 null, 表示首屏渲染
		if (shouldTrackEffects && fiber.alternate === null) {
			fiber.flags |= Placement;
		}
		return fiber;
	}

	return function reconcileChildFibers(
		returnFiber: FiberNode,
		currentFiber: FiberNode | null,
		newChild?: ReactElementType
	) {
		// 判断当前 fiber 的类型
		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE:
					return placeSingleChild(
						reconcileSingleElement(returnFiber, currentFiber, newChild)
					);
				default:
					if (__DEV__) {
						console.warn('未实现的 reconcile 类型', newChild);
					}
					break;
			}
		}
		// TODO: 多节点的情况

		// HostText
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(returnFiber, currentFiber, newChild)
			);
		}

		if (currentFiber !== null) {
			// 兜底 的情况，就删除
			deleteChild(returnFiber, currentFiber);
		}

		if (__DEV__) {
			console.warn('未实现的 reconcile 类型', newChild);
		}
		return null;
	};
}

// 复用 fiber, 对于 同一个 fiber 节点，会在 current 和 wip 中重复复用
function useFiber(fiber: FiberNode, pendingProps: Props): FiberNode {
	const clone = createWorkInProgress(fiber, pendingProps);
	clone.index = 0;
	clone.sibling = null;
	return clone;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
