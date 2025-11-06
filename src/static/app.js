document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

  // Clear loading message
  activitiesList.innerHTML = "";

  // Reset activity select (keep the placeholder option)
  activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = details.participants || [];
        let participantsHTML = '<div class="participants">';
        participantsHTML += '<h5>Participants</h5>';
        if (participants.length) {
          participantsHTML += '<ul>' + participants.map(p => `
            <li>
              <span class="participant-email">${p}</span>
              <button class="remove-participant" data-activity="${name}" data-email="${p}" title="Remove participant">✖</button>
            </li>
          `).join('') + '</ul>';
        } else {
          participantsHTML += '<p class="no-participants">No participants yet</p>';
        }
        participantsHTML += '</div>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        // Attach handlers to remove buttons inside this card
        activityCard.querySelectorAll('.remove-participant').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = btn.dataset.email;
            const activityName = btn.dataset.activity;

            try {
              const res = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
                method: 'DELETE'
              });

              const data = await res.json();
              if (res.ok) {
                // Remove the list item from the DOM
                const li = btn.closest('li');
                if (li) li.remove();

                // Update availability display (increase spots left by 1)
                const availabilityEl = activityCard.querySelector('.availability');
                if (availabilityEl) {
                  // Parse current number from text and increment
                  const match = availabilityEl.textContent.match(/(\d+) spots left/);
                  if (match) {
                    const current = parseInt(match[1], 10);
                    availabilityEl.innerHTML = `<strong>Availability:</strong> ${current + 1} spots left`;
                  }
                }

                // If list becomes empty, show placeholder text
                const ul = activityCard.querySelector('.participants ul');
                if (!ul || ul.children.length === 0) {
                  const partDiv = activityCard.querySelector('.participants');
                  if (partDiv) {
                    partDiv.querySelector('ul')?.remove();
                    const noP = document.createElement('p');
                    noP.className = 'no-participants';
                    noP.textContent = 'No participants yet';
                    partDiv.appendChild(noP);
                  }
                }

                // Optionally show a small message
                messageDiv.textContent = data.message || 'Participant removed';
                messageDiv.className = 'info';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } else {
                messageDiv.textContent = data.detail || 'Failed to remove participant';
                messageDiv.className = 'error';
                messageDiv.classList.remove('hidden');
              }
            } catch (err) {
              console.error('Error removing participant:', err);
              messageDiv.textContent = 'Failed to remove participant. Please try again.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
            }
          });
        });

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Refresh activities so the new participant appears in the UI
        await fetchActivities();

        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
