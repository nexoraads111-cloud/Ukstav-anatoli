# Supabase — налаштування та безпека

Проєкт у Supabase зберігає **заявки**, **відгуки**, **фото** і **логін адміна**.
Поточний проєкт: `gqcogdqqgxzuteaoaxza` (регіон EU West). Ключ у `js/supabase-config.js` — публічний (anon/publishable), це нормально.

> Ніколи не кладіть у репозиторій або в браузерний код `service_role`-ключ, токени Telegram/WhatsApp, паролі.

## Налаштувати з нуля (новий проєкт)

1. supabase.com → **New project** (регіон EU).
2. **Authentication → Users → Add user** — e-mail + довгий унікальний пароль. Це логін в `admin.html`.
3. **SQL Editor** → вставити весь `supabase/setup.sql` → **Run**.
   * E-mail адміна в SQL (`ukstav.sk@gmail.com`) має збігатися з користувачем із кроку 2 — інакше змініть його в SQL до запуску.
   * Скрипт можна запускати повторно: дані й завантажені фото він не стирає.
3b. **SQL Editor** → вставити весь `supabase/seed-gallery.sql` → **Run** — заносить у базу 134 початкові фото галереї, щоб їх можна було редагувати в адмінці. Запускається лише якщо в галереї ще немає жодного фото (повторний запуск нічого не дублює).
4. **Project Settings → API** → скопіювати *Project URL* і *anon/publishable key* у `js/supabase-config.js`.

## Обов'язково в панелі Supabase (SQL це зробити не може)

* **Authentication → Sign In / Providers → Email** → вимкнути *Allow new users to sign up*. Права адміна й так лише в одного акаунта, але відкрита реєстрація — зайва поверхня.
* **Authentication → Policies / Password** → увімкнути *Leaked password protection* (якщо доступно в плані).
* **Authentication → Multi-Factor** → TOTP — **поки не вмикайте**: сторінка `admin.html` ще не вміє запитувати код, і ви не зможете увійти. Спершу потрібно додати цей крок у `js/admin.js`.
* Пароль адміна — унікальний, ніде більше не використовується.

## Хто що може (перевірено тестами по ролях)

| Роль | Фото | Заявки | Відгуки | Storage |
|------|------|--------|---------|---------|
| Відвідувач (anon) | лише читати | лише створити | створити (на модерації) + читати схвалені | лише публічні посилання |
| Чужий зареєстрований акаунт | лише читати | нічого | лише схвалені | нічого |
| Адмін (`admin_users`) | читати/додавати/міняти/видаляти | читати, змінювати статус і примітку, видаляти | схвалювати, видаляти | вантажити/видаляти |

Додатково: ліміт частоти (3 заявки з одного номера на годину, 10 відгуків на годину), адмін не може змінити контактні дані клієнта в заявці.

## Таблиця `site_images`

Одна таблиця для всіх фото: `slot` (hero, hero-light, …), `category` (`gallery` — фото галереї), `storage_path` (шлях `images/…` у репозиторії або файл у bucket `site-images`), `alt_text`, `sort_order`, `work_types text[]`, `project_id`, `is_visible` (сховане фото не показується на сайті).
Публічно читається все, змінює лише адмін.

## Додати ще одного адміна

SQL Editor:
```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'nova.osoba@example.com';
```

## Telegram-сповіщення (необов'язково)

Лише через Supabase Edge Function `supabase/functions/notify-lead` із секретами `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` у Dashboard → Edge Functions → Secrets. Не вмикається автоматично.
Якщо колись у git потрапляли старі токени Telegram/WhatsApp (Meta) — їх треба **перевипустити** (BotFather / Meta), видалення з коду їх не знешкоджує.
