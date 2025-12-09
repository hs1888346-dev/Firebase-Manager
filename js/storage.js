const stList=document.getElementById("stList");
const btnListStorage=document.getElementById("btnListStorage");
const btnUploadFile=document.getElementById("btnUploadFile");
btnListStorage.onclick=()=>loadStorage("");
btnUploadFile.onclick=uploadFile;

let currentStoragePath="";

async function loadStorage(path=""){
  currentStoragePath=path;
  stList.innerHTML="Loading...";
  try{
    const storageRef=firebase.storage().ref(path);
    const res=await storageRef.listAll();
    stList.innerHTML="";

    // Back button
    if(path){
      let back=document.createElement("button");
      back.className="small"; back.innerText="⬅ Root";
      back.onclick=()=>loadStorage("");
      stList.append(back);
    }

    // Folders
    res.prefixes.forEach(p=>{
      const div=document.createElement("div");
      div.className="listItem";
      div.innerHTML=`<div class="iconName"><div>📁</div><div>${p.name}</div></div>`;
      div.onclick=()=>loadStorage(p.fullPath);
      stList.append(div);
    });

    // Files
    res.items.forEach(it=>{
      const div=document.createElement("div");
      div.className="listItem";
      div.innerHTML=`<div class="iconName"><div>📄</div><div>${it.name}</div></div>`;
      div.onclick=()=>openFilePanel(it);
      stList.append(div);
    });

    // Create Folder Button
    let btnFolder=document.createElement("button");
    btnFolder.innerText="Create Folder"; btnFolder.className="small";
    btnFolder.onclick=async ()=>{
      let fname=prompt("Enter new folder name"); if(!fname) return;
      await firebase.storage().ref(path+"/"+fname+"/.keep").put(new Blob([""]));
      loadStorage(path);
      appLog("Folder created: "+fname);
    };
    stList.prepend(btnFolder);

  }catch(e){stList.innerHTML="Error"; appLog("Storage error: "+e.message);}
}

// ------------------ FILE PANEL ------------------
async function openFilePanel(fileRef){
  const url=await fileRef.getDownloadURL();
  const meta=await fileRef.getMetadata();

  // Overlay
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:9998";
  document.body.appendChild(overlay);

  // Panel
  const panel=document.createElement("div");
  panel.style.cssText="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);"+
    "background:#fff;border:1px solid #ccc;padding:12px;z-index:9999;border-radius:8px;width:350px;max-height:80%;overflow:auto;font-size:14px";

  panel.innerHTML=`
    <h3>File Information</h3>
    <div><b>Name:</b> ${fileRef.name}</div>
    <div><b>Full Path:</b> ${fileRef.fullPath}</div>
    <div><b>Content Type:</b> ${meta.contentType}</div>
    <div><b>Size:</b> ${(meta.size/1024).toFixed(2)} KB</div>
    <div><b>Updated:</b> ${meta.updated}</div>
    <div style="margin-top:10px;">
      <button id="btnViewPlay">View/Play</button>
      <button id="btnDownload">Download</button>
      <button id="btnDelete">Delete</button>
      <button id="btnClose">Close</button>
    </div>
    <div id="downloadProgress" style="margin-top:10px;font-size:13px;color:green"></div>
  `;
  document.body.appendChild(panel);

  overlay.onclick=()=>{panel.remove(); overlay.remove();}
  panel.querySelector("#btnClose").onclick=()=>{panel.remove(); overlay.remove();};

  // View / Play Button
  const btnViewPlay=panel.querySelector("#btnViewPlay");
  if(meta.contentType.startsWith("image/") || meta.contentType.startsWith("text/")){
    btnViewPlay.onclick=()=>window.open(url,"_blank");
  } else if(meta.contentType.startsWith("video/") || meta.contentType.startsWith("audio/")){
    btnViewPlay.onclick=()=>window.open(url,"_blank");
  } else {
    btnViewPlay.style.display="none";
  }

  // Download Button
  panel.querySelector("#btnDownload").onclick=async ()=>{
    const xhr=new XMLHttpRequest();
    xhr.responseType="blob";
    xhr.onprogress=(e)=>{
      if(e.lengthComputable){
        const pct=((e.loaded/e.total)*100).toFixed(0);
        panel.querySelector("#downloadProgress").innerText="Downloading "+pct+"%";
      }
    };
    xhr.onload=()=>{
      const a=document.createElement("a");
      a.href=window.URL.createObjectURL(xhr.response);
      a.download=fileRef.name;
      a.click();
      panel.querySelector("#downloadProgress").innerText="Download complete";
      appLog("Downloaded "+fileRef.name);
    };
    xhr.onerror=()=>{panel.querySelector("#downloadProgress").innerText="Download error";};
    xhr.open("GET",url,true);
    xhr.send();
  };

  // Delete Button
  panel.querySelector("#btnDelete").onclick=async ()=>{
    if(!confirm("Delete this file?")) return;
    try{
      await fileRef.delete();
      panel.remove(); overlay.remove();
      loadStorage(currentStoragePath);
      appLog("Deleted "+fileRef.name);
    }catch(e){alert("Delete error: "+e.message);}
  };
}

// ------------------ UPLOAD ------------------
async function uploadFile(){
  const input=document.createElement("input"); input.type="file";
  input.onchange=async ()=>{
    const f=input.files[0]; if(!f) return;
    const ref=firebase.storage().ref(currentStoragePath+"/"+f.name);
    const task=ref.put(f);
    task.on("state_changed",snap=>{
      const pct=((snap.bytesTransferred/snap.totalBytes)*100).toFixed(0);
      appLog("Upload "+pct+"%");
    },err=>appLog("Upload error: "+err.message),
    async ()=>{appLog("Upload complete: "+f.name); await loadStorage(currentStoragePath);});
  };
  input.click();
}

window.loadStorage=loadStorage;
