process.env.CHAINCODE_SERVER_ADDRESS = '0.0.0.0:9999';
process.env.CHAINCODE_ID = 'test';
process.env.CORE_CHAINCODE_ID_NAME = 'test';

console.log('Environment:', {
    CHAINCODE_SERVER_ADDRESS: process.env.CHAINCODE_SERVER_ADDRESS,
    CHAINCODE_ID: process.env.CHAINCODE_ID,
    CORE_CHAINCODE_ID_NAME: process.env.CORE_CHAINCODE_ID_NAME
});

console.log('Loading chaincode...');
const cc = require('./index.js');
console.log('Chaincode loaded:', Object.keys(cc));

console.log('Server should be starting. Waiting 10 seconds...');
setTimeout(() => {
    console.log('Still running after 10 seconds');
    process.exit(0);
}, 10000);
