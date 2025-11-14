/**
 * VSION — Upload de Arquivo (Visualização de Polêmica)
 * Autor: Vitor Akira Uehara
 * Última atualização: 2025
 */

document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const confirmBtn = document.querySelector(".btn-confirm");
  let jsonData = null;

  // ===== CLIQUE OU ARRASTE =====
  uploadBox.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
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

  // ===== BOTÃO DE CONFIRMAÇÃO =====
  confirmBtn.addEventListener("click", () => {
    if (!jsonData) {
      alert("Por favor, envie um arquivo primeiro!");
      return;
    }

    try {
      // Armazena o JSON como string em window.name (sobrevive entre páginas)
      window.name = JSON.stringify(jsonData);

      // Redireciona para a página de visualização
      window.location.href = "polemica_visu.html";
    } catch (e) {
      alert("Erro ao transferir o arquivo para a próxima página.");
      console.error(e);
    }
  });

  // ===== LEITURA DO ARQUIVO =====
  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("O arquivo é muito grande (limite: 100 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);

        if (!parsed.nodes || !parsed.edges) {
          alert("O JSON deve conter as chaves 'nodes' e 'edges'.");
          return;
        }

        jsonData = parsed;
        uploadBox.innerHTML = `<p style="color:#00FF66;">✔ ${file.name} carregado com sucesso.</p>`;
        console.log("✅ JSON de polêmica carregado:", parsed);
      } catch (err) {
        alert("Erro: o arquivo não é um JSON válido.");
        console.error("❌ Erro de parse:", err);
      }
    };

    reader.readAsText(file);
  }
});
