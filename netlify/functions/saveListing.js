// netlify/functions/saveListing.js
import fetch from "node-fetch";

export async function handler(event) {
  // Allow preflight for CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "ok",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const targetPath = process.env.TARGET_PATH || "data/formdata.json";
    const imagesPath = process.env.IMAGES_PATH || "data/images";

    if (!token || !owner || !repo) {
      return { statusCode: 500, body: "Server misconfigured: missing env vars" };
    }

    const payload = JSON.parse(event.body || "{}");

    // basic normalization
    const newId = Date.now(); // simple unique id
    const listing = {
      id: newId,
      price: payload.price ? `$${Number(payload.price).toLocaleString()}` : null,
      bedrooms: payload.bedrooms !== undefined ? Number(payload.bedrooms) : null,
      bathrooms: payload.bathrooms !== undefined ? Number(payload.bathrooms) : null,
      sqft: payload.sqft !== undefined ? Number(payload.sqft) : null,
      address: payload.address || null,
      type: payload.type || null,
      seller: {
        firstName: payload.firstName || null,
        lastName: payload.lastName || null,
        email: payload.email || null,
        phone: payload.phone || null
      },
      realtor: payload.realtor || null,
      created_at: new Date().toISOString(),
      images: [] // will be filled with filenames if we save them
    };

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents`;

    // 1) Ensure data/formdata.json exists: GET it
    const fileUrl = `${apiBase}/${encodeURIComponent(targetPath)}`;
    const getFile = await fetch(fileUrl, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github.v3+json" }
    });

    let currentList = [];
    let fileSha = null;

    if (getFile.ok) {
      const fileData = await getFile.json();
      fileSha = fileData.sha;
      const decoded = Buffer.from(fileData.content, "base64").toString();
      currentList = JSON.parse(decoded);
      if (!Array.isArray(currentList)) currentList = [];
    } else if (getFile.status === 404) {
      currentList = [];
      fileSha = null;
    } else {
      const txt = await getFile.text();
      return { statusCode: 500, body: `Failed reading ${targetPath}: ${txt}` };
    }

    // 2) If images provided (data URLs), save each as its own file via GitHub API
    const images = payload.images || [];
    for (let i = 0; i < images.length; i++) {
      const dataUrl = images[i];
      // dataUrl like: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      const matches = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!matches) continue;
      const mime = matches[1];
      const b64 = matches[2];

      // choose file extension from mime
      const ext = mime.split("/")[1] || "jpg";
      const filename = `${imagesPath}/${newId}-${i + 1}.${ext}`;

      // commit image file
      const imgUrl = `${apiBase}/${encodeURIComponent(filename)}`;
      const imgPut = await fetch(imgUrl, {
        method: "PUT",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Add image for listing ${newId} (${i + 1})`,
          content: b64
        })
      });

      const imgRes = await imgPut.json();
      if (imgPut.ok) {
        // GitHub will return content.path or content.download_url (not always)
        listing.images.push(filename);
      } else {
        // if image commit fails, push null placeholder and continue
        listing.images.push(null);
        console.warn("Image commit failed:", imgRes);
      }
    }

    // 3) append the new listing to the array and PUT formdata.json back
    currentList.push(listing);
    const updatedContent = Buffer.from(JSON.stringify(currentList, null, 2)).toString("base64");

    const putBody = {
      message: `Add listing ${newId}`,
      content: updatedContent,
      // include sha only if the file existed
      ...(fileSha ? { sha: fileSha } : {})
    };

    const putRes = await fetch(fileUrl, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(putBody)
    });

    const putJson = await putRes.json();
    if (!putRes.ok) {
      return { statusCode: putRes.status, body: JSON.stringify(putJson) };
    }

    // success
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ ok: true, listing })
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
