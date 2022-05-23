const mongoose = require('mongoose');

class DBConnection {
    constructor() {
        this.mongoose = mongoose;
        this.connection = null;
        this.bucket = null;
    }

    getDb() {
        if (!this.connection) {
            this.connection = this.mongoose.connect(process.env.DB_CONNECTION_STRING, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useCreateIndex: true,
                useFindAndModify: false
            });
        }

        return this.mongoose.connection.db;
    }

    async connect(url) {
        this.connection = await this.mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        return this.connection;
    }

    async disconnect() {
        await this.connection.close();
    }

    async clearDatabase() {
        const collections = await this.connection.db.collections();
        for (let collection of collections) {
            await collection.deleteMany();
        }
    }

    setupGridFS(bucketName) {
        const db = mongoose.connection.db;
        this.bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: bucketName });
    }

    getBucket() {
        return this.bucket;
    }
}

module.exports = new DBConnection();