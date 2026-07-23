export async function submitToIndexNow(urlList: string[] = ['https://hyunkyumkim.com/']) {
  const host = "hyunkyumkim.com";
  const key = "9451125206064f26a117b38d38e23fc4"; 

  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        host: host,
        key: key,
        keyLocation: `https://${host}/${key}.txt`,
        urlList: urlList
      }),
      mode: 'no-cors'
    });
    console.log("IndexNow submission triggered.");
  } catch (error) {
    console.error("IndexNow submission failed:", error);
  }
}
