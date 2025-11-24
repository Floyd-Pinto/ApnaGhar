const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectToNetwork } = require('./fabric');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const port = 3000;

let contract;
let gateway;

// Initialize Fabric connection
connectToNetwork().then((network) => {
    contract = network.contract;
    gateway = network.gateway;
    console.log('Connected to Fabric network');
}).catch(console.error);

// Endpoints

// Create Property
app.post('/api/v1/property', async (req, res) => {
    try {
        const { propertyId, projectId, unitNumber, owner, dataHash } = req.body;
        const result = await contract.submitTransaction('CreateProperty', propertyId, projectId, unitNumber, owner, dataHash);
        res.json({ success: true, result: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update Property Status
app.put('/api/v1/property/:id/status', async (req, res) => {
    try {
        const { status, owner } = req.body;
        const result = await contract.submitTransaction('UpdatePropertyStatus', req.params.id, status, owner || '');
        res.json({ success: true, result: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Record Milestone
app.post('/api/v1/milestone', async (req, res) => {
    try {
        const { milestoneId, projectId, title, status, ipfsHash, verifier } = req.body;
        const result = await contract.submitTransaction('RecordMilestone', milestoneId, projectId, title, status, ipfsHash, verifier);
        res.json({ success: true, result: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Store Document
app.post('/api/v1/document', async (req, res) => {
    try {
        const { documentId, projectId, docType, ipfsHash, owner } = req.body;
        const result = await contract.submitTransaction('StoreDocument', documentId, projectId, docType, ipfsHash, owner);
        res.json({ success: true, result: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get History
app.get('/api/v1/history/:id', async (req, res) => {
    try {
        const result = await contract.evaluateTransaction('GetAssetHistory', req.params.id);
        res.json({ success: true, result: JSON.parse(result.toString()) });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Blockchain API listening at http://localhost:${port}`);
});
