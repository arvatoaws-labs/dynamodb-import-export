const AWS = require('aws-sdk');
const async = require('async');
const fs = require('fs');
const dyn = new AWS.DynamoDB.DocumentClient();

const chunk = (n, perChunk) => n.reduce((all,one,i) => {
  const ch = Math.floor(i/perChunk); 
  all[ch] = [].concat((all[ch]||[]),one); 
  return all
}, []);

function restore(callback) {
  async.autoInject({
    read: callback => {      
      fs.readFile(process.env.DumpFile, callback);
    },
    appendToFile: (read, callback) => {
      async.parallel(chunk(read.toString().split('\n').filter(n => n != ''), 25).map(list => callback => {
        var param = {
          RequestItems: {
          }
        };
        param.RequestItems[process.env.DumpFile] = list.map(item => {
          return {
            PutRequest: {
              Item: JSON.parse(item)
            }
          };
        });
        dyn.batchWrite(param, callback);
      }), callback);
    }
  }, callback);
}

restore((err, data) => {
  console.log(err);
  console.log(data);
});