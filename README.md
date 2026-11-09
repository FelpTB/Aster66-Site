# Aster66 — site (versão local)

Site do RPG Aster66 com quatro áreas: **Início**, **Explorar** (mundo, Maresia, panteão, países, raças e classes),
**Documentos** (ficha editável em PDF + ficha online) e **Comunidade** (comentários + contato).

## Rodar

```bash
npm install
npm start
```

Abra http://localhost:5173

## Onde editar

| O quê | Arquivo |
|---|---|
| E-mail de contato | `public/js/common.js` (`ASTER_CONFIG.email`) |
| Notícias, países, panteão, astros | `public/js/data-mundo.js` |
| Raças e classes | `public/js/data-personagens.js` (gerado do `racas-classes.csv` do Sheet-Maker) |
| Paleta / visual | `public/css/style.css` (tokens no `:root`) |
| Layout do PDF da ficha | `scripts/gerar-ficha-pdf.js` → `npm run ficha` regenera `public/docs/ficha-aster66.pdf` |
| Comentários salvos | `data/comments.json` (criado ao primeiro comentário) |

Novos PDFs para a página de Documentos: coloque em `public/docs/` e troque o botão "Em breve" em `documentos.html` por um link.

Todas as ilustrações são SVG desenhado à mão no código — nenhuma arte gerada por IA.

## Supabase

Projeto: `https://ocwwzbpsciytclqpkfxv.supabase.co` (o mesmo do Sheet-Maker, schema `fichas_jogador`).

O que vem do banco:
- **Raças e classes** (Explorar e ficha online) — `fichas_jogador.raca` / `classe`
- **Catálogo de cartas** (Explorar → Cartas) — `fichas_jogador.carta` e origens
- **Comentários** (Comunidade) — `public.comentario`
- **Login e fichas na nuvem** (ficha online) — Supabase Auth + `fichas_jogador.ficha_site`

Sem a chave configurada o site continua funcionando com os dados locais (sem cartas, sem login).

### Configurar (uma vez)
1. **SQL:** Dashboard → SQL Editor → cole `supabase/migracao-site.sql` → Run.
2. **Chave pública:** Dashboard → Project Settings → API Keys → copie a chave **anon / publishable**
   e cole em `.env` na linha `SUPABASE_ANON_KEY=`. Reinicie com `npm start`.
   O servidor recusa enviar ao navegador uma chave `service_role`/secret.
3. **Auth → URL Configuration:** adicione `http://localhost:5173` (e depois o domínio real) em
   *Site URL* / *Redirect URLs*, para os links de confirmação e de nova senha voltarem ao site.

Moderação de comentários: no Table Editor, marque `oculto = true` na linha do comentário.

## Publicação (GitHub Pages)

Site: https://felptb.github.io/Aster66-Site/

O GitHub Pages só serve arquivos estáticos, então o que vai para o ar é a pasta `public/`.
O workflow `.github/workflows/pages.yml` publica automaticamente a cada push na branch `main`.

Antes de commitar mudanças de biblioteca ou de chave, rode:

```bash
npm run build
```

Isso copia `supabase-js` e `pdf-lib` para `public/vendor/` e gera `public/js/config.js` a partir do `.env`
(só aceita a chave **pública** anon/publishable — é seguro ela ficar no repositório; quem protege os dados são as regras RLS).

No GitHub Pages os comentários e fichas usam só o Supabase (o `server.js` é apenas para desenvolvimento local).
