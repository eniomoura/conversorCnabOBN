//lotes inciso 3:
// 1315 E1PFB
// 1420 E1PFC
// 1525 E1PFD
// 1593 E1PJA
// 1613 E2PFB
// 1693 E2PFC
// 1782 E2PJA
// 1795 E3PFB
// 1857 E3PJA
// 1868 E1PF2L
// 1952 E1PJ2L
// 1963 E2PF2L
// 2073 E2PJ2L
// 2088 E3PF2L
// 2131 E3PJ2L
// 2145 E1PJAL1c
// 2156 E2PFBL1c
// 2169 E2PJAL1c
// 2183 E1L1PFc
// 2231 E1L1PJc
// 2241 E2L1PFc
// 2257 E2L1PJc
// 2263 E3L1PFc
// 2273 E3L1PJc
// 2281 END

//libs
const fs = require("fs");
const moment = require("moment");
const csvReader = require("convert-csv-to-json");

//configs
const minParams = 1;
const dbfile = "db.json";
const initialDb = { numeroLote: 1 };
const input = process.argv[2];
const encoding = "utf-8";

//inicializacao
let db = {};
let sequencialArquivo = 1;
let somaSequenciais = 0;
let somaValores = 0;
let outputOBN = "";
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
  if (input.includes("cnab")) {
    //gera a partir de CNAB
    let filename =
      process.argv[3] ||
      "inciso1-obn600" + moment().format("DDMMYYhhmmss") + ".txt";
    fs.readFile(input, encoding, (err, data) => {
      if (err) throw err;
      generateOBNfromCNAB(data, (outputOBN, sequencialArquivo) => {
        fs.appendFile(filename, outputOBN, (err) => {
          if (err) throw err;
          updateDb({ numeroLote: db.numeroLote + sequencialArquivo + 1 });
          console.log("Arquivo " + filename + " gerado com sucesso.");
          return outputOBN;
        });
      });
    });
  } else if(input.includes("retorno")){
    fs.readFile(input, encoding, (err, data) => {
      generateCSVfromReturnData(data)
    })
  } else {
    //gera a partir de CSV com dados financeiros
    let filename =
      process.argv[3] ||
      "OBNinciso3-" +
        db.numeroLote +
        "-" +
        input.slice(0, -4).replace(/[^a-zA-Z0-9 ]/g, "") +
        moment().format("DDMMhhmmss") +
        ".txt";
    generateOBNfromArray(
      csvReader.fieldDelimiter(",").getJsonFromCsv(input),
      (outputOBN, sequencialArquivo) => {
        fs.appendFile(filename, outputOBN, (err) => {
          if (err) throw err;
          updateDb({ numeroLote: db.numeroLote + sequencialArquivo + 1 });
          console.log("Arquivo " + filename + " gerado com sucesso.");
          return outputOBN;
        });
      }
    );
  }
}

function generateCSVfromReturnData(data){
  const configRetorno = {
    header: {
      //Zeros
      _001: {
        inicioRET: null,
        tamanho: 35,
        padding: "0"
      },
      //Data de geracao do arquivo
      _036: {
        inicioRET: 36,
        tamanho: 8,
      },
      //Hora de geracao do arquivo
      _044: {
        inicioRET: 44,
        tamanho: 4,
      },
      //Número da remessa
      _048: {
        inicioRET: 48,
        tamanho: 5,
      },
      //10B001 (Alterado para 10E001)
      _053: {
        inicioRET: 53,
        tamanho: 6,
      },
      //Número do contrato no Banco
      _059: {
        inicioRET: 59,
        tamanho: 9,
      },
      //Código de retorno da remessa
      _059: {
        inicioRET: 73,
        tamanho: 2,
      },
      //Motivo da devolução da remessa
      _059: {
        inicioRET: 75,
        tamanho: 44,
      },
      //Tipo de arquivo
      _119: {
        inicioRET: 119,
        tamanho: 6,
      },
      //Tipo de arquivo
      _125: {
        tamanho: 219,
        padding: " ",
      },
      //Numero seqüencial no arquivo, iniciando em 0000001
      _344: {
        inicioRET: 344,
        tamanho: 7,
      },
    },
    registro: {
      //2
      _001: {
        inicioRET: null,
        tamanho: 1,
        padding: 2,
      },
      //Código da agência bancária da UG/Gestão
      _002: {
        inicioRET: 2,
        tamanho: 5,
      },
      //Código da UG
      _007: {
        inicioRET: 7,
        tamanho: 11,
      },
      //Código da Gestão
      _018: {
        inicioRET: 18,
        tamanho: 11,
      },
      //Código da OB
      _029: {
        inicioRET: 52,
        tamanho: 2,
      },
      //Data de referência da relação DDMMAAAA (sobrescrita pela data cnab)
      _040: {
        inicioRET: 54,
        tamanho: 10,
      },
      //Brancos
      _048: {
        inicioRET: null,
        tamanho: 4,
        padding: " ",
      },
      //Código de operação
      _052: {
        inicioRET: null,
        tamanho: 2,
        default: "", //setado programaticamente
        padding: " ",
        hook: () => {
          cnabValue = linhas.substring(21 - 1, 21 + 3 - 1) + "";
          if (cnabValue === "001") {
            registro._052.default = 32;
          } else {
            registro._052.default = 31;
          }
        },
      },
      //Indicador de pagamento de pessoal (0):
      _054: {
        inicioRET: null,
        tamanho: 1,
        default: "0",
      },
      //Zeros
      _055: {
        inicioRET: null,
        tamanho: 11, //9 + 2 de padding para prox campo
        default: "",
        padding: "0",
      },
      //Valor líquido da OB
      _064: {
        inicioRET: 120,
        tamanho: 15,
        default: "",
        padding: " ",
      },
      //Código do banco do favorecido
      _081: {
        inicioRET: 21,
        tamanho: 3,
        default: "",
        padding: " ",
      },
      //Código da agência bancária do favorecido
      _084: {
        inicioRET: 25, //Truncando 1 a esquerda do CNAB (24+1)
        tamanho: 4,
        default: "",
        padding: "0",
      },
      //Dígito verificador (DV) da agência bancária do favorecido
      _088: {
        inicioRET: 29,
        tamanho: 1,
        default: "",
        padding: "0",
      },
      //Código da conta corrente bancária do favorecido
      _089: {
        inicioRET: 33, //Truncado 3 a esquerda do CNAB (30+3)
        tamanho: 9,
        default: "",
        padding: "0",
      },
      //Dígito verificador (DV) da conta corrente dofavorecido
      _098: {
        inicioRET: 42,
        tamanho: 1,
        default: "",
        padding: " ",
      },
      //Nome do favorecido
      _099: {
        inicioRET: 44,
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
        inicioRET: 33 + 240, //Segmento B 33 + 240
        tamanho: 57,
        default: "",
        padding: " ",
      },
      //Código Identificador do Sistema de Pagamentos Brasileiro - ISPB do favorecido
      _201: {
        inicioRET: null,
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //Município do favorecido (vazio até ser necessário)
      _209: {
        inicioRET: 98 + 240, //Segmento B 98 + 240
        tamanho: 20,
        default: "",
        padding: " ",
      },
      //Padding para final de municipio (CNAB 20, OBN 28)
      paddingMunicipio: {
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //Código GRU Depósito ou brancos
      _237: {
        inicioRET: null,
        tamanho: 17,
        default: "",
        padding: " ",
      },
      //CEP do favorecido (vazio até ser necessário)
      _254: {
        inicioRET: 118 + 240, //Segmento B 118 + 240
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //UF do favorecido (vazio até ser necessário)
      _262: {
        inicioRET: 126 + 240, //Segmento B 126 + 240
        tamanho: 2,
        default: "",
        padding: " ",
      },
      //Observação da OB
      _264: {
        inicioRET: null,
        tamanho: 40,
        default: "",
        padding: " ",
      },
      //0
      _304: {
        inicioRET: null,
        tamanho: 1,
        default: 0,
      },
      //Tipo favorecido: (2 = CPF)
      _305: {
        inicioRET: null, //SEGMENTO B, 18
        tamanho: 1,
        default: 2,
        padding: " ",
      },
      //Código do favorecido (CPF)
      _306: {
        inicioRET: 262, //SEGMENTO B, 19 + 3
        tamanho: 11,
        default: "",
      },
      //Padding CPF (Não usar para CNPJ)
      _paddingCpf: {
        tamanho: 3,
        default: "",
        padding: " ",
      },
      //Prefixo da agência com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _320: {
        inicioRET: null,
        tamanho: 5,
        default: "00868",
        padding: " ",
      },
      //Número conta com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _325: {
        inicioRET: null,
        tamanho: 10,
        default: "203580",
        padding: "0",
      },
      //Finalidade do pagamento – Fundeb
      _335: {
        inicioRET: null,
        tamanho: 3,
        default: "",
        padding: " ",
      },
      //Brancos
      _338: {
        inicioRET: null,
        tamanho: 4,
        default: "",
        padding: " ",
      },
      //Código de retorno da operação
      _342: {
        inicioRET: null,
        tamanho: 2,
        default: "",
        padding: "0",
      },
      //Número seqüencial no arquivo, consecutivo
      _344: {
        inicioRET: null,
        tamanho: 7,
        default: sequencialArquivo,
        hook: () => {
          registro._344.default = sequencialArquivo;
          trailer._338.default += sequencialArquivo;
        },
      },
    },
    trailer: {
      // Noves
      _001: {
        inicioRET: null,
        tamanho: 35,
        default: "",
        padding: "9",
      },
      // Brancos
      _036: {
        inicioRET: null,
        tamanho: 285,
        default: "",
        padding: " ",
      },
      // Somatório dos valores de todas as OB’s tipo 2.
      _321: {
        inicioRET: null,
        tamanho: 17,
        default: somaValores,
      },
      // Somatório das sequências de todos os registros exceto o registro trailer
      _338: {
        inicioRET: null,
        tamanho: 13,
        default: somaSequenciais,
      },
    },
  };

  //aliases
  const header = configRetorno.header;
  const registro = configRetorno.registro;
  const trailer = configRetorno.trailer;

  //gera header
  for (const key in header) {
    const field = header[key];
    if (typeof field.hook === "function") {
      field.hook.bind(this)(); //chama funções setando valores programáticos no campo
    }
    if (field.inicioRET == null) {
      //default
      outputCSV += (field.default + "").padStart(
        field.tamanho,
        field.padding ? field.padding : 0
      );
    } else {
      //get cnab
      outputCSV += (
        data[0].substring(
          field.inicioRET - 1,
          field.inicioRET + field.tamanho - 1
        ) + ""
      ).padStart(field.tamanho, field.padding ? field.padding : 0);
    }
  }
  //incrementa sequencial e quebra linha ao final do header:
  sequencialArquivo++;
  outputCSV += "\r\n";

  //gera registro (tipo 2 OBN)
  for (let i = 0; i < data.length; i++) {
    if (data[i].charAt(13) != "A") continue;
    linhas = data[i].replace(/\r?\n|\r/g, "") + data[i + 1];
    for (const key in registro) {
      const field = registro[key];

      if (typeof field.hook === "function") {
        field.hook.bind(this)(); //chama funções setando valores programáticos no campo
      }
      if (field.inicioRET == null) {
        //default
        field.value = (field.default + "").padStart(
          field.tamanho,
          field.padding ? field.padding : 0
        );
        outputCSV += field.value;
      } else {
        //get cnab
        field.value = (
          linhas.substring(
            field.inicioRET - 1,
            field.inicioRET + field.tamanho - 1
          ) + ""
        ).padStart(field.tamanho, field.padding ? field.padding : 0);
        outputCSV += field.value;
      }
      if (key === "_064") {
        //soma dos valores totais
        trailer._321.default += parseInt(field.value);
      }
    }
    //incrementa sequencial e quebra linha ao final do registro:
    sequencialArquivo++;
    outputCSV += "\r\n";
  }

  //gera trailer
  for (const key in trailer) {
    const field = trailer[key];
    if (typeof field.hook === "function") {
      field.hook.bind(this)(); //chama funções setando valores programáticos no campo
    }
    if (field.inicioRET == null) {
      //default
      outputCSV += (field.default + "").padStart(
        field.tamanho,
        field.padding ? field.padding : 0
      );
    } else {
      //get cnab
      outputCSV += (
        data[0].substring(
          field.inicioRET - 1,
          field.inicioRET + field.tamanho - 1
        ) + ""
      ).padStart(field.tamanho, field.padding ? field.padding : 0);
    }
  }
  callback(outputCSV, sequencialArquivo);
}

//gera arquivo OBN
function generateOBNfromArray(obnData, callback) {
  // Cada campo OBN representa um valor (mapeado por chave) da array,
  // um tamanho e um default (padding para a esquerda pode ser definido)
  const configOBN = {
    header: {
      //Zeros
      _001: {
        tamanho: 35,
        default: "",
      },
      //Data de geracao do arquivo DDMMAAAA
      _036: {
        tamanho: 8,
        default: moment().format("DDMMYYYY"),
      },
      //Hora de geracao do arquivo HHMM
      _044: {
        tamanho: 4,
        default: moment().format("HHmm"),
      },
      //Número da remessa
      _048: {
        tamanho: 5,
        default: db.numeroLote,
      },
      //10B001 (Alterado para 10E001)
      _053: {
        tamanho: 6,
        default: "10E001",
      },
      //Número do contrato no Banco
      _059: {
        tamanho: 9,
        default: db.numContrato,
      },
      //Brancos
      _068: {
        tamanho: 276,
        default: "",
        padding: " ",
      },
      //Numero seqüencial no arquivo, iniciando em 0000001
      _344: {
        tamanho: 7,
        default: sequencialArquivo,
        hook: () => {
          trailer._338.default += sequencialArquivo;
        },
      },
    },
    registro: {
      //2
      _001: {
        tamanho: 1,
        default: 2,
      },
      //Código da agência bancária da UG/Gestão
      _002: {
        tamanho: 4,
        default: "0086",
        padding: " ",
      },
      //Dígito verificador da agência bancária da UG/Gestão
      _006: {
        tamanho: 1,
        default: 8,
        padding: " ",
      },
      //Código da UG
      _007: {
        tamanho: 6,
        default: 86,
        padding: "0",
      },
      //Código da Gestão
      _013: {
        tamanho: 5,
        default: 20358,
        padding: " ",
      },
      //Código da relação (RE) na qual consta a OB
      _018: {
        tamanho: 11,
        default: "", //setado programaticamente
        padding: "0",
        hook: () => {
          registro._018.default = db.numeroLote;
        },
      },
      //Código da OB
      _029: {
        tamanho: 11,
        default: "", //setado programaticamente
        padding: "0",
        hook: () => {
          registro._029.default = sequencialArquivo + db.numeroLote;
        },
      },
      //Data de referência da relação DDMMAAAA
      _040: {
        tamanho: 8,
        default: db.dataReferencia,
        padding: " ",
      },
      //Brancos
      _048: {
        tamanho: 4,
        default: "",
        padding: " ",
      },
      //Código de operação
      _052: {
        tamanho: 2,
        default: "", //setado programaticamente
        padding: " ",
        hook: (i) => {
          if (obnData[i].BANCO === "001") {
            registro._052.default = 32;
          } else {
            registro._052.default = 31;
          }
        },
      },
      //Indicador de pagamento de pessoal (0):
      _054: {
        tamanho: 1,
        default: "0",
      },
      //Zeros
      _055: {
        tamanho: 9,
        default: "",
        padding: "0",
      },
      //Valor líquido da OB
      _064: {
        tamanho: 17,
        default: "", //setado programaticamente
        padding: "0",
        hook: (i) => {
          registro._064.default = (parseFloat(obnData[i].VALOR) * 100)
            .toFixed(2)
            .slice(0, -3); //workaround para erros de ponto flutuante
        },
      },
      //Código do banco do favorecido
      _081: {
        arrayKey: "BANCO",
        tamanho: 3, //padding de 2 zeros para campo anterior (0 centavos)
        default: "",
        padding: "0",
      },
      //Código da agência bancária do favorecido
      _084: {
        tamanho: 5,
        default: "",
        padding: "0",
        hook: (i) => {
          if (
            obnData[i].BANCO === "001" ||
            obnData[i].BANCO === "077" ||
            obnData[i].BANCO === "237"
          ) {
            registro._084.default = obnData[i].AGENCIA.padStart(5, 0);
          } else {
            registro._084.default = (
              obnData[i].AGENCIA.slice(1) + "0"
            ).padStart(5, 0); //workaround para bancos sem digito
          }
        },
      },
      //Código da conta corrente bancária do favorecido
      _089: {
        arrayKey: "CONTA",
        tamanho: 10,
        default: "",
        padding: "0",
      },
      //Nome do favorecido
      _099: {
        tamanho: 45,
        default: "", //setado programaticamente
        padding: " ",
        hook: (i) => {
          registro._099.default = obnData[i].NOME.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .substring(0, 45)
            .padEnd(45, " ");
        },
      },
      //Endereço do favorecido (vazio até ser necessário)
      _144: {
        tamanho: 57,
        default: "", //setado programaticamente
        padding: " ",
        hook: (i) => {
          registro._144.default = obnData[i].ENDERECO.padEnd(57, " ");
        },
      },
      //Código Identificador do Sistema de Pagamentos Brasileiro - ISPB do favorecido
      _201: {
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //Município do favorecido (vazio até ser necessário)
      _209: {
        tamanho: 28,
        default: "", //setado programaticamente
        padding: " ",
        hook: (i) => {
          registro._209.default = obnData[i].CIDADE.padEnd(28, " ");
        },
      },
      //Código GRU Depósito ou brancos
      _237: {
        tamanho: 17,
        default: "",
        padding: " ",
      },
      //CEP do favorecido (vazio até ser necessário)
      _254: {
        arrayKey: "CEP",
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //UF do favorecido (vazio até ser necessário)
      _262: {
        arrayKey: "ESTADO",
        tamanho: 2,
        default: "",
        padding: " ",
      },
      //Observação da OB
      _264: {
        tamanho: 40,
        default: "",
        padding: " ",
      },
      //0
      _304: {
        tamanho: 1,
        default: 0,
      },
      //Tipo favorecido: (2 = CPF)
      _305: {
        tamanho: 1,
        padding: " ",
        hook: (i) => {
          if (!obnData[i].CNPJ) {
            registro._305.default = 2;
          } else {
            registro._305.default = 1;
          }
        },
      },
      //Código do favorecido (CPF/CNPJ)
      _306: {
        tamanho: 11,
        default: "", //setado programaticamente
        hook: (i) => {
          if (!obnData[i].CNPJ) {
            registro._306.default = obnData[i].CPF.trim().padStart(11, "0");
          } else {
            registro._306.default = obnData[i].CNPJ.trim().padStart(14, "0");
          }
        },
      },
      //Padding CPF (Não usar para CNPJ)
      _paddingCpf: {
        tamanho: 3,
        default: "",
        padding: " ",
        hook: (i) => {
          if (obnData[i].CNPJ) {
            registro._paddingCpf.tamanho = 0;
          } else {
            registro._paddingCpf.tamanho = 3;
          }
        },
      },
      //Prefixo da agência com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _320: {
        tamanho: 5,
        default: "00868",
        padding: " ",
      },
      //Número conta com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _325: {
        tamanho: 10,
        default: "203580",
        padding: "0",
      },
      //Finalidade do pagamento – Fundeb
      _335: {
        tamanho: 3,
        default: "",
        padding: " ",
      },
      //Brancos
      _338: {
        tamanho: 4,
        default: "",
        padding: " ",
      },
      //Código de retorno da operação
      _342: {
        tamanho: 2,
        default: "",
        padding: "0",
      },
      //Número seqüencial no arquivo, consecutivo
      _344: {
        tamanho: 7,
        default: sequencialArquivo,
        hook: () => {
          registro._344.default = sequencialArquivo;
          trailer._338.default += sequencialArquivo;
        },
      },
    },
    trailer: {
      // Noves
      _001: {
        tamanho: 35,
        default: "",
        padding: "9",
      },
      // Brancos
      _036: {
        tamanho: 285,
        default: "",
        padding: " ",
      },
      // Somatório dos valores de todas as OB’s tipo 2.
      _321: {
        tamanho: 17,
        default: somaValores,
      },
      // Somatório das sequências de todos os registros exceto o registro trailer
      _338: {
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
    if (typeof field.hook === "function") {
      field.hook.bind(this)(); //chama funções setando valores programáticos no campo
    }
    if (field.arrayKey == null) {
      //all headers must be default set
      outputOBN += (field.default + "").padStart(
        field.tamanho,
        field.padding ? field.padding : 0
      );
    } else {
      throw "Todos os headers devem ser setados na config para gerar a partir de CSV!";
    }
  }
  //incrementa sequencial e quebra linha ao final do header:
  sequencialArquivo++;
  outputOBN += "\r\n";

  //gera registro (tipo 2 OBN)
  for (let i = 0; i < obnData.length; i++) {
    for (const key in registro) {
      const field = registro[key];

      if (typeof field.hook === "function") {
        field.hook.bind(this)(i); //chama funções setando valores programáticos no campo
      }
      if (!field.arrayKey) {
        //default
        field.value = (field.default + "").padStart(
          field.tamanho,
          field.padding ? field.padding : 0
        );
        outputOBN += field.value;
      } else {
        try {
          //get from array
          field.value = (obnData[i][field.arrayKey].trim() + "").padStart(
            field.tamanho,
            field.padding ? field.padding : 0
          );
          outputOBN += field.value;
        } catch (e) {
          console.error(
            `Falha ao receber valor ${field.arrayKey} na linha ${i}:`
          );
          throw e;
        }
      }
      if (key === "_064") {
        //soma dos valores totais
        trailer._321.default += parseInt(field.value);
      }
    }
    //incrementa sequencial e quebra linha ao final do registro:
    sequencialArquivo++;
    outputOBN += "\r\n";
  }

  //gera trailer
  for (const key in trailer) {
    const field = trailer[key];
    if (typeof field.hook === "function") {
      field.hook.bind(this)(); //chama funções setando valores programáticos no campo
    }
    if (field.inicioCNAB == null) {
      //all trailers must be default set
      outputOBN += (field.default + "")
        .substring(0, field.tamanho)
        .padStart(field.tamanho, field.padding ? field.padding : 0);
    } else {
      throw "Todos os trailers devem ser setados na config para gerar a partir de CSV!";
    }
  }
  callback(outputOBN, sequencialArquivo);
}

//gera arquivo OBN
function generateOBNfromCNAB(data, callback) {
  //init CNAB data
  data = data.split("\n");

  // Cada campo OBN representa uma posição inicial (mapeada no cnab),
  // um tamanho e um default (padding para a esquerda pode ser definido)
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
        default: "",
      },
      //Número da remessa
      _048: {
        inicioCNAB: null,
        tamanho: 5,
        default: db.numeroLote,
      },
      //10B001 (Alterado para 10E001)
      _053: {
        inicioCNAB: null,
        tamanho: 6,
        default: "10E001",
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
        hook: () => {
          trailer._338.default += sequencialArquivo;
        },
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
        padding: "0",
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
        default: "", //setado programaticamente
        padding: "0",
        hook: () => {
          registro._018.default = db.numeroLote;
        },
      },
      //Código da OB
      _029: {
        inicioCNAB: null,
        tamanho: 11,
        default: "", //setado programaticamente
        padding: "0",
        hook: () => {
          registro._029.default = sequencialArquivo + db.numeroLote;
        },
      },
      //Data de referência da relação DDMMAAAA (sobrescrita pela data cnab)
      _040: {
        inicioCNAB: null,
        tamanho: 8,
        default: db.dataReferencia,
        padding: " ",
        hook: () => {
          registro._040.default = data[0].substring(143, 151) + ""; //data no CNAB
        },
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
        default: "", //setado programaticamente
        padding: " ",
        hook: () => {
          cnabValue = linhas.substring(21 - 1, 21 + 3 - 1) + "";
          if (cnabValue === "001") {
            registro._052.default = 32;
          } else {
            registro._052.default = 31;
          }
        },
      },
      //Indicador de pagamento de pessoal (0):
      _054: {
        inicioCNAB: null,
        tamanho: 1,
        default: "0",
      },
      //Zeros
      _055: {
        inicioCNAB: null,
        tamanho: 11, //9 + 2 de padding para prox campo
        default: "",
        padding: "0",
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
        inicioCNAB: 25, //Truncando 1 a esquerda do CNAB (24+1)
        tamanho: 4,
        default: "",
        padding: "0",
      },
      //Dígito verificador (DV) da agência bancária do favorecido
      _088: {
        inicioCNAB: 29,
        tamanho: 1,
        default: "",
        padding: "0",
      },
      //Código da conta corrente bancária do favorecido
      _089: {
        inicioCNAB: 33, //Truncado 3 a esquerda do CNAB (30+3)
        tamanho: 9,
        default: "",
        padding: "0",
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
        inicioCNAB: 33 + 240, //Segmento B 33 + 240
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
        inicioCNAB: 98 + 240, //Segmento B 98 + 240
        tamanho: 20,
        default: "",
        padding: " ",
      },
      //Padding para final de municipio (CNAB 20, OBN 28)
      paddingMunicipio: {
        tamanho: 8,
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
        inicioCNAB: 118 + 240, //Segmento B 118 + 240
        tamanho: 8,
        default: "",
        padding: " ",
      },
      //UF do favorecido (vazio até ser necessário)
      _262: {
        inicioCNAB: 126 + 240, //Segmento B 126 + 240
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
      //Tipo favorecido: (2 = CPF)
      _305: {
        inicioCNAB: null, //SEGMENTO B, 18
        tamanho: 1,
        default: 2,
        padding: " ",
      },
      //Código do favorecido (CPF)
      _306: {
        inicioCNAB: 262, //SEGMENTO B, 19 + 3
        tamanho: 11,
        default: "",
      },
      //Padding CPF (Não usar para CNPJ)
      _paddingCpf: {
        tamanho: 3,
        default: "",
        padding: " ",
      },
      //Prefixo da agência com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _320: {
        inicioCNAB: null,
        tamanho: 5,
        default: "00868",
        padding: " ",
      },
      //Número conta com DV para débito (EXCLUSIVO PARA OB DE CONVÊNIOS)
      _325: {
        inicioCNAB: null,
        tamanho: 10,
        default: "203580",
        padding: "0",
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
        default: "",
        padding: "0",
      },
      //Número seqüencial no arquivo, consecutivo
      _344: {
        inicioCNAB: null,
        tamanho: 7,
        default: sequencialArquivo,
        hook: () => {
          registro._344.default = sequencialArquivo;
          trailer._338.default += sequencialArquivo;
        },
      },
    },
    trailer: {
      // Noves
      _001: {
        inicioCNAB: null,
        tamanho: 35,
        default: "",
        padding: "9",
      },
      // Brancos
      _036: {
        inicioCNAB: null,
        tamanho: 285,
        default: "",
        padding: " ",
      },
      // Somatório dos valores de todas as OB’s tipo 2.
      _321: {
        inicioCNAB: null,
        tamanho: 17,
        default: somaValores,
      },
      // Somatório das sequências de todos os registros exceto o registro trailer
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
    if (typeof field.hook === "function") {
      field.hook.bind(this)(); //chama funções setando valores programáticos no campo
    }
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
  //incrementa sequencial e quebra linha ao final do header:
  sequencialArquivo++;
  outputOBN += "\r\n";

  //gera registro (tipo 2 OBN)
  for (let i = 0; i < data.length; i++) {
    if (data[i].charAt(13) != "A") continue;
    linhas = data[i].replace(/\r?\n|\r/g, "") + data[i + 1];
    for (const key in registro) {
      const field = registro[key];

      if (typeof field.hook === "function") {
        field.hook.bind(this)(); //chama funções setando valores programáticos no campo
      }
      if (field.inicioCNAB == null) {
        //default
        field.value = (field.default + "").padStart(
          field.tamanho,
          field.padding ? field.padding : 0
        );
        outputOBN += field.value;
      } else {
        //get cnab
        field.value = (
          linhas.substring(
            field.inicioCNAB - 1,
            field.inicioCNAB + field.tamanho - 1
          ) + ""
        ).padStart(field.tamanho, field.padding ? field.padding : 0);
        outputOBN += field.value;
      }
      if (key === "_064") {
        //soma dos valores totais
        trailer._321.default += parseInt(field.value);
      }
    }
    //incrementa sequencial e quebra linha ao final do registro:
    sequencialArquivo++;
    outputOBN += "\r\n";
  }

  //gera trailer
  for (const key in trailer) {
    const field = trailer[key];
    if (typeof field.hook === "function") {
      field.hook.bind(this)(); //chama funções setando valores programáticos no campo
    }
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
  callback(outputOBN, sequencialArquivo);
}

//util functions

function updateDb(newState) {
  db = { ...db, ...newState };
  fs.writeFile("db.json", JSON.stringify(db), (err) => {
    if (err) throw err;
  });
}

//util functions end
