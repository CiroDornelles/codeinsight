#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Atualizando repositório CodeInsight...${NC}"

# Adicionar arquivos
echo -e "${BLUE}Adicionando arquivos...${NC}"
git add .

# Commit
echo -e "${BLUE}Criando commit...${NC}"
git commit -m "Update: CodeInsight project files"

# Configurar branch principal como 'main' se ainda não estiver
echo -e "${BLUE}Verificando branch principal...${NC}"
git branch -M main

# Adicionar remote se não existir
if ! git remote | grep -q "^origin$"; then
    echo -e "${BLUE}Adicionando remote origin...${NC}"
    git remote add origin https://github.com/CiroDornelles/codeinsight.git
fi

# Fazer push
echo -e "${BLUE}Fazendo push para o GitHub...${NC}"
git push -u origin main

echo -e "${GREEN}Repositório atualizado com sucesso!${NC}"
echo -e "${GREEN}Visite: https://github.com/CiroDornelles/codeinsight${NC}"
