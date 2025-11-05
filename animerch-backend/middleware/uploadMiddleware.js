const multer = require('multer');
const path = require('path');

// 1. Configure how files are stored
const storage = multer.diskStorage({
    // Set the destination for uploaded files
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Save to the 'uploads' folder
    },
    // Set the filename
    filename: (req, file, cb) => {
        // Create a unique filename: fieldname-timestamp.extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 2. Function to check that the file is an image
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|gif/;
    // Check the extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check the mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true); // It's an image, accept it
    } else {
        cb('Error: Images Only!'); // Not an image, reject it
    }
}

// 3. Create the multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

module.exports = upload;