# Tinc Agenda

Sistema operatiu personal — arbitratge, feina, vida.

## Posar-ho en marxa (5 minuts)

### 1. Requisits
- [Node.js](https://nodejs.org/) v18+ instal·lat

### 2. Instal·lar dependències
```bash
cd tinc-agenda
npm install
```

### 3. Executar en local
```bash
npm run dev
```
Obre `http://localhost:5173` al navegador.

### 4. Google Calendar (opcional)
La sincronització usa OAuth (inici de sessió amb Google), no una API key —
necessari per llegir el teu calendari privat (no un de públic):

1. Ves a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un projecte → "APIs & Services" → activa **Google Calendar API**
3. "APIs & Services" → **OAuth consent screen** → tipus "External", estat
   **Testing** (no cal verificació de Google per a ús personal) → afegeix el
   teu propi correu com a "Test user"
4. "APIs & Services" → **Credentials** → "Create Credentials" → **OAuth
   client ID** → tipus "Web application"
   - Authorized JavaScript origins: `http://localhost:5173` (i el domini de
     producció quan el desplega'ls, p.ex. `https://tincagenda.com`)
5. Copia el "Client ID" i crea un fitxer `.env` a l'arrel del projecte:
```
VITE_GOOGLE_CLIENT_ID=el-teu-client-id.apps.googleusercontent.com
```
6. Reinicia el servidor dev. La primera vegada que premis "Connectar"
   t'apareixerà el diàleg de consentiment de Google.

> Com que Apple Calendar ja sincronitza (en un sol sentit) cap a Google
> Calendar, connectar només amb Google ja et mostra els events de les dues
> plataformes — no cal cap integració addicional amb Apple.

---

## Desplegar a Vercel (gratis)

### Opció A: des de GitHub
1. Puja el projecte a un repo GitHub
2. Ves a [vercel.com](https://vercel.com), fes login amb GitHub
3. "Import Project" → selecciona el repo
4. Framework: Vite. Build: `npm run build`. Output: `dist`
5. Afegeix les variables d'entorn (VITE_GOOGLE_CLIENT_ID, etc.) — i afegeix el domini de Vercel a "Authorized JavaScript origins" del Client ID a Google Cloud Console
6. Deploy → ja tens URL pública

### Opció B: des de la terminal
```bash
npm i -g vercel
vercel
```
Segueix les instruccions. En 30 segons tens URL.

---

## Instal·lar al iPhone

Un cop desplegat:
1. Obre la URL a **Safari** (no Chrome)
2. Toca el botó **Compartir** (quadrat amb fletxa)
3. **Afegir a la pantalla d'inici**
4. Ja la tens com una app nativa — pantalla completa, sense barra de Safari

---

## Estructura del projecte

```
tinc-agenda/
├── index.html          ← Entry point HTML
├── package.json        ← Dependències
├── vite.config.js      ← Config Vite + PWA
├── public/
│   ├── icon.svg        ← Icona del navegador
│   ├── icon-192.png    ← Icona PWA (substitueix-la!)
│   └── icon-512.png    ← Icona PWA gran
└── src/
    ├── main.jsx        ← Entry point React
    ├── index.css       ← Estils globals
    └── App.jsx         ← Tota l'app
```

---

## Personalitzar

### Canviar icona
Substitueix `icon-192.png` i `icon-512.png` per les teves icones
(amb fons transparent o del color que vulguis).

### Sync entre dispositius (Supabase, opcional)
L'app usa `localStorage` per defecte. Per afegir sync entre dispositius amb login per enllaç màgic:
1. Crea un projecte a [Supabase](https://supabase.com) (gratis)
2. Obre l'editor SQL del projecte i executa el contingut de `supabase/schema.sql`
   (crea la taula `user_data` amb Row Level Security per usuari)
3. Assegura't que el proveïdor "Email" (magic link) està activat a
   Authentication → Providers
4. Crea un fitxer `.env` (pots partir de `.env.example`) amb:
```
VITE_SUPABASE_URL=https://el-teu-projecte.supabase.co
VITE_SUPABASE_ANON_KEY=la_teva_anon_key
```
5. Reinicia el servidor dev — ara l'app demanarà login per email abans d'entrar,
   i les dades es guarden tant en local (còpia offline) com a Supabase.

Sense aquestes variables, l'app funciona exactament igual que abans (només local).

### Domini custom
Compra un domini (p.ex. tincagenda.com, ~12€/any a Namecheap)
i connecta'l a Vercel: Settings → Domains → Add.

---

## Llicència
Projecte personal. Fes-ne el que vulguis.
