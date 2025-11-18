/**
 * VSION — Upload de Popularidade (JSON + CSV)
 * Autor: Vitor Akira Uehara
 * Última atualização: 2025
 */

document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const confirmBtn = document.querySelector(".btn-confirm");
  let jsonData = null;

  // Clique → abrir seletor de arquivos
  uploadBox.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json, .csv";
    input.onchange = handleFile;
    input.click();
  });

  // Drag & Drop
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("dragging");
  });

  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("dragging"));

  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("dragging");
    handleFile({ target: { files: e.dataTransfer.files } });
  });

  // Confirmar upload
  confirmBtn.addEventListener("click", () => {
    if (!jsonData) {
      alert("Por favor, envie um arquivo primeiro!");
      return;
    }

    try {
      window.name = JSON.stringify(jsonData);
      window.location.href = "popularidade_visu.html";
    } catch (err) {
      console.error("Erro ao salvar dados no window.name:", err);
      alert("Erro ao processar o arquivo. Tente novamente.");
    }
  });

  // ===============================
  // Função de leitura (JSON + CSV)
  // ===============================
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("Arquivo grande demais (limite: 100 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;

      // ===== JSON =====
      if (file.name.endsWith(".json")) {
        try {
          jsonData = JSON.parse(text);
          uploadBox.innerHTML = `<p style="color:#00FF66;">✔ ${file.name} carregado com sucesso (JSON).</p>`;
          console.log("JSON carregado:", jsonData);
        } catch (err) {
          alert("Erro: JSON inválido.");
        }
        return;
      }

      // ===== CSV =====
      if (file.name.endsWith(".csv")) {
        try {
          jsonData = convertCSVtoJSON(text);
          uploadBox.innerHTML = `<p style="color:#00FF66;">✔ ${file.name} convertido com sucesso (CSV → JSON).</p>`;
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

  // ================================================
  // Conversor CSV → JSON (para dados de popularidade)
  // ================================================
  function convertCSVtoJSON(csvText) {
    const rows = parseCSV(csvText);
    const headers = rows[0].map((h) => h.trim());
    const jsonArr = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const obj = {};

      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? "";
      });

      // Recriação do objeto original usado pela visualização
      jsonArr.push({
        author_id: String(obj.author_id ?? ""),
        name: obj.name ?? "",
        interactions: Number(obj.interactions ?? 0),
        apoio: Number(obj.apoio ?? 0),
        neutralidade: Number(obj.neutralidade ?? 0),
        oposicao: Number(obj.oposicao ?? 0),

        // --- reconstrói "texts"
        texts: parseTexts(obj.texts),

        position: {
          x: Number(obj.position_x ?? 0),
          y: Number(obj.position_y ?? 0),
        },
      });
    }

    return jsonArr;
  }

  // ======================================================
  // Recria textos com categoria → [{"text": "...", "type": "..."}]
  // ======================================================
  function parseTexts(textField) {
    if (!textField || textField.trim() === "") return [];

    return textField.split(" | ").map((item) => {
      const match = item.match(/^(.*)\((apoio|oposicao|neutralidade)\)$/i);
      if (!match) return { text: item.trim(), type: "neutralidade" };

      return {
        text: match[1].trim(),
        type: match[2].trim().toLowerCase(),
      };
    });
  }

  // ============================
  // CSV robusto (suporta aspas)
  // ============================
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
