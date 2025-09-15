document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop the default form POST

    try {
      const res = await fetch("user.json"); // fetch your credentials file
      const users = await res.json();

      const user = users.find(
        u => u.email === emailInput.value && u.password === passwordInput.value
      );

      if (user) {
        // redirect to the correct portal page
        window.location.href = user.portal;
      } else {
        alert("❌ Invalid email or password.");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      alert("⚠️ Could not check login. Please try again later.");
    }
  });
});
