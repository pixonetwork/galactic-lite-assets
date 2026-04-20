const JSON_URL = "https://raw.githubusercontent.com/pixonetwork/galactic-lite-assets/refs/heads/master/games.json";
let db = [];
const numFormat = new Intl.NumberFormat();

// --- STARTUP LOGIC ---
async function init() {
    const bar = document.getElementById('splash-bar');
    const msg = document.getElementById('splash-msg');
    const bytesText = document.getElementById('splash-bytes');
    try {
        const response = await fetch(JSON_URL);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get('Content-Length');
        let receivedLength = 0; let chunks = [];
        while(true) {
            const {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedLength += value.length;
            const pct = contentLength ? (receivedLength / contentLength) * 100 : 50;
            bar.style.width = pct + "%";
            bytesText.innerText = `${numFormat.format(receivedLength)} / ${contentLength ? numFormat.format(contentLength) : '???'} BYTES_DECRYPTED`;
        }
        const blob = new Blob(chunks);
        db = JSON.parse(await blob.text());
        msg.innerText = "DATABASE_SYNC_COMPLETE";
        document.getElementById('node-count').innerText = `${db.length}_NODES_DETECTED`;
        renderGrid(db);
        setTimeout(() => { document.getElementById('splash').classList.add('hidden'); }, 800);
    } catch (e) {
        msg.innerText = "CRITICAL_CONNECTION_ERROR";
        msg.style.color = "#ff3333";
    }
}

function renderGrid(data) {
    const grid = document.getElementById('grid');
    grid.innerHTML = data.length > 0 ? '' : '<div class="msg-text" style="grid-column:1/-1; text-align:center; margin-top:100px;">NO_NODES_FOUND_IN_SECTOR</div>';
    data.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.onclick = () => launchGame(game);
        const partsTag = game.parts > 0 ? `<span class="part-tag">LFS//${game.parts}_CHUNKS</span>` : '';
        card.innerHTML = `<div class="game-name">${game.name}</div>${partsTag}`;
        grid.appendChild(card);
    });
}

function createStreamItem(id, label) {
    const container = document.getElementById('stream-monitor');
    const item = document.createElement('div');
    item.className = 'stream-item active';
    item.id = `stream-${id}`;
    item.innerHTML = `<span>> ${label}</span><span><span class="bytes-val">0</span> BYTES <span class="check-mark">✓</span></span>`;
    container.appendChild(item);
    container.scrollTop = container.scrollHeight;
    return item;
}

async function fetchWithProgress(url, id, label) {
    const streamElement = createStreamItem(id, label);
    const byteDisplay = streamElement.querySelector('.bytes-val');
    const response = await fetch(url);
    const reader = response.body.getReader();
    const chunks = []; let received = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        byteDisplay.innerText = numFormat.format(received);
    }
    streamElement.className = 'stream-item complete';
    return await (new Blob(chunks)).text();
}

async function launchGame(game) {
    const theater = document.getElementById('theater');
    const loader = document.getElementById('loader');
    const bar = document.getElementById('bar');
    const msg = document.getElementById('loader-msg');
    const host = document.getElementById('iframe-host');
    const monitor = document.getElementById('stream-monitor');
    
    theater.style.display = 'flex';
    setTimeout(() => theater.classList.add('active'), 10);
    loader.style.display = 'flex';
    host.innerHTML = ''; monitor.innerHTML = ''; bar.style.width = "0%";
    document.getElementById('active-title').innerText = `SYNCING: ${game.name}`;

    try {
        let htmlCode = "";
        if (game.parts === 0) {
            msg.innerText = "FETCHING_SINGLE_NODE...";
            htmlCode = await fetchWithProgress(game.url, 'single', 'MAIN_DATA_STREAM');
            bar.style.width = "100%";
        } else {
            msg.innerText = `INITIATING_PARALLEL_UPLINK...`;
            const promises = []; let partsDone = 0;
            for (let i = 1; i <= game.parts; i++) {
                promises.push(fetchWithProgress(`${game.url}.part${i}`, i, `UPLINK_CHUNK_${i}`).then(text => {
                    partsDone++;
                    bar.style.width = `${(partsDone / game.parts) * 100}%`;
                    return text;
                }));
            }
            htmlCode = (await Promise.all(promises)).join('');
        }

        const iframe = document.createElement('iframe');
        iframe.setAttribute('allow', 'cross-origin-isolated; fullscreen; autoplay; pointer-lock');
        host.appendChild(iframe);
        const doc = iframe.contentWindow.document;
        doc.open(); doc.write(htmlCode); doc.close();
        setTimeout(() => { loader.style.display = 'none'; }, 800);
    } catch (err) {
        msg.innerHTML = `<span style="color:#ff3333">UPLINK_FAILURE: ${err.message}</span>`;
    }
}

function closeGame() {
    const theater = document.getElementById('theater');
    theater.classList.remove('active');
    setTimeout(() => { theater.style.display = 'none'; document.getElementById('iframe-host').innerHTML = ''; }, 600);
}

document.getElementById('search-input').oninput = (e) => {
    const filtered = db.filter(g => g.name.toLowerCase().includes(e.target.value.toLowerCase()));
    renderGrid(filtered);
};

// --- BACKGROUND ---
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let pts = [];
function initP(){
    canvas.width=window.innerWidth; canvas.height=window.innerHeight;
    pts=[]; for(let i=0;i<60;i++) pts.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-0.5)*0.4,vy:(Math.random()-0.5)*0.4});
}
function drawP(){
    ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle="#00f2ff"; ctx.strokeStyle="rgba(0, 242, 255, 0.1)";
    pts.forEach((p,idx)=>{
        p.x+=p.vx; p.y+=p.vy; if(p.x<0||p.x>canvas.width)p.vx*=-1; if(p.y<0||p.y>canvas.height)p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x,p.y,1,0,Math.PI*2); ctx.fill();
        for(let j=idx+1;j<pts.length;j++){
            let d=Math.hypot(p.x-pts[j].x,p.y-pts[j].y);
            if(d<160){ ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(pts[j].x,pts[j].y); ctx.stroke(); }
        }
    }); requestAnimationFrame(drawP);
}
window.onresize=initP; initP(); drawP();
init();
