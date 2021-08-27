import { App } from '@tinyhttp/app'
import { logger } from '@tinyhttp/logger'
import { json } from 'milliparsec'
import indexHandler from './lib/indexHandler'

// Setup tiny-http
const app = new App()
app.use(logger())
app.use(json())

app.get('/', indexHandler)

app.listen(3000)
