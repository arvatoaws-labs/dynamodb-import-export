const AWS = require('aws-sdk');
const async = require('async');
const fs = require('fs');
const dyn = new AWS.DynamoDB.DocumentClient();

function search(params, callback) {
  async.autoInject({
    scan: callback => {      
      dyn.scan(params, callback);
    },
    appendToFile: (scan, callback) => {
      async.parallel(scan.Items.map(item => callback => {
        fs.appendFile(process.env.DumpFile, JSON.stringify(item) + "\n", callback);
      }), callback);
    },
    recursive: (scan, callback) => {
      if (typeof scan.LastEvaluatedKey != 'undefined') {
				params.ExclusiveStartKey = scan.LastEvaluatedKey;
				// console.log('Recursive Services');
				search(params, callback);
			} else {
				callback(null);
			}
    }
  }, callback);
}

search({TableName: process.env.TableName}, (err, data) => {
  console.log(err);
  console.log(data);
});