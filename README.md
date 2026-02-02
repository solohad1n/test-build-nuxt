Как собрать и развернуть Nuxt 3 проект
1. Установите зависимости:
npm install

2. Запустите дев-сервер:
npm run dev — откроется на http://localhost:3000

3. Для продакшн-сборки выполните:
npm run build — создаст .output/

4. Чтобы посмотреть результат сборки локально, запустите:
npm run preview

5. Для деплоя на сервер нужно развернуть .output и запускать через Node (если SSR) или расшарить папку /.output/public (если SSG или SPA).

Пример:
node .output/server/index.mjs


Node:
v22.21.0

Установка nvm на сервере:
1. Установи nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

2. Подхвати nvm в текущей сессии (иначе команда nvm может не найтись до перезахода)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

3. Проверка
nvm -v

4. Node v22.21.0 и сделай её дефолтной
nvm install 22.21.0
nvm use 22.21.0
nvm alias default 22.21.0

5. Проверка:
node -v
