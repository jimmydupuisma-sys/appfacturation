@echo off
cd /d "%~dp0"

echo Lancement de App Facturation...
echo.

:: Vérifier si les dépendances sont installées
if not exist "node_modules" goto install
if not exist "frontend\node_modules" goto install
goto launch

:install
echo Installation des dépendances...
call npm run setup
echo.

:launch
call npm start
