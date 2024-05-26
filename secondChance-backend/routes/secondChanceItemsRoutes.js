const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const connectToDatabase = require('../models/db');
const logger = require('../logger');

// Define the upload directory path
const directoryPath = 'public/images';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, directoryPath); // Specify the upload directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Use the original file name
    },
});

const upload = multer({ storage: storage });

// Get all secondChanceItems
router.get('/', async (req, res, next) => {
    logger.info('/ called');
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const secondChanceItems = await collection.find({}).toArray();
        res.json(secondChanceItems);
    } catch (e) {
        console.error('Oops something went wrong', e);
        next(e);
    }
});

// Add a new item
router.post('/', upload.single('file'), async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        let secondChanceItem = req.body;

        const lastItemQuery = await collection.find().sort({'id': -1}).limit(1).toArray();
        if (lastItemQuery.length > 0) {
 secondChanceItem.id = (parseInt(lastItemQuery[0].id) + 1).toString();
        } else {
            secondChanceItem.id = "1";
        }

        const date_added = Math.floor(new Date().getTime() / 1000);
        secondChanceItem.date_added = date_added;

        const result = await collection.insertOne(secondChanceItem);
        res.status(201).json(result.ops[0]);
    } catch (e) {
        next(e);
    }
});

// Get a single secondChanceItem by ID
router.get('/:id', async (req, res, next) => {
    logger.info('/api/secondchance/items/:id called');
    try {
        const id = req.params.id;  // Correctly extract the ID from request parameters
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");

        const item = await collection.findOne({ id: id });
        
        if (item) {
            res.json(item);
        } else {
            res.status(404).send('Item not found');
        }
    } catch (e) {
        console.error('Error fetching item by ID:', e);
        next(e);
    }
});

// Update an existing item
router.put('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const id = req.params.id;
        const updatedItem = req.body;

        const result = await collection.updateOne({ id: id }, { $set: updatedItem });

        if (result.matchedCount === 1) {
            res.status(200).send('Item updated successfully');
        } else {
            res.status(404).send('Item not found');
        }
    } catch (e) {
        next(e);
    }
});

// Delete an existing item
router.delete('/:id', async (req, res, next) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection("secondChanceItems");
        const id = req.params.id;

        const result = await collection.deleteOne({ id: id });

        if (result.deletedCount === 1) {
            res.status(200).send('Item deleted successfully');
        } else {
            res.status(404).send('Item not found');
        }
    } catch (e) {
        next(e);
    }
});

module.exports = router;
