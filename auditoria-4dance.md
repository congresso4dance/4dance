# Auditoria do 4Dance — o que falta pra ficar 100%

Revisão do código inteiro (site público, checkout, portal do fotógrafo, portal do produtor, admin) mais teste ao vivo em produção. Organizado por prioridade: primeiro o que está quebrado ou incompleto de verdade, depois o que eu melhoraria em UX/UI e experiência do cliente.

## 1. Bug ativo, achei agora — evento "escondido" ainda fica acessível quebrado

Quando escondemos os 14 eventos antigos (`is_public = false`) pra tirar da listagem, a página de galeria de cada evento (`/eventos/[slug]`) não checa esse campo — ela busca só por `slug`. Resultado: quem tiver o link antigo (favorito salvo, WhatsApp, Google) ainda abre a página normalmente, com título e tudo, mas a grade de fotos aparece toda quebrada (testei ao vivo em `/eventos/reduto-da-gafieira-bday-ariel-muniz-248` e confirmei — dezenas de "Foto 4Dance" sem imagem). É pior do que um 404 limpo. Fix é simples: a mesma página já usa `notFound()` quando o evento não existe — só falta o mesmo tratamento quando `is_public` é `false`. Posso implementar isso a qualquer momento, é baixo risco.

## 2. Feature incompleta e exposta ao cliente

`/portal-fotografo/site` é um placeholder puro: "Em Construção... Em breve você poderá personalizar seu site próprio aqui." Se esse link estiver visível no menu do fotógrafo, todo fotógrafo que clicar cai numa página morta. Ou termina essa feature ou tira o link do menu até estar pronta.

## 3. Elemento de UI decorativo que não funciona

No painel do fotógrafo (`/portal-fotografo`), o seletor "Real (R$) / Dólar (US$)" no card da Carteira não está ligado a nada — é um `<select>` solto, sem `onChange`, sem conversão de moeda em lugar nenhum do sistema. Ou remove (o site é 100% BRL hoje) ou implementa de verdade. Do jeito que está, parece bug pra quem usa.

## 4. Zero automação de qualidade

Não existe pipeline de CI (`.github/workflows` não existe) — cada push vira deploy direto em produção sem nenhum teste ou lint rodando antes. Existe um único arquivo de teste (`src/__tests__/security.test.ts`, cobre autenticação de server actions e proteção contra SSRF) mas não há `jest.config` nem `vitest.config` nem script `test` no `package.json` — ou seja, hoje ninguém consegue nem rodar esse teste. Pra uma plataforma que mexe com pagamento e dado de cliente, isso é risco real: qualquer regressão só é descoberta depois que já foi pro ar (foi basicamente o que aconteceu com a migração de fotos).

## 5. SEO básico ausente

Não tem `robots.txt` nem `sitemap.xml` em lugar nenhum (nem estático em `public/`, nem gerado via `src/app/sitemap.ts`). As páginas individuais têm metadata bem feita (`generateMetadata`, Open Graph, Twitter card), o que é ótimo — só falta esses dois arquivos pra Google indexar direito e não desperdiçar crawl budget.

## 6. Compra: foto cheia acessível sem comprar (comportamento pré-existente, decisão de negócio)

Isso não é bug introduzido agora, é assim desde antes: a galeria (`GalleryContent.tsx`) mostra `full_res_url` pra qualquer visitante no lightbox, sem checar se a foto foi comprada — o controle de compra real só existe na rota de download (`/api/photos/get-download-url`), que aí sim verifica pedido pago antes de gerar o link. Ou seja: hoje dá pra ver a foto em alta na tela (e printar/salvar via clique direito) sem pagar; só o *download oficial em HD com nome de arquivo* é que é bloqueado. Se isso for intencional (mostrar pra atrair a compra, tipo vitrine), tudo bem — só quero deixar registrado que é uma escolha, não proteção técnica real contra "salvar a imagem".

## 7. Portal do produtor: sem autoatendimento pra vincular eventos antigos

Quando um produtor não tem nenhum evento vinculado ao perfil, a tela mostra "Entre em contato com a plataforma para vincular seus eventos". Existe fluxo de criar evento novo (`/portal-produtor/novo-evento`, parece completo), mas pra eventos já existentes no banco sem `producer_id`, o vínculo é manual (só você, via banco). Se pretende escalar o número de produtores, vale um fluxo de "reivindicar evento" ou pelo menos uma tela de admin pra fazer esse vínculo sem precisar mexer no SQL.

## 8. Indexação facial depende do navegador aberto

Mesmo com a automação que acabamos de implementar (indexa sozinho depois do upload, sem precisar clicar em botão separado), a detecção de rosto roda no navegador (face-api.js), então a aba do admin precisa ficar aberta até terminar. Pra eventos grandes (milhares de fotos) isso pode levar minutos. Não é bug, é limite da arquitetura atual — migrar pra um worker no servidor resolveria de vez, mas como conversamos, as libs de reconhecimento facial em Node têm dependência nativa (canvas/tensorflow) que costuma quebrar build na Vercel; precisaria de uma abordagem diferente (ex: um serviço externo de detecção facial via API, tipo AWS Rekognition ou similar) se quiser tirar essa dependência do navegador no futuro.

## 9. Coisas menores que notei

- O dashboard do admin (`/admin`) tem duplicação de navegação (menu no topo E na lateral fazendo a mesma coisa) e um card ("Buscas Realizadas") com um bloco de gradiente cortado à direita que parece elemento de gráfico não renderizando — vale um clique mais de perto.
- `public/favicon.png` existe mas não vi ícones para PWA/Apple touch icon nem `manifest.json` customizado além do `manifest.webmanifest` gerado pelo Next — se quiser que o site seja "instalável" (adicionar à tela inicial no celular) de forma bonita, falta isso.
- Toda a responsividade mobile eu não consegui validar de forma confiável pelas minhas ferramentas de automação (o resize de viewport não surtiu efeito visível nos screenshots) — recomendo um teste manual rápido no seu celular pelas páginas principais (home, galeria, checkout, minhas-fotos) antes de considerar "pronto".

## O que eu melhoraria em UX / experiência do cliente (opinião, não bug)

Isso aqui já está bem construído — checkout com PIX/cartão, reconhecimento facial, portal de fotógrafo com Stripe Connect, tudo funcional. As sugestões abaixo são polimento, não conserto:

O fluxo "Encontre suas fotos" (busca por selfie) é o grande diferencial do produto — vale destacar ainda mais isso na home e no /eventos, com um call-to-action fixo ou banner, em vez de só o texto de introdução. Hoje ele está um pouco escondido dentro de cada página de evento.

A galeria de evento mistura muita informação na mesma tela (busca facial, busca por nome de arquivo, upload de foto pelo cliente, favoritos, carrinho) — pode valer simplificar visualmente pra quem chega pela primeira vez, com um passo a passo mais guiado (a seção "Como funciona" já existe na home, mas não aparece dentro da galeria em si).

No portal do fotógrafo, o "Simulador de Ganhos" e outros elementos gamificados (banner "evolua seu plano") são um toque legal, mas misturam propaganda com dado real — cuidado pra não parecer intrusivo pra quem só quer ver o saldo.

## Resumo — prioridade sugerida

Primeiro os itens 1 e 4 (bug real ao vivo + zero rede de segurança pra próximas mudanças), depois 5 (SEO, é barato e rápido), depois 2 e 3 (limpar o que está pela metade), e o resto conforme o tempo permitir. Me avisa quais desses você quer que eu já vá resolvendo.
