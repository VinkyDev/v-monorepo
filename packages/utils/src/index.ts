export const assertNever = (value: never): never => {
  throw new Error(`unexpected value: ${String(value)}`);
};
