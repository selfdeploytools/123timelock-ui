import { decodeBase32Key } from "./otp_parts";
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

function hashFinalStepBits(
  text: string | number[] | null,
  type: string,
  state: string
) {
  let hash = type === "sha256" ? new sjcl.hash.sha256() : new sjcl.hash.sha1();
  if (state) {
    hash.import(state);
  }
  if (text) hash.update(text);
  let uint32_arr = hash.finalize() as Array<number>;
  return uint32_arr;
}

export function hashFinalStep(
  text: string | number[] | null,
  type = "sha256",
  state?: string
): string {
  let uint32_arr = hashFinalStepBits(text, type, state);
  return sjcl.codec.hex.fromBits(uint32_arr);
}

export function TOTP2Keys(secretBase32: string, type = "sha256") {
  try {
    let hashAlgo = type === "sha256" ? sjcl.hash.sha256 : sjcl.hash.sha1;
    let keys = sjcl.misc.hmacKeys(decodeBase32Key(secretBase32), hashAlgo) as {
      serverKey: number[];
      clientKey: number[];
    };
    return keys;
  } catch (error) {
    return { serverKey: [], clientKey: [] };
  }
}

export async function twoStepSha1Hmac(
  getKeyOut_server: (digest: number[]) => Promise<string>,
  keyIn_client,
  code_int_arr: number[]
): Promise<number[]> {
  let innerState = null;
  innerState = hashStep(keyIn_client, "sha1", innerState);
  let innerDigest = hashFinalStepBits(code_int_arr, "sha1", innerState);
  let innerDigestLeft = innerDigest.slice(0, innerDigest.length / 2);
  let innerDigestRight = innerDigest.slice(innerDigest.length / 2);
  let keyOutState = await getKeyOut_server(innerDigestLeft);
  let finalHash = hashFinalStep(innerDigestRight, "sha1", keyOutState);
  let finalHashBytesArray = [];
  finalHash.split("").forEach((_, i) => {
    if (i % 2 === 0)
      finalHashBytesArray.push(parseInt(finalHash[i] + finalHash[i + 1], 16));
  });
  return finalHashBytesArray;
}
