# PlaceNow — opis aplikacije i tehnologije

PlaceNow je full-stack veb aplikacija namenjena upravljanju nekretninama i procesom rezervacija, koja nastaje kao odgovor na rastuću potrebu za centralizovanim, preglednim i modernim sistemom za izdavanje smeštaja. Tradicionalni način oglašavanja nekretnina često podrazumeva rasute informacije, komplikovanu komunikaciju između vlasnika i gostiju i nedostatak jasnog uvida u rezervacije, prihode i stanje nekretnina. PlaceNow ima za cilj da objedini ove procese u jedinstvenu platformu, gde se sve — od pregleda nekretnina, preko rezervacija i prijave problema, do fakturisanja — odvija na jednom mestu.

![PlaceNow Logo Slika](./place_now_fe/public/images/logo.png)

Glavni cilj aplikacije jeste da omogući jednostavno oglašavanje i vizuelnu prezentaciju nekretnina, posebno kroz **360° prikaz** i **3D modele**, kako bi kupci mogli da steknu realan utisak o prostoru pre rezervacije. Paralelno sa tim, PlaceNow vlasnicima nekretnina pruža alat za upravljanje oglasima, rezervacijama, zahtevima za održavanje i prihodima, dok administratorima nudi pregled metrika i izveštaja radi praćenja performansi sistema. Dodatni cilj je unapređenje korisničkog iskustva kroz jasne procese — od registracije i prijave, preko izbora nekretnine i rezervacije, do pregleda faktura i istorije boravaka.

## Ciljna grupa i uloge korisnika

Ciljna grupa korisnika obuhvata četiri tipa korisnika:

- **Posetilac (guest)**: korisnik koji još uvek nije registrovan ili ulogovan.
- **Kupac (buyer)**: fizičko lice koje traži smeštaj i želi jednostavan način da pronađe, pregleda i rezerviše nekretninu.
- **Prodavac (seller)**: vlasnik ili agent koji izdaje nekretnine i kome je potreban alat za upravljanje oglasima, rezervacijama i operativnim zadacima.
- **Administrator (admin)**: nadzor nad sistemom, upravljanje korisnicima i analiza podataka o rezervacijama i prihodima.

## Ključne funkcionalnosti

### Posetilac
- Pregled javne liste nekretnina.
- Registracija i prijava u sistem.

### Kupac (buyer)
- Pregled i filtriranje nekretnina (pretraga, grad, status; paginacija).
- Detaljan prikaz nekretnine uključujući:
  - **360° prikaz** (pannellum viewer),
  - **3D model** (Sketchfab embed).
- Kreiranje rezervacije za odabrani period.
- Pregled svojih rezervacija i otkazivanje (u dozvoljenim statusima i pre početka boravka).
- Pregled svojih faktura i plaćanje fakture (u dozvoljenim statusima).
- Kreiranje zahteva za održavanje tokom boravka (uz poslovno pravilo: mora postojati aktivna ili skoro završena rezervacija).

### Prodavac (seller)
- Dodavanje, izmena i brisanje sopstvenih nekretnina.
- Pregled rezervacija vezanih za sopstvene nekretnine.
- Ažuriranje statusa rezervacija (npr. pending → confirmed).
- Pregled zahteva za održavanje dodeljenih prodavcu i ažuriranje statusa (open/in_progress/resolved/closed).
- Kreiranje faktura za rezervacije (amount, due date, opis; status po potrebi).

### Administrator (admin)
- Pregled svih korisnika i upravljanje ulogama (buyer/seller/admin).
- Pregled metrika sistema (npr. broj rezervacija, broj aktivnih nekretnina, otvoreni zahtevi).
- Generisanje izveštaja po periodu (rezervacije u periodu + plaćeni prihod).
- Vizuelizacija metrika kroz grafikone (react-chartjs-2).

---

# 3. Predlog tehnologija koje će biti korišćene

## 3.1. Frontend — React

**React JS** je jedna od najpopularnijih biblioteka za izgradnju modernih korisničkih interfejsa. Zasniva se na komponentnom pristupu, gde se aplikacija gradi od manjih, nezavisnih i ponovo upotrebljivih delova. Jedna od ključnih prednosti React-a je virtuelni DOM, koji omogućava efikasna ažuriranja UI-ja i dobre performanse i u većim aplikacijama.

![React Logo Slika](https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRm2jf3gjLM0ePHpbXmAHrhK2-weYYKMaldBA&s)

U PlaceNow aplikaciji, React predstavlja sloj koji korisnik vidi i sa kojim direktno komunicira. Glavne funkcionalnosti su implementirane kao interaktivne i responzivne komponente:

- Lista nekretnina kao dinamički grid sa filtrima i paginacijom.
- Modal ili detaljna forma za prikaz nekretnine.
- Kontrolisane forme za registraciju, prijavu, rezervacije i maintenance zahteve (sa validacijom na frontend strani).
- Role-based navigacija (admin/seller/buyer) i upravljanje sesijom (token + korisnik).

### Integracije u React-u
- **Sketchfab (3D modeli):** 3D modeli se prikazuju putem **Sketchfab embed** linka (iframe). Frontend ekstraktuje embed URL iz model linka ili HTML-a i renderuje ga u okviru detalja nekretnine.
- **Pannellum (360° slike):** 360° prikaz se implementira kroz **Pannellum viewer** (embed), gde se prosleđuje `panorama` URL (apsolutni link ka slici).
- **react-chartjs-2:** koristi se za prikaz metrika i izveštaja u admin delu (npr. bar chart za KPI vrednosti i line chart za revenue po mesecima).

React komunicira sa Laravel backendom preko HTTP (REST API) zahteva. Svaka operacija (npr. kreiranje rezervacije, učitavanje profila, plaćanje fakture, update statusa) poziva odgovarajuću API rutu, a UI se ažurira na osnovu odgovora.

## 3.2. Backend — Laravel (REST API)

**Laravel** je jedan od najpopularnijih PHP framework-ova, poznat po MVC arhitekturi, jasnoj organizaciji i bogatom ekosistemu ugrađenih funkcionalnosti (rute, kontroleri, validacija, autentifikacija, rad sa bazama).

![Laravel Logo Slika](https://logowik.com/content/uploads/images/laravel8530.jpg)

U PlaceNow projektu Laravel čini kompletan backend sloj i zadužen je za:
- poslovnu logiku (npr. pravila oko rezervacija, preklapanje datuma, dostupnost nekretnine),
- validaciju podataka,
- kontrolu pristupa (role-based),
- komunikaciju sa bazom podataka preko **Eloquent ORM**-a,
- izlaganje **REST API** ruta za React frontend.

### Autentifikacija i autorizacija
- Koristi se **Laravel Sanctum** (token-based).
- Token se šalje u headeru: `Authorization: Bearer {token}`.
- Backend ograničava rute po ulozi (buyer/seller/admin) i po vlasništvu nad resursom (npr. seller može menjati samo svoje nekretnine).

## 3.3. Baza podataka — MySQL

**MySQL** je relacioni sistem za upravljanje bazama podataka i idealan je za aplikacije koje zahtevaju jasnu strukturu, integritet podataka i relacije između entiteta.

![MySQL Logo Slika](https://brandlogos.net/wp-content/uploads/2017/05/mysql-logo_brandlogos.net_fqzvv-512x349.png)

U PlaceNow sistemu MySQL čuva podatke o:
- korisnicima (`users`),
- nekretninama (`properties`),
- rezervacijama (`reservations`),
- fakturama (`invoices`),
- zahtevima za održavanje (`maintenance_requests`).

Kroz Laravel migracije se definišu kolone, tipovi, indeksi i strani ključevi, a kroz seedere se generišu test podaci za razvoj i demonstraciju.

---

# Tehnologije korišćene (sažetak)

- **Frontend**
  - React (SPA, komponentni UI)
  - JavaScript
  - react-router-dom (rutiranje)
  - axios (HTTP pozivi ka API-ju)
  - **react-chartjs-2** + chart.js (grafikoni u admin delu)
  - **Sketchfab embed (iframe)** za 3D modele
  - **Pannellum viewer** za 360° prikaz

- **Backend**
  - PHP 8.2+
  - Laravel (rutiranje, validacija, kontroleri, Eloquent ORM)
  - Laravel Sanctum (Bearer token auth)
  - API Resources (formatiranje JSON odgovora)

- **Baza**
  - MySQL

- **DevOps / alati**
  - Git (verzionisanje)
  - Swagger UI + OpenAPI specifikacija za dokumentaciju API-ja
  - Docker za kontejnerizaciju

---


## Pokretanje projekta (lokalno bez Docker-a)

> Pretpostavke: instalirani **Node 18+**, **PHP 8.2+**, **Composer**, **XAMPP**.
> NAPOMENA: U XAMPP-u pokrenuti: **Apache** i **MySQL**

1. Klonirajte repozitorijum:
```bash
    git clone https://github.com/elab-development/internet-tehnologije-2025-placenow_2022_0139.git
```
2. Pokrenite backend:
```bash
   cd place_now_be
   composer install
   php artisan migrate:fresh --seed
   php artisan serve
```
    
3. Pokrenite frontend:
```bash
   cd place_now_fe
   npm install
   npm start
```
    
4.  Frontend pokrenut na: [http://localhost:3000](http://localhost:3000) Backend API pokrenut na: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)

## Pokretanje projekta uz Docker

> Pretpostavke: instaliran i pokrenut **Docker Desktop**.
> NAPOMENA: U XAMPP-u pokrenuti: **Apache** (**MySQL** sada pokrece Docker, tako da njega ne pokretati!)

1. Klonirajte repozitorijum:
```bash
    git clone https://github.com/elab-development/internet-tehnologije-2025-placenow_2022_0139.git
```

2. Pokrenite Docker kompoziciju:
```bash
    docker compose down -v
    docker compose up --build
```

3.  Frontend pokrenut na: [http://localhost:3000](http://localhost:3000) Backend API pokrenut na: [http://127.0.0.1:8000/api](http://127.0.0.1:8000/api)