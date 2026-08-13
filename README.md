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
Per sincronitzar el calendari:
1. Ves a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un projecte → activa "Google Calendar API"
3. Crea una API Key (restringida a Calendar API)
4. Crea un fitxer `.env` a l'arrel del projecte:
```
VITE_GCAL_API_KEY=la_teva_api_key
VITE_GCAL_ID=primary
```
5. Reinicia el servidor dev

> Si ja has sincronitzat Apple Calendar amb Google Calendar,
> veuràs tots els events de les dues plataformes.

---

## Desplegar a Vercel (gratis)

### Opció A: des de GitHub
1. Puja el projecte a un repo GitHub
2. Ves a [vercel.com](https://vercel.com), fes login amb GitHub
3. "Import Project" → selecciona el repo
4. Framework: Vite. Build: `npm run build`. Output: `dist`
5. Afegeix les variables d'entorn (VITE_GCAL_API_KEY, etc.)
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

### Afegir backend (per escalar)
L'app ara usa `localStorage`. Per afegir sync entre dispositius:
1. Crea un projecte a [Supabase](https://supabase.com) (gratis)
2. Crea una taula `user_data` amb columnes: `id`, `date`, `data` (jsonb)
3. Substitueix les funcions `storage.get()` i `storage.set()` a App.jsx
   per crides a Supabase

### Domini custom
Compra un domini (p.ex. tincagenda.com, ~12€/any a Namecheap)
i connecta'l a Vercel: Settings → Domains → Add.

---

## Llicència
Projecte personal. Fes-ne el que vulguis.
