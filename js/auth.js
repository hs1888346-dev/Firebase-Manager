const btnReg=document.getElementById("btnReg");
const btnLogin=document.getElementById("btnLogin");
const btnLogout=document.getElementById("btnLogout");
const authMsg=document.getElementById("authMsg");
const emailInput=document.getElementById("email");
const passInput=document.getElementById("pass");

btnReg.onclick=async ()=>{
  try{
    const email=emailInput.value.trim();
    const pass=passInput.value.trim();
    const uname=document.getElementById("username").value.trim();
    if(!uname){authMsg.innerText="Enter username";return;}
    const cred=await firebase.auth().createUserWithEmailAndPassword(email,pass);
    await cred.user.updateProfile({displayName:uname});
    await cred.user.sendEmailVerification();
    await firebase.database().ref("users/"+cred.user.uid).set({username:uname,email:email,created:Date.now()});
    authMsg.innerText="Registered, verify email";
    appLog("User registered: "+uname);
  }catch(e){authMsg.innerText=e.message;}
};

btnLogin.onclick=async ()=>{
  try{
    const email=emailInput.value.trim();
    const pass=passInput.value.trim();
    if(!email||!pass){authMsg.innerText="Fill email/password";return;}
    await firebase.auth().signInWithEmailAndPassword(email,pass);
    await firebase.auth().currentUser.reload();
    const u=firebase.auth().currentUser;
    if(!u.emailVerified){authMsg.innerText="Verify email first";return;}
    authMsg.innerText="Login success";
    setUserDisplay(u.displayName||u.email,u.email);
    document.getElementById("loginBox").style.display="none";
    appLog("Login success: "+u.email);
  }catch(e){authMsg.innerText=e.message;}
};

btnLogout.onclick=async ()=>{
  try{await firebase.auth().signOut();setUserDisplay(null,null);appLog("Logged out");}
  catch(e){appLog("Logout error: "+e.message);}
};