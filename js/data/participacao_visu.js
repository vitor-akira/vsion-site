document.addEventListener("DOMContentLoaded", () => {
  const cyContainer = document.getElementById("cy");
  const sidebar = document.getElementById("sidebar");
  const nodeInfo = document.getElementById("node-info");
  const totalsDiv = document.getElementById("totals");

  // -------- 1. Carrega dados via window.name --------
  let rawData = null;
  try {
    if (window.name && window.name.trim() !== "") {
      rawData = JSON.parse(window.name);
      window.name = ""; // limpa
    } else {
      alert("Nenhum arquivo carregado. Retorne à página de envio.");
      window.location.href = "participacao_up.html";
      return;
    }
  } catch (e) {
    console.error("Erro ao ler dados:", e);
    alert("Erro ao carregar dados. Por favor, envie novamente.");
    window.location.href = "participacao_up.html";
    return;
  }

  // -------- 2. Prepara nós --------
  const nodes = rawData.map((item, idx) => ({
    data: {
      id: String(item.author_id ?? idx),
      label: String(item.author_id ?? `autor_${idx}`),
      size: Math.min(180, 40 + (item.interactions ?? 1) * 3),
      color: getColorFromId(item.author_id ?? idx),
      interactions: item.interactions ?? 0,
      texts: item.texts ?? []
    },
    position: item.position || {
      x: Math.random() * 800 - 400,
      y: Math.random() * 800 - 400
    },
    selectable: false,
    grabbable: false
  }));

  // -------- 3. Inicializa Cytoscape --------
  const cy = cytoscape({
    container: cyContainer,
    elements: nodes,
    style: [
      {
        selector: "node",
        style: {
          "shape": "ellipse",
          "background-color": "data(color)",
          "label": "data(label)",
          "width": "data(size)",
          "height": "data(size)",
          "text-valign": "center",
          "color": "#fff",
          "font-size": 14,
          "text-wrap": "wrap",
          "text-outline-color": "#000",
          "text-outline-width": 1
        }
      }
    ],
    layout: { name: "preset", fit: true, animate: false }
  });

  // -------- 4. Eventos --------
  cy.on("tap", "node", (evt) => {
    const node = evt.target;
    const interacoes = node.data("interactions");
    const texts = node.data("texts");

    updateSidebarSummary(nodes.map(n => n.data));
    sidebar.classList.add("open");

    const msgList = texts.length
      ? texts.slice(0, 20).map(t => `
        <div class="msg-bubble">${escapeHTML(t)}</div>
      `).join("")
      : "<p class='no-msg'><em>Sem mensagens disponíveis.</em></p>";

    nodeInfo.innerHTML = `
      <div class="node-header"><strong>${node.id()}</strong></div>
      <p>Número de mensagens: <strong>${interacoes}</strong></p>
      <hr>
      <strong>Mensagens (máx. 20):</strong>
      <div class="messages-container">
        ${msgList}
      </div>
    `;
  });

  cy.on("tap", (evt) => {
    if (evt.target === cy) sidebar.classList.remove("open");
  });

  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  updateSidebarSummary(nodes.map(n => n.data));
});

// ========== Funções auxiliares ==========
function getColorFromId(id) {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const color = Math.abs(hash).toString(16).substring(0, 6);
  return `#${color.padEnd(6, "0")}`;
}

function updateSidebarSummary(nodes) {
  const totalAutores = nodes.length;
  const totalMensagens = nodes.reduce((sum, n) => sum + n.interactions, 0);

  document.getElementById("totals").innerHTML = `
    <div class="summary-inline">
      <div>
        <div class="summary-label">Autores</div>
        <div class="summary-value">${totalAutores}</div>
      </div>
      <div>
        <div class="summary-label">Mensagens</div>
        <div class="summary-value">${totalMensagens}</div>
      </div>
    </div>
  `;
}

function escapeHTML(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}
