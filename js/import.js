window.addEventListener("DOMContentLoaded", () => {
  const rawText = document.getElementById("jsonImportText");
  const btnRaw = document.getElementById("btnImportRaw");
  const authBox = document.getElementById("authBox");
  const btnFile = document.getElementById("btnImport");
  const modeSelect = document.getElementById("mode");
  const loginBox = document.getElementById("loginBox");

  // ----------------------------
  // Mode change handler
  // ----------------------------
  modeSelect.onchange = () => {
    if (modeSelect.value === "auth") {
      authBox.style.display = "block";
      checkAuthUI();
    } else {
      authBox.style.display = "none";
      checkAuthUI();
    }
  };

  // ----------------------------
  // Import from pasted JS-style Firebase config
  // ----------------------------
  btnRaw.addEventListener("click", () => {
    let code = rawText.value;
    if (!code.trim()) {
      alert("Paste Firebase config first");
      return;
    }

    try {
      // Get substring between first { and last }
      let start = code.indexOf("{");
      let end   = code.lastIndexOf("}");
      if (start < 0 || end < 0) throw new Error("Braces not found");

      let inner = code.substring(start + 1, end).trim();
      let objText = "{" + inner + "}";

      const cfg = (function(){ return eval('(' + objText + ')'); })();

      // Fill inputs
      document.getElementById("key").value = cfg.apiKey || "";
      document.getElementById("domain").value = cfg.authDomain || "";
      document.getElementById("pid").value = cfg.projectId || "";
      document.getElementById("appid").value = cfg.appId || "";
      document.getElementById("bucket").value = cfg.storageBucket || "";
      document.getElementById("db").value = cfg.databaseURL || "";

      // ✅ Do NOT forcibly show authBox here
      modeSelect.onchange(); // Update visibility according to selected mode
      alert("Firebase config imported ✔");

    } catch (err) {
      alert("Invalid Firebase config!");
      console.error(err);
    }
  });

  // ----------------------------
  // Import from google-services.json file
  // ----------------------------
  btnFile.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = () => {
      const f = input.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const json = JSON.parse(r.result);
          document.getElementById("bucket").value = json.project_info?.storage_bucket || "";
          document.getElementById("db").value = json.project_info?.firebase_url || "";

          // ✅ Update UI according to mode
          modeSelect.onchange();
          alert("google-services.json imported ✔");
        } catch (e) {
          alert("Invalid JSON file!");
          console.error(e);
        }
      };
      r.readAsText(f);
    };
    input.click();
  });

  // Trigger initial mode to set correct visibility
  modeSelect.onchange();
});
