document.addEventListener("DOMContentLoaded", () => {
  const uploadBox = document.getElementById("uploadBox");
  const confirmBtn = document.querySelector(".btn-confirm");
  let jsonData = null;

  // Clique e drag
  uploadBox.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
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
      // Armazena os dados no window.name (persiste até fechar aba)
      window.name = JSON.stringify(jsonData);
      window.location.href = "participacao_visu.html";
    } catch (err) {
      console.error("Erro ao salvar dados no window.name:", err);
      alert("Erro ao processar o arquivo.");
    }
  });

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("O arquivo é muito grande (limite: 100 MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        jsonData = JSON.parse(ev.target.result);
        uploadBox.innerHTML = `<p style="color:#0f0;">✔ ${file.name} carregado com sucesso.</p>`;
        console.log("✅ JSON de participação carregado:", jsonData);
      } catch {
        alert("Erro: o arquivo não é um JSON válido.");
      }
    };
    reader.readAsText(file);
  }
});
