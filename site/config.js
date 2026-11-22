window.SITE = {
  nome: "JARVIS",

  whatsapp: {
    numero: "5518997981458", // só dígitos, ex.: 5511999998888
    mensagem: "Olá! Vim pelo site do Jarvis e quero saber mais.",
  },

  contato: {
    email: "", // destino configurado no servidor (jarvis-mail)
    // Opcional: chave do Web3Forms (https://web3forms.com). Se vazio, usa FormSubmit.
    web3formsChave: "",
    endpoint: "/api/contato", // envio por SMTP no servidor; o e-mail de destino fica só lá
    assunto: "Novo contato pelo site JARVIS",
  },

  frames: { total: 160, desktop: "assets/frames/desktop/f_{n}.webp", mobile: "assets/frames/mobile/f_{n}.webp" },
};
