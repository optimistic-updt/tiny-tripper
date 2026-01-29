/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as embeddings from "../embeddings.js";
import type * as env from "../env.js";
import type * as formatting from "../formatting.js";
import type * as geocoding from "../geocoding.js";
import type * as imageProcessing from "../imageProcessing.js";
import type * as importing from "../importing.js";
import type * as quiz from "../quiz.js";
import type * as scrapeWorkflow from "../scrapeWorkflow.js";
import type * as scraping from "../scraping.js";
import type * as storageHelpers from "../storageHelpers.js";
import type * as tags from "../tags.js";
import type * as userActivityPreferences from "../userActivityPreferences.js";
import type * as workflowMetadata from "../workflowMetadata.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  embeddings: typeof embeddings;
  env: typeof env;
  formatting: typeof formatting;
  geocoding: typeof geocoding;
  imageProcessing: typeof imageProcessing;
  importing: typeof importing;
  quiz: typeof quiz;
  scrapeWorkflow: typeof scrapeWorkflow;
  scraping: typeof scraping;
  storageHelpers: typeof storageHelpers;
  tags: typeof tags;
  userActivityPreferences: typeof userActivityPreferences;
  workflowMetadata: typeof workflowMetadata;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  geospatial: {
    document: {
      get: FunctionReference<
        "query",
        "internal",
        { key: string },
        {
          coordinates: { latitude: number; longitude: number };
          filterKeys: Record<
            string,
            | string
            | number
            | boolean
            | null
            | bigint
            | Array<string | number | boolean | null | bigint>
          >;
          key: string;
          sortKey: number;
        } | null
      >;
      insert: FunctionReference<
        "mutation",
        "internal",
        {
          document: {
            coordinates: { latitude: number; longitude: number };
            filterKeys: Record<
              string,
              | string
              | number
              | boolean
              | null
              | bigint
              | Array<string | number | boolean | null | bigint>
            >;
            key: string;
            sortKey: number;
          };
          levelMod: number;
          maxCells: number;
          maxLevel: number;
          minLevel: number;
        },
        null
      >;
      remove: FunctionReference<
        "mutation",
        "internal",
        {
          key: string;
          levelMod: number;
          maxCells: number;
          maxLevel: number;
          minLevel: number;
        },
        boolean
      >;
    };
    query: {
      debugCells: FunctionReference<
        "query",
        "internal",
        {
          levelMod: number;
          maxCells: number;
          maxLevel: number;
          minLevel: number;
          rectangle: {
            east: number;
            north: number;
            south: number;
            west: number;
          };
        },
        Array<{
          token: string;
          vertices: Array<{ latitude: number; longitude: number }>;
        }>
      >;
      execute: FunctionReference<
        "query",
        "internal",
        {
          cursor?: string;
          levelMod: number;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          maxCells: number;
          maxLevel: number;
          minLevel: number;
          query: {
            filtering: Array<{
              filterKey: string;
              filterValue: string | number | boolean | null | bigint;
              occur: "should" | "must";
            }>;
            maxResults: number;
            rectangle: {
              east: number;
              north: number;
              south: number;
              west: number;
            };
            sorting: {
              interval: { endExclusive?: number; startInclusive?: number };
            };
          };
        },
        {
          nextCursor?: string;
          results: Array<{
            coordinates: { latitude: number; longitude: number };
            key: string;
          }>;
        }
      >;
      nearestPoints: FunctionReference<
        "query",
        "internal",
        {
          levelMod: number;
          logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
          maxDistance?: number;
          maxLevel: number;
          maxResults: number;
          minLevel: number;
          nextCursor?: string;
          point: { latitude: number; longitude: number };
        },
        Array<{
          coordinates: { latitude: number; longitude: number };
          distance: number;
          key: string;
        }>
      >;
    };
  };
  workflow: {
    journal: {
      load: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          journalEntries: Array<{
            _creationTime: number;
            _id: string;
            step: {
              args: any;
              argsSize: number;
              completedAt?: number;
              functionType: "query" | "mutation" | "action";
              handle: string;
              inProgress: boolean;
              name: string;
              runResult?:
                | { kind: "success"; returnValue: any }
                | { error: string; kind: "failed" }
                | { kind: "canceled" };
              startedAt: number;
              workId?: string;
            };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          ok: boolean;
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
      startSteps: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          steps: Array<{
            retry?:
              | boolean
              | { base: number; initialBackoffMs: number; maxAttempts: number };
            schedulerOptions?: { runAt?: number } | { runAfter?: number };
            step: {
              args: any;
              argsSize: number;
              completedAt?: number;
              functionType: "query" | "mutation" | "action";
              handle: string;
              inProgress: boolean;
              name: string;
              runResult?:
                | { kind: "success"; returnValue: any }
                | { error: string; kind: "failed" }
                | { kind: "canceled" };
              startedAt: number;
              workId?: string;
            };
          }>;
          workflowId: string;
          workpoolOptions?: {
            defaultRetryBehavior?: {
              base: number;
              initialBackoffMs: number;
              maxAttempts: number;
            };
            logLevel?: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
            maxParallelism?: number;
            retryActionsByDefault?: boolean;
          };
        },
        Array<{
          _creationTime: number;
          _id: string;
          step: {
            args: any;
            argsSize: number;
            completedAt?: number;
            functionType: "query" | "mutation" | "action";
            handle: string;
            inProgress: boolean;
            name: string;
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt: number;
            workId?: string;
          };
          stepNumber: number;
          workflowId: string;
        }>
      >;
    };
    workflow: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        null
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { workflowId: string },
        boolean
      >;
      complete: FunctionReference<
        "mutation",
        "internal",
        {
          generationNumber: number;
          runResult:
            | { kind: "success"; returnValue: any }
            | { error: string; kind: "failed" }
            | { kind: "canceled" };
          workflowId: string;
        },
        null
      >;
      create: FunctionReference<
        "mutation",
        "internal",
        {
          maxParallelism?: number;
          onComplete?: { context?: any; fnHandle: string };
          startAsync?: boolean;
          workflowArgs: any;
          workflowHandle: string;
          workflowName: string;
        },
        string
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { workflowId: string },
        {
          inProgress: Array<{
            _creationTime: number;
            _id: string;
            step: {
              args: any;
              argsSize: number;
              completedAt?: number;
              functionType: "query" | "mutation" | "action";
              handle: string;
              inProgress: boolean;
              name: string;
              runResult?:
                | { kind: "success"; returnValue: any }
                | { error: string; kind: "failed" }
                | { kind: "canceled" };
              startedAt: number;
              workId?: string;
            };
            stepNumber: number;
            workflowId: string;
          }>;
          logLevel: "DEBUG" | "TRACE" | "INFO" | "REPORT" | "WARN" | "ERROR";
          workflow: {
            _creationTime: number;
            _id: string;
            args: any;
            generationNumber: number;
            logLevel?: any;
            name?: string;
            onComplete?: { context?: any; fnHandle: string };
            runResult?:
              | { kind: "success"; returnValue: any }
              | { error: string; kind: "failed" }
              | { kind: "canceled" };
            startedAt?: any;
            state?: any;
            workflowHandle: string;
          };
        }
      >;
    };
  };
};
