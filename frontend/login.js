const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const credentials = {
        email: document.getElementById("loginEmail").value,
        password: document.getElementById("loginPassword").value,
        role: document.getElementById("loginRole").value
    };

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials)
        });

        const result = await response.json();

        if (response.ok) {
            sessionStorage.setItem("userId", result.id);
            sessionStorage.setItem("userName", result.name);
            sessionStorage.setItem("userEmail", result.email);
            sessionStorage.setItem("userRole", result.role);

            window.location.href = "index.html";
        } else {
            alert(result.message || "Login failed");
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server.");
    }
});