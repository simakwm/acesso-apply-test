import { App } from '@tinyhttp/app'
import { logger } from '@tinyhttp/logger'
import { json } from 'milliparsec'
import fundTransfer from './lib/fundTransfer'
import fundTransferStatus from './lib/fundTransferStatus'

// setup tinyhttp
const app = new App()
app.use(logger())
app.use(json())

app.post('/api/fund-transfer', fundTransfer)
app.get('/api/fund-transfer/:transactionId', fundTransferStatus)

app.listen(3000)
