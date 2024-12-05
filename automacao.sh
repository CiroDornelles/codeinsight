#!/bin/bash

# Nome do aplicativo e caminho do arquivo de entrada
APP_NAME="codeinsight"
ENTRY_FILE="index.js"

# Compila o aplicativo em um binário usando pkg
echo "Compilando o aplicativo..."
pkg . --targets node22-linux-x64 --output $APP_NAME

# Verifica se a compilação foi bem-sucedida
if [ $? -eq 0 ]; then
    echo "Compilação bem-sucedida."

    # Move o binário para /usr/local/bin
    echo "Movendo o binário para /usr/local/bin..."
    sudo mv $APP_NAME /usr/local/bin/

    # Torna o binário executável
    echo "Tornando o binário executável..."
    sudo chmod +x /usr/local/bin/$APP_NAME

    echo "O aplicativo foi instalado com sucesso em /usr/local/bin/$APP_NAME."
else
    echo "A compilação falhou. Verifique o erro acima."
fi
