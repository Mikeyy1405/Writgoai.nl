# 🔧 Build Environment Variables

## Waarom Staat Er Een .env File In Het Project?

De `.env` file in `nextjs_space/.env` bevat **veilige placeholder waarden** die alleen worden gebruikt tijdens het **build proces**. Deze zijn NIET je echte productie credentials!

### ⚠️ Belangrijk Te Weten:

1. **Deze .env is VEILIG** - Het bevat alleen placeholder waarden zoals:
   ```
   STRIPE_SECRET_KEY=sk_test_BUILD_TIME_PLACEHOLDER
   DATABASE_URL=postgresql://localhost:5432/writgo_build
   ```

2. **Je Echte Credentials** staan in:
   - 📄 `WRITGO_ENVIRONMENT_VARIABLES.txt` (voor download)
   - 🔒 Render Dashboard Environment Variables
   - 🔐 `/home/ubuntu/.config/abacusai_auth_secrets.json` (on server)

3. **Git Bescherming:**
   - `.env` files worden **NOOIT** naar GitHub gepusht
   - `.gitignore` blokkeert alle `.env` files
   - Alleen `.env.example` is op GitHub (als template)

## Hoe Werkt Het?

### Build Time (Local/CI)
```bash
# Next.js build heeft environment variables nodig
# om alle API routes te kunnen compileren
# → Gebruikt placeholder waarden uit .env
```

### Runtime (Production op Render)
```bash
# De app draait met ECHTE credentials
# → Uit Render Environment Variables
# → NIET uit de lokale .env file!
```

## Voor Development

Als je lokaal wilt ontwikkelen:

1. **Kopieer je echte credentials** naar `nextjs_space/.env`:
   ```bash
   cp WRITGO_ENVIRONMENT_VARIABLES.txt nextjs_space/.env
   ```

2. **Update de waarden** met je lokale database:
   ```bash
   DATABASE_URL=postgresql://localhost:5432/writgo_dev
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Start de dev server:**
   ```bash
   cd nextjs_space
   yarn dev
   ```

## Voor Production (Render)

**Gebruik NOOIT de .env file op production!**

Configureer in plaats daarvan:
1. Ga naar Render Dashboard
2. Settings → Environment
3. Voeg ALLE variabelen toe uit `WRITGO_ENVIRONMENT_VARIABLES.txt`
4. Save Changes

Render laadt deze automatisch bij elke deploy.

## Security Checklist

- [x] `.env` staat in `.gitignore`
- [x] Build-time .env bevat alleen placeholders
- [x] Echte credentials staan in Render Environment Variables
- [x] Git history is schoongemaakt (secrets verwijderd)
- [x] Stripe keys zijn vervangen (oude waren gecompromitteerd)

---

**Status**: ✅ Veilig geconfigureerd voor build en deployment
