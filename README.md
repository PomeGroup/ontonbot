# Onton

## Setting up DEV environment

### apply migrations

Create a postgres database named `tonbotdev` on port 5432
Replace the database url in all `.env` files and also in `mini-app\database-management\database_configuration.py`.

run this script inside `mini-app\database-management\migrator_script.py`.

### run dev

Install `ngrok` and run `ngrok http 3000`.

Replace the `APP_BASE_URL` env variable in all `.env` files with the ngrok url. make sure to change it in `mini-app` and `telegram-bot` env files.

go to `telegram-bot` and open `telegram-bot\src\handlers.ts` at the top of the file add your username.

`cd mini-app` and run `pnpm run dev` and also `cd telegram-bot` and run `npx tsx src/main.ts` make sure to place the `BOT_TOKEN` with your own bot token from bot father. go to the bot on telegram and send start wait until it responds. click on `discover events` and open the mini app. you should see a blank screen. check out the console and look for a response called `addUser` and it should return `200` and also it should return the user data if it does not so it means that there is a problem.

now go to the telegram bot and send `/org USERNAME admin`. this way you will become an admin.

open the mini app same way as before and you should see a button called `create new event`
