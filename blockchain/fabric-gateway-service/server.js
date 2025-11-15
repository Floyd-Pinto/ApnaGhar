/**
 * ApnaGhar Fabric Gateway Microservice
 * 
 * This Node.js service acts as a bridge between Django backend and Hyperledger Fabric
 * Uses the official Fabric Gateway SDK (recommended approach for Fabric 2.4+)
 */

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connect, signers } from '@hyperledger/fabric-gateway';
import * as grpc from '@grpc/grpc-js';
import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Fabric Gateway connection
let gateway = null;
let contract = null;

// API Key middleware (optional - for production security)
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

/**
 * Initialize Fabric Gateway connection
 */
async function initGateway() {
    try {
        console.log('Initializing Fabric Gateway connection...');
        
        // Read crypto materials
        const tlsCertPath = process.env.TLS_CERT_PATH;
        const certPath = process.env.CERT_PATH;
        const keyPath = process.env.KEY_PATH;
        
        const tlsRootCert = await fs.readFile(tlsCertPath);
        const credentials = grpc.credentials.createSsl(tlsRootCert);
        
        // Create gRPC client
        const client = new grpc.Client(
            process.env.PEER_ENDPOINT,
            credentials,
            {
                'grpc.ssl_target_name_override': process.env.PEER_HOST_ALIAS,
            }
        );
        
        // Read user credentials
        const certificate = await fs.readFile(certPath);
        const privateKey = await fs.readFile(keyPath);
        
        // Create identity and signer
        const identity = { mspId: process.env.MSP_ID, credentials: certificate };
        const signer = signers.newPrivateKeySigner(privateKey);
        
        // Connect to gateway
        gateway = connect({
            client,
            identity,
            signer,
            evaluateOptions: () => ({ deadline: Date.now() + 5000 }), // 5 seconds
            endorseOptions: () => ({ deadline: Date.now() + 15000 }), // 15 seconds
            submitOptions: () => ({ deadline: Date.now() + 5000 }), // 5 seconds
            commitStatusOptions: () => ({ deadline: Date.now() + 60000 }), // 1 minute
        });
        
        // Get network and contract
        const network = gateway.getNetwork(process.env.CHANNEL_NAME);
        contract = network.getContract(process.env.CHAINCODE_NAME);
        
        console.log('✅ Fabric Gateway connected successfully');
        console.log(`   Channel: ${process.env.CHANNEL_NAME}`);
        console.log(`   Chaincode: ${process.env.CHAINCODE_NAME}`);
        
    } catch (error) {
        console.error('❌ Failed to initialize Fabric Gateway:', error);
        throw error;
    }
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        fabricConnected: !!gateway,
        timestamp: new Date().toISOString()
    });
});

/**
 * Store progress update on blockchain
 * POST /api/progress-update
 */
app.post('/api/progress-update', authenticateApiKey, async (req, res) => {
    try {
        const {
            progressId,
            projectId,
            propertyId,
            milestoneId,
            ipfsHash,
            description,
            uploadedBy,
            metadata
        } = req.body;
        
        // Validate required fields
        if (!progressId || !projectId || !propertyId || !ipfsHash || !description || !uploadedBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const timestamp = new Date().toISOString();
        const metadataStr = JSON.stringify(metadata || {});
        
        // Submit transaction to blockchain
        const result = await contract.submitTransaction(
            'StoreProgressUpdate',
            progressId,
            projectId,
            propertyId,
            milestoneId || '',
            ipfsHash,
            description,
            uploadedBy,
            timestamp,
            metadataStr
        );
        
        const resultJson = JSON.parse(result.toString());
        
        res.json({
            success: true,
            data: resultJson,
            message: 'Progress update stored on blockchain'
        });
        
    } catch (error) {
        console.error('Error storing progress update:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Store document on blockchain
 * POST /api/document
 */
app.post('/api/document', authenticateApiKey, async (req, res) => {
    try {
        const {
            documentId,
            projectId,
            propertyId,
            documentName,
            documentType,
            ipfsHash,
            uploadedBy,
            metadata
        } = req.body;
        
        // Validate required fields
        if (!documentId || !projectId || !documentName || !documentType || !ipfsHash || !uploadedBy) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const timestamp = new Date().toISOString();
        const metadataStr = JSON.stringify(metadata || {});
        
        // Submit transaction to blockchain
        const result = await contract.submitTransaction(
            'StoreDocument',
            documentId,
            projectId,
            propertyId || '',
            documentName,
            documentType,
            ipfsHash,
            uploadedBy,
            timestamp,
            metadataStr
        );
        
        const resultJson = JSON.parse(result.toString());
        
        res.json({
            success: true,
            data: resultJson,
            message: 'Document stored on blockchain'
        });
        
    } catch (error) {
        console.error('Error storing document:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get progress update by ID
 * GET /api/progress-update/:id
 */
app.get('/api/progress-update/:id', authenticateApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await contract.evaluateTransaction('GetProgressUpdate', id);
        const resultJson = JSON.parse(result.toString());
        
        res.json({
            success: true,
            data: resultJson
        });
        
    } catch (error) {
        console.error('Error getting progress update:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get document by ID
 * GET /api/document/:id
 */
app.get('/api/document/:id', authenticateApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await contract.evaluateTransaction('GetDocument', id);
        const resultJson = JSON.parse(result.toString());
        
        res.json({
            success: true,
            data: resultJson
        });
        
    } catch (error) {
        console.error('Error getting document:', error);
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Query progress updates by property
 * GET /api/progress-updates/property/:propertyId
 */
app.get('/api/progress-updates/property/:propertyId', authenticateApiKey, async (req, res) => {
    try {
        const { propertyId } = req.params;
        
        const result = await contract.evaluateTransaction('QueryProgressUpdatesByProperty', propertyId);
        const resultJson = JSON.parse(result.toString());
        
        res.json({
            success: true,
            data: resultJson
        });
        
    } catch (error) {
        console.error('Error querying progress updates:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Query documents by project
 * GET /api/documents/project/:projectId
 */
app.get('/api/documents/project/:projectId', authenticateApiKey, async (req, res) => {
    try {
        const { projectId } = req.params;
        
        const result = await contract.evaluateTransaction('QueryDocumentsByProject', projectId);
        const resultJson = JSON.parse(result.toString());
        
        res.json({
            success: true,
            data: resultJson
        });
        
    } catch (error) {
        console.error('Error querying documents:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

/**
 * Start server
 */
async function startServer() {
    try {
        // Initialize Fabric Gateway
        if (process.env.TLS_CERT_PATH && process.env.CERT_PATH && process.env.KEY_PATH) {
            await initGateway();
        } else {
            console.warn('⚠️  Fabric credentials not configured. Gateway will not be initialized.');
            console.warn('   Set TLS_CERT_PATH, CERT_PATH, and KEY_PATH in .env file');
        }
        
        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🚀 Fabric Gateway Service running on port ${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/health`);
            console.log(`   API endpoint: http://localhost:${PORT}/api`);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    if (gateway) {
        gateway.close();
    }
    process.exit(0);
});

// Start the server
startServer();
