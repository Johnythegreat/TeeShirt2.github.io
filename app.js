const KEY = 'tee_shop_v2';
const DEFAULTS = {
  settings: { shopName: 'Tee Shirt', shipping: 80, password: 'admin123' },
  products: [
    {id:1,name:'Custom Tee Basic',category:'Custom',price:250,stock:35,size:'S,M,L,XL',color:'Black,White',description:'Affordable custom print shirt for small and bulk orders.',image:''},
    {id:2,name:'Premium Oversized Tee',category:'Oversized',price:399,stock:18,size:'M,L,XL',color:'Black,Cream',description:'Premium oversized shirt with soft cotton feel.',image:''},
    {id:3,name:'Couple Shirt Set',category:'Bundle',price:550,stock:12,size:'S,M,L,XL',color:'Black,White,Red',description:'Best for gifts, couple design, events, and barkada shirts.',image:''},
    {id:4,name:'Event Bulk Shirt',category:'Bulk',price:220,stock:60,size:'S,M,L,XL,XXL',color:'Any color',description:'Bulk order option for teams, school, company, and events.',image:''}
  ],
  orders: [], messages: [], sales: []
};
let state = loadState();
let cart = JSON.parse(localStorage.getItem('tee_cart_v2') || '[]');
let posCart = [];
function loadState(){ const saved=localStorage.getItem(KEY); if(!saved){localStorage.setItem(KEY,JSON.stringify(DEFAULTS)); return structuredClone(DEFAULTS)}; const parsed=JSON.parse(saved); return {...structuredClone(DEFAULTS),...parsed,settings:{...DEFAULTS.settings,...(parsed.settings||{})}} }
function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
function money(n){ return '₱' + Number(n||0).toLocaleString('en-PH',{maximumFractionDigits:0}); }
function toast(msg){ const el=document.getElementById('toast'); if(!el) return; el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); }
function nextId(list){ return list.length ? Math.max(...list.map(x=>Number(x.id)||0))+1 : 1; }
function orderNo(id){ return 'TS-' + String(1000 + Number(id)).padStart(4,'0'); }
function placeholder(name){ return `<div class="product-img"><span>${String(name).split(' ').map(w=>w[0]).join('').slice(0,3)}</span></div>`; }
function getProduct(id){ return state.products.find(p=>Number(p.id)===Number(id)); }

if(document.body.dataset.page === 'customer') initCustomer();
if(document.body.dataset.page === 'admin') initAdmin();

function initCustomer(){
  document.title = state.settings.shopName + ' Shop';
  document.querySelectorAll('.brand span:last-child').forEach(e=>e.textContent=state.settings.shopName);
  fillFilters(); renderProducts(); renderCart();
  document.getElementById('cartOpenBtn').onclick=()=>toggleCart(true);
  document.getElementById('cartCloseBtn').onclick=()=>toggleCart(false);
  document.getElementById('overlay').onclick=()=>toggleCart(false);
  ['searchInput','categoryFilter','sizeFilter','colorFilter'].forEach(id=>document.getElementById(id).addEventListener('input', renderProducts));
  document.getElementById('checkoutForm').addEventListener('submit', checkout);
  document.getElementById('customForm').addEventListener('submit', sendCustomRequest);
  document.getElementById('trackBtn').onclick=trackOrder;
}
function fillFilters(){
  const cats=[...new Set(state.products.map(p=>p.category).filter(Boolean))];
  const sizes=[...new Set(state.products.flatMap(p=>String(p.size).split(',').map(x=>x.trim()).filter(Boolean)))];
  const colors=[...new Set(state.products.flatMap(p=>String(p.color).split(',').map(x=>x.trim()).filter(Boolean)))];
  const fill=(id,arr)=>{ const el=document.getElementById(id); const first=el.children[0].outerHTML; el.innerHTML=first + arr.map(x=>`<option value="${x}">${x}</option>`).join(''); };
  fill('categoryFilter',cats); fill('sizeFilter',sizes); fill('colorFilter',colors);
}
function renderProducts(){
  const q=document.getElementById('searchInput').value.toLowerCase();
  const cat=document.getElementById('categoryFilter').value, size=document.getElementById('sizeFilter').value, color=document.getElementById('colorFilter').value;
  const list=state.products.filter(p=>{
    const text=[p.name,p.category,p.description,p.size,p.color].join(' ').toLowerCase();
    return (!q||text.includes(q)) && (cat==='all'||p.category===cat) && (size==='all'||String(p.size).includes(size)) && (color==='all'||String(p.color).includes(color));
  });
  document.getElementById('productsGrid').innerHTML=list.map(p=>`<article class="product-card">${p.image?`<div class="product-img"><img src="${p.image}" alt="${p.name}"></div>`:placeholder(p.name)}<div class="product-body"><span class="badge">${p.category}</span><h3>${p.name}</h3><p class="muted">${p.description||''}</p><div class="price">${money(p.price)}</div><div><span class="badge">Size: ${p.size}</span><span class="badge">Color: ${p.color}</span></div><p class="${p.stock>10?'stock-ok':p.stock>0?'stock-low':'stock-out'}">${p.stock>0?`${p.stock} in stock`:'Out of stock'}</p><button class="primary-btn full" ${p.stock<1?'disabled':''} onclick="addToCart(${p.id})">Add to Cart</button></div></article>`).join('') || '<p class="muted">No products found.</p>';
}
window.addToCart=function(id){ const p=getProduct(id); if(!p||p.stock<1) return toast('Out of stock'); const item=cart.find(x=>x.id===id); const qty=item?item.qty+1:1; if(qty>p.stock) return toast('Not enough stock'); if(item)item.qty++; else cart.push({id:p.id,name:p.name,price:p.price,qty:1}); saveCart(); renderCart(); toast('Added to cart'); };
function saveCart(){ localStorage.setItem('tee_cart_v2',JSON.stringify(cart)); }
function renderCart(){
  document.getElementById('cartCount').textContent=cart.reduce((a,b)=>a+b.qty,0);
  document.getElementById('cartItems').innerHTML=cart.map(i=>`<div class="cart-item"><div><b>${i.name}</b><p class="muted">${money(i.price)} each</p></div><div class="qty-controls"><button onclick="changeQty(${i.id},-1)">−</button><b>${i.qty}</b><button onclick="changeQty(${i.id},1)">+</button><button onclick="removeCart(${i.id})">Remove</button></div></div>`).join('') || '<p class="muted">Your cart is empty.</p>';
  const subtotal=cart.reduce((a,b)=>a+b.price*b.qty,0), shipping=cart.length?Number(state.settings.shipping):0;
  document.getElementById('subtotalText').textContent=money(subtotal); document.getElementById('shippingText').textContent=money(shipping); document.getElementById('totalText').textContent=money(subtotal+shipping);
}
window.changeQty=(id,d)=>{ const i=cart.find(x=>x.id===id), p=getProduct(id); if(!i)return; i.qty+=d; if(i.qty<1) cart=cart.filter(x=>x.id!==id); if(p&&i.qty>p.stock) i.qty=p.stock; saveCart(); renderCart(); };
window.removeCart=id=>{ cart=cart.filter(x=>x.id!==id); saveCart(); renderCart(); };
function toggleCart(open){ document.getElementById('cartDrawer').classList.toggle('open',open); document.getElementById('overlay').classList.toggle('open',open); }
function checkout(e){
  e.preventDefault(); if(!cart.length) return toast('Cart is empty');
  const fd=new FormData(e.target); const items=cart.map(i=>({...i}));
  for(const i of items){ const p=getProduct(i.id); if(!p||p.stock<i.qty) return toast(`${i.name} stock not enough`); }
  items.forEach(i=>{ const p=getProduct(i.id); p.stock-=i.qty; });
  const subtotal=items.reduce((a,b)=>a+b.price*b.qty,0), total=subtotal+Number(state.settings.shipping);
  const order={id:nextId(state.orders),type:'Online',customer:fd.get('name'),phone:fd.get('phone'),address:fd.get('address'),items,total,status:'Pending',date:new Date().toISOString()};
  state.orders.unshift(order); save(); cart=[]; saveCart(); renderCart(); toggleCart(false); e.target.reset(); toast(`Order placed: ${orderNo(order.id)}`); alert(`Order successful! Your order number is ${orderNo(order.id)}`);
}
function sendCustomRequest(e){
  e.preventDefault(); const fd=new FormData(e.target); const file=fd.get('file'); const finish=(image='')=>{ state.messages.unshift({id:nextId(state.messages),name:fd.get('name'),phone:fd.get('phone'),message:fd.get('message'),image,reply:'',status:'Unread',date:new Date().toISOString()}); save(); e.target.reset(); toast('Custom request sent'); };
  if(file&&file.size){ const reader=new FileReader(); reader.onload=()=>finish(reader.result); reader.readAsDataURL(file); } else finish();
}
function trackOrder(){ const value=document.getElementById('trackInput').value.trim().toUpperCase(); const id=Number(value.replace('TS-',''))-1000; const o=state.orders.find(x=>x.id===id); document.getElementById('trackResult').innerHTML=o?`<div class="panel"><h3>${orderNo(o.id)} - ${o.status}</h3><p>${o.customer} • ${money(o.total)}</p><p class="muted">${o.items.map(i=>`${i.qty}x ${i.name}`).join(', ')}</p></div>`:'<p class="muted">Order not found.</p>'; }

function initAdmin(){
  if(sessionStorage.getItem('tee_admin_ok')==='yes') showAdmin();
  document.getElementById('adminLoginForm').onsubmit=(e)=>{ e.preventDefault(); if(document.getElementById('adminPassword').value===state.settings.password){sessionStorage.setItem('tee_admin_ok','yes'); showAdmin();} else toast('Wrong password'); };
  document.getElementById('logoutAdmin').onclick=()=>{sessionStorage.removeItem('tee_admin_ok'); location.reload();};
  document.querySelectorAll('.admin-tab').forEach(btn=>btn.onclick=()=>showTab(btn.dataset.tab));
  document.getElementById('productForm').onsubmit=saveProduct;
  document.getElementById('resetDemo').onclick=()=>{ if(confirm('Reset all demo data?')){ localStorage.removeItem(KEY); state=loadState(); refreshAdmin(); toast('Demo data reset'); }};
  document.getElementById('posSearch').oninput=renderPOSProducts;
  document.getElementById('completeSale').onclick=completePOSSale;
  document.getElementById('clearSale').onclick=()=>{posCart=[]; renderPOSCart();};
  document.getElementById('settingsForm').onsubmit=saveSettings;
}
function showAdmin(){ document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('adminApp').classList.remove('hidden'); refreshAdmin(); }
function showTab(id){ document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id)); document.querySelectorAll('.admin-section').forEach(s=>s.classList.toggle('active',s.id===id)); refreshAdmin(); }
function refreshAdmin(){ renderDashboard(); renderProductTable(); renderStockTable(); renderOrders(); renderMessages(); renderPOSProducts(); renderPOSCart(); fillSettings(); }
function renderDashboard(){
  const today=new Date().toISOString().slice(0,10); const sales=state.orders.filter(o=>o.date.slice(0,10)===today && o.status!=='Cancelled').reduce((a,b)=>a+b.total,0);
  document.getElementById('salesToday').textContent=money(sales); document.getElementById('totalOrders').textContent=state.orders.length; document.getElementById('totalProducts').textContent=state.products.length; document.getElementById('lowStockCount').textContent=state.products.filter(p=>p.stock<=5).length;
  document.getElementById('recentOrders').innerHTML=state.orders.slice(0,5).map(o=>`<div class="mini-row"><span>${orderNo(o.id)} • ${o.customer}</span><b>${money(o.total)}</b></div>`).join('')||'<p class="muted">No orders yet.</p>';
}
function renderProductTable(){ document.getElementById('productsTable').innerHTML=state.products.map(p=>`<tr><td><b>${p.name}</b><br><span class="muted">${p.category}</span></td><td>${money(p.price)}</td><td>${p.stock}</td><td>${p.size}<br>${p.color}</td><td><div class="action-row"><button class="small-btn" onclick="editProduct(${p.id})">Edit</button><button class="small-btn" onclick="deleteProduct(${p.id})">Delete</button></div></td></tr>`).join(''); }
function saveProduct(e){ e.preventDefault(); const fd=new FormData(e.target); const id=Number(fd.get('id')); const data={id:id||nextId(state.products),name:fd.get('name'),category:fd.get('category'),price:Number(fd.get('price')),stock:Number(fd.get('stock')),size:fd.get('size'),color:fd.get('color'),image:fd.get('image'),description:fd.get('description')}; if(id){ const idx=state.products.findIndex(p=>p.id===id); state.products[idx]=data; } else state.products.unshift(data); save(); e.target.reset(); refreshAdmin(); toast('Product saved'); }
window.editProduct=(id)=>{ const p=getProduct(id); const f=document.getElementById('productForm'); Object.keys(p).forEach(k=>{ if(f.elements[k]) f.elements[k].value=p[k]; }); window.scrollTo({top:0,behavior:'smooth'}); };
window.deleteProduct=(id)=>{ if(confirm('Delete this product?')){ state.products=state.products.filter(p=>p.id!==id); save(); refreshAdmin(); }};
function renderStockTable(){ document.getElementById('stockTable').innerHTML=state.products.map(p=>`<tr><td>${p.name}</td><td>${p.stock}</td><td><b class="${p.stock>10?'stock-ok':p.stock>0?'stock-low':'stock-out'}">${p.stock>10?'In Stock':p.stock>0?'Low Stock':'Out of Stock'}</b></td><td><div class="inline-form"><input id="stock-${p.id}" type="number" value="${p.stock}"><button class="small-btn" onclick="updateStock(${p.id})">Update</button></div></td></tr>`).join(''); }
window.updateStock=(id)=>{ const p=getProduct(id); p.stock=Number(document.getElementById('stock-'+id).value); save(); refreshAdmin(); toast('Stock updated'); };
function renderOrders(){ document.getElementById('ordersTable').innerHTML=state.orders.map(o=>`<tr><td><b>${orderNo(o.id)}</b><br><span class="muted">${new Date(o.date).toLocaleString()}</span></td><td>${o.customer}<br>${o.phone||''}</td><td>${o.items.map(i=>`${i.qty}x ${i.name}`).join('<br>')}</td><td>${money(o.total)}</td><td>${o.status}</td><td><select onchange="changeStatus(${o.id},this.value)">${['Pending','Preparing','Ready','Completed','Cancelled'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="6">No orders yet.</td></tr>'; }
window.changeStatus=(id,status)=>{ const o=state.orders.find(x=>x.id===id); if(o)o.status=status; save(); refreshAdmin(); };
function renderPOSProducts(){ const q=(document.getElementById('posSearch')?.value||'').toLowerCase(); const list=state.products.filter(p=>p.stock>0 && p.name.toLowerCase().includes(q)); document.getElementById('posProducts').innerHTML=list.map(p=>`<button class="pos-product" onclick="addPOS(${p.id})"><b>${p.name}</b><br>${money(p.price)}<br><span class="muted">Stock: ${p.stock}</span></button>`).join('')||'<p class="muted">No products.</p>'; }
window.addPOS=(id)=>{ const p=getProduct(id); const item=posCart.find(x=>x.id===id); const qty=item?item.qty+1:1; if(qty>p.stock) return toast('Not enough stock'); if(item)item.qty++; else posCart.push({id:p.id,name:p.name,price:p.price,qty:1}); renderPOSCart(); };
function renderPOSCart(){ document.getElementById('posCart').innerHTML=posCart.map(i=>`<div class="cart-item"><span>${i.qty}x ${i.name}</span><b>${money(i.price*i.qty)}</b></div>`).join('')||'<p class="muted">No POS items.</p>'; document.getElementById('posTotal').textContent=money(posCart.reduce((a,b)=>a+b.price*b.qty,0)); }
function completePOSSale(){ if(!posCart.length)return toast('No POS items'); posCart.forEach(i=>getProduct(i.id).stock-=i.qty); const total=posCart.reduce((a,b)=>a+b.price*b.qty,0); state.orders.unshift({id:nextId(state.orders),type:'POS',customer:'Walk-in Customer',phone:'',address:'POS sale',items:posCart.map(x=>({...x})),total,status:'Completed',date:new Date().toISOString()}); save(); posCart=[]; refreshAdmin(); toast('POS sale completed'); }
function renderMessages(){ document.getElementById('messagesList').innerHTML=state.messages.map(m=>`<div class="panel"><b>${m.name}</b> <span class="badge">${m.status}</span><p class="muted">${m.phone} • ${new Date(m.date).toLocaleString()}</p><p>${m.message}</p>${m.image?`<img class="message-img" src="${m.image}" alt="attachment">`:''}<textarea id="reply-${m.id}" placeholder="Reply note...">${m.reply||''}</textarea><div class="action-row"><button class="small-btn" onclick="saveReply(${m.id})">Save Reply</button><button class="small-btn" onclick="markRead(${m.id})">Mark Read</button></div></div>`).join('')||'<p class="muted">No messages yet.</p>'; }
window.saveReply=(id)=>{ const m=state.messages.find(x=>x.id===id); m.reply=document.getElementById('reply-'+id).value; m.status='Replied'; save(); refreshAdmin(); toast('Reply saved'); };
window.markRead=(id)=>{ const m=state.messages.find(x=>x.id===id); m.status='Read'; save(); refreshAdmin(); };
function fillSettings(){ const f=document.getElementById('settingsForm'); if(!f)return; f.shopName.value=state.settings.shopName; f.shipping.value=state.settings.shipping; f.password.value=state.settings.password; }
function saveSettings(e){ e.preventDefault(); const fd=new FormData(e.target); state.settings={shopName:fd.get('shopName')||'Tee Shirt',shipping:Number(fd.get('shipping')||0),password:fd.get('password')||state.settings.password}; save(); toast('Settings saved'); }
