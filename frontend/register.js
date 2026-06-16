const registerForm = document.getElementById("registerForm");
const regRole = document.getElementById("regRole");
const advisorFields = document.getElementById("advisorFields");

// Dynamic UI toggle: Show phone and specialization only if role is 'advisor'
regRole.addEventListener("change", () => {
    if (regRole.value === "advisor") {
        advisorFields.style.display = "block";
    } else {
        advisorFields.style.display = "none";
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = {
        name: document.getElementById("regName").value,
        email: document.getElementById("regEmail").value,
        password: document.getElementById("regPassword").value,
        role: regRole.value,
        phone: document.getElementById("regPhone").value,
        specialization: document.getElementById("regSpecialization").value // Captured here
    };

    try {
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        alert(result.message);

        if (response.ok) {
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error(error);
        alert("Error connecting to server.");
    }
});