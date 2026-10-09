const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const Registration = require("./models/Registration");
const Event = require("./models/Event");

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// CREATE UPLOADS FOLDER
// =====================================================

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// =====================================================
// SESSION
// =====================================================

app.use(
    session({
        secret: process.env.SESSION_SECRET || "college_event_secret_2026",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 30 * 60 * 1000
        }
    })
);


// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
    .connect(
        process.env.MONGODB_URI ||
        "mongodb://127.0.0.1:27017/CollegeEventDB"
    )
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });


// =====================================================
// MULTER CONFIGURATION
// =====================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {

        const registerNo = req.body.registerNo || "student";

        const extension = path.extname(file.originalname);

        cb(
            null,
            `${registerNo}_idcard${extension}`
        );
    }
});


const fileFilter = function (req, file, cb) {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf"
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only JPG, JPEG, PNG and PDF files are allowed."
            )
        );
    }
};


const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// =====================================================
// ADMIN LOGIN
// =====================================================

app.get("/admin-login", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "admin-login.html")
    );

});


app.post("/admin-login", (req, res) => {

    const username = (req.body.username || "").trim();
    const password = (req.body.password || "").trim();

    console.log("--------------------------------");
    console.log("ADMIN LOGIN ATTEMPT");
    console.log("Entered username:", username);
    console.log(
        "Configured username:",
        process.env.ADMIN_USERNAME
    );
    console.log(
        "Password received:",
        password ? "YES" : "NO"
    );
    console.log("--------------------------------");


    const adminUsername =
        (process.env.ADMIN_USERNAME || "admin").trim();

    const adminPassword =
        (process.env.ADMIN_PASSWORD || "Admin@123").trim();


    if (
        username === adminUsername &&
        password === adminPassword
    ) {

        req.session.isAdmin = true;

        console.log("Admin login successful");

        return res.redirect("/admin.html");
    }


    console.log("Admin login failed");

    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Failed</title>

            <link
                rel="stylesheet"
                href="/style.css"
            >
        </head>

        <body>

            <div class="form-container">

                <h2 style="color:#dc3545;">
                    Invalid Username or Password
                </h2>

                <p style="text-align:center;">
                    Please check your admin login details.
                </p>

                <br>

                <div style="text-align:center;">

                    <a
                        href="/admin-login"
                        class="btn"
                    >
                        Try Again
                    </a>

                </div>

            </div>

        </body>
        </html>
    `);

});


// =====================================================
// ADMIN AUTHORIZATION MIDDLEWARE
// =====================================================

function requireAdmin(req, res, next) {

    if (!req.session || !req.session.isAdmin) {

        return res.status(401).json({
            message: "Unauthorized. Admin login required."
        });

    }

    next();
}


// =====================================================
// PROTECT ADMIN PAGE
// =====================================================

app.get("/admin.html", (req, res) => {

    if (!req.session || !req.session.isAdmin) {

        return res.redirect("/admin-login");

    }

    res.sendFile(
        path.join(__dirname, "public", "admin.html")
    );

});


// =====================================================
// STATIC FILES
// =====================================================

app.use(express.static(path.join(__dirname, "public")));


// =====================================================
// UPLOAD FILES
// =====================================================

app.use(
    "/uploads",
    express.static(uploadDir)
);


// =====================================================
// HOME PAGE
// =====================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});


// =====================================================
// GET EVENTS
// =====================================================

app.get("/events", async (req, res) => {

    try {

        const events = await Event.find();

        const result = [];

        for (const event of events) {

            const registeredCount =
                await Registration.countDocuments({
                    eventName: event.eventName
                });

            result.push({
                ...event.toObject(),
                registeredCount
            });

        }

        res.json(result);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Unable to load events"
        });

    }

});


// =====================================================
// REGISTER STUDENT
// =====================================================

app.post(
    "/register",
    upload.single("idCard"),
    async (req, res) => {

        try {

            const {
                studentName,
                registerNo,
                email,
                department,
                year,
                eventName,
                eventType
            } = req.body;


            // Check ID card

            if (!req.file) {

                return res.status(400).send(`
                    <h2>ID Card is required.</h2>
                    <a href="/register.html">
                        Go Back
                    </a>
                `);

            }


            // Check duplicate registration

            const existingRegistration =
                await Registration.findOne({
                    registerNo: registerNo,
                    eventName: eventName
                });


            if (existingRegistration) {

                fs.unlinkSync(req.file.path);

                return res.status(400).send(`
                    <h2>
                        You are already registered
                        for this event.
                    </h2>

                    <a href="/events.html">
                        Back to Events
                    </a>
                `);

            }


            // Find selected event

            const selectedEvent =
                await Event.findOne({
                    eventName: eventName
                });


            if (!selectedEvent) {

                fs.unlinkSync(req.file.path);

                return res.status(400).send(`
                    <h2>Selected event not found.</h2>

                    <a href="/events.html">
                        Back to Events
                    </a>
                `);

            }


            // Check event capacity

            const registeredCount =
                await Registration.countDocuments({
                    eventName: eventName
                });


            if (
                selectedEvent.maxParticipants &&
                registeredCount >= selectedEvent.maxParticipants
            ) {

                fs.unlinkSync(req.file.path);

                return res.status(400).send(`
                    <h2>
                        Sorry, this event is full.
                    </h2>

                    <a href="/events.html">
                        Back to Events
                    </a>
                `);

            }


            // Save registration

            const registration =
                new Registration({

                    studentName,
                    registerNo,
                    email,
                    department,
                    year,
                    eventName,
                    eventType,

                    idCard:
                        "uploads/" +
                        req.file.filename

                });


            await registration.save();


            // Success page

            res.send(`
                <!DOCTYPE html>

                <html>

                <head>

                    <title>
                        Registration Successful
                    </title>

                    <link
                        rel="stylesheet"
                        href="/style.css"
                    >

                </head>

                <body>

                    <div class="success">

                        <h2>
                            Registration Successful!
                        </h2>

                        <p>
                            Student registration has been
                            successfully submitted.
                        </p>

                        <br>

                        <a
                            href="/events.html"
                            class="btn"
                        >
                            Back to Events
                        </a>

                    </div>

                </body>

                </html>
            `);

        } catch (error) {

            console.log(error);

            if (req.file) {

                try {

                    fs.unlinkSync(req.file.path);

                } catch (e) {}

            }

            res.status(500).send(`
                <h2>
                    Registration failed.
                </h2>

                <p>
                    Please try again.
                </p>

                <a href="/register.html">
                    Go Back
                </a>
            `);

        }

    }
);


// =====================================================
// ADMIN - GET REGISTRATIONS
// =====================================================

app.get(
    "/admin/registrations",
    requireAdmin,
    async (req, res) => {

        try {

            const registrations =
                await Registration.find()
                    .sort({ registeredAt: -1 });

            res.json(registrations);

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Unable to fetch registrations"
            });

        }

    }
);


// =====================================================
// ADMIN - DELETE REGISTRATION
// =====================================================

app.delete(
    "/admin/registrations/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const registration =
                await Registration.findById(
                    req.params.id
                );


            if (!registration) {

                return res.status(404).json({
                    message:
                        "Registration not found"
                });

            }


            // Delete uploaded ID card

            if (registration.idCard) {

                const filePath =
                    path.join(
                        __dirname,
                        registration.idCard
                    );

                if (fs.existsSync(filePath)) {

                    fs.unlinkSync(filePath);

                }

            }


            // Delete database record

            await Registration.findByIdAndDelete(
                req.params.id
            );


            res.json({
                message:
                    "Registration deleted successfully"
            });

        } catch (error) {

            console.log(error);

            res.status(500).json({
                message:
                    "Unable to delete registration"
            });

        }

    }
);


// =====================================================
// ADMIN LOGOUT
// =====================================================

app.get("/admin-logout", (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            console.log(error);

        }

        res.redirect("/admin-login");

    });

});


// =====================================================
// MULTER ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {

    if (error instanceof multer.MulterError) {

        if (error.code === "LIMIT_FILE_SIZE") {

            return res.status(400).send(`
                <h2>
                    File too large.
                </h2>

                <p>
                    Maximum file size is 5 MB.
                </p>

                <a href="/register.html">
                    Go Back
                </a>
            `);

        }

    }


    if (error) {

        return res.status(400).send(`
            <h2>
                ${error.message}
            </h2>

            <a href="/register.html">
                Go Back
            </a>
        `);

    }

    next();

});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log("--------------------------------");
    console.log(
        `Server running at http://localhost:${PORT}`
    );
    console.log(
        "Admin username:",
        process.env.ADMIN_USERNAME || "admin"
    );
    console.log("--------------------------------");

});