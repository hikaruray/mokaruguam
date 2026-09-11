// Lets plain node import the project's .ts files without editing them.
//
// Three differences between Next's resolver and node's ESM loader:
//   • Next resolves "./pricing" to "./pricing.ts"; node refuses.
//   • Next resolves the "@/..." alias to src/...; node has never heard of it.
//   • "server-only" is a package whose whole job is to throw when it is loaded
//     outside a server component. Under plain node it always throws, which
//     would make every route handler unimportable.
//
// Rather than change shipping code to suit a test — adding extensions, dropping
// the alias — the differences are absorbed here. The server-only stub is safe
// precisely because these scripts never run in a browser: node IS the server.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const SRC = join(dirname(import.meta.dirname), "src");

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export{}", shortCircuit: true };
  }

  if (specifier.startsWith("@/")) {
    const target = join(SRC, specifier.slice(2));
    const url = pathToFileURL(target).href;
    try {
      return await nextResolve(url + ".ts", context);
    } catch {
      try {
        return await nextResolve(url + ".tsx", context);
      } catch {
        return nextResolve(url, context);
      }
    }
  }

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
