export type FLags = number;

export const NoFlags = 0b0000000; // 没有副作用
export const Placement = 0b0000001; // 插入
export const Update = 0b0000010; // 更新
export const childDeletion = 0b0000100; // 删除

export const MutationMask = Placement | Update | childDeletion;
