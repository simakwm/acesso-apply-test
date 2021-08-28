import { Request, Response } from '@tinyhttp/app'

export default function indexHandler (request: Request, response: Response): void {
  response.send({ result: 'success' })
}
