const { MongoClient } = require('mongodb');
require('dotenv').config();

let client;
const URI = process.env.MONGO_URI;
const DB = process.env.DB;
// DB = drawdash

// Function to connect mongo
async function connectToMongoDB() {
    try {
        client = new MongoClient(URI);
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

async function insertDrawingData(drawingData) {
    try {
        await connectToMongoDB();
        const db = client.db(DB);
        const result = await db.collection('drawing').insertOne({
            word: drawingData.word,
            data: drawingData.data,
            createdAt: new Date()
        });
        success = result.insertedCount === 1;
        console.log('Data inserted:', result.insertedId);
        return { success: true }
    }
    catch (exception) {
        console.error('Unable to insert drawing data: ', exception)
        return { success: false }
    }
    // finally {
    //     // Close the MongoDB connection when done, even if an error occurred
    //     await client.close();
    // }
}

async function getRandomDrawingData() {
    try {
        await connectToMongoDB();
        const db = client.db(DB);
        const collection = db.collection('drawing');

        // Retrieve the count of documents in the collection
        const count = await collection.countDocuments();
        // Generate a random index within the range of the count
        const randomIndex = Math.floor(Math.random() * count);

        // Use findOne with skip and limit options to fetch a single document at the random index
        const randomDocument = await collection.findOne({}, { skip: randomIndex, limit: 1 });

        return {success: true, data: randomDocument};

    }
    catch (exception) {
        console.error('Unable to get drawing data: ', exception)
        return { success: false }
    }
    finally {
        // Close the MongoDB connection when done, even if an error occurred
        await client.close();
    }
}
module.exports = { insertDrawingData, connectToMongoDB, getRandomDrawingData }