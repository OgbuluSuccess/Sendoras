const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { checkContactsLimit } = require("../middleware/tierMiddleware");
const {
  getLists,
  createList,
  deleteList,
  importContacts,
  getListContacts,
} = require("../controllers/listController");

router.use(protect); // Protect all routes

router.route("/").get(getLists).post(createList);

router.route("/:id").delete(deleteList);

router.post("/:id/import", checkContactsLimit, importContacts);
router.get("/:id/contacts", getListContacts);

module.exports = router;
