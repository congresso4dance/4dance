# Auditoria de segurança, banco de dados e LGPD — 4Dance

Data: 29/07/2026. Revisão código-por-código do repositório (`4dance`) e do banco de produção (Supabase, projeto `pxvcgautbaobysvhyfzi`) via SQL direto. Achados ordenados por severidade real (o que alguém consegue explorar hoje, sem precisar de acesso privilegiado).

**Atualização: todos os itens abaixo já foram corrigidos.** Deixei marcado `[CORRIGIDO]` em cada um, com o que foi feito de verdade — inclusive uma correção no meu próprio diagnóstico do item 2, que na primeira leitura eu superestimei.

---

## CRÍTICO — explorável agora, sem ser admin

### 1. Reconhecimento facial (dados biométricos) legível por qualquer pessoa, sem login `[CORRIGIDO]`

A tabela `photo_faces` guarda os *embeddings* faciais (a representação matemática do rosto de cada pessoa fotografada — dado biométrico sensível pela LGPD, Art. 11). Ela tinha RLS habilitado, mas existia uma política:

```
Public read faces | SELECT | roles: {anon} | qual: true
```

Isso permitia que **qualquer pessoa na internet**, sem estar logada, lesse a tabela inteira via API REST do Supabase. Além disso, existia uma segunda política `Admin manage faces` com `roles: {authenticated}` e `qual: true` — qualquer conta logada tinha acesso total (ler, alterar, apagar).

Sua política de privacidade (`/privacidade`) diz que esses dados são "processados e armazenados de forma criptografada" — o acesso estava, na prática, aberto, contradizendo o que está declarado.

**O que foi feito:** removidas as políticas `Public read faces` e `Admin manage faces`. Criada uma política nova, só de `INSERT`, liberada apenas para `owner`/`admin`/`editor`/`assistant`/`photographer` (necessário pra indexação automática continuar funcionando depois do upload). Leitura, alteração e exclusão continuam restritas só a `owner`/`admin` via `Bloqueio total photo_faces` (que já existia).

### 2. Foto "HD" paga podia ser baixada de graça — mas não onde eu disse na primeira vez `[CORRIGIDO]`

Na primeira passada eu apontei a página principal da galeria como a origem do problema. Errado — conferi de novo com calma e a página principal (`eventos/[slug]/page.tsx`) **já troca corretamente** `full_res_url` por `thumbnail_url` (640px) pra eventos pagos antes de mandar qualquer coisa pro navegador. Essa parte sempre esteve certa.

O problema real estava em outro lugar: a rota usada pelo "carregar mais fotos" da rolagem infinita (`/api/events/[id]/photos/route.ts`) decidia se devia esconder o `full_res_url` com base num parâmetro `is_paid` **mandado pelo próprio navegador na URL** (`?is_paid=true`), em vez de checar o campo `is_paid` real do evento no banco. Bastava chamar a mesma rota manualmente com `is_paid=false` (ou sem o parâmetro) pra receber de volta o arquivo original de 2400px, sem marca d'água, de qualquer evento pago — sem estar logado, sem ter comprado nada.

**O que foi feito:** a rota agora busca o `is_paid` direto do banco (`events.is_paid`, pelo `id` da URL, que não dá pra falsificar) e ignora completamente o que vier da query string. Também limpei a chamada no front-end que mandava esse parâmetro à toa.

### 3. Qualquer conta logada podia apagar/alterar fotos e eventos de qualquer fotógrafo `[CORRIGIDO]`

Nas tabelas `photos` e `events` existia, ao lado da política correta (`is_admin()`), uma segunda política redundante:

```
Full access for authenticated admins | ALL | roles: {public} | qual: (auth.role() = 'authenticated')
```

O nome sugeria "só admins", mas a condição real só conferia se a pessoa estava logada — não o cargo. Isso liberava qualquer conta comum pra `UPDATE`/`DELETE`/`INSERT` em qualquer linha de `photos` ou `events`, de qualquer fotógrafo.

O mesmo padrão se repetia em mais 5 tabelas:

| Tabela | Política com o bug | Efeito |
|---|---|---|
| `system_settings` | "Admins can manage settings" (ALL) | Qualquer conta logada altera configurações globais |
| `crm_activities` | "Admins can manage crm_activities" (ALL) | Qualquer conta logada lê/altera CRM |
| `admin_logs` | "Admins can manage admin logs" (ALL) | Qualquer conta logada lê/apaga o log de auditoria |
| `testimonials` | "Full access for authenticated admins" (ALL) | Qualquer conta logada cria/apaga depoimentos |
| `search_logs` | "Admins can view search logs" (SELECT) | Qualquer conta logada lê todos os logs de busca |

**O que foi feito:** confirmei antes que `is_admin()` só cobre `owner`/`admin` (não `editor`/`assistant`/`photographer`), e que o app escreve em `photos`/`events` direto do navegador em alguns fluxos legítimos (painel admin pra `editor`/`assistant`, e o fotógrafo criando/gerenciando o próprio evento e as próprias fotos). Por isso, em vez de só apagar a política, troquei por uma condição precisa em cada tabela:

- `photos` / `events`: `is_admin() OR cargo IN ('editor','assistant') OR dono da linha (photographer_id = você)`.
- `system_settings` / `crm_activities`: removida a política solta (já existia uma correta cobrindo o mesmo caso).
- `admin_logs`: separada em duas — qualquer autenticado pode inserir *só o próprio* registro de log, mas só `owner`/`admin` conseguem ler.
- `testimonials`: `is_admin() OR cargo IN ('editor','assistant')` — o mesmo critério que a Server Action já usava pra deixar entrar no botão de criar/apagar depoimento.
- `search_logs`: leitura restrita a `is_admin()`.

Testei mentalmente contra cada uso real no código (upload de fotógrafo, indexação facial, criação de evento pelo fotógrafo, admin apagando fotos/eventos, criação/exclusão de depoimentos) — nenhum desses fluxos deveria quebrar.

---

## ALTO

### 4. O middleware de segurança do site inteiro nunca rodava `[CORRIGIDO]`

`src/proxy.ts` continha toda a lógica de proteção de rotas (`/admin`, `/portal-fotografo`, `/portal-produtor`, `/minha-conta`), CSP, HSTS e rate limiting — mas o Next.js só reconhece um middleware se o arquivo se chamar **`middleware.ts`**. Com o nome errado, o arquivo inteiro era ignorado, silenciosamente. Isso incluía a checagem de "só `owner`/`admin` entra em `/admin/settings`, `/admin/crm` e `/admin/recovery`" — que conferi, não existe replicada em nenhuma dessas 3 páginas.

**O que foi feito:** renomeado para `src/middleware.ts`. Rodei `tsc --noEmit` depois — build limpo. A partir do próximo deploy, essa checagem de owner-only volta a valer, junto com CSP, HSTS e o rate limiting simples que já existia.

### 5. `/api/send-email` podia virar relay de spam `[CORRIGIDO]`

A rota checava se a requisição era "interna" pelo header `Origin` — mas ausência do header (comum em chamadas fora do navegador) já contava como "interno" automaticamente. Dava pra chamar a rota de fora e mandar e-mail (template de boas-vindas) pra qualquer endereço, usando a conta Resend e o domínio do 4dance, sem limite de volume.

**O que foi feito:** a rota agora exige um `userId` e valida, usando a Admin API do Supabase (chave de service role), que esse `userId` corresponde a uma conta real, que o e-mail bate com o cadastrado, e que a conta foi criada há no máximo 15 minutos (essa rota só existe pra mandar o e-mail de boas-vindas logo após o cadastro). O front-end do cadastro (`/cadastro`) foi ajustado pra mandar esse `userId` junto.

---

## MÉDIO — ainda pendente (baixo risco, sem pressa)

### 6. Migrations SQL conflitantes acumuladas na raiz do repo

Pelo menos 8 arquivos `.sql` soltos na raiz (`db_migration_elite.sql`, `fix_security_rls_final.sql`, `migration_photographer_area.sql`/`_v2`, `migration_ecosystem_v2.sql`, `ecosystem_upgrade_v2.sql`, `storage_and_lgpd_hardening.sql`, `sovereign_audit_logs.sql`, `docs/security-hardening.sql`), com definições que se sobrepõem e às vezes se contradizem. Não é uma falha de segurança em si, mas é terreno fértil pra próxima migration desfazer algo sem querer.

**Sugestão (não apliquei ainda):** mover pra uma pasta `migrations/archive` ou apagar os já superados.

### 7. Projeto Vercel duplicado

Existe um segundo projeto Vercel (`agnaldomoitas-projects`) apontando pro mesmo repositório, sem domínio conectado, travando em `BLOCKED` a cada push. Não afeta o site real (`congresso4dances-projects`), mas vale apagar pra não confundir de novo. Isso só dá pra fazer pelo próprio dashboard do Vercel (não tenho acesso de exclusão por aqui).

---

## O que já estava bem-feito

- Segredos: nenhuma chave, senha ou `.env` commitado no git.
- Webhook do Stripe valida a assinatura corretamente.
- Rotas administrativas de foto (`upload-photo`, `delete-photos`, `migrate-photos-to-r2`, `upload-photo/confirm`) checam autenticação e cargo no servidor.
- `/api/photos/get-download-url` (o fluxo de compra) está bem implementado: checa se o evento é pago, se existe pedido pago daquele usuário pra aquela foto, e só então gera URL assinada com expiração de 1h.
- A página principal da galeria já protegia corretamente o preview de fotos pagas (meu erro inicial foi apontar o lugar errado, não a proteção em si).
- RLS habilitado em todas as 15 tabelas públicas.
- Política de privacidade e de cookies existem, mencionam de verdade o reconhecimento facial e a base legal (LGPD), e o Google Analytics só carrega depois do consentimento aceito no banner.
- `leads`, `orders`, `revenue_splits`, `user_profiles` já tinham políticas de RLS coerentes.

---

## Status final

Todos os itens críticos e altos (1 a 5) estão corrigidos e verificados (`tsc --noEmit` limpo depois de cada mudança de código). Faltam só os dois itens médios (6 e 7), que são faxina/organização, sem urgência. O código ainda precisa ser commitado e enviado — nada disso foi publicado em produção ainda.
