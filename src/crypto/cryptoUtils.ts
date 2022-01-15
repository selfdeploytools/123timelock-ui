import * as sjcl from "./custom_sjcl_1.0.8";

export function hashSyncExample(text: string, type = "sha256"): string {
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

function hashFinalStepBytes(
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
  let uint32_arr = hashFinalStepBytes(text, type, state);
  return sjcl.codec.hex.fromBits(uint32_arr);
}

export function TOTP2Keys(secretBase32: string, type = "sha256") {
  try {
    console.log("originalkey: " + sjcl.codec.base32.toBits(secretBase32));
    let hashAlgo = type === "sha256" ? sjcl.hash.sha256 : sjcl.hash.sha1;
    let keys = sjcl.misc.hmacKeys(
      sjcl.codec.base32.toBits(secretBase32),
      hashAlgo
    ) as {
      serverKey: number[];
      clientKey: number[];
    };
    return keys;
  } catch (error) {
    return { serverKey: [], clientKey: [] };
  }
}

const hex2FFarr = (text: string) => {
  let finalHashBytesArray = [];
  text.split("").forEach((_, i) => {
    if (i % 2 === 0)
      finalHashBytesArray.push(parseInt(text[i] + text[i + 1], 16));
  });
  return finalHashBytesArray;
};

export async function twoStepSha1Hmac(
  getKeyOut_server: (digest: number[]) => Promise<string>,
  keyIn_client,
  code_int_arr: number[]
): Promise<number[]> {
  //
  // Hash (client_key (inner) + counter bytes (sjcl need 32int))
  let counterUint32Arr = sjcl.codec.bytes.toBits(code_int_arr);

  let innerState = null;
  innerState = hashStep(keyIn_client, "sha1", innerState);
  let innerDigest = hashFinalStepBytes(counterUint32Arr, "sha1", innerState);

  // Sha1 5 numbers (32bit?)
  let innerDigestLeft = innerDigest.slice(0, innerDigest.length / 2);
  let innerDigestRight = innerDigest.slice(innerDigest.length / 2);

  // Server side of hash(server_key (outer) + digest first bytes)
  let serverOutState = await getKeyOut_server(innerDigestLeft);

  // Client side again to finish:
  let finalHash = hashFinalStep(innerDigestRight, "sha1", serverOutState);
  let finalHashBytesArray = hex2FFarr(finalHash);

  return finalHashBytesArray;
}
