# Amigos da TETO Chatbot
---
Adaptação do chatbot do grupo SkyCoders (programa Hiring Coders, Gama Academy, set/2020) para o site da TETO.  
Apresentamos, aqui, duas propostas:  
A primeira é um tour guiado e bastante amigável pelo site da TETO.  
A segunda é uma assistente virtual da própria TETO, a Tereza, que conversa com usuário interessado em se tornar um amigo da TETO e obtém todas as informações necessárias.


## Proposta 01 - Frontend ()
---
### Instalação


### Uso



## Proposta 01 - Backend ()
---
### Instalação


### Uso



## Proposta 02 - Frontend ()
---
### Instalação


### Uso



## Proposta 02 - Backend (/proposta_02_form/AWSLambda)
---

### Pré-requisitos

Para utilizar o referido código, é preciso:
- Ter uma conta na AWS;
- Criar uma tabela no DynamoDB chamada 'chatbot_TETO', com 'ID' (string) como Primary Key e 'TS' (number) como Sort Key;

### Instalação

Para hospedar o código na AWS:
- Crie uma função Lambda e cole o conteúdo de index.js.
- Associe uma nova policy ao role criado automaticamente para permitir 'Query' e 'PutItem' à tabela chatbot_TETO;
- Crie um API gateway e associe à função lambda criada. A API deverá ter um método POST e passar as seguintes informações (não obrigatórias):
-- user (id criado para a conversa)
-- message (mensagem do usuário para o bot)

### Uso e funcionamento
A função lambda recebe o ID da conversa ('user') e a mensagem do usuário ('message') e responde com o mesmo ID ('user'), a resposta do bot ('lex') e o status da conversa. Caso não receba 'user', uma nova conversa é criada junto com um uuid gerado.
Ao final da conversa, um form é passado para o bot com as seguintes informações, que deverão ser mostradas ao usuário para confirmação:
```
form:   {nome: 'João', 
        frequencia: 'unica', 
        valor:'20.50', 
        email:'joao@bla.com', 
        telefone:'1234546', 
        dn:'01/01/1990', 
        sexo:'m', 
        forma:'cartao'}
```


## Referências
[TETO](https://teto.org.br/)  
[AWS](https://aws.amazon.com/)  
[VTEX API](https://developers.vtex.com/reference/orders)  
[Gama Academy](https://gama.academy/)  
