//libs
const fs = require("fs");
const moment = require("moment");

//configs
const minParams = 1;
const input = process.argv[2];
const encoding = "utf-8";

//config DE-PARA: Cada campo OBN representa uma posição inicial (mapeada no cnab),
//  um tamanho e um default (padding para a esquerda pode ser definido)
const configOBN = {
  header: {
    //Zeros
    _001: {
      inicioCNAB: null,
      tamanho: 35,
      default: 00000000000000000000000000000000000,
    },
    //Data de geracao do arquivo
    _036: {
      inicioCNAB: null,
      tamanho: 8,
      default: moment().format("DDMMYYYY"),
    },
    //Hora de geracao do arquivo
    _044: {
      inicioCNAB: null,
      tamanho: 4,
      default: moment().format("HHMM"),
    },
    //teste padding
    _048: {
      inicioCNAB: null,
      tamanho: 20,
      default: "teste padding",
      padding: " ",
    },
    //teste recupera cnab
    _053: {
      inicioCNAB: 73,
      tamanho: 30,
      default: "teste recupera cnab",
    },
    _059: {
      inicioCNAB: null,
      tamanho: 11,
      default: "placeholder",
    },
    _068: {
      inicioCNAB: null,
      tamanho: 11,
      default: "placeholder",
    },
    _344: {
      inicioCNAB: null,
      tamanho: 11,
      default: "placeholder",
    },
  },
};

if (process.argv.length < 2 + minParams)
  throw (
    "Necessários pelo menos " +
    minParams +
    " parâmetros - o caminho do arquivo de entrada e saída."
  );

//leitura e geração do arquivo
fs.readFile(input, encoding, (err, data) => {
  if (err) throw err;
  let outputOBN = "";
  //adiciona header ao arquivo OBN
  const header = configOBN.header;
  for (const key in header) {
    const field = header[key];
    if (field.inicioCNAB == null) {
      //default
      outputOBN += field.default
        .toString()
        .padStart(field.tamanho, field.padding ? field.padding : 0);
    } else {
      //get cnab
      outputOBN += data
        .substring(field.inicioCNAB - 1, field.inicioCNAB + field.tamanho - 1)
        .toString()
        .padStart(field.tamanho, field.padding ? field.padding : 0);
    }
  }
  fs.appendFile(
    process.argv[3] ||
      "inciso1-obn600" + moment().format("ddmmyyhhmmss") + ".txt",
    outputOBN,
    (err) => {
      if (err) throw err;
      console.log(outputOBN);
    }
  );
});
