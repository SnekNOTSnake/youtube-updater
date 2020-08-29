process.on('uncaughtException', (err) => {
	console.error(err)
	process.exit()
})

const readline = require('readline')
const { google } = require('googleapis')
const CronJob = require('cron').CronJob
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../config.env') })

const config = require('./utils/config')
const formatNumber = require('./utils/formatNumber')

const handleUpdate = async (oAuth2Client) => {
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
	console.log('Initiating CronJob to update the video every 3 minutes')
	const job = new CronJob(
		'*/3 * * * *',
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

	console.log('CronJob is running')
}

const getToken = (oAuth2Client) => {
	return new Promise((resolve, reject) => {
		// Readline to enter the Code parameter
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		})

		rl.question(
			'The code parameter Google sent (make sure to decode it first): ',
			async (code) => {
				try {
					const token = await oAuth2Client.getToken(code)
					resolve(token)
				} catch (err) {
					reject(err)
				}
			},
		)
	})
}

const generateAuthUrl = (oAuth2Client) => {
	const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: ['https://www.googleapis.com/auth/youtube'],
	})
	return authUrl
}

;(async () => {
	const oAuth2Client = new google.auth.OAuth2({
		clientId: config.CLIENT_ID,
		clientSecret: config.CLIENT_SECRET,
		redirectUri: config.REDIRECT_URI,
	})

	const authUrl = generateAuthUrl(oAuth2Client)
	console.log(`Go in here to authenticate your account: ${authUrl}`)

	const token = await getToken(oAuth2Client)
	if (!token) throw new Error('No token')

	// This fucking thing
	oAuth2Client.credentials = token.tokens

	handleUpdate(oAuth2Client, token)
})()

process.on('unhandledRejection', (err) => {
	console.error(err)
	process.exit()
})
