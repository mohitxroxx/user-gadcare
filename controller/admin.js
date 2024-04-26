const dotenv = require('dotenv')
const jwt = require("jsonwebtoken")
const express = require("express")
const cookieParser = require('cookie-parser')
const msg = require('../models/messages')
const user = require('../models/user')

const app = express()

app.use(express.json())
app.use(cookieParser())
dotenv.config()



const { Admin_User, Admin_Pass, TOKEN_KEY } = process.env

const users = [
    { id: 1, username: Admin_User, password: Admin_Pass },
]


app.post("/login", async (req, res) => {
    try {
        const { username, password, rememberMe } = req.body

        if (!username || !password) {
            return res.json({ msg: 'Please fill the login details completely', status: false })
        }

        const user = users.find(u => u.username === username && u.password === password)

        if (!user) {
            return res.json({ msg: 'Invalid credentials', status: false })
        }
        const expiresIn = rememberMe ? '7d' : '2h'
        const token = jwt.sign({ id: user.id, username: user.username }, TOKEN_KEY, { expiresIn })
        res.cookie('jwt', token, {
            secure: true,
            maxAge: expiresIn === '7d' ? 7 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000,
            httpOnly: true
        })
        res.status(200).json({
            msg: 'Login successful',
            status: true,
            token: token
        })
    } catch (err) {
        console.error(err)
        res.status(500).json({ msg: 'Server error', status: false })
    }
})

app.get("/logout", async (req, res) => {
    try {
        res.clearCookie('jwt')
        res.status(200).send("User Logged out and session ended")
    } catch (ex) {
        next(ex)
    }
})

app.get('/filter', async (req, res) => {
    try {
        const country = req.query.name
        const _id = req.query.id
        if (!country && !_id)
            return res.status(400).json({ msg: "You need to specify the country or id" })
        if (!_id) {
            // console.log(country)
            const data = await user.find({ country })
            return res.status(200).json(data)
        }
        const data = await user.findById({ _id: _id })
        // console.log(data) 
        return res.status(200).json(data)
    } catch (error) {
        console.error(error)
        return res.status(404).json({ msg: "Cant find any data for this country or ID" })
    }
})

app.get('/pending', async (req, res) => {
    try {
        const result = await user.find({
            "services.payments": {
                $not: {
                    $elemMatch: {
                        paymentStatus: "paid"
                    }
                }
            }
        });
        const services = result.map(user => user.services)
        console.log(services)
        return res.status(200).json(services)
    } catch (error) {
        console.error(error)
        return res.status(404).json({ msg: "Cant find any data for this country or ID" })
    }
})

app.get('/completed', async (req, res) => {
    try {
        const result = await user.find({
            "services.payments": {
                $elemMatch: {
                    paymentStatus: "paid"
                }
            }
        });
        const services = result.map(user => user.services)
        console.log(services)
        return res.status(200).json(services)
    } catch (error) {
        console.error(error)
        return res.status(404).json({ msg: "Cant find any data for this country or ID" })
    }
})
app.get('/user', async (req, res) => {
    try {
        const service_id = req.query.id
        const result = await user.find({
            "services._id": service_id
        });
        console.log(result)
        return res.status(200).json(result)
    } catch (error) {
        console.error(error)
        return res.status(404).json({ msg: "Cant find any data for this ID" })
    }
})

app.post('/message', async (req, res) => {
    try {
        const { message, target, target_type } = req.body
        const messageData = {
            message
        }
        if (target_type === "all") {
            await user.updateMany(
                {},
                { $push: { messages: messageData } }
            );
            const store = await msg.create({
                message, target: (target_type != 'all') ? target.toLowerCase() : "all"
            })
            return res.status(201).json({ msg: `message sent to all partners` })
        }
        else if (target_type === 'country') {
            await user.updateMany(
                { country: target },
                { $push: { messages: messageData } }
            );
            const store = await msg.create({
                message, target: (target_type != 'all') ? target.toLowerCase() : "all"
            })
            return res.status(201).json({ msg: `message sent to all ${target} partners` })
        }
        else if (target_type === 'user') {
            await user.updateMany(
                { _id: target },
                { $push: { messages: messageData } }
            );
            const store = await msg.create({
                message, target: (target_type != 'all') ? target.toLowerCase() : "all"
            })
            return res.status(201).json({ msg: `message sent to the partner` })
        }
        else
            return res.status(400).json({ error: `${target} is invalid, target can only be one the these [country, all, user]` })
    } catch (error) {
        console.error(error)
        return res.status(404).json({ error: "Unable to send the message" })
    }
})

app.get('/message', async (req, res) => {
    try {
        const messageData = await msg.find({}).sort({ sentAt: -1 })
        if (!messageData)
            return res.status(404).json({ error: "No message record available" })
        return res.status(200).json(messageData)
    } catch (error) {
        console.error(error)
        return res.status(404).json({ error: "Unable to fetch the message records" })
    }
})

app.post('/updateclaim', async (req, res) => {
    try {
        const claim_id = req.query.claim_id;
        const status = req.query.status;
        const { admin_message, admin_amount } = req.body
        const data = await user.findOneAndUpdate(
            { "claims.claim_id": claim_id },
            { $set: { "claims.$.status": status, "claims.$.updated_date": Date.now(), "claims.$.admin_message": admin_message, "claims.$.admin_amount": admin_amount } },
            { new: true }
        );
        const updated = await user.findOne({ "claims.claim_id": claim_id }, { "claims.$": 1 })
        return res.status(200).json({ msg: "Claim status updated", updated });
    } catch (error) {
        console.error(error)
        return res.status(200).json({ msg: "error updating data" })
    }
})
app.get('/viewclaims', async (req, res) => {
    try {
        let status = req.query.status
        let country = req.query.country
        if (country) {
            const filters = await user.find({ country })
            let claims = filters.map(userDoc => userDoc.claims.filter(claim => claim.status === status));
            const countryWiseFilteredData = (claims.filter(it => it.length > 0)).flat()
            console.log(countryWiseFilteredData)
            // let dataclaims = claims.filter(it=>it.length>0)
            // const onlyClaims = claims.map(data => data.claims)
            // console.log(dataclaims)
            return res.status(200).json(countryWiseFilteredData)
        }
        let claims = await user.aggregate([
            { $unwind: "$claims" },
            { $match: { "claims.status": status } }
        ]);
        const onlyClaims = claims.map(data => data.claims)
        return res.status(200).json(onlyClaims)
    } catch (error) {
        console.error(error)
        return res.status(200).json({ msg: "error fetching data" })
    }
})

app.post('/earnings', async (req, res) => {
    try {
        const { userID, amount, refid, currency, link } = req.body
        const userData = await user.findById(userID)
        // console.log(userData)
        const record = {
            amount, refid, currency, link
        }
        const prevdata = await user.findById(userID)
        // console.log(prevdata)
        const data = await user.findByIdAndUpdate(
            userID,
            {
                $set: { "earning.amount": prevdata.earning.amount + amount },
                $push: { "earning.records": record }
            },
            { new: true }
        );
        return res.status(200).json(data.earning)
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: error.toString() });
    }
})




app.get('/earnings', async (req, res) => {
    try {
        const data = await user.find({}, 'earning.records')

        const filteredData = data
        .filter(it => it.earning.records.length > 0)
        .flatMap(value => value.earning.records)

        return res.status(200).json(filteredData)
    } catch (error) {
        // console.error(error)
        return res.status(500).json({ err: "Internal Server Error!" })
    }
})




module.exports = app;