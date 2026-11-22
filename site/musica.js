// Tela de entrada: o clique em "Iniciar Jarvis" libera o áudio no navegador.
(() => {
  const audio = document.getElementById("trilha");
  const botao = document.querySelector(".som");
  const splash = document.getElementById("splash");
  const entrar = document.getElementById("splash-botao");
  const VOLUME = 0.14;
  if (audio) audio.volume = VOLUME;

  const atualizar = () => {
    if (!audio || !botao) return;
    const tocando = !audio.paused;
    botao.setAttribute("aria-pressed", String(tocando));
    botao.setAttribute("aria-label", tocando ? "Desligar música de fundo" : "Ligar música de fundo");
  };
  const tocar = () => (audio ? audio.play().then(atualizar).catch(() => {}) : Promise.resolve());

  if (audio && botao) {
    fetch(audio.getAttribute("src"), { method: "HEAD" }).then((r) => { if (r.ok) botao.hidden = false; }).catch(() => {});
    botao.addEventListener("click", () => { if (audio.paused) tocar(); else { audio.pause(); atualizar(); } });
  }

  const abrir = () => {
    tocar();
    document.body.classList.remove("travado");
    if (splash) { splash.classList.add("saindo"); setTimeout(() => splash.remove(), 1000); }
    window.scrollTo(0, 0);
  };
  if (entrar) entrar.addEventListener("click", abrir);
  else document.body.classList.remove("travado");
  if (entrar) entrar.focus({ preventScroll: true });
})();
