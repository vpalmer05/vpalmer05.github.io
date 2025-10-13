document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // prevent form from submitting

    try {
      const res = await fetch("user.json"); // fetch user creds
      const users = await res.json();

      const user = users.find(
        u => u.email === emailInput.value && u.password === passwordInput.value
      );

      if (user) {
        // successful login
        window.location.href = user.portal;
      } else {
        // failed login
        alert("Invalid email or password.");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      alert("Could not check login. Please try again later.");
    }
  });
});
