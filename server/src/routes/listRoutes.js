const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getLists, createList, deleteList, importContacts, getListContacts } = require('../controllers/listController');

router.use(protect); // Protect all routes

router.route('/')
    .get(getLists)
    .post(createList);

router.route('/:id')
    .delete(deleteList);

router.post('/:id/import', importContacts);
router.get('/:id/contacts', getListContacts);

module.exports = router;
