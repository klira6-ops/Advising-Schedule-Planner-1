// Redirect to login if not authenticated
if (!sessionStorage.getItem("userEmail")) {
    window.location.href = "login.html";
}

// Optional: auto-fill name & email from session
window.addEventListener("DOMContentLoaded", () => {
    const name = sessionStorage.getItem("userName");
    const email = sessionStorage.getItem("userEmail");
    if (name) document.getElementById("studentName").value = name;
    if (email) document.getElementById("studentEmail").value = email;
});

const form = document.getElementById("appointmentForm");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const appointment = {
        studentName: document.getElementById("studentName").value,
        studentEmail: document.getElementById("studentEmail").value,
        advisorName: document.getElementById("advisor").value,
        appointmentTime: document.getElementById("appointmentTime").value,
        priority: document.getElementById("priority").value
    };

    try {
        const response = await fetch(
            "http://localhost:3000/appointments",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(appointment)
            }
        );

        const result = await response.json();

        alert(result.message);

        form.reset();
        loadQueue();

    } catch (error) {
        console.error(error);
        alert("Error connecting to server.");
    }
});


async function loadQueue() {
    try {
        const response = await fetch("http://localhost:3000/appointments");
        const appointments = await response.json();

        const queueList = document.getElementById("queueList");
        queueList.innerHTML = "";

        if (appointments.length === 0) {
            queueList.innerHTML = "<li>No appointments in queue.</li>";
            return;
        }

        const priorityLabels = {
            1: "Graduating Senior",
            2: "Registration Issue",
            3: "Regular Advising"
        };

        appointments.forEach((apt, index) => {
            const li = document.createElement("li");
            const time = new Date(apt.appointment_time).toLocaleString();
            li.textContent = `${index + 1}. ${apt.student_name} → ${apt.advisor_name} at ${time} (${priorityLabels[apt.priority]})`;
            queueList.appendChild(li);
        });
    } catch (error) {
        console.error("Failed to load queue:", error);
    }
}

async function loadAdvisors() {
    try {
        const response = await fetch("http://localhost:3000/advisors");
        const advisors = await response.json();
        const select = document.getElementById("advisor");
        select.innerHTML = ""; // Clears the hardcoded HTML placeholders

        if (advisors.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "No advisors available. Please register one.";
            select.appendChild(option);
            return;
        }

        advisors.forEach(adv => {
            const option = document.createElement("option");
            option.value = adv.advisor_name;
            option.textContent = adv.advisor_name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Failed to load advisors:", error);
    }
}

loadAdvisors();

// Load on page load
loadQueue();
