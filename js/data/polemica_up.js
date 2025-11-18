/**
 * VSION — Upload de Arquivo (Visualização de Polêmica)
 * Autor: Vitor Akira Uehara
 * Última atualização: 2025
 */

document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const confirmBtn = document.querySelector(".btn-confirm");
  let jsonData = null;

  // ========= CLIQUE OU ARRASTE =========
  uploadBox.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json, .csv";
    input.onchange = handleFile;
    input.click();
  });

  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragging");
  });

  uploadBox.addEventListener("dragleave", () =>
    uploadBox.classList.remove("dragging")
  );

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragging");
    handleFile({ target: { files: e.dataTransfer.files } });
  });

  // ========= BOTÃO DE CONFIRMAÇÃO =========
  confirmBtn.addEventListener("click", () => {
    if (!jsonData) {
      alert("Por favor, envie um arquivo primeiro!");
      return;
    }

    try {
      window.name = JSON.stringify(jsonData);
      window.location.href = "polemica_visu.html";
    } catch (e) {
      alert("Erro ao transferir o arquivo.");
      console.error(e);
    }
  });

  // ========= LEITURA DO ARQUIVO (JSON / CSV) =========
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("Arquivo muito grande (limite: 100 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;

      // ======== JSON ========
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);

          if (!parsed.nodes || !parsed.edges) {
            alert("O JSON deve conter 'nodes' e 'edges'.");
            return;
          }

          jsonData = parsed;
          uploadBox.innerHTML = `<p style="color:#00FF66;">✔ ${file.name} carregado (JSON).</p>`;
          console.log("JSON carregado:", parsed);
        } catch (err) {
          alert("Erro: JSON inválido.");
          console.error(err);
        }
        return;
      }

      // ======== CSV ========
      if (file.name.endsWith(".csv")) {
        try {
          jsonData = convertCSVtoJSON(text);
          uploadBox.innerHTML = `<p style="color:#00FF66;">✔ ${file.name} convertido (CSV → JSON).</p>`;
          console.log("CSV convertido:", jsonData);
        } catch (err) {
          alert("Erro ao converter CSV.");
          console.error(err);
        }
        return;
      }

      alert("Formato inválido. Envie JSON ou CSV.");
    };

    reader.readAsText(file);
  }

  // ======================================================
  // ========= CONVERSOR CSV (NÓS + EDGES → JSON) =========
  // ======================================================

  function convertCSVtoJSON(csvText) {
    const rows = parseCSV(csvText);
    const headers = rows[0].map((h) => h.trim());
    const data = rows.slice(1);

    const nodes = {};
    const edges = [];

    for (const cols of data) {
      const obj = {};
      headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));

      // ---------------------
      // Reconstrução do nó SOURCE
      // ---------------------
      const sid = obj.source_id;
      if (!nodes[sid]) {
        nodes[sid] = {
          id: sid,
          label: obj.source_label,
          text: obj.source_text,
          apoio: Number(obj.source_apoio),
          oposicao: Number(obj.source_oposicao),
          neutralidade: Number(obj.source_neutralidade),
          total: Number(obj.source_total)
        };
      }

      // ---------------------
      // Reconstrução do nó TARGET
      // ---------------------
      const tid = obj.target_id;
      if (!nodes[tid]) {
        nodes[tid] = {
          id: tid,
          label: obj.target_label,
          text: obj.target_text,
          apoio: Number(obj.target_apoio),
          oposicao: Number(obj.target_oposicao),
          neutralidade: Number(obj.target_neutralidade),
          total: Number(obj.target_total)
        };
      }

      // ---------------------
      // Criar a aresta
      // ---------------------
      edges.push({
        source: sid,
        target: tid,
        relation: obj.edge_relation,
        color: obj.edge_color,
        text: obj.edge_text
      });
    }

    return { nodes: Object.values(nodes), edges };
  }

  // ======================================================
  // =================== PARSER CSV =======================
  // ======================================================

  function parseCSV(text) {
    const rows = [];
    let row = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      // Aspas escapadas ""
      if (c === '"' && next === '"') {
        current += '"';
        i++;
        continue;
      }

      if (c === '"') {
        insideQuotes = !insideQuotes;
        continue;
      }

      if (c === "," && !insideQuotes) {
        row.push(current);
        current = "";
        continue;
      }

      if ((c === "\n" || c === "\r") && !insideQuotes) {
        if (current.length > 0 || row.length > 0) {
          row.push(current);
          rows.push(row);
        }
        current = "";
        row = [];
        continue;
      }

      current += c;
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current);
      rows.push(row);
    }

    return rows;
  }
});
