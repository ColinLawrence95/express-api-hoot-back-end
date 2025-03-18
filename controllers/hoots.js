const express = require("express");
const verifyToken = require("../middleware/verify-token.js");
const Hoot = require("../models/hoot.js");
const router = express.Router();

router.post("/", verifyToken, async function (req, res) {
    try {
        req.body.author = req.user._id;
        const hoot = await Hoot.create(req.body);
        hoot._doc.author = req.user;
        res.status(201).json(hoot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/:hootId/comments", verifyToken, async function (req, res) {
    try {
        req.body.author = req.user._id;
        const hoot = await Hoot.findById(req.params.hootId);
        hoot.comments.push(req.body);
        await hoot.save();
        const newComment = hoot.comments[hoot.comments.length - 1];
        newComment._doc.author = req.user;
        res.status(200).json(newComment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/:hootId", verifyToken, async function (req, res) {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        if (!hoot.author.equals(req.user._id)) {
            return res.status(403).send("Permissions Invalid!");
        }
        const updatedHoot = await Hoot.findByIdAndUpdate(req.params.hootId, req.body, { new: true });

        updatedHoot._doc.author = req.user;
        res.status(200).json(updatedHoot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put("/:hootId/comments/:commentId", verifyToken, async function (req, res) {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        const comment = hoot.comments.id(req.params.commentId);
        if (comment.author.toString() !== req.user._id) {
            return res.status(403).json({
                message: "You are not authorized to edit this comment",
            });
        }
        comment.text = req.body.text;
        await hoot.save();
        res.status(200).json({ message: "Comment updated successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/", verifyToken, async function (req, res) {
    try {
        const hoots = await Hoot.find({}).populate("author").sort({ createdAt: "desc" });
        res.status(200).json(hoots);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/:hootId", verifyToken, async function (req, res) {
    try {
        const hoot = await Hoot.findById(req.params.hootId).populate("author", "comments.author");
        res.status(200).json(hoot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/:hootId", verifyToken, async function (req, res) {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        if (!hoot.author.equals(req.user._id)) {
            return res.status(403).send("Permissions Invalid!");
        }
        const deletedHoot = await Hoot.findByIdAndDelete(req.params.hootId);
        res.status(200).json(deletedHoot);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete("/:hootId/comments/:commentId", verifyToken, async function (req, res) {
    try {
        const hoot = await Hoot.findById(req.params.hootId);
        const comment = hoot.comments.id(req.params.commentId);

        if (comment.author.toString() !== req.user._id) {
            return res.status(403).json({
                message: "You are not authorized to edit this comment",
            });
        }
        hoot.comments.remove({ _id: req.params.commentId });
        await hoot.save();
        res.status(200).json({ message: "Comment deleted successfully!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
module.exports = router;
