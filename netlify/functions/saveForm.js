
import fetch from "node-fetch";
export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const path = process.env.TARGET_PATH || "data/formdata.json";

  const payload = JSON.parse(event.body || "{}");
  const newEntry = { 
    id: Date.now(), 
    ...payload,
    created_at: new Date().toISOString()
  };

  const apiPath = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

  try {
    // 1) GET current file
    const getRes = await fetch(apiPath, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" }
    });
    if (!getRes.ok) {
      // If file not found (404), create new content with [] initial
      if (getRes.status === 404) {
        const initial = [newEntry];
        const content = Buffer.from(JSON.stringify(initial, null, 2)).toString("base64");
        const putRes = await fetch(apiPath, {
          method: "PUT",
          headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "Create formdata.json with first entry",
            content
          })
        });
        const putData = await putRes.json();
        return { statusCode: putRes.ok ? 200 : 500, body: JSON.stringify(putData) };
      }
      const err = await getRes.text();
      return { statusCode: getRes.status, body: `Error reading file: ${err}` };
    }

    const fileData = await getRes.json();
    const current = JSON.parse(Buffer.from(fileData.content, "base64").toString());

    // append
    current.push(newEntry);

    // commit
    const updatedContent = Buffer.from(JSON.stringify(current, null, 2)).toString("base64");
    const putRes = await fetch(apiPath, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Add form submission",
        content: updatedContent,
        sha: fileData.sha
      })
    });

    const putJson = await putRes.json();
    if (!putRes.ok) {
      return { statusCode: putRes.status, body: JSON.stringify(putJson) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, commit: putJson.content?.sha || null })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
