# Deploy lp-test para Vercel

**Guia rápido** para fazer deploy da landing page teste.

---

## 📋 Pré-Requisitos

- [ ] Conta GitHub (repo clonado ou criado)
- [ ] Conta Vercel (conectada ao GitHub)
- [ ] Schema criado em Supabase
- [ ] Credenciais Supabase prontas
- [ ] Pixel ID da Meta

---

## 🚀 Passo 1: Conectar Repo ao GitHub

```bash
cd /path/to/lp-test

# Se não tem git ainda:
git init

# Adicionar ao GitHub:
# 1. Criar repo vazio no GitHub (https://github.com/new)
# 2. Nome: lp-test (ou seu_cliente)
# 3. Não inicializar com README

git remote add origin https://github.com/SEU_USER/lp-test.git
git add .
git commit -m "Initial commit: landing page template v2"
git branch -M main
git push -u origin main
```

---

## 🔗 Passo 2: Conectar Vercel ao GitHub

1. Ir em **https://vercel.com/dashboard**
2. Clicar **"Add New..." > "Project"**
3. Procurar repo `lp-test`
4. Clicar **"Import"**
5. Vercel importa automaticamente

---

## ⚙️ Passo 3: Configurar Environment Variables

No painel Vercel que abriu:

1. Ir em **"Environment Variables"**
2. Para CADA variável, adicionar:

```
Name: NEXT_PUBLIC_META_PIXEL_ID
Value: 1034449309557577
Environments: ✓ Production ✓ Preview ✓ Development
Click: Save

Name: NEXT_PUBLIC_SCHEMA_ID
Value: eng_pratice
Environments: ✓ Production ✓ Preview ✓ Development
Click: Save

Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://pyagqbqzyksbiutkeyzk.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development
Click: Save

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGc...
Environments: ✓ Production ✓ Preview ✓ Development
Click: Save

Name: NEXT_PUBLIC_WHATSAPP_NUMBER
Value: 5588996758647
Environments: ✓ Production ✓ Preview ✓ Development
Click: Save
```

---

## 📦 Passo 4: Deploy

Após adicionar env vars:

1. Clicar **"Deploy"**
2. Aguardar 2-3 minutos (build automático)
3. Deve aparecer: ✅ **"Deployment successful"**
4. Clicar em URL para abrir em produção

---

## ✅ Validação Pós-Deploy

Após deploy bem-sucedido:

```bash
# 1. Acessar URL de produção
https://lp-test-xxxx.vercel.app

# 2. DevTools (F12)
- Console: fbq definido?
- Cookies: _fbp, _fbc?
- Network: POST /api/pageview retorna 200?

# 3. Supabase
- Acessar seu_schema > cliques_landing
- Deve haver nova linha com dados
- fbclid, utm_*, ref_id preenchidos?

# 4. Clicar Botão WhatsApp
- Redireciona para wa.me?
- clicou_wpp_at preenchido em Supabase?
```

---

## 🔄 Atualizações Futuras

Sempre que mudar código:

```bash
git add .
git commit -m "Fix: descrição da mudança"
git push origin main

# Vercel auto-deploya (sem fazer nada!)
```

---

## 🐛 Se Deploy Falhar

Ir em **Vercel > Deployments > Failed > View Logs**

Erros comuns:
- `NEXT_PUBLIC_* not found` → Verificar env vars
- `Module not found` → Rodar `npm install`
- `Port already in use` → Mudar porta

---

## 📝 Resumo

| Etapa | Duração | Status |
|-------|---------|--------|
| GitHub push | 1 min | ✅ |
| Vercel import | 2 min | ✅ |
| Add env vars | 2 min | ✅ |
| Deploy | 3 min | ✅ |
| Validação | 5 min | ✅ |

**Total: ~15 minutos**

---

**Pronto!** Landing page em produção 🚀
