//libs
const fs = require("fs");
const moment = require("moment");

//configs
const minParams = 1;
const dbfile = "db.json";
const initialDb = { numeroLote: 1 };
const input = process.argv[2];
const encoding = "utf-8";
let db = {};

//inicializacao
if (process.argv.length < 2 + minParams)
  throw (
    "Necessários pelo menos " +
    minParams +
    " parâmetros - o caminho do arquivo de entrada e saída."
  );
fs.readFile(dbfile, encoding, (err, data) => {
  if (err || !data) {
    console.log("Inicializando arquivo de db...");
    updateDb(initialDb);
  } else {
    db = JSON.parse(data);

    //validações arquivo db
    if (!db.numeroLote) {
      console.log("Inicializando dados do arquivo de db...");
      updateDb(initialDb);
      console.log(db);
    }
    if (!db.numContrato) {
      console.warn('Setar variável "numContrato" no db!');
    }
  }
  createFile(db);
});

function createFile(db) {
  //leitura e geração do arquivo
  let filename =
    process.argv[3] ||
    "inciso1-obn600" + moment().format("DDMMYYhhmmss") + ".txt";
  fs.readFile(input, encoding, (err, data) => {
    if (err) throw err;
    generateOBN(data, (outputOBN) => {
      fs.appendFile(filename, outputOBN, (err) => {
        if (err) throw err;
        updateDb({ numeroLote: db.numeroLote + 1 });
        console.log("Arquivo " + filename + " gerado com sucesso.");
        return outputOBN;
      });
    });
  });
}

//gera arquivo OBN
function generateOBN(data, callback) {
  //init
  let outputOBN = "";
  data = data.split("\n");

  let sequencialArquivo = 1;
  let somaSequenciais = 0;
  let somaValores = 0;

  //config DE-PARA: Cada campo OBN representa uma posição inicial (mapeada no cnab),
  //  um tamanho e um default (padding para a esquerda pode ser definido)
  const configOBN = {
    header: {
      //Zeros
      _001: {
        inicioCNAB: null,
        tamanho: 35,
        default: "",
      },
      //Data de geracao do arquivo
      _036: {
        inicioCNAB: 144,
        tamanho: 8,
        default: "",
      },
      //Hora de geracao do arquivo
      _044: {
        inicioCNAB: 152,
        tamanho: 4,
        default: moment().format("HHMM"),
      },
      //Número da remessa
      _048: {
        inicioCNAB: null,
        tamanho: 5,
        default: db.numeroLote,
      },
      //10B001
      _053: {
        inicioCNAB: null,
        tamanho: 6,
        default: "10B001",
      },
      //Número do contrato no Banco
      _059: {
        inicioCNAB: null,
        tamanho: 9,
        default: db.numContrato,
      },
      //Brancos
      _068: {
        inicioCNAB: null,
        tamanho: 276,
        default: "",
        padding: " ",
      },
      //Numero seqüencial no arquivo, iniciando em 0000001
      _344: {
        inicioCNAB: null,
        tamanho: 7,
        default: sequencialArquivo,
      },
    },
    registro: {
      //2
      _001: {
        inicioCNAB: null,
        tamanho: 1,
        default: 2,
      },
      //Código da agência bancária da UG/Gestão
      _002: {
        inicioCNAB: null,
        tamanho: 4,
        default: "0086",
        padding: " ",
      },
      //Dígito verificador da agência bancária da UG/Gestão
      _006: {
        inicioCNAB: null,
        tamanho: 1,
        default: 8,
        padding: " ",
      },
      //Código da UG
      _007: {
        inicioCNAB: null,
        tamanho: 6,
        default: 86,
        padding: " ",
      },
      //Código da Gestão
      _013: {
        inicioCNAB: null,
        tamanho: 5,
        default: 20358,
        padding: " ",
      },
      //Código da relação (RE) na qual consta a OB
      _018: {
        inicioCNAB: null,
        tamanho: 11,
        default: 0000001,
        padding: " ",
      },
      //Código da OB
      _029: {
        inicioCNAB: null,
        tamanho: 11,
        default: 0000001,
        padding: " ",
      },
      //Data de referência da relação DDMMAAAA
      _040: {
        inicioCNAB: null,
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //Brancos
      _048: {
        inicioCNAB: null,
        tamanho: 4,
        default: "",
        padding: " ",
      },
      //Código de operação
      _052: {
        inicioCNAB: null,
        tamanho: 2,
        default: "",
        padding: " ",
      },
      //Indicador de pagamento de pessoal:
      _054: {
        inicioCNAB: null,
        tamanho: 1,
        default: "",
      },
      //Zeros
      _055: {
        inicioCNAB: null,
        tamanho: 11, //9 + 2 de padding para prox campo
        default: "",
        padding: " ",
      },
      //Valor líquido da OB
      _064: {
        inicioCNAB: 120,
        tamanho: 15,
        default: "",
        padding: " ",
      },
      //Código do banco do favorecido
      _081: {
        inicioCNAB: 21,
        tamanho: 3,
        default: "",
        padding: " ",
      },
      //Código da agência bancária do favorecido
      _084: {
        inicioCNAB: 24,
        tamanho: 4,
        default: "",
        padding: " ",
      },
      //Dígito verificador (DV) da agência bancária do favorecido
      _088: {
        inicioCNAB: 29,
        tamanho: 1,
        default: "",
        padding: " ",
      },
      //Código da conta corrente bancária do favorecido
      _089: {
        inicioCNAB: 33, //Truncado 3 a esquerda do CNAB (30+3)
        tamanho: 9,
        default: "",
        padding: " ",
      },
      //Dígito verificador (DV) da conta corrente dofavorecido
      _098: {
        inicioCNAB: 42,
        tamanho: 1,
        default: "",
        padding: " ",
      },
      //Nome do favorecido
      _099: {
        inicioCNAB: 44,
        tamanho: 30,
        default: "",
        padding: " ",
      },
      //Padding - Nome do favorecido (CNAB: 30, OBN: 45)
      _p099: {
        tamanho: 15,
        default: "",
        padding: " ",
      },
      //Endereço do favorecido (vazio até ser necessário)
      _144: {
        inicioCNAB: null,
        tamanho: 57,
        default: "",
        padding: " ",
      },
      //Código Identificador do Sistema de Pagamentos Brasileiro - ISPB do favorecido
      _201: {
        inicioCNAB: null,
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //Município do favorecido (vazio até ser necessário)
      _209: {
        inicioCNAB: null,
        tamanho: 28,
        default: "",
        padding: " ",
      },
      //Código GRU Depósito ou brancos
      _237: {
        inicioCNAB: null,
        tamanho: 17,
        default: "",
        padding: " ",
      },
      //CEP do favorecido (vazio até ser necessário)
      _254: {
        inicioCNAB: null,
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //UF do favorecido
      _262: {
        inicioCNAB: null,
        tamanho: 2,
        default: "",
        padding: " ",
      },
      //Observação da OB
      _264: {
        inicioCNAB: null,
        tamanho: 40,
        default: "",
        padding: " ",
      },
      //0
      _304: {
        inicioCNAB: null,
        tamanho: 1,
        default: 0,
      },
      //Tipo favorecido:
      _305: {
        inicioCNAB: 258, //SEGMENTO B, 18
        tamanho: 1,
        default: "",
        padding: " ",
      },
      //Código do favorecido (CPF)
      _306: {
        inicioCNAB: 259, //SEGMENTO B, 19
        tamanho: 14,
        default: "",
      },
      //Prefixo da agência com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _320: {
        inicioCNAB: null,
        tamanho: 5,
        default: "",
        padding: " ",
      },
      //Número conta com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _325: {
        inicioCNAB: null,
        tamanho: 10,
        default: "",
        padding: " ",
      },
      //Finalidade do pagamento – Fundeb
      _335: {
        inicioCNAB: null,
        tamanho: 3,
        default: "",
        padding: " ",
      },
      //Brancos
      _338: {
        inicioCNAB: null,
        tamanho: 4,
        default: "",
        padding: " ",
      },
      //Código de retorno da operação
      _342: {
        inicioCNAB: null,
        tamanho: 2,
        default: 0000001,
      },
      //Número seqüencial no arquivo, consecutivo
      _344: {
        inicioCNAB: null,
        tamanho: 7,
        default: sequencialArquivo,
      },
    },
    trailer: {
      _001: {
        inicioCNAB: null,
        tamanho: 35,
        default: "",
        padding: "9",
      },
      _036: {
        inicioCNAB: null,
        tamanho: 285,
        default: "",
        padding: " ",
      },
      _321: {
        inicioCNAB: null,
        tamanho: 17,
        default: somaValores,
      },
      _338: {
        inicioCNAB: null,
        tamanho: 13,
        default: somaSequenciais,
      },
    },
  };

  //aliases
  const header = configOBN.header;
  const registro = configOBN.registro;
  const trailer = configOBN.trailer;

  //gera header
  for (const key in header) {
    const field = header[key];
    if (field.inicioCNAB == null) {
      //default
      outputOBN += (field.default + "").padStart(
        field.tamanho,
        field.padding ? field.padding : 0
      );
    } else {
      //get cnab
      outputOBN += (
        data[0].substring(
          field.inicioCNAB - 1,
          field.inicioCNAB + field.tamanho - 1
        ) + ""
      ).padStart(field.tamanho, field.padding ? field.padding : 0);
    }
  }
  sequencialArquivo++;
  outputOBN += "\n";

  //gera registro (tipo 2 OBN)
  let value;
  for (let i = 0; i < data.length; i++) {
    if (data[i].charAt(13) != "A") continue;
    linhas = data[i].replace(/\r?\n|\r/g, "") + data[i + 1];
    for (const key in registro) {
      const field = registro[key];
      if (field.inicioCNAB == null && key !== "_344") {
        //default
        value = (field.default + "").padStart(
          field.tamanho,
          field.padding ? field.padding : 0
        );
        outputOBN += value;
      } else if (key !== "_344") {
        //get cnab
        value = (
          linhas.substring(
            field.inicioCNAB - 1,
            field.inicioCNAB + field.tamanho - 1
          ) + ""
        ).padStart(field.tamanho, field.padding ? field.padding : 0);
        outputOBN += value;
      }
      if (key === "_064") {
        trailer._321.default += parseInt(value);
      }
      if (key === "_344") {
        outputOBN += (sequencialArquivo + "").padStart(7, "0");
        trailer._338.default += sequencialArquivo;
        sequencialArquivo++;
      }
    }
    outputOBN += "\n";
  }

  //gera trailer
  for (const key in trailer) {
    const field = trailer[key];
    if (field.inicioCNAB == null) {
      //default
      outputOBN += (field.default + "").padStart(
        field.tamanho,
        field.padding ? field.padding : 0
      );
    } else {
      //get cnab
      outputOBN += (
        data[0].substring(
          field.inicioCNAB - 1,
          field.inicioCNAB + field.tamanho - 1
        ) + ""
      ).padStart(field.tamanho, field.padding ? field.padding : 0);
    }
  }
  sequencialArquivo++;

  callback(outputOBN);
}

//util functions

function updateDb(newState) {
  db = { ...db, ...newState };
  fs.writeFile("db.json", JSON.stringify(db), (err) => {
    if (err) throw err;
  });
}

//util functions end
