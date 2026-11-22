// Recebe o formulário do site e envia por SMTP (e-mail da Hostinger) para o destino.
// A senha vem de um Docker secret (arquivo), nunca do código nem do repositório.
const http = require("http");
const fs = require("fs");
const nodemailer = require("nodemailer");

const env = (k, d) => process.env[k] || d;
const SMTP_HOST = env("SMTP_HOST", "smtp.hostinger.com");
const SMTP_PORT = Number(env("SMTP_PORT", "465"));
const SMTP_USER = env("SMTP_USER", "");
const MAIL_TO = env("MAIL_TO", "");
const SITE = env("SITE_NOME", "JARVIS");
const PASS_FILE = env("SMTP_PASS_FILE", "/run/secrets/jarvis_smtp_pass");
const SMTP_PASS = fs.existsSync(PASS_FILE) ? fs.readFileSync(PASS_FILE, "utf8").trim() : env("SMTP_PASS", "");

if (!SMTP_USER || !SMTP_PASS || !MAIL_TO) console.error("AVISO: SMTP_USER, senha ou MAIL_TO ausentes. O envio vai falhar.");

const transporter = nodemailer.createTransport({
  host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

// limite simples por IP: 5 envios a cada 10 minutos
const janela = new Map();
const limitado = (ip) => {
  const agora = Date.now();
  const lista = (janela.get(ip) || []).filter((t) => agora - t < 600000);
  if (lista.length >= 5) return true;
  lista.push(agora); janela.set(ip, lista); return false;
};
setInterval(() => { const a = Date.now(); for (const [k, v] of janela) if (!v.some((t) => a - t < 600000)) janela.delete(k); }, 600000).unref();

const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const limpa = (s, n) => String(s || "").replace(/[\r\n]+/g, " ").trim().slice(0, n);
const json = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/saude") return json(res, 200, { ok: true });
  if (req.method !== "POST" || req.url.split("?")[0] !== "/api/contato") return json(res, 404, { ok: false });

  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (limitado(ip)) return json(res, 429, { ok: false, message: "Muitas tentativas. Tente em alguns minutos." });

  let corpo = "";
  req.on("data", (c) => { corpo += c; if (corpo.length > 20000) req.destroy(); });
  req.on("end", async () => {
    let d;
    try { d = JSON.parse(corpo); } catch { return json(res, 400, { ok: false, message: "Dados inválidos." }); }
    if (d._honey) return json(res, 200, { ok: true }); // robô: finge sucesso
    const nome = limpa(d.nome, 120), email = limpa(d.email, 160), tel = limpa(d.telefone, 40), msg = String(d.mensagem || "").trim().slice(0, 4000);
    if (nome.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || tel.length < 6)
      return json(res, 400, { ok: false, message: "Confira os campos." });
    try {
      await transporter.sendMail({
        from: `"${SITE} · site" <${SMTP_USER}>`,
        to: MAIL_TO,
        replyTo: `"${nome.replace(/"/g, "")}" <${email}>`,
        subject: limpa(d._assunto, 150) || `Novo contato pelo site ${SITE}`,
        text: `Nome: ${nome}\nE-mail: ${email}\nWhatsApp: ${tel}\n\nMensagem:\n${msg || "(sem mensagem)"}\n`,
        html: `<h3>Novo contato pelo site ${esc(SITE)}</h3><p><b>Nome:</b> ${esc(nome)}<br><b>E-mail:</b> ${esc(email)}<br><b>WhatsApp:</b> ${esc(tel)}</p><p><b>Mensagem:</b><br>${esc(msg).replace(/\n/g, "<br>") || "(sem mensagem)"}</p>`,
      });
      json(res, 200, { ok: true });
    } catch (e) {
      console.error("Falha SMTP:", e.code || "", e.message);
      json(res, 502, { ok: false, message: "Não foi possível enviar agora." });
    }
  });
}).listen(3000, () => console.log("jarvis-mailer na porta 3000"));
