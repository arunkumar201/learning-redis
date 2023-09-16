// Import required packages
const express = require("express");
const axios = require("axios");
const redis = require("redis");
const cors = require("cors");
const bodyParser = require("body-parser");

const redisClient = redis.createClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
const DEFAULT_EXPIRATION_TIMEOUT = 3600;

app.post("/photos", async (req, res) => {
	const album_id = req.body.album_id;
	try {
		const data = await getOrSetCache(`photos:${album_id}`, async () => {
			const response = await axios.get(
				"https://jsonplaceholder.typicode.com/photos",
				{
					params: { albumId: album_id },
				}
			);
			return response.data;
		});
		res.json(data); 
	} catch (err) {
		console.debug("🚀 ~ file: index.js:31 ~ cache ~ err:", err);
		res.json({ message: "Something went wrong" });
	}
}); // Added a closing parenthesis here

function getOrSetCache(key, callback) {
	return new Promise((res, rej) => {
		redisClient.get(key, async (error, data) => {
			if (error) {
				return rej(error);
			}
			if (data != null) {
				return res(JSON.parse(data));
			}
			const freshData = await callback();
			redisClient.setex(
				key,
				DEFAULT_EXPIRATION_TIMEOUT,
				JSON.stringify(freshData),
				(error) => {
					if (error) {
						rej(error);
					} else {
						res(freshData);
					}
				}
			);
		});
	});
}

app.listen(3000, () => {
	console.log("Server started on port 3000");
});
