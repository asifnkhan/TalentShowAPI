const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const busboy = require('busboy');
const dbConnection = require('../helpers/db-connection');
const accountService = require('../helpers/user-service');

// get all users
getAllUsers = (req, res) => {
    User.find({}, (err, users) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving users."
            });
        } else {
            res.send(users.map(x => {
                return {
                    id: x._id,
                    fullName: x.fullName,
                    email: x.email,
                    dob: x.dob,
                    address: x.address,
                    applicationId: x.applicationId,
                    video: x.video,
                }
            }));
        }
    });
};

// Register user
register = (req, res) => {
    const { fullName, email, password, dob, address } = req.body;
    const saltRounds = 10;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = new User({
        fullName,
        email,
        password: hashedPassword,
        dob,
        address
    });

    user.save()
        .then((data) => {
            res.status(201).json({
                message: 'User created successfully',
                id: data._id
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: err
            });
        });
}

// Login user
// returns JWT token and expiry
// /users/login
login = (req, res) => {
    const { email, password } = req.body;
    console.log(email, password);
    accountService.authenticate({ email, password })
        .then(({ refreshToken, ...account }) => {
            setTokenCookie(res, refreshToken);
            res.json(account);
        }).catch((err) => {
            res.status(401).json({
                message: err
            })
        });


    // User.findOne({ email })
    //     .then((user) => {
    //         if (!user) {
    //             return res.status(401).json({
    //                 message: 'Auth failed'
    //             });
    //         }

    //         const isPasswordValid = bcrypt.compareSync(password, user.password);
    //         if (!isPasswordValid) {
    //             return res.status(401).json({
    //                 message: 'Auth failed'
    //             });
    //         }

    //         const token = jwt.sign({
    //             email: user.email,
    //             userId: user._id
    //         }, process.env.JWT_SECRET, { expiresIn: '1h' });

    //         res.status(200).json({
    //             token: token,
    //             expiresIn: 3600
    //         });
    //     })
    //     .catch((err) => {
    //         res.status(500).json({
    //             error: err
    //         });
    //     });
}

// Logout user
// /users/logout
logout = (req, res) => {
    const token = req.body.token || req.cookies.refreshToken;

    if (!token) return res.status(400).json({ message: 'Token is required' });

    accountService.revokeToken({ token })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch((err) => res.status(500).json({ message: err }));
}

// To upload the video for talent show
// returns the application id
// /users/apply
apply = async (req, res) => {
    // Check if already applied
    const checkUser = await User.findById(req.user.id)

    if (!checkUser) { res.status(401).json({ message: 'User not found' }) }

    if (checkUser && checkUser.applicationId) {
        return res.status(400).json({
            message: 'Already applied',
            applicationId: checkUser.applicationId
        });
    }

    const bb = busboy({ headers: req.headers, limits: { fileSize: 100 * 1024 * 1024 } });

    bb.on('file', async (name, file, info, mimetype) => {
        // Only allow video files
        let reg = /video/;
        if (reg.test(mimetype)) {
            return res.status(400).json({
                message: 'Invalid file type'
            });
        }

        const bucket = dbConnection.getBucket();
        const uploadStream = bucket.openUploadStream(new Date().getTime());

        file.on('limit', () => {
            res.status(400).json({
                message: 'File size is too large. Max size: 100 MB'
            });
        });

        uploadStream.on('finish', (data) => {
            User.findOne({ _id: req.user.id })
                .then((user) => {
                    if (!user) {
                        return res.status(401).json({
                            message: 'Auth failed'
                        });
                    }

                    user.applicationId = process.env.PREFIX + new Date().getTime();
                    user.video = data._id;
                    user.updatedAt = new Date().toISOString();
                    console.log(user);
                    User.updateOne({ _id: req.user.id }, user)
                        .then(() => {
                            res.status(200).json({
                                message: 'Application submitted successfully',
                                data: {
                                    applicationId: user.applicationId
                                }
                            });
                        }).catch((err) => {
                            res.status(500).json({
                                error: err
                            });
                        });
                })
                .catch((err) => {
                    res.status(500).json({
                        error: err
                    });
                });
        });

        file.pipe(uploadStream);

    });

    req.pipe(bb);
}

// To view the uploaded video by the user
// returns the video stream
// /users/view
getVideo = (req, res) => {
    User.findOne({ _id: req.user.id })
        .then((user) => {
            if (!user) {
                return res.status(401).json({
                    message: 'Auth failed'
                });
            }

            if (!user.video) {
                return res.status(404).json({
                    message: 'No video found'
                });
            }

            const bucket = dbConnection.getBucket();
            const readStream = bucket.openDownloadStream(user.video);

            readStream.on('data', (data) => {
                res.write(data);
            });

            readStream.on('end', () => {
                res.end();
            });
        })
        .catch((err) => {
            res.status(500).json({
                error: err
            });
        });
}

refreshToken = (req, res) => {
    const token = req.body.token || req.cookies.refreshToken;

    accountService.refreshToken({ token })
        .then(({ refreshToken, ...user }) => {
            setTokenCookie(res, refreshToken);
            res.json(user);
        })
        .catch((err) => {
            res.status(401).json({
                message: err
            });
        });
}

function setTokenCookie(res, token) {
    // create cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    res.cookie('refreshToken', token, cookieOptions);
}

module.exports = {
    getAllUsers,
    register,
    login,
    logout,
    apply,
    getVideo,
    refreshToken
}