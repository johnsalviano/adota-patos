# Deploy do Adota Patos em VPS (guia para iniciantes)

> Este guia explica como publicar o site em uma VPS e apontar um domínio próprio.
> O backend (banco, autenticação, Edge Functions) continua no **Supabase** (gratuito).
> A VPS serve apenas o **frontend** (HTML/CSS/JS estático).

---

## 0. Pré-requisitos

- Uma **VPS** (ex.: DigitalOcean, Hetzner, Contabo, Hostinger) com Ubuntu 22.04 ou 24.04.
- Um **domínio** (ex.: `adotapatos.com.br`) comprado (Registro.br, Namecheap, etc.).
- Acesso SSH à VPS (usuário `root` ou com sudo).
- Git instalado na sua máquina (para clonar/atualizar o código).

---

## 1. Apontar o domínio para a VPS

No painel do seu registrador de domínio (onde comprou o domínio), crie estes registros DNS:

| Tipo | Nome | Valor | TTL |
|---|---|---|---|
| A | @ | IP-DA-VPS | 3600 |
| A | www | IP-DA-VPS | 3600 |

Substitua `IP-DA-VPS` pelo IP público da sua VPS. A propagação pode levar de minutos a 24h.

---

## 2. Preparar a VPS (uma vez)

Conecte via SSH:

```bash
ssh root@IP-DA-VPS
```

Instale o Caddy (servidor web com HTTPS automático):

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

Crie o diretório do site:

```bash
sudo mkdir -p /var/www/adota-patos
sudo chown -R $USER:$USER /var/www/adota-patos
```

---

## 3. Publicar o site (deploy)

Na sua máquina (não na VPS), dentro da pasta do projeto:

```bash
cd "C:\Users\johns\OneDrive\Documentos\Default Project\adota-patos"
bash deploy/vps/deploy.sh root@IP-DA-VPS
```

Isso copia a pasta `frontend/` para `/var/www/adota-patos` na VPS.

---

## 4. Configurar o Caddy (HTTPS automático)

Na VPS, edite o Caddyfile:

```bash
sudo nano /etc/caddy/Caddyfile
```

Substitua o conteúdo por (ajuste o domínio):

```
SEU-DOMINIO.com.br, www.SEU-DOMINIO.com.br {
    root * /var/www/adota-patos
    file_server
    encode gzip zstd

    header {
        X-Frame-Options "DENY"
        X-Content-Type-Options "nosniff"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    @static path *.css *.js *.png *.jpg *.jpeg *.webp *.svg *.woff *.woff2 *.ico
    header @static Cache-Control "public, max-age=31536000, immutable"

    @html path *.html /
    header @html Cache-Control "no-cache, no-store, must-revalidate"

    try_files {path} {path}/ /index.html
}
```

Salve (Ctrl+O, Enter, Ctrl+X) e recarregue o Caddy:

```bash
sudo systemctl reload caddy
```

O Caddy obtém o certificado HTTPS automaticamente. Acesse `https://SEU-DOMINIO.com.br` para confirmar.

---

## 5. Atualizar o CORS no Supabase (OBRIGATÓRIO)

O backend (Supabase) só aceita requisições de origens autorizadas. Precisa adicionar o novo domínio.

1. No código, edite **todos** os arquivos `cors.ts` em:
   - `supabase/functions/_shared/cors.ts`
   - `supabase/functions/*/cors.ts`
   - `backend/supabase/functions/_shared/cors.ts`
   - `backend/supabase/functions/*/cors.ts`

2. Descomente e ajuste a linha do novo domínio:
   ```ts
   'https://SEU-DOMINIO.com.br', // site publicado (VPS)
   ```

3. Faça deploy das Edge Functions afetadas (login-username, receber-adocao, receber-afiliacao, receber-doacao-alimento, receber-doacao-outro, transparencia, confirmar-doacao-monetaria, receber-doacao-monetaria) via Supabase MCP ou CLI.

4. Atualize o `robots.txt` (opcional) para incluir o sitemap quando tiver URLs absolutas.

---

## 6. Atualizar o site (futuras mudanças)

Sempre que mudar o frontend:

```bash
cd "C:\Users\johns\OneDrive\Documentos\Default Project\adota-patos"
bash deploy/vps/deploy.sh root@IP-DA-VPS
```

Ou configure um GitHub Action para deploy automático ao mergear em `main`.

---

## 7. Checklist de verificação pós-deploy

- [ ] `https://SEU-DOMINIO.com.br` abre o site.
- [ ] HTTPS ativo (cadeado verde no navegador).
- [ ] Login no painel funciona.
- [ ] "Lembrar-me" persiste a sessão.
- [ ] Catálogo de animais carrega.
- [ ] Formulário de adoção envia e grava no Supabase.
- [ ] Painel admin funciona (cadastro, edição, exclusão, marcar adotado).
- [ ] Upload de transparência funciona.
- [ ] Doações funcionam.
- [ ] Console do navegador sem erros de CORS.

---

## 8. Manutenção

- **Logs do Caddy:** `sudo journalctl -u caddy -f`
- **Reiniciar Caddy:** `sudo systemctl restart caddy`
- **Atualizar código:** `git pull` na sua máquina, depois `deploy.sh`.
- **Backup:** a VPS serve apenas o frontend; os dados ficam no Supabase (já tem backup próprio).

---
*Guia de deploy VPS — Adota Patos, 2026-10-30.*