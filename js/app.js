window.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start");
  const mode = document.getElementById("mode");
  const authBox = document.getElementById("authBox");
  const loginBox = document.getElementById("loginBox");

  // Initialize mode options
  mode.innerHTML = `<option value="public">Public</option><option value="auth">Auth</option>`;

  // Function to update visibility
  function updateModeUI() {
    if (mode.value === "public") {
      authBox.style.display = "none";
      checkAuthUI();
    } else if (mode.value === "auth") {
      authBox.style.display = "block";
      checkAuthUI(); // login box will show after start
    }
  }

  // Attach change listener
  mode.addEventListener("change", updateModeUI);

  // Trigger UI update on page load
  updateModeUI();

  // Start button click
  startBtn.onclick = async () => {
    // Read current inputs
    const cfg = {
      apiKey: document.getElementById("key").value || undefined,
      authDomain: document.getElementById("domain").value || undefined,
      databaseURL: document.getElementById("db").value || undefined,
      storageBucket: document.getElementById("bucket").value || undefined,
      projectId: document.getElementById("pid").value || undefined,
      appId: document.getElementById("appid").value || undefined
    };

    // If Firebase already initialized, delete previous app
    if (firebase.apps.length) {
      try {
        await firebase.app().delete();
        appLog("Previous Firebase app deleted");
      } catch (e) {
        appLog("Error deleting previous app: " + e.message);
      }
    }

    // Initialize Firebase with new config
    try {
      firebase.initializeApp(cfg);
      appLog("Firebase initialized with new config");
    } catch (e) {
      appLog("Firebase init error: " + e.message);
      alert("Firebase init error: " + e.message);
      return;
    }

    // Show login box only in auth mode
    loginBox.style.display = (mode.value === "auth") ? "block" : "none";

    // Load DB and Storage based on new config
    if (typeof checkAuthUI === "function") checkAuthUI();
    if (typeof loadDB === "function") loadDB("/");
    if (typeof loadStorage === "function") loadStorage();
  };
});
