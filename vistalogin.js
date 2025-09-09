document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent form from actually submitting

    try {
      const res = await fetch("api/users.json");
      const users = await res.json();

      const user = users.find(
        u => u.email === emailInput.value && u.password === passwordInput.value
      );

      if (user) {
        // Redirect to the appropriate portal
        window.location.href = user.portal;
      } else {
        alert("❌ Invalid email or password.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Error accessing user data.");
    }
  });
});
