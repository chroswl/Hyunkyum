import fetch from 'node-fetch';

async function test() {
  const uploadId = process.env.UPLOAD_ID;
  const key = process.env.KEY;
  const res = await fetch("http://localhost:3000/api/upload-multipart", {
    method: "POST",
    headers: {
      "x-action": "complete",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ uploadId, key, parts: [{ ETag: "\"7b44f98d2479e313616204083b43cff7\"", PartNumber: 1 }] })
  });
  console.log(await res.text());
}
test();
