// netlify/functions/resolve-amazon.js

export async function handler(event, context) {
  try {
    const { url } = JSON.parse(event.body || "{}");

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing URL" })
      };
    }

    // Follow redirects fully server-side
    const response = await fetch(url, { redirect: "follow" });
    const finalURL = response.url;

    return {
      statusCode: 200,
      body: JSON.stringify({ finalURL })
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
}
