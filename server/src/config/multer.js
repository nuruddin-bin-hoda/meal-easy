const multer = require('multer');
const path = require('path');

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}${file.originalname}`),
});

const fileFilter = (_req, file, cb) => {
  if (ACCEPTED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only jpeg, png, webp images are allowed'), { statusCode: 422 }));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});
