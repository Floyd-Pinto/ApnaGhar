process.env.CHAINCODE_SERVER_ADDRESS = '0.0.0.0:9999';
process.env.CHAINCODE_ID = 'test';
process.env.CORE_CHAINCODE_ID_NAME = 'test';

console.log('Environment set');
console.log('Loading chaincode...');

try {
    const cc = require('./index.js');
    console.log('Chaincode loaded:', Object.keys(cc));
    console.log('Contracts:', cc.contracts ? cc.contracts.length : 'none');
    
    console.log('Waiting 10 seconds to see if server starts...');
    setTimeout(() => {
        console.log('Still running after 10 seconds');
        process.exit(0);
    }, 10000);
} catch(e) {
    console.error('Error:', e);
    process.exit(1);
}
