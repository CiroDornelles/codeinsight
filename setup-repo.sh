#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Configurando repositório CodeInsight...${NC}"

# Inicializar repositório se não existir
if [ ! -d .git ]; then
    echo -e "${BLUE}Inicializando repositório Git...${NC}"
    git init
fi

# Adicionar arquivos
echo -e "${BLUE}Adicionando arquivos...${NC}"
git add .

# Commit inicial
echo -e "${BLUE}Criando commit inicial...${NC}"
git commit -m "Initial commit: CodeInsight project setup"

# Configurar branch principal como 'main'
echo -e "${BLUE}Configurando branch principal...${NC}"
git branch -M main

# Criar repositório no GitHub e fazer push
echo -e "${BLUE}Criando repositório no GitHub e fazendo push...${NC}"
gh repo create codeinsight --public --source=. --remote=origin --push

echo -e "${GREEN}Repositório configurado com sucesso!${NC}"
echo -e "${GREEN}Visite: https://github.com/$(gh api user -q .login)/codeinsight${NC}"
