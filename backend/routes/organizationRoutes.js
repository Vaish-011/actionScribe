const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");
const authMiddleware = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.post("/create", authMiddleware, organizationController.createOrganization);
router.get("/", authMiddleware, organizationController.getOrganization);
router.put("/", authMiddleware, allowRoles("admin"), organizationController.updateOrganization);
router.post("/invite", authMiddleware, allowRoles("admin"), organizationController.inviteMember);
router.put("/member-role", authMiddleware, allowRoles("admin"), organizationController.updateMemberRole);
router.delete("/member/:memberId", authMiddleware, allowRoles("admin"), organizationController.removeMember);

module.exports = router;