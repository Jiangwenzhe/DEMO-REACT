import { Action } from 'shared/ReactTypes';

export interface Dispatcher {
	useState: <T>(initialState: (() => T) | T) => [T, Dispatch<T>];
	// useEffect: any;
}

export type Dispatch<State> = (action: Action<State>) => void;

// 当前使用的 hooks 集合
const currentDispatcher: { current: Dispatcher | null } = {
	current: null
};

export const resolveDispatcher = (): Dispatcher => {
	const dispatcher = currentDispatcher.current;
	if (dispatcher === null) {
		throw new Error('hook 只能在函数组件中执行');
	}
	return dispatcher;
};

export default currentDispatcher;
