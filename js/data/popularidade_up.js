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
          const parsed = JSON.parse(text);

          // valida atributos obrigatórios
          if (!validateJSON(parsed)) return;

          jsonData = parsed;
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
          const rows = parseCSV(text);
          const headers = rows[0].map(h => h.trim());

          // valida cabeçalhos obrigatórios
          if (!validateCSV(headers)) return;

          jsonData = convertCSVtoJSON(rows);
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

  //VALIDAÇÃO DE JSON 

  function validateJSON(parsed) {
    if (!Array.isArray(parsed)) {
      alert("Erro: o JSON deve conter uma lista de objetos.");
      return false;
    }

    const sample = parsed[0] ?? {};

    if (!("author_id" in sample) ||
        !("texts" in sample) ||
        !("name" in sample)) {

      alert("❌ O arquivo JSON enviado não contém os campos necessários para gerar a visualização.\n" +
            "Campos obrigatórios: author_id, text, entities");
      return false;
    }

    return true;
  }


  //VALIDAÇÃO DE CSV 
  function validateCSV(headers) {
    const required = ["author_id", "texts", "name"];

    const missing = required.filter(c => !headers.includes(c));

    if (missing.length > 0) {
      alert(
        "❌ O arquivo CSV não contém os campos necessários para gerar a visualização.\n" +
        "Campos obrigatórios: author_id, text, entities\n\n" +
        "Campos ausentes: " + missing.join(", ")
      );
      return false;
    }

    return true;
  }

  // ================================================
  // Conversor CSV → JSON
  // ================================================
  function convertCSVtoJSON(rows) {
    const headers = rows[0].map((h) => h.trim());
    const jsonArr = [];

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const obj = {};

      headers.forEach((h, idx) => {
        obj[h] = cols[idx] ?? "";
      });

      // Converte entities caso seja string
      let entitiesData = obj.entities;
      try {
        entitiesData = JSON.parse(obj.entities);
      } catch {
        // mantém como string se vier inválido (evita crash)
      }

      jsonArr.push({
        author_id: String(obj.author_id ?? ""),
        text: obj.text ?? "",
        entities: entitiesData
      });
    }

    return jsonArr;
  }

  // ============================
  // CSV parser robusto
  // ============================
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
