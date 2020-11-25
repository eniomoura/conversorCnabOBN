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
let headerSequencial = 1;

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
  fs.readFile(input, encoding, (err, data) => {
    if (err) throw err;
    generateOBN(data, (outputOBN) => {
      fs.appendFile(
        process.argv[3] ||
          "inciso1-obn600" + moment().format("DDMMYYhhmmss") + ".txt",
        outputOBN,
        (err) => {
          if (err) throw err;
          updateDb({ numeroLote: db.numeroLote + 1 });
          console.log(outputOBN);
          return outputOBN;
        }
      );
    });
  });
}

//gera arquivo OBN
function generateOBN(data, callback) {
  let outputOBN = "";
  data = data.split("\n");
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
        default: null,
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
        default: headerSequencial,
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
        default: "",
      },
      //Dígito verificador da agência ba
      _006: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _007: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _013: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _018: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _029: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _040: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _048: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _052: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _054: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _055: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _064: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _081: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _084: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _088: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _089: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _098: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _099: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _144: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _201: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _209: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _237: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _254: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _262: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _264: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _304: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _305: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _306: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _320: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _325: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _335: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _338: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _342: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
      _344: {
        inicioCNAB: null,
        tamanho: 7,
        default: 0000001,
      },
    },
  };

  //gera header
  const header = configOBN.header;
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
  outputOBN += "\n";

  //gera registro (tipo 2 OBN)
  const registro = configOBN.registro;
  for (let i = 0; i < data.length; i++) {
    if (data[i].charAt(13) != "A") continue;
    for (const key in registro) {
      const field = registro[key];
      if (field.inicioCNAB == null) {
        //default
        outputOBN += (field.default + "").padStart(
          field.tamanho,
          field.padding ? field.padding : 0
        );
      } else {
        //get cnab
        outputOBN += (
          data[i].substring(
            field.inicioCNAB - 1,
            field.inicioCNAB + field.tamanho - 1
          ) + ""
        ).padStart(field.tamanho, field.padding ? field.padding : 0);
      }
    }
    outputOBN += "\n";
  }

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
