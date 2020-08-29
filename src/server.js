process.on('uncaughtException', (err) => {
	console.error(err)
	process.exit()
})

const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.resolve(__dirname, '../config.env') })

const app = require('./app')

const PORT = process.env.PORT || 4200
const server = app.listen(PORT, () => console.log(`Serving on port ${PORT}`))

process.on('unhandledRejection', (err) => {
	console.error(err)
	server.close(() => {
		process.exit()
	})
})
