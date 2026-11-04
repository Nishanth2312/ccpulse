const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/learning/courses
 * List all available academy courses
 */
router.get('/courses', (req, res) => {
    try {
        const courses = db.prepare('SELECT id, slug, title, category, difficulty, duration_minutes, modules_count, summary FROM learning_courses').all();
        return res.json({ success: true, count: courses.length, courses });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * GET /api/learning/courses/:slug
 */
router.get('/courses/:slug', authenticateToken, (req, res) => {
    try {
        const course = db.prepare('SELECT * FROM learning_courses WHERE slug = ?').get(req.params.slug);
        if (!course) {
            return res.status(404).json({ success: false, error: 'Course not found.' });
        }

        course.modules = JSON.parse(course.content_json);

        let userProgress = null;
        if (req.user && !req.isGuest) {
            userProgress = db.prepare('SELECT * FROM learning_progress WHERE user_id = ? AND course_id = ?').get(req.user.id, course.id);
        }

        return res.json({
            success: true,
            course,
            userProgress: userProgress || { completed_modules: 0, status: 'not_started' }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * POST /api/learning/progress
 * Update module completion
 */
router.post('/progress', authenticateToken, (req, res) => {
    try {
        if (!req.user || req.isGuest) {
            return res.json({
                success: true,
                isGuest: true,
                message: 'Guest progress completed. Sign in to save permanent badges and certificates!'
            });
        }

        const { course_id, completed_modules, total_modules } = req.body;
        if (!course_id) {
            return res.status(400).json({ success: false, error: 'Course ID is required.' });
        }

        const completed = parseInt(completed_modules, 10) || 1;
        const total = parseInt(total_modules, 10) || 4;
        const status = completed >= total ? 'completed' : 'in_progress';

        db.prepare(`
            INSERT INTO learning_progress (user_id, course_id, completed_modules, total_modules, status, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, course_id) DO UPDATE SET
                completed_modules = excluded.completed_modules,
                status = excluded.status,
                updated_at = CURRENT_TIMESTAMP
        `).run(req.user.id, course_id, completed, total, status);

        return res.json({
            success: true,
            progress: {
                userId: req.user.id,
                courseId: course_id,
                completedModules: completed,
                totalModules: total,
                status
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;

