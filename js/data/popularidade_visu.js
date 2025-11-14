/**
 * VSION — Visualização de Popularidade (versão com window.name)
 * Autor: Vitor Akira Uehara
 * Última atualização: 2025
 */

document.addEventListener("DOMContentLoaded", () => {
  const cyContainer = document.getElementById("cy");
  const sidebar = document.getElementById("sidebar");
  const summaryDiv = document.getElementById("summary");
  const nodeInfoDiv = document.getElementById("node-info");

  // ======== Carrega dados via window.name ========
  let rawData = null;
  try {
    if (window.name && window.name.trim() !== "") {
      rawData = JSON.parse(window.name);
      window.name = ""; // limpa após uso
    } else {
      alert("Nenhum arquivo carregado. Retorne à página de envio.");
      window.location.href = "popularidade_up.html";
      return;
    }
  } catch (e) {
    console.error("Erro ao carregar dados:", e);
    alert("Erro ao carregar dados. Por favor, envie novamente.");
    window.location.href = "popularidade_up.html";
    return;
  }

  // ======== Montagem dos nós ========
  const nodes = rawData.map((item, idx) => ({
    data: {
      id: String(item.author_id ?? idx),
      label: String(item.author_id ?? `autor_${idx}`),
      size: Math.min(200, 50 + (item.interactions || 0) * 3),
      image: createPieChartImage(item.apoio, item.neutralidade, item.oposicao),
      interactions: item.interactions || 0,
      apoio: item.apoio || 0,
      neutralidade: item.neutralidade || 0,
      oposicao: item.oposicao || 0,
      texts: item.texts || []
    },
    position: item.position || {
      x: Math.random() * 800 - 400,
      y: Math.random() * 800 - 400
    },
    selectable: false,
    grabbable: false
  }));

  // ======== Inicializa Cytoscape ========
  const cy = cytoscape({
    container: cyContainer,
    elements: nodes,
    style: [
      {
        selector: "node",
        style: {
          "shape": "ellipse",
          "background-image": "data(image)",
          "background-fit": "cover",
          "width": "data(size)",
          "height": "data(size)",
          "label": "data(label)",
          "color": "#fff",
          "font-size": 14,
          "text-valign": "center",
          "text-outline-color": "#000",
          "text-outline-width": 0.5
        }
      }
    ],
    layout: { name: "preset", fit: true, animate: false }
  });

  // ======== Interações ========
  cy.on("tap", "node", (evt) => {
    const node = evt.target.data();
    showNodeInfo(node);
    updateSidebarSummary(rawData, node.interactions);
    sidebar.classList.add("open");
  });

  cy.on("tap", (evt) => {
    if (evt.target === cy) sidebar.classList.remove("open");
  });

  // ======== Botões ========
  document.getElementById("menu-toggle")?.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.getElementById("sidebar-close")?.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });

  // ======== Estado inicial ========
  summaryDiv.innerHTML = `<p class="placeholder">Aguardando análise...</p>`;
  nodeInfoDiv.innerHTML = `<p class="placeholder">Clique em um nó para ver os detalhes.</p>`;

  updateSidebarSummary(rawData);
});

// ========================= FUNÇÕES AUXILIARES =========================

// ----- Cria o gráfico de pizza -----
function createPieChartImage(apoio, neutralidade, oposicao) {
  const total = apoio + neutralidade + oposicao || 1;
  const data = [apoio, neutralidade, oposicao];
  const colors = ["#00FF66", "#FFD43B", "#FF3B30"]; // verde, amarelo, vermelho

  const canvas = document.createElement("canvas");
  const size = 180;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  let startAngle = 0;
  for (let i = 0; i < data.length; i++) {
    const sliceAngle = (data[i] / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(size / 2, size / 2);
    ctx.arc(size / 2, size / 2, size / 2, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    startAngle += sliceAngle;
  }

  return canvas.toDataURL();
}

// ----- Atualiza o resumo -----
function updateSidebarSummary(nodes, highlightInteraction = null) {
  const totalAutores = nodes.length;
  const totalInteracoes = nodes.reduce((sum, n) => sum + (n.interactions || 0), 0);

  document.getElementById("summary").innerHTML = `
    <div class="summary-inline">
      <div>
        <div class="summary-label">Autores</div>
        <div class="summary-value">${totalAutores}</div>
      </div>
      <div>
        <div class="summary-label">Interações</div>
        <div class="summary-value">${totalInteracoes}</div>
      </div>
    </div>
  `;
}

// ----- Mostra detalhes do nó -----
function showNodeInfo(data) {
  const total = (data.apoio + data.neutralidade + data.oposicao) || 1;
  const pct = (v) => ((v / total) * 100).toFixed(1) + "%";

  const msgList = (data.texts || [])
    .slice(0, 20)
    .map(t => `
      <div class="msg-bubble">
        <strong style="color:${getColorByType(t.type)};">
          ${(t.type || 'Mensagem').toUpperCase()}:
        </strong> ${escapeHTML(t.text)}
      </div>
    `)
    .join('');

  document.getElementById("node-info").innerHTML = `
    <div class="node-header">
      <strong>${data.label}</strong>
      <p style="font-size:0.9em; color:#aaa;">${data.interactions} interações</p>
    </div>

    <div class="node-percentages">
      <div class="percentage-item">
        <span style="color:#00FF66;">Apoio:</span> ${pct(data.apoio)}
      </div>
      <div class="percentage-item">
        <span style="color:#FFD43B;">Neutro:</span> ${pct(data.neutralidade)}
      </div>
      <div class="percentage-item">
        <span style="color:#FF3B30;">Oposição:</span> ${pct(data.oposicao)}
      </div>
    </div>

    <hr>

    <strong>Mensagens (máx. 20):</strong>
    <div class="messages-container">
      ${msgList || "<p class='no-msg'><em>Sem mensagens disponíveis.</em></p>"}
    </div>
  `;
}

// ===== Função auxiliar para cor de tipo =====
function getColorByType(type) {
  switch ((type || "").toLowerCase()) {
    case "apoio": return "#00FF66";
    case "neutralidade": return "#FFD43B";
    case "oposicao": return "#FF3B30";
    default: return "#ccc";
  }
}

// ===== Escapar HTML perigoso =====
function escapeHTML(str = "") {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

