// Builders for the `main.circom` Withdraw circuit input JSON.

import { siblingPath } from "./merkle.ts";

export interface WithdrawInput {
  withdrawnValue: string;
  stateRoot: string;
  associationRoot: string;
  label: string;
  value: string;
  nullifier: string;
  secret: string;
  stateSiblings: string[];
  stateIndex: string;
  labelIndex: string;
  labelSiblings: string[];
}

export interface CoinFields {
  value: bigint;
  label: bigint;
  nullifier: bigint;
  secret: bigint;
}

export function dec(v: bigint): string {
  return v.toString(10);
}

export function decList(vs: bigint[]): string[] {
  return vs.map(dec);
}

export function emptySiblings(depth: number): string[] {
  return Array.from({ length: depth }, () => "0");
}

export function buildWithdrawInput(
  coin: CoinFields,
  opts: {
    withdrawnValue: bigint;
    stateRoot: bigint;
    associationRoot: bigint;
    stateSiblings: bigint[];
    stateIndex: number;
    labelIndex: number;
    labelSiblings: bigint[];
  },
): WithdrawInput {
  return {
    withdrawnValue: dec(opts.withdrawnValue),
    stateRoot: dec(opts.stateRoot),
    associationRoot: dec(opts.associationRoot),
    label: dec(coin.label),
    value: dec(coin.value),
    nullifier: dec(coin.nullifier),
    secret: dec(coin.secret),
    stateSiblings: decList(opts.stateSiblings),
    stateIndex: dec(BigInt(opts.stateIndex)),
    labelIndex: dec(BigInt(opts.labelIndex)),
    labelSiblings: decList(opts.labelSiblings),
  };
}

export function validateInput(input: WithdrawInput, treeDepth: number, assocDepth: number): string[] {
  const errs: string[] = [];
  if (input.stateSiblings.length !== treeDepth)
    errs.push(`stateSiblings must have ${treeDepth} entries`);
  if (input.labelSiblings.length !== assocDepth)
    errs.push(`labelSiblings must have ${assocDepth} entries`);
  if (BigInt(input.withdrawnValue) > BigInt(input.value))
    errs.push("withdrawnValue exceeds value");
  return errs;
}

export function toJson(input: WithdrawInput): string {
  return JSON.stringify(input, null, 2);
}

export function siblingsForLeaf(leafIndex: number, depth: number): number[] {
  return siblingPath(leafIndex, depth);
}
