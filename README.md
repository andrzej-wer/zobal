# Idea Nova — panel wycen Zobal MVP

## 1. Supabase
1. Utwórz projekt.
2. Otwórz SQL Editor i uruchom `schema.sql`.
3. Authentication > Users > Add user. Utwórz konto pracownika.
4. Skopiuj UUID użytkownika i uruchom:
   `insert into public.profiles(id,full_name,role) values ('UUID','Imię Nazwisko','admin');`
5. Project Settings > API: skopiuj Project URL i Publishable/anon key do `supabase-config.js`.

## 2. GitHub Pages
1. Utwórz prywatne repozytorium, np. `idea-nova-wyceny`.
2. Wgraj wszystkie pliki.
3. Settings > Pages > Deploy from branch > main / root.
4. Otwórz adres GitHub Pages.

Uwaga: GitHub Pages publikuje statyczne pliki. Dane i dokumenty pozostają w Supabase. Bezpieczeństwo zapewniają Auth + RLS. Nie wstawiaj do repozytorium klucza `service_role`.

## 3. Pierwsze dane
Obecne MVP zakłada, że zapytania są już w bazie. Następny etap to podłączenie formularza `formularz-zobal.html`, aby automatycznie tworzył klienta, zapytanie i pozycje.

## Zakres MVP
- logowanie e-mail/hasło,
- lista zapytań,
- wyszukiwanie po kliencie i numerze Zobal,
- karta wyceny,
- ceny sprzedaży per pozycja,
- prywatny PDF Zobal,
- oddzielna sekcja dokumentów klienta,
- status i notatki wewnętrzne.
