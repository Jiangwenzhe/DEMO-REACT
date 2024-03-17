import { Dispatch, Dispatcher } from 'react/src/currentDispatcher';
import { Action } from 'shared/ReactTypes';
import internals from 'shared/internals';
import { FiberNode } from './fiber';
import {
	UpdateQueue,
	createUpdate,
	createUpdateQueue,
	enqueueUpdate,
	processUpdateQueue
} from './updateQueue';
import { scheduleUpdateOnFiber } from './workLoop';

let currentlyRenderingFiber: FiberNode | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

// 当前使用的数据共享层
const { currentDispatcher } = internals;

// 每一个 hooks 内部的 memoizedState
interface Hook {
	memoizedState: any;
	updateQueue: unknown;
	next: Hook | null;
}

export function renderWithHooks(wip: FiberNode) {
	// 赋值
	currentlyRenderingFiber = wip;
	// 重置
	wip.memoizedState = null;

	const current = wip.alternate;
	if (current !== null) {
		// update
		currentDispatcher.current = HooksDispatcherOnUpdate;
	} else {
		// mount
		currentDispatcher.current = HooksDispatcherOnMount;
	}

	// type 就是函数组件的本身，类似 jsx 方法的第一个参数
	const Component = wip.type;
	const props = wip.pendingProps;
	// FC 的 render 函数
	const children = Component(props);

	// 重置
	currentlyRenderingFiber = null;
	workInProgressHook = null;
	currentHook = null;
	return children;
}

const HooksDispatcherOnMount: Dispatcher = {
	useState: mountState
};

const HooksDispatcherOnUpdate: Dispatcher = {
	useState: updateState
};

function updateState<State>(): [State, Dispatch<State>] {
	// 找到当前 useState 对应的 hook 数据
	const hook = updateWorkInProgressHook();
	// 计算新的 state 的逻辑
	const queue = hook.updateQueue as UpdateQueue<State>;
	const pending = queue.shared.pending;
	if (pending !== null) {
		const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
		hook.memoizedState = memoizedState;
	}
	return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

function updateWorkInProgressHook(): Hook {
	// TODO: render 阶段触发的更新
	// 数据从 current Hook 中来，其实是 current 树来
	let nextCurrentHook: Hook | null;

	if (currentHook === null) {
		// 这是这个 fc update 时的第一个 hook
		const current = currentlyRenderingFiber?.alternate;
		if (current !== null) {
			nextCurrentHook = current?.memoizedState;
		} else {
			// mount 阶段，错误情况
			nextCurrentHook = null;
		}
	} else {
		// FC updaet 时，后续的 hook
		nextCurrentHook = currentHook.next;
	}

	if (nextCurrentHook === null) {
		// mount / update  u1 u2 u3
		//                 u1 u2 u3 u4
		throw new Error(
			`组件 ${currentlyRenderingFiber?.type} 本次执行时的 Hook 比上一次执行多`
		);
	}

	currentHook = nextCurrentHook;
	const newHook: Hook = {
		memoizedState: currentHook?.memoizedState,
		updateQueue: currentHook?.updateQueue,
		next: null
	};
	if (workInProgressHook === null) {
		// mount 时的第一个 hook
		if (currentlyRenderingFiber === null) {
			// 对应比如 window.useState 方法
			throw new Error('请在函数组件内调用 hooks');
		} else {
			// mount 时的第一个 hook
			workInProgressHook = newHook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount 时，后续的 hook
		workInProgressHook.next = newHook;
		workInProgressHook = newHook;
	}
	return workInProgressHook;
}

function mountState<State>(
	initialState: (() => State) | State
): [State, Dispatch<State>] {
	// 找到当前 useState 对应的 hook 数据
	const hook = mountWorkInProgressHook();
	let memoizedState;
	if (initialState instanceof Function) {
		memoizedState = initialState();
	} else {
		memoizedState = initialState;
	}
	const queue = createUpdateQueue<State>();
	hook.updateQueue = queue;
	hook.memoizedState = memoizedState;

	// @ts-ignore
	const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
	queue.dispatch = dispatch;
	return [memoizedState, dispatch];
}

function dispatchSetState<State>(
	fiber: FiberNode,
	updateQueue: UpdateQueue<State>,
	action: Action<State>
) {
	const update = createUpdate(action);
	enqueueUpdate(updateQueue, update);
	scheduleUpdateOnFiber(fiber);
}

function mountWorkInProgressHook(): Hook {
	// 新建的数据
	const hook: Hook = {
		memoizedState: null,
		updateQueue: null,
		next: null
	};
	if (workInProgressHook === null) {
		// mount 时的第一个 hook
		if (currentlyRenderingFiber === null) {
			// 对应比如 window.useState 方法
			throw new Error('请在函数组件内调用 hooks');
		} else {
			// mount 时的第一个 hook
			workInProgressHook = hook;
			currentlyRenderingFiber.memoizedState = workInProgressHook;
		}
	} else {
		// mount 时，后续的 hook
		workInProgressHook.next = hook;
		workInProgressHook = hook;
	}
	return workInProgressHook;
}
