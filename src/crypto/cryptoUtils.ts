import * as sjcl from "./custom_sjcl_1.0.8";

export function hash(text: string, type = "sha256"): string {
  let hash = type === "sha256" ? new sjcl.hash.sha256() : new sjcl.hash.sha1();
  hash.update(text);
  let uint32_arr = hash.finalize() as Array<number>;
  return sjcl.codec.hex.fromBits(uint32_arr);
}

export function hashStep(text, type = "sha256", state = null) {
  let hash = type === "sha256" ? new sjcl.hash.sha256() : new sjcl.hash.sha1();
  if (state) {
    hash.import(state);
  }
  hash.update(text);
  return hash.export();
}

export function hashFinalStep(
  text: string | null,
  type = "sha256",
  state?: string
): string {
  let hash = type === "sha256" ? new sjcl.hash.sha256() : new sjcl.hash.sha1();
  if (state) {
    hash.import(state);
  }
  if (text) hash.update(text);
  let uint32_arr = hash.finalize() as Array<number>;
  return sjcl.codec.hex.fromBits(uint32_arr);
}
