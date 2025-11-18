document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const confirmBtn = document.querySelector(".btn-confirm");
  let jsonData = null;

  // Clique e drag
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

  // =====================================================
  //                    LEITURA DO ARQUIVO
  // =====================================================
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

      // ---------------- JSON -----------------
      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(text);

          // === VALIDAÇÃO JSON ===
          if (!validateJSON(parsed)) return;

          jsonData = parsed;
          uploadBox.innerHTML = `<p style="color:#0f0;">✔ ${file.name} carregado com sucesso (JSON).</p>`;
          console.log("JSON carregado:", jsonData);
          return;

        } catch (err) {
          alert("Erro: o arquivo JSON é inválido.");
          return;
        }
      }

      // ---------------- CSV -----------------
      else if (file.name.endsWith(".csv")) {
        try {
          const csvRows = parseCSV(text);
          const headers = csvRows[0].map(h => h.trim());

          // === VALIDAÇÃO CSV ===
          if (!validateCSV(headers)) return;

          jsonData = convertCSVtoJSON(csvRows);
          uploadBox.innerHTML = `<p style="color:#0f0;">✔ ${file.name} carregado e convertido (CSV → JSON).</p>`;
          console.log("CSV convertido:", jsonData);
          return;

        } catch (err) {
          alert("Erro ao converter CSV.");
          console.error(err);
          return;
        }
      }

      else {
        alert("Formato inválido. Envie JSON ou CSV.");
      }
    };

    reader.readAsText(file);
  }

  //VALIDAÇÕES       //

  //valida JSON
  function validateJSON(parsed) {
    if (!Array.isArray(parsed)) {
      alert("O JSON deve conter uma lista de objetos.");
      return false;
    }

    const sample = parsed[0] || {};

    if (!("author_id" in sample) || !("texts" in sample)) {
      alert("❌ O arquivo JSON não contém as colunas obrigatórias: author_id e text.");
      return false;
    }

    return true;
  }

  //valida CSV
  function validateCSV(headers) {
    const required = ["author_id", "texts"];

    const missing = required.filter(col => !headers.includes(col));
    if (missing.length > 0) {
      alert(`❌ O arquivo CSV não contém as colunas obrigatórias: ${missing.join(", ")}`);
      return false;
    }

    return true;
  }

  // =====================================================
  //                  CSV → JSON CONVERSOR
  // =====================================================

  function convertCSVtoJSON(rows) {
    const headers = rows[0].map(h => h.trim());
    const jsonArr = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const obj = {};

      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? "";
      });

      jsonArr.push({
        author_id: obj.author_id,
        interactions: Number(obj.interactions ?? 0),
        texts: obj.text ? obj.text.split(" | ").map(t => t.trim()) : [],
        position: {
          x: Number(obj.position_x ?? 0),
          y: Number(obj.position_y ?? 0)
        }
      });
    }

    return jsonArr;
  }

  // =====================================================
  //                  PARSER DE CSV ROBUSTO
  // =====================================================
  function parseCSV(text) {
    const rows = [];
    let current = "";
    let insideQuotes = false;
    let row = [];

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"' && next === '"') {
        current += '"';
        i++;
      }
      else if (c === '"') {
        insideQuotes = !insideQuotes;
      }
      else if (c === ',' && !insideQuotes) {
        row.push(current);
        current = "";
      }
      else if ((c === '\n' || c === '\r') && !insideQuotes) {
        if (current.length > 0 || row.length > 0) {
          row.push(current);
          rows.push(row);
        }
        current = "";
        row = [];
      }
      else {
        current += c;
      }
    }

    if (current.length > 0 || row.length > 0) {
      row.push(current);
      rows.push(row);
    }

    return rows;
  }

});
