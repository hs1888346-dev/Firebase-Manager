const dbList=document.getElementById("dbList");
let currentPath="/";

// ---------------- Load DB ----------------
async function loadDB(path="/"){
  currentPath=path;
  dbList.innerHTML="Loading...";
  const snap=await firebase.database().ref(path).once("value");
  const val=snap.val();
  dbList.innerHTML="";
  if(val===null){dbList.innerHTML="Empty";return;}

  if(path!="/"){
    let back=document.createElement("button");
    back.innerText="⬅ Back"; back.className="small";
    back.onclick=()=>loadDB(findParent(path));
    dbList.append(back);
  }

  Object.keys(val).forEach(k=>{
    let v=val[k];
    let isObj=(typeof v==="object" && v!==null);
    let icon=isObj?"📁":"📄";
    let row=document.createElement("div");
    row.className="listItem";
    row.innerHTML=`<div class="iconName"><div>${icon}</div><div>${k}</div></div>`;
    row.onclick=()=>editDbDialog(k,v);
    row.oncontextmenu=(e)=>{e.preventDefault(); deleteNodeConfirm(k);}
    dbList.append(row);
  });
}

// ---------------- Edit Node ----------------
function editDbDialog(key,val){
  let type=typeof val;
  if(type==="object" && val!==null){ loadDB(currentPath+"/"+key); return; }

  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:9998";
  document.body.appendChild(overlay);

  const dlg=document.createElement("div");
  dlg.style.cssText="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid #ccc;padding:10px;z-index:9999;border-radius:8px";
  
  let valueField="";
  if(type==="boolean"){
    valueField=`Value: <select id="valInput"><option value="true"${val===true?" selected":""}>true</option><option value="false"${val===false?" selected":""}>false</option></select>`;
  } else {
    valueField=`Value: <input id="valInput" value="${val}">`;
  }

  dlg.innerHTML=`
    <div>Key: <b>${key}</b></div>
    <div>Type: <b>${type}</b></div>
    <div>${valueField}</div>
    <div style="margin-top:10px">
      <button id="saveBtn">Save</button>
      <button id="cancelBtn">Cancel</button>
    </div>
  `;
  document.body.appendChild(dlg);

  overlay.onclick=()=>{dlg.remove(); overlay.remove();}
  dlg.querySelector("#cancelBtn").onclick=()=>{dlg.remove(); overlay.remove();};

  dlg.querySelector("#saveBtn").onclick=()=>{
    let input;
    if(type==="boolean"){
      input = dlg.querySelector("#valInput").value==="true";
    } else if(type==="number"){
      input=parseFloat(dlg.querySelector("#valInput").value);
      if(isNaN(input)){ alert("Enter numeric value"); return; }
    } else {
      input=dlg.querySelector("#valInput").value;
    }

    firebase.database().ref(currentPath+"/"+key).set(input).then(()=>{
        loadDB(currentPath); dlg.remove(); overlay.remove();
    });
  };
}

// ---------------- Add Node ----------------
document.getElementById("btnAddDb").onclick=()=>addNodeDialog(currentPath);

function addNodeDialog(path){
  const overlay=document.createElement("div");
  overlay.style.cssText="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:9998";
  document.body.appendChild(overlay);

  const dlg=document.createElement("div");
  dlg.style.cssText="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid #ccc;padding:10px;z-index:9999;border-radius:8px";
  dlg.innerHTML=`
    <div style="margin-bottom:8px">Key: <input id="keyInput"></div>
    <div style="margin-bottom:8px">Type: 
      <select id="typeSelect">
        <option value="string">string</option>
        <option value="number">number</option>
        <option value="boolean">boolean</option>
        <option value="object">object</option>
      </select>
    </div>
    <div id="valContainer" style="margin-bottom:8px">Value: <input id="valInput"></div>
    <div>
      <button id="addBtn">Add</button>
      <button id="cancelBtn">Cancel</button>
    </div>
  `;
  document.body.appendChild(dlg);

  const keyInput=dlg.querySelector("#keyInput");
  const typeSelect=dlg.querySelector("#typeSelect");
  const valContainer=dlg.querySelector("#valContainer");

  overlay.onclick=()=>{dlg.remove(); overlay.remove();}
  dlg.querySelector("#cancelBtn").onclick=()=>{dlg.remove(); overlay.remove();};

  function updateValContainer(container, type){
    container.innerHTML="";
    if(type==="string") container.innerHTML=`Value: <input id="valInput">`;
    else if(type==="number") container.innerHTML=`Value: <input id="valInput" type="number">`;
    else if(type==="boolean") container.innerHTML=`Value: <select id="valInput"><option>true</option><option>false</option></select>`;
    else if(type==="object"){
      container.innerHTML=`Select: 
        <select id="objOption">
          <option value="full">Full JSON</option>
          <option value="nested">Nested Value</option>
        </select>
        <div id="nestedContainer"></div>`;
      const objOption=container.querySelector("#objOption");
      const nestedContainer=container.querySelector("#nestedContainer");
      objOption.onchange=()=>{
        nestedContainer.innerHTML="";
        if(objOption.value==="full"){
          nestedContainer.innerHTML=`JSON: <textarea id="valInput" style="width:100%;height:80px">{}</textarea>`;
        } else {
          addNestedNode(nestedContainer);
        }
      };
      objOption.dispatchEvent(new Event("change"));
    }
  }

  typeSelect.onchange=()=>updateValContainer(valContainer,typeSelect.value);
  updateValContainer(valContainer,typeSelect.value);

  dlg.querySelector("#addBtn").onclick=()=>{
    const key=keyInput.value.trim();
    if(!key){alert("Enter key"); return;}
    const type=typeSelect.value;
    let val;
    if(type==="string") val=dlg.querySelector("#valInput").value;
    else if(type==="number"){
        val=parseFloat(dlg.querySelector("#valInput").value);
        if(isNaN(val)){ alert("Enter numeric value"); return; }
    }
    else if(type==="boolean") val=dlg.querySelector("#valInput").value==="true";
    else if(type==="object"){
      const objOption=dlg.querySelector("#objOption").value;
      if(objOption==="full"){
        try{val=JSON.parse(dlg.querySelector("#valInput").value);}catch(e){alert("Invalid JSON"); return;}
      } else val=collectNested(dlg.querySelector("#nestedContainer"));
    }
    firebase.database().ref(path+"/"+key).set(val).then(()=>{
      loadDB(path); dlg.remove(); overlay.remove();
    });
  };
}

// ---------------- Nested Helpers ----------------
function addNestedNode(container){
  const div=document.createElement("div");
  div.style.cssText="border:1px solid #ccc;padding:6px;margin-bottom:4px";
  div.innerHTML=`
    Key: <input class="nKey" style="width:25%">
    Type: <select class="nType" style="width:25%">
      <option value="string">string</option>
      <option value="number">number</option>
      <option value="boolean">boolean</option>
      <option value="object">object</option>
    </select>
    Value: <input class="nVal" style="width:30%">
    <button class="nAdd">+</button>
  `;
  container.appendChild(div);

  const typeSelect=div.querySelector(".nType");
  const addBtn=div.querySelector(".nAdd");

  typeSelect.onchange=()=>{
    div.querySelector(".nVal")?.remove();
    div.querySelector(".nestedObj")?.remove();
    if(typeSelect.value==="string"){
      const input=document.createElement("input"); input.className="nVal"; input.style.width="30%";
      div.insertBefore(input, addBtn);
    } else if(typeSelect.value==="number"){
      const input=document.createElement("input"); input.type="number"; input.className="nVal"; input.style.width="30%";
      div.insertBefore(input, addBtn);
    } else if(typeSelect.value==="boolean"){
      const sel=document.createElement("select"); sel.className="nVal"; sel.style.width="30%";
      sel.innerHTML="<option>true</option><option>false</option>";
      div.insertBefore(sel, addBtn);
    } else if(typeSelect.value==="object"){
      const nestedDiv=document.createElement("div"); nestedDiv.className="nestedObj"; nestedDiv.style.marginLeft="10px";
      div.insertBefore(nestedDiv, addBtn);
      const objSelect=document.createElement("select"); objSelect.innerHTML='<option value="full">Full JSON</option><option value="nested">Nested Value</option>';
      nestedDiv.appendChild(objSelect);
      const childContainer=document.createElement("div"); nestedDiv.appendChild(childContainer);
      objSelect.onchange=()=>{
        childContainer.innerHTML="";
        if(objSelect.value==="nested") addNestedNode(childContainer);
        else childContainer.innerHTML=`JSON: <textarea class="nVal" style="width:100%;height:60px">{}</textarea>`;
      };
      objSelect.dispatchEvent(new Event("change"));
    }
  };

  addBtn.onclick=()=>addNestedNode(div.querySelector(".nestedObj")||container);
}

function collectNested(container){
  const obj={};
  const children=container.querySelectorAll(":scope > div");
  children.forEach(c=>{
    const key=c.querySelector(".nKey")?.value;
    const type=c.querySelector(".nType")?.value;
    let val=null;
    if(!key) return;
    if(type==="string") val=c.querySelector(".nVal")?.value||"";
    else if(type==="number") val=parseFloat(c.querySelector(".nVal")?.value)||0;
    else if(type==="boolean") val=c.querySelector(".nVal")?.value==="true";
    else if(type==="object"){
      const nested=c.querySelector(".nestedObj");
      const txt=c.querySelector("textarea.nVal");
      if(txt) val=JSON.parse(txt.value||"{}");
      else if(nested) val=collectNested(nested.querySelector("div")||nested);
      else val={};
    }
    obj[key]=val;
  });
  return obj;
}

// ---------------- Delete Node ----------------
function deleteNodeConfirm(key){
  if(confirm("Delete this node?")) firebase.database().ref(currentPath+"/"+key).remove().then(()=>loadDB(currentPath));
}

// ---------------- Utilities ----------------
function findParent(p){ if(p==="/") return "/"; let arr=p.split("/"); arr.pop(); let r=arr.join("/"); if(!r) r="/"; return r;}
window.loadDB=loadDB;
