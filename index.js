require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const Person = require('./models/person')

const app = express()

morgan.token('postReceivedData', (req) => {
  return req.method === 'POST' ? JSON.stringify(req.body) : ''
})

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(express.static('dist'))
app.use(express.json())
app.use(
  morgan('tiny', {
    skip: (req) => req.method === 'POST',
  })
)
app.use(
    morgan(
    ':method :url :status :res[content-length] - :response-time ms :postReceivedData',
    {
        skip: (req) => req.method !== 'POST',
    }
    )
)

app.get('/', (request, response) => {
    response.send('<h1>Hello World!</h1>')
})

app.get('/info', (request, response) => {
    Person.find({}).then(persons => {
        response.send(`<p>Phonebook has info for ${persons.length} people</p><p>${new Date().toString()}</p>`)
    })
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response) => {
  Person.findByIdAndDelete(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const person = {
        name: body.name,
        number: body.number,
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
        response.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
  const body = request.body
  const { name, number } = body
  if (!name) {
    return response.status(400).json({
      error: 'name is missing',
    })
  }
  if (!number) {
    return response.status(400).json({
      error: 'number is missing',
    })
  }

  const person = new Person({
    name,
    number,
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
})

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
