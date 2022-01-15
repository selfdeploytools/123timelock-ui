// Thanks:
//      Chris Miceli /  https://github.com/chrismiceli
// http://chris-miceli.blogspot.com/2014/04/google-authenticator-in-html5-with.html

function padDigits(number, digits) {
  return (
    Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number
  );
}

function NumericToUint8Array(counter) {
  const hexCounter = padDigits(counter.toString(16), 16);
  let bytesArr = [];
  for (let i = 0; i < 16; i += 2) {
    bytesArr.push(hexCounter[i] + hexCounter[i + 1]);
  }
  return new Uint8Array(bytesArr.map((e) => parseInt(e, 16)));
}

export function getTimeDataNumArray(steps = 30): number[] {
  var time = Math.floor(Date.now() / (steps * 1000));
  var data = Array.from(NumericToUint8Array(time));
  return data;
}

export function GenerateTOTPWithSign(signature) {
  try {
    if (signature) {
      var signatureArray = new Uint8Array(signature);
      var offset = signatureArray[signatureArray.length - 1] & 0xf;

      var binary =
        ((signatureArray[offset] & 0x7f) << 24) |
        ((signatureArray[offset + 1] & 0xff) << 16) |
        ((signatureArray[offset + 2] & 0xff) << 8) |
        (signatureArray[offset + 3] & 0xff);

      return binary % 1000000;
    } else {
      console.error("Sign with HMAC - SHA-1: FAIL");
      return 0;
    }
  } catch (error) {
    console.error(`Sign with HMAC - SHA-1: FAIL, ${error}`);
    return 0;
  }
}
