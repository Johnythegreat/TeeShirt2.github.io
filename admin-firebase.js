let adminUser = null;
let products = [];
let orders = [];
let posCart = [];

const peso = n => "₱" + Number(n || 0).toLocaleString();

function showError(msg) {
  const box = document.getElementById("loginError");
  box.textContent = msg;
  box.style.display = "block";
}

async function isCurrentUserAdmin(user) {
  if (!user) return false;
  const doc = await db.collection("admins").doc(user.uid).get();
  return doc.exists;
}

auth.onAuthStateChanged(async (user) => {
  if (!user) return;
  try {
    const ok = await isCurrentUserAdmin(user);
    if (!ok) {
      await auth.signOut();
      showError("This email is logged in, but it is not listed in Firestore admins collection.");
      return;
    }
    adminUser = user;
    document.getElementById("loginWrap").style.display = "none";
    document.getElementById("adminShell").style.display = "block";
    startAdmin();
  } catch (e) {
    console.error(e);
    showError("Admin check failed. Check your Firestore rules and admins UID document.");
  }
});

document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  document.getElementById("loginError").style.display = "none";
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value;
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const ok = await isCurrentUserAdmin(cred.user);
    if (!ok) {
      await auth.signOut();
      showError("Login blocked. Add this user's UID to Firestore collection: admins");
    }
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => auth.signOut().then(() => location.reload()));

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

function startAdmin() {
  db.collection("products").onSnapshot(snap => {
    products = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderProducts();
    renderPOS();
    updateDashboard();
  });

  db.collection("orders").orderBy("createdAt", "desc").onSnapshot(snap => {
    orders = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderOrders();
    updateDashboard();
  });

  db.collection("messages").orderBy("createdAt", "desc").onSnapshot(snap => {
    const messages = snap.docs.map(d => ({id:d.id, ...d.data()}));
    renderMessages(messages);
  });
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const product = {
    name: pName.value.trim(),
    description: pDesc.value.trim(),
    price: Number(pPrice.value),
    stock: Number(pStock.value),
    size: pSize.value.trim(),
    color: pColor.value.trim(),
    image: pImage.value.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await db.collection("products").add(product);
  e.target.reset();
});

function renderProducts() {
  productsTable.innerHTML = products.map(p => `
    <tr>
      <td>${p.name || ""}</td>
      <td>${peso(p.price)}</td>
      <td>${p.stock ?? 0}</td>
      <td>${p.size || ""}</td>
      <td>${p.color || ""}</td>
      <td>
        <button class="small-btn" onclick="adjustStock('${p.id}', 1)">+ Stock</button>
        <button class="small-btn" onclick="adjustStock('${p.id}', -1)">- Stock</button>
        <button class="small-btn" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>
  `).join("");
}

async function adjustStock(id, change) {
  const p = products.find(x => x.id === id);
  const next = Math.max(0, Number(p.stock || 0) + change);
  await db.collection("products").doc(id).update({stock: next});
}

async function deleteProduct(id) {
  if (confirm("Delete this product?")) await db.collection("products").doc(id).delete();
}

function renderPOS() {
  posProducts.innerHTML = products.map(p => `
    <div class="card">
      <h3>${p.name}</h3>
      <p>${peso(p.price)}</p>
      <p>Stock: ${p.stock ?? 0}</p>
      <button onclick="addPOS('${p.id}')" ${Number(p.stock||0)<=0 ? "disabled" : ""}>Add to POS</button>
    </div>
  `).join("");
}

function addPOS(id) {
  const p = products.find(x => x.id === id);
  if (!p || Number(p.stock || 0) <= 0) return alert("Out of stock");
  const item = posCart.find(x => x.id === id);
  if (item) item.qty += 1;
  else posCart.push({id:p.id, name:p.name, price:Number(p.price), qty:1});
  renderPOSCart();
}

function renderPOSCart() {
  posCart.innerHTML = posCart.map(i => `<p>${i.name} x ${i.qty} = ${peso(i.price*i.qty)}</p>`).join("");
  posTotal.textContent = peso(posCart.reduce((s,i)=>s+i.price*i.qty,0));
}

completeSaleBtn.addEventListener("click", async () => {
  if (!posCart.length) return alert("POS cart is empty");
  const batch = db.batch();
  for (const item of posCart) {
    const p = products.find(x => x.id === item.id);
    if (!p || Number(p.stock || 0) < item.qty) return alert(`${item.name} has not enough stock`);
    batch.update(db.collection("products").doc(item.id), {stock: Number(p.stock || 0) - item.qty});
  }
  const saleRef = db.collection("sales").doc();
  batch.set(saleRef, {
    type: "POS",
    items: posCart,
    total: posCart.reduce((s,i)=>s+i.price*i.qty,0),
    cashierUid: adminUser.uid,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await batch.commit();
  posCart = [];
  renderPOSCart();
  alert("Sale completed and stock deducted.");
});

function renderOrders() {
  ordersTable.innerHTML = orders.map(o => `
    <tr>
      <td>${o.customerName || o.customerEmail || "Customer"}</td>
      <td>${peso(o.total || o.totalAmount)}</td>
      <td>${o.status || "pending"}</td>
      <td>${o.createdAt?.toDate ? o.createdAt.toDate().toLocaleString() : ""}</td>
    </tr>
  `).join("");
}

function renderMessages(messages) {
  messagesList.innerHTML = messages.map(m => `
    <div class="card">
      <h3>${m.name || m.customerName || "Customer"}</h3>
      <p>${m.message || m.text || ""}</p>
      <small>${m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : ""}</small>
    </div>
  `).join("");
}

async function updateDashboard() {
  totalProducts.textContent = products.length;
  totalOrders.textContent = orders.length;
  lowStock.textContent = products.filter(p => Number(p.stock || 0) <= 5).length;
  try {
    const salesSnap = await db.collection("sales").get();
    const total = salesSnap.docs.reduce((s,d)=>s+Number(d.data().total || 0),0);
    totalSales.textContent = peso(total);
  } catch {
    totalSales.textContent = "₱0";
  }
}
