/**
 * VSION — Visualização de Polêmica (pizza via canvas, layout dagre, logs adicionados)
 * Autor: Vitor Akira Uehara
 * Última atualização: 2025
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando visualização de polêmica...");

  const cyContainer = document.getElementById("cy");
  const sidebar = document.getElementById("sidebar");
  const summaryDiv = document.getElementById("summary");
  const nodeInfoDiv = document.getElementById("node-info");

  // ======== Carrega dados via window.name ========
  let rawData = null;
  try {
    if (window.name && window.name.trim() !== "") {
      rawData = JSON.parse(window.name);
      console.log("Dados carregados com sucesso:", rawData);
      window.name = ""; // limpa
    } else {
      console.warn("Nenhum dado encontrado em window.name");
      alert("Nenhum arquivo carregado. Retorne à página de envio.");
      window.location.href = "polemica_up.html";
      return;
    }
  } catch (e) {
    console.error("Erro ao ler dados:", e);
    alert("Erro ao carregar dados. Por favor, envie novamente.");
    window.location.href = "polemica_up.html";
    return;
  }

  // ======== Valida estrutura ========
  if (!rawData.nodes || !rawData.edges) {
    console.error("Estrutura incorreta. Esperado {nodes, edges}. Recebido:", rawData);
    alert("O arquivo enviado não possui o formato esperado (nodes e edges).");
    window.location.href = "polemica_up.html";
    return;
  }
  console.log(`${rawData.nodes.length} nós e ${rawData.edges.length} arestas carregados.`);

  // ======== Montagem dos nós ========
  const nodes = rawData.nodes.map((node, idx) => {
    const apoio = Number(node.apoio || 0);
    const neutralidade = Number(node.neutralidade || 0);
    const oposicao = Number(node.oposicao || 0);
    const totalCalc = apoio + neutralidade + oposicao;
    const image = createPieChartImage(apoio, neutralidade, oposicao);

    return {
      data: {
        id: node.id ?? String(idx),
        label: node.label ?? `autor_${idx}`,
        text: node.text || "",
        apoio,
        neutralidade,
        oposicao,
        total: node.total ?? totalCalc,
        image
      }
    };
  });
  console.log("Nós processados:", nodes.slice(0, 3));

  // ======== Montagem das arestas ========
  const edges = rawData.edges.map(edge => ({
    data: {
      id: `${edge.source}_${edge.target}`,
      source: edge.source,
      target: edge.target,
      color: edge.color || "#999",
      relation: edge.relation || "neutralidade"
    }
  }));

  // ======== Inicializa Cytoscape (layout dagre) ========
  console.log("Inicializando Cytoscape...");
  const cy = cytoscape({
    container: cyContainer,
    elements: [...nodes, ...edges],
    style: [
      {
        selector: "node",
        style: {
          "shape": "ellipse",
          "background-image": "data(image)",
          "background-fit": "cover",
          "label": "data(label)",
          "width": 70,
          "height": 70,
          "text-valign": "center",
          "color": "#fff",
          "font-size": 9,
          "text-outline-color": "#000",
          "text-outline-width": 0.8,
          "border-width": 2,
          "border-color": "#444"
        }
      },
      {
        selector: "edge",
        style: {
          "width": 2,
          "line-color": "data(color)",
          "target-arrow-color": "data(color)",
          "target-arrow-shape": "triangle",
          "curve-style": "bezier"
        }
      },
      {
        selector: "node:selected",
        style: {
          "border-width": 4,
          "border-color": "#fff"
        }
      }
    ],
    layout: {
      name: "dagre",
      rankDir: "LR",
      nodeSep: 200,
      rankSep: 300,
      edgeSep: 100,
      padding: 100,
      animate: false
    }
  });

  // ======== Layout pronto ========
cy.ready(() => {
  cy.layout({
    name: "dagre",
    rankDir: "LR",
    nodeSep: 200,
    rankSep: 300,
    edgeSep: 100,
    padding: 100,
    animate: false
  }).run();

  cy.fit(null, 40);
  cy.zoom(cy.zoom() * 1.5);

  const mostConnected = cy.nodes().sort((a, b) => b.degree(false) - a.degree(false))[0];
  if (mostConnected) {
    cy.center(mostConnected);
    cy.zoom({ level: 1.2, position: mostConnected.position() });
    console.log("Focado no nó mais conectado:", mostConnected.data().label);
  }

  // chama o resumo de novo após o layout
  setTimeout(() => updateSidebarSummary(rawData.nodes), 200);
});

// também chama imediatamente ao carregar o dataset
updateSidebarSummary(rawData.nodes);

  // ======== Interações ========
  cy.on("tap", "node", (evt) => {
    const node = evt.target.data();
    sidebar.classList.add("open");
    showNodeInfo(node);
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
});

// ====================== FUNÇÕES AUXILIARES ======================

function createPieChartImage(apoio, neutralidade, oposicao) {
  const total = apoio + neutralidade + oposicao || 1;
  const data = [apoio, neutralidade, oposicao];
  const colors = ["#00FF66", "#FFD43B", "#FF3B30"];

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

function updateSidebarSummary(nodes) {
  // cada nó = uma mensagem individual
  const totalMensagens = nodes.length;
  console.log(`Resumo — Total de mensagens: ${totalMensagens}`);

  const summaryEl = document.getElementById("summary");
  if (!summaryEl) {
    console.warn("Elemento #summary não encontrado no HTML.");
    return;
  }

  summaryEl.innerHTML = `
    <div class="summary-inline">
      <div>
        <div class="summary-label">Mensagens</div>
        <div class="summary-value">${totalMensagens}</div>
      </div>
    </div>
  `;
}


function showNodeInfo(data) {
  const total = (data.apoio + data.neutralidade + data.oposicao) || 1;
  const pct = (v) => ((v / total) * 100).toFixed(1) + "%";

  const msgBubble = `
    <div class="msg-bubble">
      <p style="margin:0; font-size:0.9rem; color:#eee; line-height:1.4;">
        ${data.text || "<em>Sem conteúdo disponível.</em>"}
      </p>
    </div>
  `;

  document.getElementById("node-info").innerHTML = `
    <div class="node-header">
      <strong>${data.label}</strong>
      <p style="font-size:0.9em; color:#aaa;">${data.total} mensagens</p>
    </div>

    <!-- Porcentagens em linha -->
    <div class="node-percentages" style="display:flex; gap:8px; margin-top:10px; margin-bottom:10px;">
      <div class="percentage-item" style="background:rgba(255,255,255,0.08); padding:6px 10px; border-radius:8px;">
        <span style="color:#00FF66;">Apoio:</span> ${pct(data.apoio)}
      </div>
      <div class="percentage-item" style="background:rgba(255,255,255,0.08); padding:6px 10px; border-radius:8px;">
        <span style="color:#FFD43B;">Neutro:</span> ${pct(data.neutralidade)}
      </div>
      <div class="percentage-item" style="background:rgba(255,255,255,0.08); padding:6px 10px; border-radius:8px;">
        <span style="color:#FF3B30;">Oposição:</span> ${pct(data.oposicao)}
      </div>
    </div>

    <hr>

    <strong>Exemplo de mensagem:</strong>
    <div class="messages-container" style="margin-top:10px;">
      ${msgBubble}
    </div>
  `;
}

