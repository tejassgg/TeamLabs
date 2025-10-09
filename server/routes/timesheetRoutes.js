const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { logActivity } = require('../services/activityService');
const PunchDetails = require('../models/PunchDetails');
const TimeSheet = require('../models/TimeSheet');

const getTimeSheetHistory = async (req, res) => {
    try {
        const { date } = req.params;
        const punchData = await PunchDetails.findOne({ UserId: req.user._id, PunchDate: new Date(date) });
        if (punchData) {
            const timeSheet = await TimeSheet.find({ PunchID: punchData._id, UserId: req.user._id })
            if (timeSheet.length != 0) {
                return res.status(200).json({ punchData: punchData, timeSheet: timeSheet })
            }
            return res.status(200).json({punchData: punchData, timeSheet: timeSheet, message: 'No time recorded for today' })
        }
        return res.status(400).json({ message: 'Punch In Requried!' })
    }
    catch (error) {
        console.log(error);
    }
}

const postTimeSheet = async (req, res) => {
    try {
        const { Description, StartTime, EndTime, PunchDate, PunchID } = req.body;
        const PunchData = await PunchDetails.findOne({ _id: PunchID, UserId: req.user._id });
        if (PunchData) {
            const newTime = await TimeSheet.create({
                UserId: req.user._id,
                PunchID: PunchID,
                Description: Description,
                StartTime: StartTime,
                EndTime: EndTime,
            });
            await logActivity(
                req.user._id,
                'add_timesheet',
                'info',
                `User Added Timesheet at: ${newTime.CreatedAt}`,
                req,
                { newTime }
            );

            return res.status(201).json(newTime);
        }
        return res.status(400).json({ message: 'Punch In First to Log TimeSheet.' });
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({ message: error.message });
    }
}

const handlePunchIn = async (req, res) => {
    try {
        const date = new Date().toLocaleDateString()
        const punchIn = await PunchDetails.create({
            UserId: req.user._id,
            PunchDate: new Date(date).toISOString()
        })

        await logActivity(
            req.user._id,
            'user_punchIn',
            'info',
            `User PunchedIn at: ${punchIn.PunchIn}`,
            req,
            { punchIn }
        );

        return res.status(200).json({ punchIn, message: `Punched In at: ${punchIn.InTime} ` });
    }
    catch (error) {
        console.log('Error occured in the handlePunchIn: ', error);
    }
}

const handlePunchOut = async (req, res) => {
    try {
        const { punchID } = req.params;
        const punchOut = await PunchDetails.findById(punchID);

        if (punchOut?.InTime) {
            punchOut.OutTime = new Date();
            await punchOut.save();
        }
        else {
            return res.status(404).json({ message: 'You Cannot PunchOut Before You PunchIn.' });
        }

        await logActivity(
            req.user._id,
            'user_punchOut',
            'info',
            `User PunchedOut at: ${punchOut.OutTime}`,
            req,
            { punchOut }
        );

        return res.status(200).json({ punchOut, message: `Punched Out at: ${punchOut.OutTime} ` });
    }
    catch (error) {
        console.log('Error occured in the handlePunchOut: ', error);
    }
}

const delTimeSheet = async (req, res) => {
    try {
        const { timeId, punchID } = req.body;
        const delData = await TimeSheet.findOne({ _id: timeId, PunchID: punchID, UserId: req.user._id });
        if (delData) {
            await delData.deleteOne();
            return res.status(200).json({ message: "TimeSheet Deleted Successfully!" });
        }
        return res.status(204).send();
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({ message: error.message });
    }
}

// Routes
// POST /api/timehseet - Add Time
router.post('/', protect, postTimeSheet);

// DELETE /api/timehseet - Delete Time
router.delete('/', protect, delTimeSheet);

// GET /api/timehseet/punchIn - PunchIn for Today
router.get('/punchIn', protect, handlePunchIn);

// POST /api/timehseet/punchOut/:punchID - PunchOut for Today
router.post('/punchOut/:punchID', protect, handlePunchOut);

// GET /api/timesheet/history - Get timesheetDetails
router.get('/history/:date', protect, getTimeSheetHistory);

module.exports = router; 