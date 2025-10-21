/**
 * External Dependencies.
 */
import type { FunctionKeys } from 'utility-types';

/**
 * Shared type utilities for Redux stores
 * These types help with proper TypeScript inference when using @wordpress/data
 */

/**
 * Maps a "raw" actionCreators object to the actions available when registered on the @wordpress/data store.
 *
 * @template A Action creators map, usually from `import * as actions from './my-store/actions';`
 */
export type DispatchFromMap<A extends Record<string, (...args: any[]) => any>> = {
  [actionCreator in keyof A]: (
    ...args: Parameters<A[actionCreator]>
  ) => A[actionCreator] extends (...args: any[]) => Generator
    ? Promise<GeneratorReturnType<A[actionCreator]>>
    : void;
};

/**
 * Maps a "raw" selector object to the selectors available when registered on the @wordpress/data store.
 *
 * @template S Selector map, usually from `import * as selectors from './my-store/selectors';`
 */
export type SelectFromMap<S extends Record<string, unknown>> = {
  [selector in FunctionKeys<S>]: S[selector] extends (...args: any[]) => any
  ? (...args: TailParameters<S[selector]>) => ReturnType<S[selector]>
  : never;
};

/**
 * Parameters type of a function, excluding the first parameter.
 *
 * This is useful for typing some @wordpress/data functions that make a leading
 * `state` argument implicit.
 */
export type TailParameters<F extends Function> = F extends (
  head: any,
  ...tail: infer T
) => any
  ? T
  : never;

/**
 * Obtain the type finally returned by the generator when it's done iterating.
 */
export type GeneratorReturnType<T extends (...args: any[]) => Generator> =
  T extends (...args: any) => Generator<any, infer R, any> ? R : never;

