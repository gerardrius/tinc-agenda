# Pla — activar autenticació real (Supabase) i retirar el secret compartit

Document d'execució per al model que faci aquesta feina. Llegeix-lo sencer
abans de tocar res: l'ordre dels passos és el que evita quedar-te tancat
fora de la teva pròpia API i, sobretot, el que evita perdre dades.

## Context: per què existeix aquest pla

L'app té dades personals reals (finances, son, ubicació, informes arbitrals)
darrere de 10 rutes `api/*.js`. Fins al commit `c6397db` aquestes rutes eren
URLs públiques sense cap comprovació: `curl https://tinc-agenda.vercel.app/api/finances`
retornava el patrimoni net real de l'usuari.

El pegat actual (`api/_auth.js`) comprova un **secret compartit**
(`VITE_API_ACCESS_TOKEN`) que viu dins del bundle del client. Tanca el forat
obvi, però qualsevol que inspeccioni el JS de l'app el pot extreure i reutilitzar
indefinidament. No hi ha usuaris, ni caducitat, ni revocació.

L'objectiu d'aquest pla és substituir-lo per una sessió Supabase real i
per-usuari.

## Estat actual del codi: gairebé tot ja està escrit, però mai s'ha activat

Això és important — **no cal construir l'autenticació des de zero**. Ja existeix
i està adormida perquè `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` estan
configurades a Vercel amb **valors buits** (verificat en producció: un header de
diagnòstic va retornar `x-debug-key-len: 0`). Per això l'app mai ha mostrat
pantalla de login tot i tenir-la implementada.

| Peça | Fitxer | Estat |
|---|---|---|
| Esquema + RLS | `supabase/schema.sql` | Escrit i correcte. Taula `user_data(user_id, date, data jsonb)`, RLS activat, 4 polítiques per `auth.uid()`. **Mai executat.** |
| Client Supabase | `src/lib/supabaseClient.js` | Fet. `isSupabaseConfigured` = `Boolean(url && anonKey)`. |
| Sync remot | `src/lib/remoteStorage.js` | Fet: `fetchAll`, `upsertEntry`, `signInWithMagicLink`, `signOut`, `getSession`, `onAuthStateChange`. |
| Pantalla de login | `src/components/AuthScreen.jsx` | Feta (formulari d'enllaç màgic). |
| Porta a la UI | `src/App.jsx:307` | Feta: `if (isSupabaseConfigured && !session) return <AuthScreen />;` |
| Escriptura dual local+remot | `src/App.jsx` (`persistDates`, `saveGlobal`) | Feta. |
| Porta a l'API | `api/_auth.js` | Secret compartit, falla tancat. **Això és el que has de substituir.** |

En el moment que les dues variables d'entorn tinguin valors reals, tot aquest
codi s'activa de cop. **Aquesta és exactament la situació perillosa** — llegeix
el risc 1 abans de configurar res.

---

## Decisions a prendre amb l'usuari abans de començar

No comencis sense resoldre aquestes dues. Són decisions de producte, no
tècniques, i la segona afecta l'ús diari de l'app.

### Decisió 1 — mètode de login: codi OTP, enllaç màgic o contrasenya

**Recomanació: codi OTP de 6 dígits.** Motiu tècnic concret: l'app corre com a
app nativa via Capacitor (`ios/`), i dins d'un WKWebView l'enllaç màgic **es
trenca**. El correu s'obre a Mail → Safari → el lloc https, que no és l'app
nativa; l'usuari acabaria amb sessió al navegador i l'app nativa seguiria sense
sessió. És exactament la mateixa classe de problema que ja està documentat a
`src/lib/googleAuth.js:6-13` per al popup d'OAuth de Google, i que allà es va
haver de resoldre amb un esquema d'URL custom i una pàgina pont
(`public/oauth-callback.html`).

El codi OTP no té cap redirecció, així que funciona idènticament al navegador,
a la PWA i al WebView, sense configurar Redirect URLs ni deep links.

Alternativa raonable si l'usuari prefereix no dependre del correu cada cop:
**contrasenya única** (`signInWithPassword`) guardada al clauer de l'iPhone, amb
Face ID. Un sol usuari, cap correu, login instantani.

L'enllaç màgic (el que hi ha ara implementat) només té sentit si es descarta
l'app nativa i es queda tot en PWA.

### Decisió 2 — porta dura o porta tova quan no hi ha sessió

Ara mateix `src/App.jsx:307` és una **porta dura**: sense sessió, l'usuari no
veu res, ni tan sols les seves dades locals.

En una app d'ús diari des del mòbil això vol dir que un token de refresc caducat,
un vol sense connexió o una incidència de Supabase deixen l'usuari **sense accés a
la seva pròpia agenda del dia**. Per a un àrbitre que la fa servir el dia del
partit, això és un mode de fallada real, no teòric.

Alternativa: **porta tova** — les dades locals (`localStorage`) segueixen sent la
font de veritat de la UI i es veuen sempre; la sessió només cal per sincronitzar
i per cridar `api/*`. Sense sessió, l'app funciona en local i mostra un avís
discret ("sense sincronitzar"). Les crides a `api/*` fallen amb 401 i les seccions
que depenen de BigQuery (Finances, Son, Arbitratge) mostren el seu estat d'error,
que ja està implementat.

Pregunta-ho explícitament. No decideixis tu: l'usuari ha dit que la seguretat de
les dades és un guardrail del projecte, i una porta tova és un compromís
conscient entre seguretat i disponibilitat que li pertoca a ell.

---

## Riscos crítics

### Risc 1 — pèrdua de dades a la primera sessió (el més greu)

`src/App.jsx:75-77` fa, quan detecta sessió:

```js
const loadRemote = async (userId) => {
  try { applyRaw(await fetchAll(userId)); }
  ...
```

`applyRaw` **substitueix** tot l'estat (`setAllData(d)`, `setDay(...)`). El
primer dia, Supabase està buit → `fetchAll` retorna `{}` → l'app es queda en
blanc i, a partir d'aquí, cada escriptura puja dies buits. L'historial local no
s'esborra del `localStorage` immediatament, però l'usuari veu l'app buida i
qualsevol edició posterior consolida l'estat buit.

**Obligatori abans d'activar Supabase:** implementa una migració única.

1. Abans del primer `fetchAll`, llegeix `storage.get()` (local).
2. Si Supabase retorna 0 files i local en té, puja **totes** les entrades locals
   amb `upsertEntry` (incloent `_global`) i només llavors continua.
3. Si les dues bandes tenen dades, la política per defecte ha de ser **no
   destructiva**: fusiona per clau de data, i davant d'un conflicte a la mateixa
   data, conserva la versió local i registra-ho per consola. No inventis una
   estratègia de "l'últim guanya" per timestamp sense preguntar — `updated_at`
   només existeix al costat remot.
4. Fes una còpia de seguretat abans de res: exporta `localStorage` a un fitxer
   JSON i deixa'l al disc de l'usuari. És una línia de codi i converteix aquest
   risc en reversible.

No consideris la fase 1 acabada fins que hagis verificat, amb dades reals de
l'usuari, que després del primer login es veuen tots els dies que es veien abans.

### Risc 2 — quedar-te tancat fora de la teva pròpia API

El servidor i el client es despleguen alhora (mateix commit), però **l'app nativa
no**: el bundle JS està empaquetat dins l'app iOS i només s'actualitza amb
`npx cap sync ios` + rebuild a Xcode + reinstal·lació al dispositiu.

Si canvies `api/_auth.js` perquè només accepti JWT de Supabase i despleges, la
web funcionarà i **l'app de l'iPhone deixarà de funcionar** fins que l'usuari
reinstal·li. Per això la migració ha de ser en tres fases amb un període on el
servidor accepta els dos mètodes.

### Risc 3 — plantilla de correu de Supabase sense el codi

Si es tria OTP: per defecte la plantilla "Magic Link" de Supabase només conté
l'enllaç, **no el codi**. Cal editar-la (Authentication → Email Templates) perquè
inclogui `{{ .Token }}`. Si no ho fas, l'usuari rep un correu sense cap codi i
sembla que l'OTP "no funciona". És un dels errors més freqüents d'aquesta
integració.

### Risc 4 — no facis servir mai la `service_role` key al client

L'`anon key` és pública per disseny i està protegida per RLS: pot anar al bundle
sense problema. La `service_role` key salta RLS i no ha de sortir mai del servidor
— i en aquest pla **no la necessites enlloc**. Si en algun moment et sembla que et
cal per fer funcionar alguna cosa, atura't: vol dir que RLS està mal configurat.

---

## Passos manuals de l'usuari (no automatitzables)

L'agent no pot fer-los. Demana-li a l'usuari que els faci i espera confirmació.

1. Crear projecte a [supabase.com](https://supabase.com) (pla gratuït suficient).
2. SQL Editor → executar el contingut de `supabase/schema.sql` sencer.
3. Authentication → Providers → Email: activat. Si s'ha triat OTP, editar la
   plantilla perquè inclogui `{{ .Token }}` (vegeu risc 3).
4. Copiar Project URL i `anon` key (Settings → API).
5. Posar-les a Vercel, **Production i Preview**:
   ```bash
   vercel env rm VITE_SUPABASE_URL production      # les actuals són buides
   vercel env rm VITE_SUPABASE_ANON_KEY production
   vercel env add VITE_SUPABASE_URL production
   vercel env add VITE_SUPABASE_ANON_KEY production
   # repetir amb `preview`
   ```
   Nota per a l'agent: en aquest entorn, executar `vercel env add` des de l'eina
   Bash ha estat **bloquejat pel classificador de permisos**. No intentis
   esquivar-ho; passa-li les comandes a l'usuari perquè les executi ell.
6. Confirmar que `vercel env ls` ja no mostra valors buits (o simplement seguir
   la verificació de la fase 1, que ho detecta).

---

## Fases d'implementació

Respecta l'ordre. Cada fase té una condició de sortida; no passis a la següent
sense complir-la.

### Fase 0 — xarxa de seguretat

- Exporta i desa una còpia del `localStorage` actual de l'usuari (JSON al disc).
- Confirma que `git status` està net i que `main` està al dia.

**Sortida:** existeix una còpia de seguretat verificable de les dades actuals.

### Fase 1 — activar Supabase només per a dades, sense tocar l'API

- Implementa la migració del risc 1 a `src/App.jsx` (`loadRemote` / `applyRaw`).
- Amb les env vars ja posades, desplega i fes que l'usuari iniciï sessió una
  vegada a la web.
- `api/_auth.js` **segueix intacte** amb el secret compartit durant tota aquesta
  fase.

**Sortida:** l'usuari fa login, veu **tot** el seu historial, i les taules de
Supabase contenen les seves dades (comprova-ho al Table Editor). Si falta un sol
dia, atura't i arregla-ho aquí.

### Fase 2 — el servidor accepta JWT **o** secret compartit

A `api/_auth.js`, accepta les dues vies:

```js
// Ordre: primer la sessió real; el secret compartit es manté només com a pont
// per a l'app nativa fins que estigui reconstruïda (fase 3).
export async function requireUser(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) { res.status(401).json({ error: "unauthorized" }); return false; }

  const authClient = getAuthClient();            // VITE_SUPABASE_URL + ANON_KEY
  if (authClient) {
    const { data, error } = await authClient.auth.getUser(token);
    if (!error && data?.user) return true;
  }

  const secret = process.env.VITE_API_ACCESS_TOKEN;
  if (secret && token === secret) return true;

  res.status(401).json({ error: "unauthorized" });
  return false;
}
```

Manté el **fail-closed**: si no hi ha ni client d'auth ni secret configurats, ha
de retornar 401/500, mai `true`. La versió anterior d'aquest fitxer passava de
llarg quan Supabase no estava configurat, i per això el primer intent de fix no
protegia absolutament res tot i semblar correcte.

A `src/lib/apiClient.js`, envia el JWT de la sessió i cau al secret compartit
només si no hi ha sessió:

```js
const { data } = await supabase.auth.getSession();
const token = data.session?.access_token || import.meta.env.VITE_API_ACCESS_TOKEN;
```

Sobre el cost de `getUser()`: fa una crida de xarxa a Supabase per cada petició
(~100-200 ms). Per al volum d'aquesta app és perfectament acceptable i és
l'opció correcta i simple. Si algun dia molesta, l'optimització és verificar la
signatura del JWT localment (JWKS + `jose`), no cachejar el resultat de forma
casolana.

**Sortida:** `curl` sense capçalera → 401. `curl` amb el secret antic → 200.
`curl` amb un `access_token` real de sessió → 200. La web i l'app nativa
funcionen les dues.

### Fase 3 — reconstruir l'app nativa

- `npm run build && npx cap sync ios`, rebuild a Xcode, instal·lar al dispositiu.
- Verificar que l'app nativa fa login i que les seccions de BigQuery carreguen.

**Sortida:** l'app de l'iPhone funciona amb sessió Supabase, sense dependre del
secret compartit.

### Fase 4 — retirar el secret compartit

- Treu la branca del secret de `api/_auth.js` i de `src/lib/apiClient.js`.
- Treu `VITE_API_ACCESS_TOKEN` de `.env.example`.
- Esborra la variable a Vercel (Production i Preview) — comanda per a l'usuari.
- Actualitza el comentari de capçalera de `api/_auth.js`: ja no descriu un pegat
  sinó el mecanisme definitiu.

**Sortida:** `curl` amb el secret antic → 401. L'app segueix funcionant.

---

## Verificació final

```bash
# 1. Sense credencials → 401 (no 200, i tampoc 500)
curl -s -o /dev/null -w "%{http_code}\n" https://tinc-agenda.vercel.app/api/finances

# 2. Amb un token de sessió real (agafa'l de la consola del navegador:
#    (await supabase.auth.getSession()).data.session.access_token)
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  https://tinc-agenda.vercel.app/api/finances

# 3. Amb un token inventat → 401
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer no-soc-ningu" \
  https://tinc-agenda.vercel.app/api/finances
```

Compte amb la cache: aquestes rutes porten `Cache-Control: s-maxage` i Vercel
les cacheja a la CDN. Ja s'hi ha afegit `Vary: Authorization` (commit `c6397db`)
perquè cada token tingui la seva entrada, però quan provis afegeix-hi sempre un
paràmetre únic (`?_cb=$(date +%s)`) i comprova `x-vercel-cache: MISS`, o estaràs
validant una resposta antiga en comptes del codi nou. Aquest és exactament el
parany que va fer semblar, durant una estona, que el primer fix funcionava.

Comprovacions addicionals:

- RLS realment activa: al SQL Editor, `select * from pg_policies where tablename = 'user_data';`
  ha de retornar 4 files, i `select relrowsecurity from pg_class where relname = 'user_data';`
  ha de retornar `true`.
- A l'iPhone: tancar l'app del tot, reobrir-la i confirmar que la sessió persisteix
  (no hauria de demanar login cada cop).
- Deixar passar >1 h i confirmar que el refresc automàtic del token funciona i que
  les crides a `api/*` segueixen anant bé.

## Fora d'abast (no ho facis en aquesta feina)

- Reorganitzar `App.jsx` o el prop-drilling. Hi ha una auditoria pendent per això.
- Tocar el flux d'OAuth de Google Calendar (`src/lib/googleAuth.js`). És
  independent de l'auth de Supabase i ara mateix funciona.
- Afegir més proveïdors de login (Google, Apple). Un sol usuari, un sol mètode.
