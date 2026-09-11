// Lets plain node import the project's .ts files without editing them.
//
// Next.js resolves "./pricing" to "./pricing.ts"; node's ESM loader does not,
// and refuses with ERR_MODULE_NOT_FOUND. Rather than add extensions to the
// source just to make a test run — which would change shipping code to suit
// the test — this hook appends .ts for relative specifiers that have no
// extension, and otherwise defers to node.
import { register } from "node:module";
import { pathToFileURL } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await nextResolve(specifier + ".ts", context);
    } catch {
      // Fall through: let node report its own error for the original name.
    }
  }
  return nextResolve(specifier, context);
}

register(pathToFileURL(import.meta.filename).href);
