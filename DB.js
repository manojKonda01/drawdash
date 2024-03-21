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

        return { success: true, data: randomDocument };

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

async function getCountRandomDrawingData(count) {
    try {
        await connectToMongoDB();
        const db = client.db(DB);
        const collection = db.collection('drawing');
        // Perform aggregation to get 20 random documents
        const randomDocuments = await collection.aggregate([{ $sample: { size: count } }]).toArray();

        return { success: true, data: randomDocuments };

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

async function registerUser(username, name, imageurl) {
    try {
        if(!username){
            console.log('Null User Name');
            return {success: false, message: 'Null Username'}
        }
        await connectToMongoDB();
        const db = client.db(DB);
        const collection = db.collection('user');
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            console.log('User with this username already exists.');
            return { success: false, message: 'User already exists' };
        }
        const result = await  collection.insertOne({
            username: username,
            name: name,
            imageurl: imageurl
        })
        console.log(result);
        return {'success': result.acknowledged, message: 'user registered successfully'};
    }
    catch (error) {
        console.error('unable to check username', error)
        return {
            'success': false
        };
    }
    finally {
        // Close the MongoDB connection when done, even if an error occurred
        await client.close();
    }
}

async function googleSignIn(username, name, imageurl) {
    try {
        if(!username){
            console.log('Null User Name');
            return {success: false, message: 'Null Username'}
        }
        await connectToMongoDB();
        const db = client.db(DB);
        const collection = db.collection('user');
        const existingUser = await collection.findOne({ username });
        if (existingUser) {
            console.log('User with this username already exists.');
            return { success: true, message: 'Welcome '+name };
        }
        const result = await  collection.insertOne({
            username: username,
            name: name,
            imageurl: imageurl
        })
        console.log(result);
        return {'success': result.acknowledged, message: 'user registered successfully'};
    }
    catch (error) {
        console.error('unable to check username', error)
        return {
            'success': false
        };
    }
    finally {
        // Close the MongoDB connection when done, even if an error occurred
        await client.close();
    }
}
module.exports = { insertDrawingData, connectToMongoDB, getRandomDrawingData, getCountRandomDrawingData, registerUser, googleSignIn}