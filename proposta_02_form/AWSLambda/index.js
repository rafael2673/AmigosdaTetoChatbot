var AWS = require('aws-sdk');
const https = require('https');
const dynamo = new AWS.DynamoDB.DocumentClient();
const frases = {
    'default': ["Me desculpe! Não sei mais o que dizer, ainda estou em construção!"],
    'inicio':  ["Olá! Eu sou Tereza, a assistente virtual da TETO. <br/>Você tem interesse em fazer parte dos amigos da TETO?","Para fazer parte dos amigos da TETO, basta fazer uma doação. Quer fazer a sua agora?","Não entendi, pode falar de outra forma?"],
    'nome':  ["Para começar, me informe o seu nome completo, por favor."],
    'dataNascimento':  ["Qual é sua data de nascimento?","Não entendi, informe dia/mês/ano, por favor."],
    'frequencia':  ["Você vai querer doar só esta vez, mensalmente ou anualmente? <br/>Doações únicas são muito bem vindas, mas doações recorrentes nos permitem planejar melhor os gastos."],
    'valor':  ["Que valor você vai querer doar?"],
    'email':  ["Qual é o seu e-mail?"],
    'telefone':  ["E o seu telefone?"],
    'sexo':  ["Você se identifica com o sexo feminino, masculino ou prefere não informar?"],
    'forma':  ["Prefere pagar utilizando boleto ou cartão de crédito?"],
    'formCompleto':   ["Obrigada por contribuir para uma sociedade justa e sem pobreza! <br/> Vou redirecioná-lo para a página de confirmação dos dados."],
    'deuRuim':   ["Poxa, que pena! Estarei por aqui se mudar de idéia!"]
};

//funções auxiliares simples
const giveUp = (info) => info.attempt>=frases[info.status].length;
const zPad = (num, places) => String(num).padStart(places, '0');
const jsUcfirst = (nome) =>  nome.charAt(0).toUpperCase() + nome.slice(1).toLowerCase();

/** Lida com a requisição do API gateway **/
exports.handler = async (event, context, callback) => {
    try {
        var info = await obtemStatus((event.user && event.user!="") ? event.user : uuidv4());
        info.message = event.message ? event.message.toLowerCase() : "";
        info.attempt+=1;
        info.response = "";
        let newStatus = await proxEstado(info);
        if (newStatus==='erro') callback(null, { statusCode: 200, lex:'Estamos com erro ao acessar o servidor. Por favor tente novamente em alguns instantes.'});
        if (newStatus!==info.status) info.attempt=0;
        if (!(newStatus in frases) || info.attempt>=frases[newStatus].length)  {
            newStatus = 'default';
            info.attempt=0;
        }
        info.status = newStatus;
        info.response += frases[newStatus][info.attempt];
        gravaStatus(info);
        const response = { statusCode: 200,
                            user: info.ID,
                            status: info.status, 
                            lex: info.response };
        if (info.status==='formCompleto') response.form = info.form;
        callback(null, response);
    } catch (e) {
        console.log(e);
        callback(e);
    }
};

/** Define qual é o próximo estado da conversa **/
async function proxEstado(info) {
    
    //Se o ultimo chat estiver finalizado, reinicia o processo
    if (info.status === 'formCompleto' ||info.status === 'deuRuim' || info.status === '') {
        return 'inicio';
    }
    
    let intent = entendeMensagem(info.message);

    //Avalia a intenção do usuário de acordo com o estado atual e redireciona para o próximo estado 
    if (info.status === 'inicio') {
        if (intent==="não") return 'deuRuim'
        info.form = {nome: '', frequencia: '', valor:'', email:'', telefone:'', dn:'', sexo:'', forma:''};
        if (intent==="sim") return 'nome';
        if(giveUp(info)) return 'nome';
    }
    else if (info.status === 'nome') {
        let nome = info.message.match(/[A-Za-záéíóúÁÉÍÓÚÃÕÜãõüÂÊÔ]{2,20}(\s+[A-Za-záéíóúÁÉÍÓÚÃÕÜãõüâêôÂÊÔ]{1,20}\.?){0,10}/g);
        if (nome)  info.form = {nome:nome[0]};
        return 'email';
    }
    else if (info.status === 'email') {
        let email = info.message.toLowerCase().match(/[a-z0-9]+([!#$%&'*+\-\/=?^_`{|\.][a-z0-9]+)*[a-z0-9]+@([a-z0-9]+\.){1,3}[a-z]{2,5}/g);
        if (email) info.form.email = email[0];
        return 'telefone';
    }
    else if (info.status === 'telefone') {
        let telefone = info.message.match(/(\+?\d+)?[\s\-\.]*(\(\d+\))?\d*([\s\-\.]*\d*)*/g);
        if(telefone) info.form.telefone = telefone[0].replace(/[\.\s\-\(\)\+]/g,"");
        return 'frequencia';
    }
    else if (info.status === 'frequencia') {
        info.form.frequencia = intent;
        return 'valor';
    }
    else if (info.status === 'valor') {
        let valor = info.message.match(/\d+([\.\,]\d+)*/g);
        if (valor) info.form.valor = valor[0].replace(/[,\.]([^,\.]*)$/," $1").replace(/[,\.]/g,"").replace(" ",".");
        return 'dataNascimento';
    }
    else if (info.status === 'dataNascimento') {
        let dn = info.message.match(/\d{1,2}(([\/\-]\d{1,2}[\/\-])|( de [a-z]* de ))\d{2,4}/g)
        if (dn) info.form.dn = dn[0];
        if (dn || giveUp(info)) return 'sexo';
    }
    else if (info.status === 'sexo') {
        info.form.sexo = (intent === "m" || intent === "f") ? intent : "";
        return 'forma';
    }
    else if (info.status === 'forma') {
        info.form.forma = (intent === "boleto" || intent === "cartao") ? intent : "";
        return 'formCompleto';
    }
    else if (info.status === 'requisicao') {
        if (intent==="não" || giveUp(info)) return 'maisInfo';
    }

    
    return info.status;
}

/** Tenta entender a mensagem do cliente e transformar em uma intenção **/
function entendeMensagem(msg) {
    msg = msg.trim().replace(/[-//!?.]/g,"");
    let palavras = msg.split(" ");
    if (palavras.includes("sim") || ["s","yep","yes","aham","bora","claro","isso","com certeza","agora","desejo","quero","quero sim","ja","oui","agora quero","já"].includes(msg)) return "sim";
    if (palavras.includes("não") || palavras.includes("nao") || 
        ["não","nao","ñ","nopz","no","nops","nope","nn","n","nah","neh","n~","nein","non"].includes(msg)) 
            return "não";
    if (palavras.includes("mensalmente") || palavras.includes("mensal") || palavras.includes("mês") ||  palavras.includes("mes")) return "mensal";
    if (palavras.includes("anualmente") || palavras.includes("anual") || palavras.includes("ano")) return "anual";
    if (palavras.includes("só") || palavras.includes("única") || palavras.includes("so") || palavras.includes("unica")  || palavras.includes("vez")) return "unica";
    if (palavras.includes("boleto")) return "boleto";
    if (palavras.includes("cartão") || palavras.includes("cartao") || palavras.includes("credito") || palavras.includes("crédito")) 
            return "cartao";
    if (palavras.includes("feminino") || palavras.includes("mulher") || palavras.includes("garota") || palavras.includes("fêmea") || palavras.includes("femea") || ["f","fem"].includes(msg)) return "f";
    if (palavras.includes("masculino") || palavras.includes("homem") || palavras.includes("macho") || ["m","mas","masc"].includes(msg)) return "m";
    return msg;
}

/** Grava estado atual da conversa no DynamoDB **/
async function gravaStatus(info) {
    info.TS = Date.now();
    info.TTL = parseInt(Date.now()/1000,10)+60*60*4;      //Fica armazenado por 4 horas
    await dynamo.put({
        "TableName": "chatbot_TETO",
        "Item": info
    }).promise();
}

/** Consulta DynamoDB e obtém último estado da conversa **/
async function obtemStatus(id) {
    let reg = await dynamo.query({
        TableName: 'chatbot_TETO',
        KeyConditionExpression: "ID = :id",
        ExpressionAttributeValues: {
            ':id': id
        },
        ScanIndexForward: false,
        Limit: 1
    }).promise();
    if (!reg.Items || reg.Items.length==0) {
        return {
            ID: id,
            message: "",
            response: "",
            status: '',
            attempt: 0
        };
    }
    return reg.Items[0];
}



/** Função auxiliar de formatação de data e hora **/
function formataDataHora(dt){
    let ndt = new Date(dt);
    let DD = zPad(ndt.getDate(),2),  MM = zPad((ndt.getMonth()+1),2);
    let Hh = zPad(ndt.getHours(),2), Mm = zPad(ndt.getMinutes(),2);
    return DD+"/"+MM+"/"+ndt.getFullYear() + " às "+Hh+":"+Mm;
}

/** Função para gerar IDs (praticamente) únicos **/
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}