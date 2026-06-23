// Merkle index/path helpers for building circuit inputs (state + association trees).

export function parent(index: number): number {
  return index >> 1;
}
export function leftChild(index: number): number {
  return index * 2;
}
export function rightChild(index: number): number {
  return index * 2 + 1;
}
export function sibling(index: number): number {
  return index % 2 === 0 ? index + 1 : index - 1;
}
export function isLeft(index: number): boolean {
  return index % 2 === 0;
}
export function isRight(index: number): boolean {
  return index % 2 === 1;
}
export function leafCount(depth: number): number {
  return 2 ** depth;
}
export function requiredDepth(count: number): number {
  let d = 0;
  while (2 ** d < count) d++;
  return d;
}
export function pathIndices(leafIndex: number, depth: number): number[] {
  const out: number[] = [];
  let idx = leafIndex;
  for (let i = 0; i < depth; i++) {
    out.push(idx % 2);
    idx = parent(idx);
  }
  return out;
}
export function siblingPath(leafIndex: number, depth: number): number[] {
  const out: number[] = [];
  let idx = leafIndex;
  for (let i = 0; i < depth; i++) {
    out.push(sibling(idx));
    idx = parent(idx);
  }
  return out;
}
export function zeros(depth: number, zeroValue = 0n): bigint[] {
  return Array.from({ length: depth }, () => zeroValue);
}
export function padLeaves(leaves: bigint[], depth: number, zeroValue = 0n): bigint[] {
  const cap = leafCount(depth);
  const out = leaves.slice(0, cap);
  while (out.length < cap) out.push(zeroValue);
  return out;
}
export function leafIndexOf(leaves: bigint[], leaf: bigint): number {
  return leaves.findIndex((l) => l === leaf);
}
export function isValidIndex(index: number, count: number): boolean {
  return index >= 0 && index < count;
}
export function sharesAncestor(a: number, b: number, level: number): boolean {
  return a >> level === b >> level;
}
