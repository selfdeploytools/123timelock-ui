// Thanks:
//      Chris Miceli /  https://github.com/chrismiceli
// http://chris-miceli.blogspot.com/2014/04/google-authenticator-in-html5-with.html

// TODO: Feature Documentation of SHA256 \ HMAC hash in parts

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

function Base32Decode(base32EncodedString) {
  /// Decodes a base32 encoded string into a Uin8Array, note padding is not supported

  /// The base32 encoded string to be decoded
  /// The Unit8Array representation of the data that was encoded in base32EncodedString
  if (!base32EncodedString && base32EncodedString !== "") {
    throw "base32EncodedString cannot be null or undefined";
  }

  if ((base32EncodedString.length * 5) % 8 !== 0) {
    throw "base32EncodedString is not of the proper length. Please verify padding.";
  }

  base32EncodedString = base32EncodedString.toLowerCase();
  var alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  var returnArray = new Array((base32EncodedString.length * 5) / 8);

  var currentByte = 0;
  var bitsRemaining = 8;
  var mask = 0;
  var arrayIndex = 0;

  for (var count = 0; count < base32EncodedString.length; count++) {
    var currentIndexValue = alphabet.indexOf(base32EncodedString[count]);
    if (-1 === currentIndexValue) {
      if ("=" === base32EncodedString[count]) {
        var paddingCount = 0;
        for (count = count; count < base32EncodedString.length; count++) {
          if ("=" !== base32EncodedString[count]) {
            throw "Invalid '=' in encoded string";
          } else {
            paddingCount++;
          }
        }

        switch (paddingCount) {
          case 6:
            returnArray = returnArray.slice(0, returnArray.length - 4);
            break;
          case 4:
            returnArray = returnArray.slice(0, returnArray.length - 3);
            break;
          case 3:
            returnArray = returnArray.slice(0, returnArray.length - 2);
            break;
          case 1:
            returnArray = returnArray.slice(0, returnArray.length - 1);
            break;
          default:
            throw "Incorrect padding";
        }
      } else {
        throw "base32EncodedString contains invalid characters or invalid padding.";
      }
    } else {
      if (bitsRemaining > 5) {
        mask = currentIndexValue << (bitsRemaining - 5);
        currentByte = currentByte | mask;
        bitsRemaining -= 5;
      } else {
        mask = currentIndexValue >> (5 - bitsRemaining);
        currentByte = currentByte | mask;
        returnArray[arrayIndex++] = currentByte;
        currentByte = currentIndexValue << (3 + bitsRemaining);
        bitsRemaining += 3;
      }
    }
  }

  return new Uint8Array(returnArray);
}

async function _2step_hmac(
  keyData: Uint8Array,
  hashType: string,
  data: Uint8Array
) {
  let key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: hashType },
    false,
    ["sign"]
  );

  let signature = await crypto.subtle.sign(
    { name: "HMAC", hash: hashType },
    key,
    data
  );
  return signature;
}

async function GenerateToken(
  base32EncodedSecret,
  callback,
  steps = 30,
  hashType = "SHA-1"
) {
  // Google by default puts spaces in the secret, so strip them out.
  base32EncodedSecret = base32EncodedSecret.replace(/\s/g, "");

  // This method decodes the secret to bytes, the code is excluded here.
  var keyData = Base32Decode(base32EncodedSecret);
  var time = Math.floor(Date.now() / (steps * 1000));
  var data = NumericToUint8Array(time);

  // We need to create a key that the subtle object can actualy do work with
  try {
    let signature = await _2step_hmac(keyData, hashType, data);

    if (signature) {
      var signatureArray = new Uint8Array(signature);
      var offset = signatureArray[signatureArray.length - 1] & 0xf;
      var binary =
        ((signatureArray[offset] & 0x7f) << 24) |
        ((signatureArray[offset + 1] & 0xff) << 16) |
        ((signatureArray[offset + 2] & 0xff) << 8) |
        (signatureArray[offset + 3] & 0xff);
      callback(binary % 1000000);
    } else {
      console.error("Sign with HMAC - SHA-1: FAIL");
      callback(-1);
    }
  } catch (error) {
    console.error(`Sign with HMAC - SHA-1: FAIL, ${error}`);
    callback(-1);
  }
}

export function decodeBase32Key(encoded: string) {
  return Array.from(Base32Decode(encoded));
}

export function getTimeData(steps = 30) {
  var time = Math.floor(Date.now() / (steps * 1000));
  var data = NumericToUint8Array(time);
  return data;
}

export function GenerateTOTPWithSign(signature) {
  // We need to create a key that the subtle object can actualy do work with
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
