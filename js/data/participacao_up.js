document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const confirmBtn = document.querySelector(".btn-confirm");
  let jsonData = null;

  uploadBox.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json, .csv";
    input.onchange = handleFile;
    input.click();
  });

  uploadBox.addEventListener("dragover", e => {
    e.preventDefault();
    uploadBox.classList.add("dragging");
  });

  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragging"));

  uploadBox.addEventListener("drop", e => {
    e.preventDefault();
    uploadBox.classList.remove("dragging");
    handleFile({ target: { files: e.dataTransfer.files } });
  });

  confirmBtn.addEventListener("click", () => {
    if (!jsonData) return alert("Por favor, envie um arquivo primeiro!");
    try {
      window.name = JSON.stringify(jsonData);
      window.location.href = "participacao_visu.html";
    } catch (err) {
      console.error("Erro ao salvar dados no window.name:", err);
      alert("Erro ao processar o arquivo.");
    }
  });

  // ----------------------------
  // LEITURA DO ARQUIVO
  // ----------------------------
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("O arquivo é muito grande (limite: 100 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target.result;

      if (file.name.endsWith(".json")) {
        try {
          jsonData = JSON.parse(text);
          uploadBox.innerHTML = `<p style="color:#0f0;">✔ ${file.name} carregado (JSON).</p>`;
        } catch {
          alert("Erro: JSON inválido.");
        }
        return;
      }

      if (file.name.endsWith(".csv")) {
        try {
          const csvRows = parseCSV(text);
          jsonData = convertCSVtoJSON(csvRows);
          uploadBox.innerHTML = `<p style="color:#0f0;">✔ ${file.name} convertido (CSV → JSON).</p>`;
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

  // ----------------------------
  // CSV → JSON
  // ----------------------------
  function convertCSVtoJSON(rows) {
    const headers = rows[0].map(h => h.trim());
    const arr = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const obj = {};

      headers.forEach((h, idx) => obj[h] = cols[idx] ?? "");

      arr.push({
        author_id: obj.author_id,
        interactions: Number(obj.interactions ?? 0),
        // ✅ FIX: agora usa texts corretamente
        texts: obj.texts ? obj.texts.split(" | ").map(t => t.trim()) : [],
        position: {
          x: Number(obj.position_x ?? 0),
          y: Number(obj.position_y ?? 0)
        }
      });
    }

    return arr;
  }

  // ----------------------------
  // parseCSV
  // ----------------------------
  function parseCSV(text) {
    const rows = [];
    let row = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

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
        row = [];
        current = "";
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
