export function removeDup(arr: any[]): any[] {
  return arr.filter(function (value, index, array) {
    return array.indexOf(value) === index;
  });
}

export const removeIndInxState = (
  index: number,
  setfunc: (callback: (old: any[]) => any[]) => void
) => {
  setfunc((old) => {
    let aclone = [...old];
    aclone.splice(index, 1);
    return aclone;
  });
};

export function imageUrlBlob(base64Image) {
  // Split into two parts
  const parts = base64Image.split(";base64,");

  // Hold the content type
  const imageType = parts[0].split(":")[1];

  // Decode Base64 string
  const decodedData = window.atob(parts[1]);

  // Create UNIT8ARRAY of size same as row data length
  const uInt8Array = new Uint8Array(decodedData.length);

  // Insert all character code into uInt8Array
  for (let i = 0; i < decodedData.length; ++i) {
    uInt8Array[i] = decodedData.charCodeAt(i);
  }

  // Return BLOB image after conversion
  return URL.createObjectURL(new Blob([uInt8Array], { type: imageType }));
}

export function base64ToArrayBuffer(base64) {
  var binary_string = window.atob(base64);
  var len = binary_string.length;
  var bytes = new Uint8Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export function uuidv4(): string {
  return ([1e7].toString() + -1e3 + -4e3 + -8e3 + -1e11).replace(
    /[018]/g,
    (c) =>
      (
        parseInt(c) ^
        (crypto.getRandomValues(new Uint8Array(1))[0] &
          (15 >> (parseInt(c) / 4)))
      ).toString(16)
  );
}
