// Function to show login box if auth mode and Firebase initialized, but user not logged in
function checkAuthUI() {
  const mode = document.getElementById("mode");
  const loginBox = document.getElementById("loginBox");

  // Hide login box by default
  loginBox.style.display = "none";

  // Check if mode is auth and Firebase is initialized
  if (mode.value === "auth" && firebase.apps.length) {
    // Check if no user is logged in
    const user = firebase.auth().currentUser;
    if (!user) {
      loginBox.style.display = "block";
    }
  }
}

const modeEl = document.getElementById("mode");
const btnImport = document.getElementById("btnImport");
const btnImportRaw = document.getElementById("btnImportRaw");
const jsonImportText = document.getElementById("jsonImportText");
const authBox = document.getElementById("authBox");
const loginBox = document.getElementById("loginBox");
const userName = document.getElementById("userName");
const userEmail = document.getElementById("userEmail");

// Mode options
modeEl.innerHTML = `
  <option value="public">Public</option>
  <option value="auth">Auth</option>
`;

// Initial visibility
authBox.style.display = "none";
loginBox.style.display = "none";
modeEl.value = "public";

// Create How To Use buttons
let howToUsePublicBtn = document.createElement("button");
howToUsePublicBtn.className = "small";
howToUsePublicBtn.style.marginTop = "8px";
howToUsePublicBtn.innerText = "How To Use (Public)";
howToUsePublicBtn.onclick = () => window.open("https://example.com/public-guide", "_blank");

let howToUseAuthBtn = document.createElement("button");
howToUseAuthBtn.className = "small";
howToUseAuthBtn.style.marginTop = "8px";
howToUseAuthBtn.innerText = "How To Use (Auth)";
howToUseAuthBtn.onclick = () => window.open("https://example.com/auth-guide", "_blank");

// Append buttons
const leftBox = document.querySelector(".left .box");
leftBox.appendChild(howToUsePublicBtn);
leftBox.appendChild(howToUseAuthBtn);

// Update visibility based on mode
function updateModeVisibility() {
  const m = modeEl.value;

  if (m === "auth") {
    authBox.style.display = "block";   // show JSON/text import for auth
    checkAuthUI();  // show login form
    howToUseAuthBtn.style.display = "inline-block";
    howToUsePublicBtn.style.display = "none";
    btnImport.style.display = "none";
    btnImportRaw.style.display = "block";
    jsonImportText.style.display = "block";
  } else {
    authBox.style.display = "none";    // hide JSON/text import
    checkAuthUI();  // hide login form
    howToUsePublicBtn.style.display = "inline-block";
    howToUseAuthBtn.style.display = "none";
    btnImport.style.display = "block";
    btnImportRaw.style.display = "none";
    jsonImportText.style.display = "none";
  }{}

  log("Mode: " + m);
}

// Attach onchange
modeEl.addEventListener("change", updateModeVisibility);

// Initial update
updateModeVisibility();

function log(msg){
  const a = document.getElementById("logArea");
  const now = new Date().toLocaleTimeString();
  a.innerHTML = `<div>[${now}] ${escapeHtml(msg)}</div>` + a.innerHTML;
}

function escapeHtml(s){
  return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

window.appLog = log;

window.setUserDisplay = (name, email) => {
  userName.innerText = name || "Hi, User";
  userEmail.innerText = email ? `(${email})` : "";
};
