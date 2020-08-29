const { promises: fs } = require('fs')
const path = require('path')
const express = require('express')
const { google } = require('googleapis')
const CronJob = require('cron').CronJob
const config = require('./utils/config')
const formatNumber = require('./utils/formatNumber')
const app = express()

const oAuth2Client = new google.auth.OAuth2({
	clientId: config.CLIENT_ID,
	clientSecret: config.CLIENT_SECRET,
	redirectUri: config.REDIRECT_URI,
})

const TOKEN_PATH = path.resolve(__dirname, 'token', 'token.json')

app.use('/update-video', async (req, res) => {
	const rawToken = await fs.readFile(TOKEN_PATH)
	const token = JSON.parse(rawToken)
	if (!token.token) return res.redirect('/auth/google/login')

	// This fucking thing
	oAuth2Client.credentials = token.token.tokens

	const youtube = google.youtube('v3')

	const updateVideo = async (newTitle) => {
		await youtube.videos.update({
			auth: oAuth2Client,
			part: 'id,snippet,contentDetails',
			resource: {
				id: config.VIDEO_ID,
				snippet: {
					categoryId: 10,
					title: newTitle,
					description:
						"The title of this video is automatically updated every 3 minutes to match the total views.\n\n I do not own anything from this video; the game is called Terraria, and the artist of the illustration is Bohrokki https://www.deviantart.com/bohrokki \n\nThis video is inspired by Tom Scott's video: https://www.youtube.com/watch?v=BxV14h0kFs0",
				},
			},
		})
		console.log('Video updated: ' + newTitle)
	}

	// Update the Video title every 3 minutes
	console.log('Running CronJob to update the video every 3 minutes')
	const job = new CronJob(
		'*/4 * * * *',
		async () => {
			// Get the Video's current views
			const video = await youtube.videos.list({
				auth: oAuth2Client,
				part: 'id,statistics',
				id: config.VIDEO_ID,
			})

			const newViews = video.data.items[0].statistics.viewCount
			const newTitle = `This video has ${formatNumber(
				newViews,
			)} views (Update every 3 minutes)`

			// Update the video
			updateVideo(newTitle)
		},
		null,
		true,
	)
	job.start()

	res.json({
		message:
			'You can close the window now, the cron job is running and will update the video every 3 minutes',
	})
})

app.use('/auth/google/login', (req, res) => {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/youtube'],
	})
	res.redirect(authUrl)
})

app.use('/auth/google/callback', async (req, res) => {
	const code = req.query.code
	console.log(code)
	const token = await oAuth2Client.getToken(code)

	await fs.writeFile(TOKEN_PATH, JSON.stringify({ token }))
	res.redirect('/update-video')
})

module.exports = app
