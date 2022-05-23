const dbConnection = require('./db-connection');

uploadFile = async (file) => {
    const bucket = dbConnection.getBucket();
    const uploadStream = bucket.openUploadStream(file.name);
    const id = await new Promise((resolve, reject) => {
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
    });
    console.log('Uploaded file with id: ', id);
    return id;
}

downloadFile = async (id) => {
    const downloadStream = bucket.openDownloadStream(id);
    const chunks = [];
    return new Promise((resolve, reject) => {
        downloadStream.on('data', chunk => chunks.push(chunk));
        downloadStream.on('error', reject);
        downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

deleteFile = async (id) => {
    return bucket.delete(id);
}

module.exports = {
    uploadFile,
    downloadFile,
    deleteFile
}