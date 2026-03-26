const List = require('../models/List');
const Contact = require('../models/Contact');
const User = require('../models/User');

// @desc    Get user lists
// @route   GET /api/lists
// @access  Private
exports.getLists = async (req, res) => {
    try {
        const lists = await List.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(lists);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a list
// @route   POST /api/lists
// @access  Private
exports.createList = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ msg: 'List name is required' });

        const newList = new List({
            user: req.user.id,
            name
        });

        const list = await newList.save();
        res.json(list);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a list and its contacts
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteList = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) return res.status(404).json({ msg: 'List not found' });
        if (list.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

        await Contact.deleteMany({ list: list._id });
        await list.deleteOne();

        res.json({ msg: 'List removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'List not found' });
        res.status(500).send('Server Error');
    }
};

// @desc    Import contacts into a list
// @route   POST /api/lists/:id/import
// @access  Private
exports.importContacts = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) return res.status(404).json({ msg: 'List not found' });
        if (list.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

        const { contacts } = req.body; // Array of {email, firstName, lastName}

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ msg: 'Invalid contacts array format' });
        }

        // Validate emails and map to correct schema
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validContacts = contacts
            .filter(c => c.email && emailRegex.test(c.email))
            .map(c => ({
                list: list._id,
                user: req.user.id,
                email: c.email.toLowerCase().trim(),
                firstName: c.firstName || '',
                lastName: c.lastName || ''
            }));

        if (validContacts.length === 0) {
            return res.status(400).json({ msg: 'No valid contacts provided' });
        }

        // Use unordered bulkWrite to ignore duplicate errors and insert the rest
        const bulkOps = validContacts.map(c => ({
            insertOne: { document: c }
        }));

        let insertedCount = 0;
        try {
            const result = await Contact.bulkWrite(bulkOps, { ordered: false });
            insertedCount = result.insertedCount;
        } catch (e) {
            // BulkWriteError with code 11000 means duplicates were found.
            // Result object is still available on the error object.
            if (e.code === 11000 || e.result) {
                insertedCount = e.result?.nInserted || 0;
            } else {
                throw e;
            }
        }

        // Update list contact count
        const newCount = await Contact.countDocuments({ list: list._id });
        list.contactCount = newCount;
        await list.save();

        res.json({
            msg: `Successfully imported ${insertedCount} contacts.`,
            insertedCount,
            totalContacts: newCount
        });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'List not found' });
        res.status(500).send('Server Error');
    }
};

// @desc    Get contacts in a list (paginated)
// @route   GET /api/lists/:id/contacts
// @access  Private
exports.getListContacts = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);

        if (!list) return res.status(404).json({ msg: 'List not found' });
        if (list.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;

        const total = await Contact.countDocuments({ list: req.params.id });
        const contacts = await Contact.find({ list: req.params.id })
            .sort({ createdAt: -1 })
            .skip(startIndex)
            .limit(limit);

        res.json({
            contacts,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'List not found' });
        res.status(500).send('Server Error');
    }
};
