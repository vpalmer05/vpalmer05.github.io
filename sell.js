
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("sellForm");
  const status = document.createElement("div");
  form.appendChild(status);

  async function readFilesAsDataURLs(fileList) {
    const arr = Array.from(fileList || []);
    const results = await Promise.all(arr.map(file => {
      return new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(file);
      });
    }));
    return results;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Submitting...";
    const f = new FormData(form);

    //payload
    const payload = {
      address: f.get("address") || null,
      bedrooms: f.get("bedrooms") ? Number(f.get("bedrooms")) : null,
      bathrooms: f.get("bathrooms") ? Number(f.get("bathrooms")) : null,
      sqft: f.get("sqft") ? Number(f.get("sqft")) : null,
      price: f.get("price") ? Number(f.get("price")) : null,
      type: f.get("type") || null,
      firstName: f.get("firstName") || null,
      lastName: f.get("lastName") || null,
      email: f.get("email") || null,
      phone: f.get("phone") || null,
      realtor: f.get("realtor") || null,
      images: []
    };

    // files
    const fileInput = form.querySelector('input[name="photos"]');
    if (fileInput && fileInput.files && fileInput.files.length) {
      try {
        payload.images = await readFilesAsDataURLs(fileInput.files);
      } catch (err) {
        console.error("Error reading images:", err);
        status.textContent = "Error reading images.";
        return;
      }
    }

    try {
      // Replace with your Netlify site URL and function name
      const endpoint = "https://monumental-lamington-73e706.netlify.app/.netlify/functions/saveListing";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        console.error(json);
        status.textContent = `Error: ${json.message || JSON.stringify(json)}`;
        return;
      }

      status.textContent = "Listing submitted — saved to repo!";
      form.reset();
    } catch (err) {
      console.error(err);
      status.textContent = "Submission Posted for Review";
    }
  });
});
