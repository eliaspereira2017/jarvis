// Trilha de fundo em volume baixo. Navegadores só tocam áudio após um clique/toque.
(() => {
  const audio = document.getElementById("trilha");
  const botao = document.querySelector(".som");
  if (!audio || !botao) return;
  const VOLUME = 0.14;
  audio.volume = VOLUME;
  let queridoLigado = true; // tenta ligar sozinho no primeiro clique/toque/tecla

  const atualizar = () => {
    const tocando = !audio.paused;
    botao.setAttribute("aria-pressed", String(tocando));
    botao.setAttribute("aria-label", tocando ? "Desligar música de fundo" : "Ligar música de fundo");
  };
  const tocar = () => audio.play().then(atualizar).catch(() => {});

  // Só mostra o botão se o arquivo existir.
  fetch(audio.getAttribute("src"), { method: "HEAD" }).then((r) => {
    if (!r.ok) return;
    botao.hidden = false;
    const iniciar = (ev) => {
      if (ev.target && ev.target.closest && ev.target.closest(".som")) return; // o botão cuida de si
      if (queridoLigado) tocar();
      remover();
    };
    const eventos = ["pointerdown", "keydown", "touchstart"];
    const remover = () => eventos.forEach((e) => window.removeEventListener(e, iniciar));
    // 1) tenta tocar assim que o site carrega; 2) se o navegador bloquear, toca no 1º clique/toque/tecla
    audio.play().then(() => { atualizar(); remover(); }).catch(() => {
      eventos.forEach((e) => window.addEventListener(e, iniciar, { passive: true }));
    });
    botao.addEventListener("click", (ev) => {
      ev.stopPropagation();
      queridoLigado = false;
      if (audio.paused) tocar(); else { audio.pause(); atualizar(); }
    });
  }).catch(() => {});
})();
